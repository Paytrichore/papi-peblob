import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNumber, Max, Min } from "class-validator";

export class PtiblobDto {
  @ApiProperty({
    description: 'Valeur rouge (0-255)',
    example: 255,
    minimum: 0,
    maximum: 255,
  })
  @IsNumber()
  @Min(0)
  @Max(255)
  r: number;

  @ApiProperty({
    description: 'Valeur verte (0-255)',
    example: 128,
    minimum: 0,
    maximum: 255,
  })
  @IsNumber()
  @Min(0)
  @Max(255)
  g: number;

  @ApiProperty({
    description: 'Valeur bleue (0-255)',
    example: 64,
    minimum: 0,
    maximum: 255,
  })
  @IsNumber()
  @Min(0)
  @Max(255)
  b: number;
}