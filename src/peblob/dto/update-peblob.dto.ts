import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreatePeblobDto } from './create-peblob.dto';

export class UpdatePeblobDto extends PartialType(CreatePeblobDto) {
  @ApiProperty({
    description: 'Statut actuel du peblob',
    example: 'active',
    required: false,
  })
  status?: 'active' | 'inactive' | 'archived';
}
