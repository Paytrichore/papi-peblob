import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { CreatePeblobForUserDto } from './dto/create-peblob-for-user.dto';
import { UpdatePeblobDto } from './dto/update-peblob.dto';
import { PeblobEntity } from './entities/peblob.entity';
import { PtiblobEntity } from './entities/ptiblob.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Peblob, PeblobDocument } from './schemas/peblob.schema';
import { UserService } from '../user/user.service';
import { v4 as uuidv4 } from 'uuid';
import {
  PlacementCompensationEventDto,
  PlacementEventDto,
} from './dto/placement-event.dto';
import {
  FindUserPeblobsQueryDto,
  PeblobSortOrder,
} from './dto/find-user-peblobs-query.dto';

@Injectable()
export class PeblobService {
  private readonly logger = new Logger(PeblobService.name);
  private peblobs: PeblobEntity[] = [];

  constructor(
    @InjectModel(Peblob.name)
    private readonly peblobModel: Model<PeblobDocument>,
    private readonly userService: UserService,
  ) {}

  async markPlacedFromEvent(event: PlacementEventDto) {
    const peblob = await this.peblobModel.findById(event.peblobId).exec();
    if (!peblob || peblob.userId !== event.userId) {
      throw new NotFoundException({
        code: 'PEBLOB_NOT_FOUND',
        message: 'Peblob introuvable pour cet utilisateur',
      });
    }

    if (peblob.processedEventIds.includes(event.eventId)) {
      return { status: 'duplicate', peblob };
    }

    if (peblob.status === 'ON_MAP') {
      throw new ConflictException({
        code: 'PEBLOB_ALREADY_PLACED',
        message: 'Peblob déjà placé sur la carte',
      });
    }

    const updated = await this.peblobModel
      .findOneAndUpdate(
        { _id: event.peblobId, userId: event.userId },
        {
          $set: { status: 'ON_MAP', mapPosition: { x: event.x, y: event.y } },
          $addToSet: { processedEventIds: event.eventId },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException({
        code: 'PEBLOB_NOT_FOUND',
        message: 'Peblob introuvable pour cet utilisateur',
      });
    }
    return { status: 'processed', peblob: updated };
  }

  async compensatePlacement(event: PlacementCompensationEventDto) {
    const updated = await this.peblobModel
      .findOneAndUpdate(
        {
          _id: event.peblobId,
          userId: event.userId,
          'mapPosition.x': event.x,
          'mapPosition.y': event.y,
        },
        {
          $set: { status: 'AVAILABLE' },
          $unset: { mapPosition: 1 },
          $addToSet: { processedEventIds: event.eventId },
        },
        { new: true },
      )
      .exec();

    return {
      status: updated ? 'compensated' : 'already-compensated',
      peblob: updated,
    };
  }

  async create(
    CreatePeblobForUserDto: CreatePeblobForUserDto,
  ): Promise<Peblob> {
    if (!CreatePeblobForUserDto.structure) {
      throw new BadRequestException('Le champ structure est obligatoire');
    }
    this.validateSquareStructure(CreatePeblobForUserDto.structure);
    const created = new this.peblobModel({
      userId: CreatePeblobForUserDto.userId,
      structure: CreatePeblobForUserDto.structure,
      name: CreatePeblobForUserDto.name?.trim() || undefined,
      dominantColor: CreatePeblobForUserDto.dominantColor,
    });
    const savedPeblob = await created.save();
    const savedPeblobId = String(savedPeblob._id);

    try {
      await this.userService.notifyPeblobDraftCreated({
        eventType: 'peblob-created-from-draft',
        eventId: uuidv4(),
        occurredAt: new Date().toISOString(),
        userId: CreatePeblobForUserDto.userId,
        peblobId: savedPeblobId,
        correlationId: uuidv4(),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Webhook sync failed for peblob ${savedPeblobId}: ${reason}`,
      );

      try {
        await this.peblobModel.findByIdAndDelete(savedPeblobId).exec();
      } catch (rollbackError) {
        const rollbackReason =
          rollbackError instanceof Error
            ? rollbackError.message
            : 'Unknown rollback error';
        this.logger.error(
          `Rollback failed for peblob ${savedPeblobId}: ${rollbackReason}`,
        );
        throw new ServiceUnavailableException(
          `Synchronisation utilisateur indisponible et rollback échoué (${reason})`,
        );
      }

      throw new ServiceUnavailableException(
        `Création annulée: synchronisation utilisateur indisponible (${reason})`,
      );
    }

    return savedPeblob;
  }

  async createRandom(name: string, size: number = 3): Promise<Peblob> {
    if (size < 1 || size > 50) {
      throw new BadRequestException('La taille doit être entre 1 et 50');
    }

    const structure: { r: number; g: number; b: number }[][] = [];
    for (let i = 0; i < size; i++) {
      const row: { r: number; g: number; b: number }[] = [];
      for (let j = 0; j < size; j++) {
        row.push({
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256),
        });
      }
      structure.push(row);
    }

    const created = new this.peblobModel({
      name,
      structure,
      status: 'ACTIVE',
    });
    return created.save();
  }

  private validateSquareStructure(structure: any[][]): void {
    if (!structure || structure.length === 0) {
      throw new BadRequestException('La structure ne peut pas être vide');
    }

    const size = structure.length;
    for (let i = 0; i < structure.length; i++) {
      if (!structure[i] || structure[i].length !== size) {
        throw new BadRequestException(
          `La structure doit être carrée. Ligne ${i} a ${structure[i]?.length || 0} éléments, attendu ${size}`,
        );
      }
    }
  }

  findAll(): PeblobEntity[] {
    return this.peblobs;
  }

  async findByIds(
    ids: string[],
  ): Promise<Array<Peblob & { ownerName?: string }>> {
    const uniqueIds = [...new Set(ids)];
    const peblobs = await this.peblobModel
      .find({ _id: { $in: uniqueIds } })
      .exec();
    const userIds = [
      ...new Set(
        peblobs
          .map((peblob) => peblob.userId)
          .filter((userId): userId is string => !!userId),
      ),
    ];
    const profiles = await this.userService.getUserProfiles(userIds);
    const ownerNames = new Map(
      profiles.map((profile) => [profile.id, profile.username]),
    );

    return peblobs.map((peblob) => ({
      ...(typeof peblob.toObject === 'function' ? peblob.toObject() : peblob),
      ownerName: peblob.userId ? ownerNames.get(peblob.userId) : undefined,
    }));
  }

  findOne(id: string): PeblobEntity {
    const peblob = this.peblobs.find((p) => p.id === id);
    if (!peblob) {
      throw new NotFoundException(`Peblob avec l'ID ${id} non trouvé`);
    }
    return peblob;
  }

  async update(id: string, updatePeblobDto: UpdatePeblobDto) {
    if (updatePeblobDto.structure) {
      this.validateSquareStructure(updatePeblobDto.structure);
    }
    const update = {
      ...updatePeblobDto,
      ...(updatePeblobDto.name !== undefined
        ? { name: updatePeblobDto.name.trim() || undefined }
        : {}),
      updatedAt: new Date(),
    };
    const updated = await this.peblobModel
      .findByIdAndUpdate(id, update, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Peblob avec l'ID ${id} non trouvé`);
    }
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.peblobModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Peblob avec l'ID ${id} non trouvé`);
    }
    return deleted;
  }

  // Filtrer les peblobs par taille
  findBySize(size: number): PeblobEntity[] {
    return this.peblobs.filter((peblob) => peblob.size === size);
  }

  // Mettre à jour un Ptiblob spécifique dans un Peblob
  updatePtiblob(
    peblobId: string,
    row: number,
    col: number,
    r: number,
    g: number,
    b: number,
  ): PeblobEntity {
    const peblob = this.findOne(peblobId);

    if (!peblob.setPtiblob(row, col, new PtiblobEntity(r, g, b))) {
      throw new BadRequestException(
        `Position invalide: row=${row}, col=${col} pour un peblob de taille ${peblob.size}`,
      );
    }

    return peblob;
  }

  // 👥 MÉTHODES POUR LA GESTION DES UTILISATEURS

  // Récupérer tous les peblobs d'un utilisateur
  findByUserId(userId: string): Promise<Peblob[]> {
    return this.peblobModel.find({ userId }).exec();
  }

  async findByUserIdPaginated(userId: string, query: FindUserPeblobsQueryDto) {
    const filter = {
      userId,
      ...(query.color ? { dominantColor: query.color } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const sortDirection = query.sortOrder === PeblobSortOrder.ASC ? 1 : -1;

    const [items, total] = await Promise.all([
      this.peblobModel
        .find(filter)
        .sort({ createdAt: sortDirection })
        .skip(skip)
        .limit(query.pageSize)
        .exec(),
      this.peblobModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  // Transférer un peblob à un autre utilisateur
  transferPeblobToUser(peblobId: string, newUserId: string): PeblobEntity {
    const peblob = this.findOne(peblobId);
    peblob.userId = newUserId;
    peblob.updatedAt = new Date();
    return peblob;
  }

  // Récupérer les peblobs publics (sans utilisateur assigné)
  findPublicPeblobs(): PeblobEntity[] {
    return this.peblobs.filter((peblob) => !peblob.userId);
  }

  // Supprimer tous les peblobs d'un utilisateur (pour GDPR par exemple)
  removeAllByUserId(userId: string): number {
    const initialLength = this.peblobs.length;
    this.peblobs = this.peblobs.filter((peblob) => peblob.userId !== userId);
    return initialLength - this.peblobs.length;
  }
}
