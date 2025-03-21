import {
  DynamoDBClient,
  CreateTableCommand,
  PutItemCommand,
  CreateTableCommandInput,
  PutItemCommandInput,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  JOB_TYPES,
  TREE_LOCATIONS,
  TREE_TYPES,
  TREE_HEIGHTS,
  JOB_TIMINGS,
  TREE_HEALTH,
  LOCATION_ACCESS,
} from '../quote/quote.constants';
import * as dotenv from 'dotenv';
import * as process from 'process';

dotenv.config();

const createQuoteOptionsTable = async (client: DynamoDBClient) => {
  const params: CreateTableCommandInput = {
    TableName: 'QuoteOptions',
    KeySchema: [
      { AttributeName: 'optionType', KeyType: 'HASH' }, // Partition key
      { AttributeName: 'value', KeyType: 'RANGE' }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'optionType', AttributeType: 'S' },
      { AttributeName: 'value', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log('Table created successfully');
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating table:', err);
    }
  }
};

const insertOption = async (
  client: DynamoDBClient,
  optionType: string,
  values: string[],
) => {
  for (const value of values) {
    const params: PutItemCommandInput = {
      TableName: 'QuoteOptions',
      Item: {
        optionType: { S: optionType },
        value: { S: value },
      },
    };

    try {
      await client.send(new PutItemCommand(params));
      console.log(`Inserted ${value} into ${optionType}`);
    } catch (err) {
      console.error(`Error inserting ${value} into ${optionType}:`, err);
    }
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

  // Check if the table exists
  try {
    await client.send(new DescribeTableCommand({ TableName: 'QuoteOptions' }));
    console.log('Table exists, skipping creation');
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log('Table does not exist, creating');
      await createQuoteOptionsTable(client);
    } else {
      console.error('Error checking table existence:', err);
    }
  }

  // Insert options into the table
  await insertOption(client, 'JOB_TYPES', JOB_TYPES);
  await insertOption(client, 'TREE_LOCATIONS', TREE_LOCATIONS);
  await insertOption(client, 'TREE_TYPES', TREE_TYPES);
  await insertOption(client, 'TREE_HEIGHTS', TREE_HEIGHTS);
  await insertOption(client, 'JOB_TIMINGS', JOB_TIMINGS);
  await insertOption(client, 'TREE_HEALTH', TREE_HEALTH);
  await insertOption(client, 'SERVICEABLE_AREA', LOCATION_ACCESS);
};

run().catch(console.error);
