import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Description du peblob',
    example: 'Une description détaillée de ce peblob',
  })
  description?: string;

  @ApiProperty({
    description: 'Couleur du peblob',
    example: '#FF5733',
  })
  color?: string;

  @ApiProperty({
    description: 'Statut du peblob',
    example: 'active',
  })
  status: 'active' | 'inactive' | 'archived';

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
  }
}
