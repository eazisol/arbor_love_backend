// src/test/test-dynamo.controller.ts
import { Controller, Get } from '@nestjs/common';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';

@Controller('test-dynamo')
export class TestDynamoController {
    s3Service: any;
  @Get()
  async test() {
    const client = new DynamoDBClient({
      region: 'us-east-1',
      endpoint: 'http://localhost:8001',
      credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
      },
    });

    try {
      const result = await client.send(new ListTablesCommand({}));
      return { tables: result.TableNames };
    } catch (err) {
      console.error('Dynamo Error:', err);
      return { error: err.message };
    }
  }

@Get('test-upload')
async testUpload() {
  const file = Buffer.from('Hello MinIO!');
  await this.s3Service.uploadFile('Local_Bucket', 'hello.txt', file);
  return { success: true };
}

}
