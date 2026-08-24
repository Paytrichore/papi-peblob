import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PeblobDominantColor } from '../dto/create-peblob.dto';

export type PeblobDocument = Peblob & Document;

@Schema({ timestamps: true })
export class Peblob {
  @Prop()
  userId?: string;

  @Prop()
  name?: string;

  @Prop({ enum: PeblobDominantColor })
  dominantColor?: PeblobDominantColor;

  @Prop({ required: true, type: [[Object]] })
  structure: { r: number; g: number; b: number }[][];

  @Prop({ min: 0, max: 1, default: 0 })
  maturity: number;

  @Prop({ min: 0, max: 1, default: 0 })
  balance: number;

  @Prop({ min: 0, max: 3, default: 0 })
  earnedPowerCount: number;

  @Prop({ min: 0, max: 3, default: 0 })
  unlockedPowerCount: number;

  @Prop({ type: [String], default: [] })
  purchasedPowerIds: string[];

  @Prop({ type: [String], default: [] })
  playedStoryIds: string[];
  @Prop({ enum: ['AVAILABLE', 'ON_MAP'], default: 'AVAILABLE' })
  status: 'AVAILABLE' | 'ON_MAP';

  @Prop({ type: [String], default: [] })
  processedEventIds: string[];

  @Prop({ type: Object })
  mapPosition?: { x: number; y: number };
}

export const PeblobSchema = SchemaFactory.createForClass(Peblob);
PeblobSchema.index({ userId: 1, dominantColor: 1, createdAt: -1 });
