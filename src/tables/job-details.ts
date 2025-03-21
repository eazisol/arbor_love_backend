import {
  DynamoDBClient,
  CreateTableCommand,
  CreateTableCommandInput,
  ScalarAttributeType,
  KeyType,
  ProjectionType,
} from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';
import * as process from 'process';

dotenv.config();

const createJobDetailsTable = async (client: DynamoDBClient) => {
  const params: CreateTableCommandInput = {
    TableName: 'JobDetails',
    KeySchema: [
      { AttributeName: 'jobId', KeyType: KeyType.HASH }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'jobId', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'createdAt', AttributeType: ScalarAttributeType.S },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'CreatedAtIndex',
        KeySchema: [
          { AttributeName: 'createdAt', KeyType: KeyType.HASH }, // Partition key for the GSI
        ],
        Projection: {
          ProjectionType: ProjectionType.ALL,
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
  };

  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log('Table created successfully:', data);
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

  await createJobDetailsTable(client);
};

run().catch(console.error);
