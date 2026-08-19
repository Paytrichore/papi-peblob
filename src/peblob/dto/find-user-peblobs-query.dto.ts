import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PeblobDominantColor } from './create-peblob.dto';

export enum PeblobSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FindUserPeblobsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsEnum(PeblobDominantColor)
  color?: PeblobDominantColor;

  @IsOptional()
  @IsEnum(PeblobSortOrder)
  sortOrder: PeblobSortOrder = PeblobSortOrder.DESC;
}
