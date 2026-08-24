import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class ApplyStoryDto {
  @ApiProperty({ example: 'story-1' })
  @IsString()
  storyId: string;

  @ApiProperty({ example: 4, minimum: -10, maximum: 10 })
  @IsInt()
  @Min(-10)
  @Max(10)
  r: number;

  @ApiProperty({ example: 1, minimum: -10, maximum: 10 })
  @IsInt()
  @Min(-10)
  @Max(10)
  g: number;

  @ApiProperty({ example: 0, minimum: -10, maximum: 10 })
  @IsInt()
  @Min(-10)
  @Max(10)
  b: number;
}
