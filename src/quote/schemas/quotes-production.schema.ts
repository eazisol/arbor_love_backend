import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'Quotes_Production' })
export class QuoteProduction extends Document {
  @Prop()
  quoteId: string;

  @Prop()
  amount: number;

  @Prop()
  dateCreated: string;

  @Prop({ type: Object }) // ✅ Fix here
  clientDetails: Record<string, any>;

  @Prop({ type: Array }) // you can specify more details if needed
  services: any[];
}

export const QuoteProductionSchema = SchemaFactory.createForClass(QuoteProduction);
