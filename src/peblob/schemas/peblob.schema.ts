import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PeblobDocument = Peblob & Document;

@Schema({ timestamps: true })
export class Peblob {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: [[Object]] })
  structure: { r: number; g: number; b: number }[][];

  @Prop({ default: 'ACTIVE' })
  status: string;
}

export const PeblobSchema = SchemaFactory.createForClass(Peblob);
