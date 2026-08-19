import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePeblobDto } from './create-peblob.dto';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PeblobDominantColor } from './create-peblob.dto';

export enum PeblobStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export class UpdatePeblobDto extends PartialType(CreatePeblobDto) {
  @ApiProperty({ description: 'Nom du Peblob', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Couleur dominante fournie par le frontend',
    enum: PeblobDominantColor,
    required: false,
  })
  @IsOptional()
  @IsEnum(PeblobDominantColor)
  dominantColor?: PeblobDominantColor;

  @ApiProperty({
    description: 'Statut actuel du peblob',
    example: 'active',
    enum: PeblobStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PeblobStatus)
  status?: PeblobStatus;
}
