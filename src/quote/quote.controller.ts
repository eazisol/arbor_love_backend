import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Controller('quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get('all')
  async getAllQuotes() {
    try {
      const quotes = await this.quoteService.getAllQuotes();
      return quotes;
    } catch (err) {
      throw new Error(`Error fetching quotes: ${err.message}`);
    }
  }

  @Delete('all')
  async deleteAllQuotes() {
    try {
      const result = await this.quoteService.deleteAllQuotes();
      return result;
    } catch (err) {
      throw new Error(`Error deleting quotes: ${err.message}`);
    }
  }

  // @Post('create')
  // generateQuote(@Body() generateQuoteDto: CreateQuoteDto) {
  //   return this.quoteService.generateQuote(generateQuoteDto);
  // }

  @Post('create')
  generateNewQuote(
    @Body()
    params: CreateQuoteDto,
  ) {
    return this.quoteService.createQuote(params);
  }

  @Get('options')
  getJobTypes() {
    return this.quoteService.getOptions();
  }

  @Get(':id')
  getQuote(@Param('id') id: string) {
    return this.quoteService.getQuote(id);
  }
}
