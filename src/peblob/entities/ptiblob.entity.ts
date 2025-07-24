import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class PtiblobEntity {
  @ApiProperty({
    description: 'Valeur rouge (0-255)',
    example: 255,
    minimum: 0,
    maximum: 255,
  })
  @IsNumber()
  @Min(0)
  @Max(255)
  r: number;

  @ApiProperty({
    description: 'Valeur verte (0-255)',
    example: 128,
    minimum: 0,
    maximum: 255,
  })
  @IsNumber()
  @Min(0)
  @Max(255)
  g: number;

  @ApiProperty({
    description: 'Valeur bleue (0-255)',
    example: 64,
    minimum: 0,
    maximum: 255,
  })
  @IsNumber()
  @Min(0)
  @Max(255)
  b: number;

  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  /**
   * Convertit le Ptiblob en couleur hexadécimale
   */
  toHex(): string {
    return `#${this.r.toString(16).padStart(2, '0')}${this.g.toString(16).padStart(2, '0')}${this.b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Clone le Ptiblob
   */
  clone(): PtiblobEntity {
    return new PtiblobEntity(this.r, this.g, this.b);
  }
}
