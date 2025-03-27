import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'QuoteOptions' })
export class QuoteOption extends Document {
  @Prop()
  optionType: string;

  @Prop()
  value: string;
}

export const QuoteOptionSchema = SchemaFactory.createForClass(QuoteOption);
