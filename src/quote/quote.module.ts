import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Quote, QuoteSchema } from './schemas/quote.schema'; // <-- Import your schema
import { TestMongoController } from 'src/test/test-dynamo.controller';
import { QuoteOption, QuoteOptionSchema } from './schemas/quote-options.schema';
import { QuoteProduction, QuoteProductionSchema } from './schemas/quotes-production.schema';
import { ScoringFactor, ScoringFactorSchema } from './schemas/scoring-factor.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quote.name, schema: QuoteSchema },
      { name: QuoteOption.name, schema: QuoteOptionSchema },
      { name: QuoteProduction.name, schema: QuoteProductionSchema },
      { name: ScoringFactor.name, schema: ScoringFactorSchema },
    ]),
  ],
  controllers: [QuoteController,TestMongoController],
  providers: [QuoteService],
})
export class QuoteModule {}
