import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreatePeblobDto } from './dto/create-peblob.dto';
import { CreatePeblobForUserDto } from './dto/create-peblob-for-user.dto';
import { UpdatePeblobDto, PeblobStatus } from './dto/update-peblob.dto';
import { PeblobEntity } from './entities/peblob.entity';
import { PtiblobEntity } from './entities/ptiblob.entity';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Peblob, PeblobDocument } from './schemas/peblob.schema';

@Injectable()
export class PeblobService {
  private peblobs: PeblobEntity[] = [];

  constructor(
    @InjectModel(Peblob.name)
    private readonly peblobModel: Model<PeblobDocument>,
  ) {}

  async create(CreatePeblobForUserDto: CreatePeblobForUserDto): Promise<Peblob> {
    if (!CreatePeblobForUserDto.structure) {
      throw new BadRequestException('Le champ structure est obligatoire');
    }
    this.validateSquareStructure(CreatePeblobForUserDto.structure);
    const created = new this.peblobModel({
      userId: CreatePeblobForUserDto.userId,
      structure: CreatePeblobForUserDto.structure,
    });
    return created.save();
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
    const updated = await this.peblobModel
      .findByIdAndUpdate(
        id,
        { ...updatePeblobDto, updatedAt: new Date() },
        { new: true },
      )
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

  getStats(): {
    total: number;
  } {
    const total = this.peblobs.length;

    return { total };
  }

  // Méthode pour obtenir la couleur dominante d'un Peblob
  getDominantColor(id: string): { r: number; g: number; b: number } {
    const peblob = this.findOne(id);
    let totalR = 0,
      totalG = 0,
      totalB = 0;
    let count = 0;

    for (const row of peblob.structure) {
      for (const ptiblob of row) {
        totalR += ptiblob.r;
        totalG += ptiblob.g;
        totalB += ptiblob.b;
        count++;
      }
    }

    return {
      r: Math.round(totalR / count),
      g: Math.round(totalG / count),
      b: Math.round(totalB / count),
    };
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
  findByUserId(userId: string): PeblobEntity[] {
    return this.peblobs.filter((peblob) => peblob.userId === userId);
  }

  // Récupérer les statistiques d'un utilisateur
  getUserStats(userId: string): {
    total: number;
    averageSize: number;
    totalPixels: number;
  } {
    const userPeblobs = this.findByUserId(userId);
    const total = userPeblobs.length;

    const totalPixels = userPeblobs.reduce(
      (sum, peblob) => sum + peblob.size * peblob.size,
      0,
    );
    const averageSize = total > 0 ? totalPixels / total : 0;

    return {
      total,
      averageSize: Math.round(averageSize),
      totalPixels,
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
