import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDefined, ValidateNested } from 'class-validator';
import { PtiblobDto } from './create-ptiblob.dto';

export class CreatePeblobForUserDto {
  @IsDefined()
  @ApiProperty({
    description: "ID de l'utilisateur",
    example: '1234567890abcdef',
  })
  userId: string;

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
