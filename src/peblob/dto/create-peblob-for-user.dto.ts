import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PtiblobDto } from './create-ptiblob.dto';
import { PeblobDominantColor } from './create-peblob.dto';

export class CreatePeblobForUserDto {
  @IsDefined()
  @ApiProperty({
    description: "ID de l'utilisateur",
    example: '1234567890abcdef',
  })
  userId: string;

  @IsOptional()
  @IsString()
  @IsEnum(PeblobDominantColor)
  @ApiProperty({
    description: 'Couleur dominante fournie par le frontend',
    enum: PeblobDominantColor,
    required: false,
  })
  dominantColor?: PeblobDominantColor;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Nom du Peblob', required: false })
  name?: string;

  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PtiblobDto)
  @ApiProperty({
    description: 'Structure carrée de ptiblobs',
    type: 'array',
    items: {
      type: 'array',
      items: { $ref: getSchemaPath(PtiblobDto) },
    },
  })
  structure: PtiblobDto[][];
}
