import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export const MAX_PEBLOB_IDS_PER_REQUEST = 500;

export class FindPeblobsByIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PEBLOB_IDS_PER_REQUEST)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[];
}
