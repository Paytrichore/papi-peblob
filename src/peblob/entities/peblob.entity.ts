import { ApiProperty } from '@nestjs/swagger';
import { PeblobStatus } from '../dto/update-peblob.dto';
import { PtiblobEntity } from './ptiblob.entity';

export class PeblobEntity {
  @ApiProperty({
    description: 'ID unique du peblob',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nom du peblob',
    example: 'Mon Premier Peblob',
  })
  name: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur propriétaire (référence vers le microservice User)',
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  userId?: string;

  @ApiProperty({
    description: 'Matrice carrée de Ptiblobs représentant le Peblob',
    example: [
      [
        { r: 20, g: 17, b: 0 },
        { r: 14, g: 13, b: 0 },
        { r: 8, g: 7, b: 1 }
      ],
      [
        { r: 27, g: 25, b: 0 },
        { r: 17, g: 13, b: 4 },
        { r: 33, g: 28, b: 3 }
      ],
      [
        { r: 25, g: 22, b: 5 },
        { r: 16, g: 14, b: 2 },
        { r: 35, g: 28, b: 4 }
      ]
    ],
    type: 'array',
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          r: { type: 'number', minimum: 0, maximum: 255 },
          g: { type: 'number', minimum: 0, maximum: 255 },
          b: { type: 'number', minimum: 0, maximum: 255 }
        }
      }
    }
  })
  structure: PtiblobEntity[][];

  @ApiProperty({
    description: 'Taille du carré (nombre de pixels par côté)',
    example: 3,
  })
  size: number;

  @ApiProperty({
    description: 'Statut du peblob',
    example: 'active',
    enum: PeblobStatus,
  })
  status: PeblobStatus;

  @ApiProperty({
    description: 'Date de création',
    example: '2025-07-24T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2025-07-24T10:30:00Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<PeblobEntity>) {
    Object.assign(this, partial);
    
    // Calculer la taille si la structure est fournie
    if (this.structure && this.structure.length > 0) {
      this.size = this.structure.length;
    }
  }

  /**
   * Vérifie si la structure est bien carrée
   */
  isValidSquare(): boolean {
    if (!this.structure || this.structure.length === 0) {
      return false;
    }
    
    const size = this.structure.length;
    return this.structure.every(row => row.length === size);
  }

  /**
   * Obtient un Ptiblob à une position donnée
   */
  getPtiblob(row: number, col: number): PtiblobEntity | null {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
      return null;
    }
    return this.structure[row][col];
  }

  /**
   * Met à jour un Ptiblob à une position donnée
   */
  setPtiblob(row: number, col: number, ptiblob: PtiblobEntity): boolean {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
      return false;
    }
    this.structure[row][col] = ptiblob;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Calcule la luminosité moyenne du Peblob
   */
  getAverageBrightness(): number {
    if (!this.structure) return 0;
    
    let totalBrightness = 0;
    let count = 0;
    
    for (const row of this.structure) {
      for (const ptiblob of row) {
        totalBrightness += ptiblob.getBrightness();
        count++;
      }
    }
    
    return count > 0 ? totalBrightness / count : 0;
  }

  /**
   * Clone le Peblob
   */
  clone(): PeblobEntity {
    const clonedStructure = this.structure.map(row => 
      row.map(ptiblob => ptiblob.clone())
    );
    
    return new PeblobEntity({
      ...this,
      structure: clonedStructure
    });
  }
}
