import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  MaxLength, 
  IsArray, 
  ValidateNested, 
  IsNumber, 
  Min, 
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';

export class PtiblobDto {
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
}

export class CreatePeblobDto {
  @ApiProperty({
    description: 'Nom du peblob',
    example: 'Mon Premier Peblob',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'ID de l\'utilisateur propriétaire (optionnel)',
    example: 'user_123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Matrice carrée de Ptiblobs (minimum 1x1, maximum 50x50)',
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
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => Array)
  structure: PtiblobDto[][];
}
