import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePeblobDto } from './create-peblob.dto';
import { IsOptional, IsEnum } from 'class-validator';

export enum PeblobStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export class UpdatePeblobDto extends PartialType(CreatePeblobDto) {
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
