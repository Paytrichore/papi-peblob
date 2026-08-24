import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

const MAX_STORY_EFFECT = 84;

export class ApplyStoryDto {
  @ApiProperty({ example: 'story-1' })
  @IsString()
  storyId: string;

  @ApiProperty({
    example: 4,
    minimum: -MAX_STORY_EFFECT,
    maximum: MAX_STORY_EFFECT,
  })
  @IsInt()
  @Min(-MAX_STORY_EFFECT)
  @Max(MAX_STORY_EFFECT)
  r: number;

  @ApiProperty({
    example: 1,
    minimum: -MAX_STORY_EFFECT,
    maximum: MAX_STORY_EFFECT,
  })
  @IsInt()
  @Min(-MAX_STORY_EFFECT)
  @Max(MAX_STORY_EFFECT)
  g: number;

  @ApiProperty({
    example: 0,
    minimum: -MAX_STORY_EFFECT,
    maximum: MAX_STORY_EFFECT,
  })
  @IsInt()
  @Min(-MAX_STORY_EFFECT)
  @Max(MAX_STORY_EFFECT)
  b: number;
}
