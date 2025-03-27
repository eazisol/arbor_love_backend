import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'ScoringFactors' })
export class ScoringFactor extends Document {
  @Prop()
  factorId: string;

  @Prop()
  factorType: string;

  @Prop()
  value: string;

  @Prop()
  weight?: number;
}

export const ScoringFactorSchema = SchemaFactory.createForClass(ScoringFactor);
