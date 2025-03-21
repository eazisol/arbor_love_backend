import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { CreateQuoteDto } from '../quote/dto/create-quote.dto';

@Injectable()
export class DynamoDbService {
  private client: DynamoDBDocumentClient;

  constructor(private configService: ConfigService) {
    console.log('ENV VALUES', {
      region: this.configService.get<string>('AWS_REGION'),
      endpoint: this.configService.get<string>('DYNAMODB_ENDPOINT'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
    });
        
    const ddbClient = new DynamoDBClient({
      region: this.configService.get<string>('AWS_REGION'),
      endpoint: this.configService.get<string>('DYNAMODB_ENDPOINT'), // ✅ from configService
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });    
    this.client = DynamoDBDocumentClient.from(ddbClient);
  }

  async createQuote(quoteDetails: CreateQuoteDto): Promise<void> {
    const jobId = uuidv4();
    const createdAt = new Date().toISOString();
    const params = {
      TableName: 'JobDetails',
      Item: {
        jobId,
        ...quoteDetails,
        createdAt,
      },
    };
    await this.client.send(new PutCommand(params));
  }

  async getQuote(jobId: string): Promise<CreateQuoteDto> {
    const params = {
      TableName: 'JobDetails',
      Key: {
        jobId,
      },
    };
    const { Item } = await this.client.send(new GetCommand(params));
    return Item as CreateQuoteDto;
  }

  async getQuotesByDate(createdAt: string): Promise<CreateQuoteDto[]> {
    const params = {
      TableName: 'JobDetails',
      IndexName: 'CreatedAtIndex',
      KeyConditionExpression: 'createdAt = :createdAt',
      ExpressionAttributeValues: {
        ':createdAt': createdAt,
      },
    };
    const { Items } = await this.client.send(new QueryCommand(params));
    return Items as CreateQuoteDto[];
  }
}
