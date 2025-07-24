import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

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
    description: 'Description du peblob',
    example: 'Une description détaillée de ce peblob',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Couleur du peblob',
    example: '#FF5733',
    required: false,
  })
  @IsString()
  @IsOptional()
  color?: string;
}
