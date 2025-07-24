import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePeblobDto } from './dto/create-peblob.dto';
import { UpdatePeblobDto, PeblobStatus } from './dto/update-peblob.dto';
import { PeblobEntity } from './entities/peblob.entity';
import { PtiblobEntity } from './entities/ptiblob.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PeblobService {
  private peblobs: PeblobEntity[] = [];

  create(createPeblobDto: CreatePeblobDto): PeblobEntity {
    // Validation que la structure est carrée
    this.validateSquareStructure(createPeblobDto.structure);

    // Conversion du DTO vers des entités Ptiblob
    const structure = createPeblobDto.structure.map(row =>
      row.map(ptiblob => new PtiblobEntity(ptiblob.r, ptiblob.g, ptiblob.b))
    );

    const newPeblob = new PeblobEntity({
      id: uuidv4(),
      name: createPeblobDto.name,
      structure,
      status: PeblobStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.peblobs.push(newPeblob);
    return newPeblob;
  }

  createRandom(name: string, size: number = 3): PeblobEntity {
    if (size < 1 || size > 50) {
      throw new BadRequestException('La taille doit être entre 1 et 50');
    }

    const structure: PtiblobEntity[][] = [];
    for (let i = 0; i < size; i++) {
      const row: PtiblobEntity[] = [];
      for (let j = 0; j < size; j++) {
        row.push(new PtiblobEntity(
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256)
        ));
      }
      structure.push(row);
    }

    const newPeblob = new PeblobEntity({
      id: uuidv4(),
      name,
      structure,
      status: PeblobStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.peblobs.push(newPeblob);
    return newPeblob;
  }

  private validateSquareStructure(structure: any[][]): void {
    if (!structure || structure.length === 0) {
      throw new BadRequestException('La structure ne peut pas être vide');
    }

    const size = structure.length;
    for (let i = 0; i < structure.length; i++) {
      if (!structure[i] || structure[i].length !== size) {
        throw new BadRequestException(`La structure doit être carrée. Ligne ${i} a ${structure[i]?.length || 0} éléments, attendu ${size}`);
      }
    }
  }

  findAll(): PeblobEntity[] {
    return this.peblobs;
  }

  findOne(id: string): PeblobEntity {
    const peblob = this.peblobs.find(p => p.id === id);
    if (!peblob) {
      throw new NotFoundException(`Peblob avec l'ID ${id} non trouvé`);
    }
    return peblob;
  }

  update(id: string, updatePeblobDto: UpdatePeblobDto): PeblobEntity {
    const peblobIndex = this.peblobs.findIndex(p => p.id === id);
    if (peblobIndex === -1) {
      throw new NotFoundException(`Peblob avec l'ID ${id} non trouvé`);
    }

    const existingPeblob = this.peblobs[peblobIndex];
    
    // Si on met à jour la structure, valider qu'elle est carrée
    if (updatePeblobDto.structure) {
      this.validateSquareStructure(updatePeblobDto.structure);
      
      // Convertir vers des entités Ptiblob
      const newStructure = updatePeblobDto.structure.map(row =>
        row.map(ptiblob => new PtiblobEntity(ptiblob.r, ptiblob.g, ptiblob.b))
      );
      
      existingPeblob.structure = newStructure;
    }

    if (updatePeblobDto.name) {
      existingPeblob.name = updatePeblobDto.name;
    }

    if (updatePeblobDto.status) {
      existingPeblob.status = updatePeblobDto.status;
    }

    existingPeblob.updatedAt = new Date();
    
    return existingPeblob;
  }

  remove(id: string): void {
    const peblobIndex = this.peblobs.findIndex(p => p.id === id);
    if (peblobIndex === -1) {
      throw new NotFoundException(`Peblob avec l'ID ${id} non trouvé`);
    }

    this.peblobs.splice(peblobIndex, 1);
  }

  getStats(): { total: number; active: number; inactive: number; archived: number } {
    const total = this.peblobs.length;
    const active = this.peblobs.filter(p => p.status === PeblobStatus.ACTIVE).length;
    const inactive = this.peblobs.filter(p => p.status === PeblobStatus.INACTIVE).length;
    const archived = this.peblobs.filter(p => p.status === PeblobStatus.ARCHIVED).length;

    return { total, active, inactive, archived };
  }

  // Méthode pour obtenir la couleur dominante d'un Peblob
  getDominantColor(id: string): { r: number; g: number; b: number } {
    const peblob = this.findOne(id);
    let totalR = 0, totalG = 0, totalB = 0;
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
      b: Math.round(totalB / count)
    };
  }

  // Filtrer les peblobs par taille
  findBySize(size: number): PeblobEntity[] {
    return this.peblobs.filter(peblob => peblob.size === size);
  }

  // Filtrer les peblobs par luminosité moyenne
  findByBrightness(minBrightness: number = 0, maxBrightness: number = 255): PeblobEntity[] {
    return this.peblobs.filter(peblob => {
      const brightness = peblob.getAverageBrightness();
      return brightness >= minBrightness && brightness <= maxBrightness;
    });
  }

  // Mettre à jour un Ptiblob spécifique dans un Peblob
  updatePtiblob(peblobId: string, row: number, col: number, r: number, g: number, b: number): PeblobEntity {
    const peblob = this.findOne(peblobId);
    
    if (!peblob.setPtiblob(row, col, new PtiblobEntity(r, g, b))) {
      throw new BadRequestException(`Position invalide: row=${row}, col=${col} pour un peblob de taille ${peblob.size}`);
    }

    return peblob;
  }

  // 👥 MÉTHODES POUR LA GESTION DES UTILISATEURS

  // Récupérer tous les peblobs d'un utilisateur
  findByUserId(userId: string): PeblobEntity[] {
    return this.peblobs.filter(peblob => peblob.userId === userId);
  }

  // Récupérer les statistiques d'un utilisateur
  getUserStats(userId: string): { 
    total: number; 
    active: number; 
    inactive: number; 
    archived: number;
    averageSize: number;
    totalPixels: number;
  } {
    const userPeblobs = this.findByUserId(userId);
    const total = userPeblobs.length;
    const active = userPeblobs.filter(p => p.status === PeblobStatus.ACTIVE).length;
    const inactive = userPeblobs.filter(p => p.status === PeblobStatus.INACTIVE).length;
    const archived = userPeblobs.filter(p => p.status === PeblobStatus.ARCHIVED).length;
    
    const totalPixels = userPeblobs.reduce((sum, peblob) => sum + (peblob.size * peblob.size), 0);
    const averageSize = total > 0 ? totalPixels / total : 0;

    return { total, active, inactive, archived, averageSize: Math.round(averageSize), totalPixels };
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
    return this.peblobs.filter(peblob => !peblob.userId);
  }

  // Supprimer tous les peblobs d'un utilisateur (pour GDPR par exemple)
  removeAllByUserId(userId: string): number {
    const initialLength = this.peblobs.length;
    this.peblobs = this.peblobs.filter(peblob => peblob.userId !== userId);
    return initialLength - this.peblobs.length;
  }
}
