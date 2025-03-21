import {
  DynamoDBClient,
  CreateTableCommand,
  CreateTableCommandInput,
  PutItemCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';
import * as process from 'process';

dotenv.config();

const createScoringFactorsTable = async (client: DynamoDBClient) => {
  const params: CreateTableCommandInput = {
    TableName: 'ScoringFactors',
    KeySchema: [
      { AttributeName: 'category', KeyType: 'HASH' }, // Partition key
      { AttributeName: 'name', KeyType: 'RANGE' }, // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'category', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    await client.send(new CreateTableCommand(params));
    console.log('ScoringFactors table created successfully');
  } catch (err) {
    console.error('Error creating ScoringFactors table:', err);
  }
};

const waitForTable = async (client: DynamoDBClient, tableName: string) => {
  console.log(`Waiting for table ${tableName} to be active...`);
  while (true) {
    try {
      const data = await client.send(
        new DescribeTableCommand({ TableName: tableName }),
      );
      if (data.Table?.TableStatus === 'ACTIVE') {
        console.log(`Table ${tableName} is now active`);
        break;
      }
    } catch (err) {
      console.error('Error describing table:', err);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

const populateScoringFactorsTable = async (client: DynamoDBClient) => {
  const scoringFactors = {
    JobTypes: {
      'Tree Trimming': 3,
      'Tree Removal': 5,
      'Arborist Report': 1,
      'Stump Removal': 3,
      'General Tree Management': 2,
      'Tree Treatment': 2,
      'Chipper GreenWaste Disposal': 2,
    },
    TreeHealth: {
      Pests: 1,
      Disease: 1,
      Fallen: 1,
      Healthy: 0,
    },
    JobTiming: {
      Asap: 1,
      LessThan2Weeks: 0,
      MoreThan2Weeks: 0.5,
    },
    LocationAccess: {
      'Access No': 6,
      'Access Moderate': 4,
      'No Obstruction': 0,
    },
    TreeType: {
      Ficus: 2,
      Podocarpus: 3,
      Pine: 3,
      Eucalyptus: 4,
      Palm: 6,
      Other: 1,
    },
    TreeLocation: {
      Residential: 1,
      Commercial: 2,
      'Front Yard': 1,
      'Back Yard': 4,
      'Right side of house': 2,
      'Left side of house': 2,
      'Other location': 4,
      'Near utilities': 6,
    },
    TreeHeight: {
      'Less than 1 story': 1,
      '1 story': 2,
      '2 story': 3,
      '3 story': 4,
      '4 story': 5,
      '4+ story': 6,
    },
  };

  const rates = {
    AdHocHourlyRate: 150,
    DayRate: 2000, // Calculated as 8 hours * 83.33 (DayRate) * 3 (StandardWorkCrew)
    FullDayHours: 8,
    StandardWorkCrew: 3,
  };

  const quoteFactors = {
    HoursConversionFactor: 5,
    Surcharge: 150,
    Commission: 10,
  };

  const allData = {
    ...scoringFactors,
    Rates: rates,
    QuoteFactors: quoteFactors,
  };

  for (const category in allData) {
    for (const name in allData[category]) {
      const score = allData[category][name];
      const params = {
        TableName: 'ScoringFactors',
        Item: {
          category: { S: category },
          name: { S: name },
          score: { N: score.toString() },
        },
      };
      try {
        await client.send(new PutItemCommand(params));
        console.log(`Inserted ${name} into ${category}`);
      } catch (err) {
        console.error(`Error inserting ${name} into ${category}:`, err);
      }
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

  await createScoringFactorsTable(client);
  await waitForTable(client, 'ScoringFactors');
  await populateScoringFactorsTable(client);
};

run().catch(console.error);
