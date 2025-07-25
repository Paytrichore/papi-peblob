import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PeblobDocument = Peblob & Document;

@Schema({ timestamps: true })
export class Peblob {
  @Prop()
  userId?: string;

  @Prop({ required: true, type: [[Object]] })
  structure: { r: number; g: number; b: number }[][];
}

export const PeblobSchema = SchemaFactory.createForClass(Peblob);
