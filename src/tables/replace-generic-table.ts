import {
  DynamoDBClient,
  CreateTableCommand,
  PutItemCommand,
  DeleteTableCommand,
  DeleteItemCommand,
  ScanCommand,
  CreateTableCommandInput,
  PutItemCommandInput,
  DeleteItemCommandInput,
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

const deleteTable = async (client: DynamoDBClient) => {
  const params = {
    TableName: 'QuoteOptions',
  };

  try {
    await client.send(new DeleteTableCommand(params));
    console.log('Table deleted successfully');
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log('Table does not exist');
    } else {
      console.error('Error deleting table:', err);
    }
  }
};

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

const waitForTableActive = async (
  client: DynamoDBClient,
  tableName: string,
) => {
  console.log(`Waiting for table ${tableName} to become active...`);
  while (true) {
    try {
      const response = await client.send(
        new DescribeTableCommand({ TableName: tableName }),
      );
      if (response.Table?.TableStatus === 'ACTIVE') {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      if (err.name === 'ResourceNotFoundException') {
        console.log(`Table ${tableName} not found, retrying...`);
      } else {
        console.error('Error describing table:', err);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.log(`Table ${tableName} is now active`);
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

  // Delete the existing table if it exists
  await deleteTable(client);

  // Create a new table
  await createQuoteOptionsTable(client);

  // Add a short delay to ensure table creation is processed
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Wait for the table to be active
  await waitForTableActive(client, 'QuoteOptions');

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
