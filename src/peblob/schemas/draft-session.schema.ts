import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PeblobDominantColor } from '../dto/create-peblob.dto';
import { DraftStatus } from '../draft-status.enum';

export type DraftSessionDocument = DraftSession & Document;

type DraftChoice = {
  structure: { r: number; g: number; b: number }[][];
  dominantColor: PeblobDominantColor;
};

@Schema({ timestamps: true })
export class DraftSession {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, type: Object })
  story: { color: string; action: string; result: string };

  @Prop({ required: true, type: [Object], select: true })
  choices: DraftChoice[];

  @Prop({ required: true, enum: DraftStatus, default: DraftStatus.IN_PROGRESS })
  status: DraftStatus;

  @Prop()
  selectedIndex?: number;
}

export const DraftSessionSchema = SchemaFactory.createForClass(DraftSession);
DraftSessionSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: DraftStatus.IN_PROGRESS },
  },
);
