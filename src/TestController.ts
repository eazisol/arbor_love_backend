import { Controller, Get } from '@nestjs/common';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';

@Controller('test-dynamo')
export class TestDynamoController {
  @Get()
  async test() {
    const client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:8001', // 🚨 LOCAL ENDPOINT
      credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
      },
    });

    try {
      const result = await client.send(new ListTablesCommand({}));
      return result;
    } catch (err) {
      console.error('Dynamo Error:', err);
      return { error: err.message };
    }
  }
}
