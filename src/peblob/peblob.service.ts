import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { CreatePeblobForUserDto } from './dto/create-peblob-for-user.dto';
import { PeblobDominantColor } from './dto/create-peblob.dto';
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
import { ApplyStoryDto } from './dto/apply-story.dto';
import { StartDraftDto } from './dto/start-draft.dto';
import { SelectDraftDto } from './dto/select-draft.dto';
import { AnswerDraftDto } from './dto/answer-draft.dto';
import {
  DraftSession,
  DraftSessionDocument,
} from './schemas/draft-session.schema';
import { DraftStatus } from './draft-status.enum';

@Injectable()
export class PeblobService {
  private readonly logger = new Logger(PeblobService.name);
  private peblobs: PeblobEntity[] = [];

  constructor(
    @InjectModel(Peblob.name)
    private readonly peblobModel: Model<PeblobDocument>,
    @InjectModel(DraftSession.name)
    private readonly draftSessionModel: Model<DraftSessionDocument>,
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
    const savedPeblob = await this.savePeblob(CreatePeblobForUserDto);
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
            : 'Unknown error';
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

  private async savePeblob(
    createPeblobForUserDto: CreatePeblobForUserDto,
  ): Promise<PeblobDocument> {
    if (!createPeblobForUserDto.structure) {
      throw new BadRequestException('Le champ structure est obligatoire');
    }
    this.validateSquareStructure(createPeblobForUserDto.structure);
    const metrics = this.calculateMetrics(createPeblobForUserDto.structure);
    const created = new this.peblobModel({
      userId: createPeblobForUserDto.userId,
      structure: createPeblobForUserDto.structure,
      name: createPeblobForUserDto.name?.trim() || undefined,
      dominantColor:
        createPeblobForUserDto.dominantColor ??
        this.calculateDominantColor(createPeblobForUserDto.structure),
      ...metrics,
    });
    return created.save();
  }

  async startDraft(dto: StartDraftDto): Promise<DraftSessionDocument> {
    const existing = await this.draftSessionModel
      .findOne({ userId: dto.userId, status: DraftStatus.IN_PROGRESS })
      .exec();
    if (existing) {
      return existing;
    }

    const session = new this.draftSessionModel({
      userId: dto.userId,
      question: dto.question,
      choices: [],
      status: DraftStatus.IN_PROGRESS,
    });
    const saved = await session.save();
    return saved;
  }

  async answerDraft(
    id: string,
    dto: AnswerDraftDto,
  ): Promise<DraftSessionDocument> {
    const session = await this.draftSessionModel
      .findOne({ _id: id, status: DraftStatus.IN_PROGRESS })
      .exec();
    if (!session) {
      throw new NotFoundException('Draft introuvable');
    }
    if (session.choices.length > 0) {
      return session;
    }

    const choices = this.shuffle([
      this.generatePeblob(this.resolveTint(dto.color)),
      this.generatePeblob(),
      this.generatePeblob(),
    ]);
    const updated = await this.draftSessionModel
      .findByIdAndUpdate(id, { $set: { story: dto, choices } }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Draft introuvable');
    }
    return updated;
  }

  getCurrentDraft(userId: string): Promise<DraftSessionDocument | null> {
    return this.draftSessionModel
      .findOne({ userId, status: DraftStatus.IN_PROGRESS })
      .exec();
  }

  async selectDraft(id: string, dto: SelectDraftDto): Promise<Peblob> {
    const session = await this.draftSessionModel
      .findOneAndUpdate(
        { _id: id, status: DraftStatus.IN_PROGRESS },
        {
          $set: {
            status: DraftStatus.COMPLETED,
            selectedIndex: dto.choiceIndex,
          },
        },
        { new: true },
      )
      .exec();
    if (!session) {
      throw new ConflictException({
        code: 'DRAFT_ALREADY_DONE',
        message: 'Draft déjà complétée',
      });
    }
    const selected = session.choices[dto.choiceIndex];
    if (!selected) {
      await this.draftSessionModel
        .findByIdAndUpdate(id, {
          $set: { status: DraftStatus.IN_PROGRESS },
          $unset: { selectedIndex: 1 },
        })
        .exec();
      throw new BadRequestException('Choix de draft invalide');
    }

    try {
      const peblob = await this.savePeblob({
        userId: session.userId,
        structure: selected.structure,
        dominantColor: selected.dominantColor,
      });
      await this.draftSessionModel
        .findByIdAndUpdate(id, {
          $set: { choices: [] },
        })
        .exec();
      return peblob;
    } catch (error) {
      await this.draftSessionModel
        .findByIdAndUpdate(id, {
          $set: { status: DraftStatus.IN_PROGRESS },
          $unset: { selectedIndex: 1 },
        })
        .exec();
      throw error;
    }
  }

  private generatePeblob(tint?: PeblobDominantColor) {
    const dominantColor = tint ?? this.randomTint();
    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    const structure = [
      [
        this.makeColor(dominantColor, rand(20, 40)),
        this.makeColor(dominantColor, rand(10, 40)),
        this.makeColor(dominantColor, rand(0, 40)),
      ],
      [
        this.makeColor(dominantColor, rand(10, 40)),
        this.makeColor(dominantColor, rand(0, 40)),
        this.makeColor(dominantColor, rand(0, 40)),
      ],
      [
        this.makeColor(dominantColor, rand(10, 40)),
        this.makeColor(dominantColor, rand(0, 40)),
        this.makeColor(dominantColor, rand(0, 40)),
      ],
    ];
    return { structure, dominantColor };
  }

  private randomTint(): PeblobDominantColor {
    const rand = Math.random();
    if (rand < 0.75) {
      const tints = [
        PeblobDominantColor.YELLOW,
        PeblobDominantColor.RED,
        PeblobDominantColor.BLUE,
      ];
      return tints[Math.floor(Math.random() * tints.length)];
    }
    if (rand < 0.95) {
      const tints = [
        PeblobDominantColor.PURPLE,
        PeblobDominantColor.GREEN,
        PeblobDominantColor.ORANGE,
      ];
      return tints[Math.floor(Math.random() * tints.length)];
    }
    return PeblobDominantColor.PINK;
  }

  private resolveTint(color: string): PeblobDominantColor {
    const normalized = color.toLowerCase();
    const aliases: Record<string, PeblobDominantColor> = {
      orange: PeblobDominantColor.ORANGE,
      green: PeblobDominantColor.GREEN,
      blue: PeblobDominantColor.BLUE,
      purple: PeblobDominantColor.PURPLE,
      violet: PeblobDominantColor.PURPLE,
      red: PeblobDominantColor.RED,
      yellow: PeblobDominantColor.YELLOW,
      pink: PeblobDominantColor.PINK,
      rose: PeblobDominantColor.PINK,
      neutral: PeblobDominantColor.GREEN,
    };
    return aliases[normalized] ?? this.randomTint();
  }

  private shuffle<T>(items: T[]): T[] {
    for (let index = items.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
  }

  private makeColor(tint: PeblobDominantColor, base: number) {
    const percent = (value: number, min: number, max: number) =>
      Math.floor(value * (min + Math.random() * (max - min)));
    const low = () => Math.floor(Math.random() * 6);
    switch (tint) {
      case PeblobDominantColor.ORANGE:
        return { r: base, g: percent(base, 0.3, 0.6), b: low() };
      case PeblobDominantColor.PURPLE:
        return { r: base, g: percent(base, 0.2, 0.4), b: base };
      case PeblobDominantColor.PINK:
        return {
          r: base,
          g: percent(base, 0.2, 0.4),
          b: percent(base, 0.5, 0.8),
        };
      case PeblobDominantColor.YELLOW:
        return { r: base, g: percent(base, 0.8, 1), b: low() };
      case PeblobDominantColor.GREEN:
        return {
          r: percent(base, 0.2, 0.4),
          g: base,
          b: percent(base, 0.2, 0.4),
        };
      case PeblobDominantColor.BLUE:
        return {
          r: percent(base, 0.2, 0.4),
          g: percent(base, 0.2, 0.4),
          b: base,
        };
      case PeblobDominantColor.RED:
        return {
          r: base,
          g: percent(base, 0.2, 0.4),
          b: percent(base, 0.2, 0.4),
        };
    }
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

    const metrics = this.calculateMetrics(structure);
    const created = new this.peblobModel({
      name,
      structure,
      status: 'ACTIVE',
      dominantColor: this.calculateDominantColor(structure),
      ...metrics,
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

    const migratedPeblobs = await Promise.all(
      peblobs.map((peblob) => this.ensureMetrics(peblob)),
    );

    return migratedPeblobs.map((peblob) => ({
      ...(typeof peblob.toObject === 'function'
        ? peblob.toObject<Peblob>()
        : peblob),
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
    const mutableFields = { ...updatePeblobDto };
    delete mutableFields.dominantColor;
    const update = {
      ...mutableFields,
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

  async applyStory(id: string, dto: ApplyStoryDto): Promise<Peblob> {
    const STORY_COST = 1;
    const current = await this.peblobModel.findById(id).exec();
    if (!current) {
      throw new NotFoundException({
        code: 'PEBLOB_NOT_FOUND',
        message: 'Peblob introuvable',
      });
    }
    if (current.playedStoryIds?.includes(dto.storyId)) {
      throw new ConflictException({
        code: 'STORY_ALREADY_PLAYED',
        message: 'Story déjà jouée',
      });
    }

    await this.userService.consumeActionPoints(
      current.userId ?? '',
      STORY_COST,
      `${id}:${dto.storyId}`,
    );
    const structure = current.structure.map((row) =>
      row.map((color) => this.applyStoryEffect(color, dto)),
    );
    const metrics = this.calculateMetrics(
      structure,
      current.earnedPowerCount ?? 0,
      current.purchasedPowerIds?.length ?? 0,
    );
    const updated = await this.peblobModel
      .findOneAndUpdate(
        { _id: id, playedStoryIds: { $ne: dto.storyId } },
        {
          $set: { structure, ...metrics, updatedAt: new Date() },
          $addToSet: { playedStoryIds: dto.storyId },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new ConflictException({
        code: 'STORY_ALREADY_PLAYED',
        message: 'Story déjà jouée',
      });
    }
    return updated;
  }

  async purchasePower(id: string, powerId: string): Promise<Peblob> {
    const current = await this.peblobModel.findById(id).exec();
    if (!current) {
      throw new NotFoundException({
        code: 'PEBLOB_NOT_FOUND',
        message: 'Peblob introuvable',
      });
    }
    if (current.purchasedPowerIds?.includes(powerId)) {
      throw new ConflictException({
        code: 'POWER_ALREADY_PURCHASED',
        message: 'Pouvoir déjà acheté',
      });
    }
    if ((current.unlockedPowerCount ?? 0) < 1) {
      throw new ConflictException({
        code: 'INSUFFICIENT_POWER_POINTS',
        message: 'Points de pouvoir insuffisants',
      });
    }

    const updated = await this.peblobModel
      .findOneAndUpdate(
        {
          _id: id,
          unlockedPowerCount: { $gte: 1 },
          purchasedPowerIds: { $ne: powerId },
        },
        {
          $inc: { unlockedPowerCount: -1 },
          $addToSet: { purchasedPowerIds: powerId },
          $set: { updatedAt: new Date() },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new ConflictException({
        code: 'POWER_PURCHASE_CONFLICT',
        message: 'Le pouvoir ne peut pas être acheté',
      });
    }
    return updated;
  }

  private clampRgb(value: number): number {
    return Math.max(0, Math.min(255, value));
  }

  private randomizeEffect(effect: number): number {
    if (effect === 0) {
      return 0;
    }

    const absoluteEffect = Math.abs(effect);
    const minimumMagnitude = Math.ceil(absoluteEffect * 0.8);
    const magnitude =
      minimumMagnitude +
      Math.floor(Math.random() * (absoluteEffect - minimumMagnitude + 1));
    return effect > 0 ? magnitude : -magnitude;
  }

  private applyStoryEffect(
    color: { r: number; g: number; b: number },
    effect: { r: number; g: number; b: number },
  ) {
    const updated = {
      r: this.clampRgb(color.r + this.randomizeEffect(effect.r)),
      g: this.clampRgb(color.g + this.randomizeEffect(effect.g)),
      b: this.clampRgb(color.b + this.randomizeEffect(effect.b)),
    };
    const missingTotal =
      color.r + color.g + color.b - (updated.r + updated.g + updated.b);

    if (missingTotal <= 0) {
      return updated;
    }

    for (const channel of ['r', 'g', 'b'] as const) {
      const available = 255 - updated[channel];
      const compensation = Math.min(available, missingTotal);
      updated[channel] += compensation;
      if (compensation === missingTotal) {
        break;
      }
    }

    return updated;
  }

  private async ensureMetrics(peblob: PeblobDocument): Promise<PeblobDocument> {
    if (
      peblob.maturity !== undefined &&
      peblob.balance !== undefined &&
      peblob.earnedPowerCount !== undefined &&
      peblob.unlockedPowerCount !== undefined &&
      peblob.dominantColor !== undefined
    ) {
      return peblob;
    }

    const metrics = this.calculateMetrics(
      peblob.structure,
      peblob.earnedPowerCount ?? 0,
      peblob.purchasedPowerIds?.length ?? 0,
    );
    Object.assign(peblob, metrics);
    if (peblob.dominantColor === undefined) {
      peblob.dominantColor = this.calculateDominantColor(peblob.structure);
    }

    if (typeof peblob.save === 'function') {
      await peblob.save();
    }
    return peblob;
  }

  private calculateDominantColor(
    structure: { r: number; g: number; b: number }[][],
  ): PeblobDominantColor {
    const colors = structure.flat();
    if (!colors.length) {
      return PeblobDominantColor.GREEN;
    }

    const average = colors.reduce(
      (total, color) => ({
        r: total.r + color.r / colors.length,
        g: total.g + color.g / colors.length,
        b: total.b + color.b / colors.length,
      }),
      { r: 0, g: 0, b: 0 },
    );
    const colorVectors: Record<PeblobDominantColor, [number, number, number]> =
      {
        [PeblobDominantColor.ORANGE]: [1, 0.5, 0],
        [PeblobDominantColor.GREEN]: [0.25, 1, 0.25],
        [PeblobDominantColor.BLUE]: [0.25, 0.25, 1],
        [PeblobDominantColor.PURPLE]: [1, 0, 1],
        [PeblobDominantColor.RED]: [1, 0.25, 0.25],
        [PeblobDominantColor.YELLOW]: [1, 1, 0],
        [PeblobDominantColor.PINK]: [1, 0.4, 0.7],
      };
    const maximum = Math.max(average.r, average.g, average.b, 1);
    const normalized = [
      average.r / maximum,
      average.g / maximum,
      average.b / maximum,
    ];

    return Object.entries(colorVectors).reduce(
      (closestColor, [color, vector]) => {
        const distance = vector.reduce(
          (total, channel, index) => total + (channel - normalized[index]) ** 2,
          0,
        );
        return distance < closestColor.distance
          ? { color: color as PeblobDominantColor, distance }
          : closestColor;
      },
      { color: PeblobDominantColor.GREEN, distance: Number.POSITIVE_INFINITY },
    ).color;
  }

  private calculateMetrics(
    structure: { r: number; g: number; b: number }[][],
    currentEarnedPowerCount = 0,
    purchasedPowerCount = 0,
  ) {
    const colors = structure.flat();
    const maturity =
      colors.length === 0
        ? 0
        : colors.reduce(
            (total, color) => total + color.r + color.g + color.b,
            0,
          ) /
          (colors.length * 255 * 3);
    const balance =
      colors.length === 0
        ? 0
        : colors.reduce(
            (total, color) =>
              total +
              1 -
              (Math.max(color.r, color.g, color.b) -
                Math.min(color.r, color.g, color.b)) /
                255,
            0,
          ) / colors.length;
    const earnedPowerCount = Math.max(
      currentEarnedPowerCount,
      maturity >= 0.76 ? 3 : maturity >= 0.51 ? 2 : maturity >= 0.26 ? 1 : 0,
    );
    const unlockedPowerCount = Math.max(
      0,
      earnedPowerCount - purchasedPowerCount,
    );
    return { maturity, balance, earnedPowerCount, unlockedPowerCount };
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
  async findByUserId(userId: string): Promise<Peblob[]> {
    const peblobs = await this.peblobModel.find({ userId }).exec();
    return Promise.all(peblobs.map((peblob) => this.ensureMetrics(peblob)));
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

    const migratedItems = await Promise.all(
      items.map((peblob) => this.ensureMetrics(peblob)),
    );

    return {
      items: migratedItems,
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
