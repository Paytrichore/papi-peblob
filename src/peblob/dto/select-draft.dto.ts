import { IsInt, Min } from 'class-validator';

export class SelectDraftDto {
  @IsInt()
  @Min(0)
  choiceIndex: number;
}
