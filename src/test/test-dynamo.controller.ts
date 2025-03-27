import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quote } from 'src/quote/schemas/quote.schema';

@Controller('test-mongo')
export class TestMongoController {
  constructor(
    @InjectModel(Quote.name) private readonly quoteModel: Model<Quote>
  ) {}

  // Check MongoDB connection and retrieve quotes
  @Get()
  async testMongoConnection() {
    try {
      const count = await this.quoteModel.estimatedDocumentCount();
      return {
        success: true,
        message: `MongoDB is connected. Quotes in DB: ${count}`,
      };
    } catch (err) {
      console.error('Mongo Error:', err);
      return { error: err.message };
    }
  }

  // Create a test quote
  @Get('insert-test')
  async insertTestQuote() {
    try {
      const result = await this.quoteModel.create({
        quoteId: 'test-123',
        amount: 100,
        dateCreated: new Date().toISOString(),
        clientDetails: {
          name: 'Test Client',
          address: '123 Mongo Lane',
          phone: '123456789',
          email: 'test@example.com',
          propertyOwner: true,
          additionalInfo: 'Test insert',
        },
        services: [
          {
            serviceType: 'Tree Removal',
            treeLocation: 'Front Yard',
            treeType: 'Palm',
            treeHeight: '31-45',
            utilityLines: false,
            propertyFenced: false,
            equipmentAccess: true,
            emergencyCutting: false,
            numOfTrees: 1,
          },
        ],
      });

      return { success: true, inserted: result };
    } catch (err) {
      console.error('Insert Error:', err);
      return { error: err.message };
    }
  }
}
