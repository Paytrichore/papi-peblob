import { ApiProperty } from '@nestjs/swagger';
import { PeblobEntity } from '../entities/peblob.entity';

export class PeblobPageResponseDto {
  @ApiProperty({ type: [PeblobEntity] })
  items: PeblobEntity[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1, minimum: 1 })
  page: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 100 })
  pageSize: number;
}
