import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerDraftDto {
  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  result: string;
}
