import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'Quotes' })
export class Quote extends Document {
  @Prop({ required: true })
  quoteId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  dateCreated: string;

  @Prop({ type: Object })
  clientDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    propertyOwner: boolean;
    additionalInfo?: string;
  };

  @Prop({ type: Array })
  services: {
    serviceType: string;
    treeLocation: string;
    treeType: string;
    treeHeight: string;
    utilityLines: boolean;
    stumpRemoval?: boolean;
    fallenDown?: boolean;
    propertyFenced: boolean;
    equipmentAccess: boolean;
    emergencyCutting: boolean;
    numOfTrees?: number;
    imageUrls?: string[];
  }[];
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
