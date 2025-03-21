import { Module } from '@nestjs/common';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { DynamoDbModule } from 'src/dynamodb/dynamodb.module';

@Module({
  imports: [DynamoDbModule],
  controllers: [QuoteController],
  providers: [QuoteService],
})
export class QuoteModule {}
