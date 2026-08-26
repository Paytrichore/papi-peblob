import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class StartDraftDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsObject()
  question: {
    id?: string;
    situation: string;
    choices: Array<{ color: string; action: string; result: string }>;
  };
}
