import {
  DynamoDBClient,
  CreateTableCommand,
  CreateTableCommandInput,
} from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';
import * as process from 'process';

dotenv.config();

const createQuoteTable = async (client: DynamoDBClient) => {
  const params: CreateTableCommandInput = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    KeySchema: [
      { AttributeName: 'quoteId', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [{ AttributeName: 'quoteId', AttributeType: 'S' }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log('Table created successfully');
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

const run = async () => {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  await createQuoteTable(client);
};

run().catch(console.error);
