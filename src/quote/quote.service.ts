import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { DynamoDbService } from 'src/dynamodb/dynamodb.service';
import { ConfigService } from '@nestjs/config';
import { emailTemplate } from './templates/email_template';
import {quoteNotificationTemplate} from './templates/email_info_template'

import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommandInput,
  ScanCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

@Injectable()
export class QuoteService {
  private client: DynamoDBClient;
  private sesClient: SESClient;

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private configService: ConfigService,
    
  ) {
    console.log('DynamoDBClient config:', {
      region: this.configService.get<string>('AWS_REGION'),
      endpoint: this.configService.get<string>('DYNAMODB_ENDPOINT'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    });
    
    this.client = new DynamoDBClient({
      
      region: this.configService.get<string>('AWS_REGION'),
      endpoint: this.configService.get<string>('DYNAMODB_ENDPOINT'), // ✅ fix here
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
    this.sesClient = new SESClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async getOptions(): Promise<Record<string, string[]>> {
    const params: ScanCommandInput = {
      TableName: 'QuoteOptions',
    };
    const command = new ScanCommand(params);
    const response = await this.client.send(command);

    const options: Record<string, string[]> = {};

    for (const item of response.Items) {
      const optionType = item.optionType.S;
      const value = item.value.S;

      if (!options[optionType]) {
        options[optionType] = [];
      }
      options[optionType].push(value);
    }

    return options;
  }

  async getQuote(quoteId: string): Promise<any> {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      Key: {
        quoteId: { S: quoteId },
      },
    };

    try {
      const data = await this.client.send(new GetItemCommand(params));
      return this.transformDynamoDBItem(data.Item);
    } catch (err) {
      throw new Error(`Error fetching quote: ${err.message}`);
    }
  }

  async getAllQuotes(): Promise<any> {
    const params: ScanCommandInput = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    };

    try {
      const data = await this.client.send(new ScanCommand(params));
      if (!data.Items) {
        throw new Error('No quotes found.');
      }
      const quotes = data.Items.map((item) => this.transformDynamoDBItem(item));
      return quotes;
    } catch (err) {
      throw new Error(`Error fetching all quotes: ${err.message}`);
    }
  }

  // To transform DynamoDB data
  private transformDynamoDBItem(item: any): any {
    if (!item) {
      return null;
    }

    const getNestedValue = (obj, path, defaultValue = null) => {
      return path.reduce(
        (acc, part) => (acc && acc[part] ? acc[part] : defaultValue),
        obj,
      );
    };

    const transformService = (service) => ({
      serviceType: getNestedValue(service, ['M', 'serviceType', 'S'], ''),
      numOfTrees: parseInt(
        getNestedValue(service, ['M', 'numOfTrees', 'N'], '0'),
        10,
      ),
      treeLocation: getNestedValue(service, ['M', 'treeLocation', 'S'], ''),
      treeType: getNestedValue(service, ['M', 'treeType', 'S'], ''),
      treeHeight: getNestedValue(service, ['M', 'treeHeight', 'S'], ''),
      utilityLines: getNestedValue(
        service,
        ['M', 'utilityLines', 'BOOL'],
        false,
      ),
      stumpRemoval: getNestedValue(
        service,
        ['M', 'stumpRemoval', 'BOOL'],
        false,
      ),
      propertyFenced: getNestedValue(
        service,
        ['M', 'propertyFenced', 'BOOL'],
        false,
      ),
      equipmentAccess: getNestedValue(
        service,
        ['M', 'equipmentAccess', 'BOOL'],
        false,
      ),
      emergencyCutting: getNestedValue(
        service,
        ['M', 'emergencyCutting', 'BOOL'],
        false,
      ),
      fallenDown: getNestedValue(service, ['M', 'fallenDown', 'BOOL'], false),
      imageUrls: getNestedValue(service, ['M', 'imageUrls', 'SS'], []),
    });

    return {
      quoteId: getNestedValue(item, ['quoteId', 'S'], ''),
      clientDetails: {
        name: getNestedValue(item, ['clientDetails', 'M', 'name', 'S'], ''),
        address: getNestedValue(
          item,
          ['clientDetails', 'M', 'address', 'S'],
          '',
        ),
        phone: getNestedValue(item, ['clientDetails', 'M', 'phone', 'S'], ''),
        email: getNestedValue(item, ['clientDetails', 'M', 'email', 'S'], ''),
        propertyOwner: getNestedValue(
          item,
          ['clientDetails', 'M', 'propertyOwner', 'BOOL'],
          false,
        ),
        additionalInfo: getNestedValue(
          item,
          ['clientDetails', 'M', 'additionalInfo', 'S'],
          '',
        ), // Retrieve additionalInfo
      },
      services: getNestedValue(item, ['services', 'L'], []).map(
        transformService,
      ),
      amount: parseFloat(getNestedValue(item, ['amount', 'N'], '0')),
      dateCreated: getNestedValue(item, ['dateCreated', 'S'], ''),
    };
  }

  private getTemplate(fileName: string): string {
    // Resolve the path to the template file
    const filePath = path.join(__dirname, 'templates', fileName);
    return fs.readFileSync(filePath, 'utf8');
  }

  private async sendQuoteNotification(
    quoteId: string,
    clientDetails: any,
    services: any[],
    amount: number,
    dateCreated: string,
    additionalInfo:string,
  ): Promise<void> {
    const template = Handlebars.compile(emailTemplate);

    const data = {
      clientName: clientDetails.name,
      quoteId: quoteId,
      dateCreated: dateCreated,
      services: services.map((service) => ({
        serviceType: service.serviceType,
        treeLocation: service.treeLocation,
        treeHeight: service.treeHeight,
        treeType: service.treeType,
        numOfTrees: service.numOfTrees,
        utilityLines: service.utilityLines ? 'Yes' : 'No',
        stumpRemoval: service.stumpRemoval ? 'Yes' : 'No',
        imageUrl:service.imageUrls
      })),
      amount:amount.toFixed(2),
      additionalInfo,
    };

    const htmlBody = template(data);
    const adminTemplate = Handlebars.compile(quoteNotificationTemplate);
    const adminHtmlBody = adminTemplate(data);

    const params = {
      Destination: {
        ToAddresses: [clientDetails.email],
      },
      Message: {
        Body: {
          Html: {
            Data: htmlBody,
          },
        },
        Subject: {
          Data: 'Your Tree Service Quote',
        },
      },
      Source: this.configService.get<string>('SES_SOURCE_EMAIL'),
    };

    const adminParams = {
      Destination: {
        ToAddresses: ['info@arborlove.com'],
      },
      Message: {
        Body: {
          Html: {
            Data: adminHtmlBody, // Send the admin template to the admin
          },
        },
        Subject: {
          Data: 'New Quote Requested',
        },
      },
      Source: this.configService.get<string>('SES_SOURCE_EMAIL'),
    };

    try {
      if (process.env.SHOULD_SEND_EMAIL === 'true') {
        await this.sesClient.send(new SendEmailCommand(params));
        await this.sesClient.send(new SendEmailCommand(adminParams));
      } else {
        console.log('📭 Skipping SES email send in development mode');
      }
    } catch (err) {
      throw new Error(`Error sending SES email: ${err.message}`);
    }    
  }

  async deleteAllQuotes(): Promise<any> {
    const scanParams: ScanCommandInput = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    };

    try {
      const data = await this.client.send(new ScanCommand(scanParams));

      if (!data.Items) {
        return { message: 'No quotes to delete.' };
      }

      const deletePromises = data.Items.map(async (item) => {
        const deleteParams = {
          TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
          Key: {
            quoteId: { S: item.quoteId.S },
          },
        };
        await this.client.send(new DeleteItemCommand(deleteParams));
      });

      await Promise.all(deletePromises);

      return { message: 'All quotes deleted successfully.' };
    } catch (err) {
      throw new Error(`Error deleting all quotes: ${err.message}`);
    }
  }

  private async generateNewQuote({
    treeType,
    serviceType,
    treeHeight,
    treeLocation,
    utilityLines,
    stumpRemoval,
    fallenDown,
    propertyFenced,
    equipmentAccess,
    emergencyCutting,
  }: {
    treeType: string;
    serviceType: string;
    treeHeight: string;
    treeLocation: string;
    utilityLines: boolean;
    stumpRemoval?: boolean;
    fallenDown?: boolean;
    propertyFenced: boolean;
    equipmentAccess: boolean;
    emergencyCutting: boolean;
  }): Promise<number> {
    const nonStandardTreeTypes: string[] = [
      'Palm',
      'Pine',
      'Podocarpus',
      'Ficus',
      'Eucalyptus',
      'Carrotwood',
    ];

    const removalConfig: any = {
      standard: {
        surcharge: 0,
        baseRate: 250,
        treeHeightRates: {
          '15': 0.0,
          '16-30': 0.6,
          '31-45': 5.5,
          '46-60': 7.5,
          '60+': 13.0,
        },
        emergencyCutting: 500,
        stumpRemoval: 345,
        fallenTree: -0.15,
        propertyFenced: 0.25,
        locationAdjustments: {
          frontYard: -0.1,
          backYard: 0.1,
        },
        utilityLines: 800,
        equipmentAccess: 345,
      },
      nonStandard: {
        surcharge: 150,
        baseRate: 400,
        treeHeightRates: {
          '15': 0.0,
          '16-30': 0.75,
          '31-45': 5.5,
          '46-60': 8.0,
          '60+': 14.0,
        },
        emergencyCutting: 500,
        stumpRemoval: 365,
        fallenTree: -0.15,
        propertyFenced: 0.25,
        locationAdjustments: {
          frontYard: -0.1,
          backYard: 0.1,
        },
        utilityLines: 800,
        equipmentAccess: 345,
      },
      others: {
        surcharge: 150,
        baseRate: 400,
        treeHeightRates: {
          '15': 0.0,
          '16-30': 0.45,
          '31-45': 5.5,
          '46-60': 8.0,
          '60+': 14.0,
        },
        emergencyCutting: 500,
        stumpRemoval: 365,
        fallenTree: -0.15,
        propertyFenced: 0.25,
        locationAdjustments: {
          frontYard: -0.1,
          backYard: 0.1,
        },
        utilityLines: 800,
        equipmentAccess: 345,
      },
    };

    const ficusCarrotwoodHeightRates = {
      '16-30': {
        Carrotwood: 0.65,
      },
      '40-60': {
        Ficus: 9.0, // 900%
        Carrotwood: 7.0, // 700%
      },
      '60+': {
        Ficus: 14.5, // 1450%
        Carrotwood: 14.0, // 1400%
      },
    };

    const trimmingConfig = {
      standard: {
        baseRate: 250,
        surcharge: 0,
        treeHeightRates: {
          '15': 0.0,
          '16-30': 0.15,
          '31-45': 0.3,
          '46-60': 0.8,
          '60+': 1.2,
        },
        locationAdjustments: {
          frontYard: 0.0,
          backYard: 0.25,
        },
        utilityLines: 1,
        propertyFenced: 0.25,
        equipmentAccess: -0.1,
        emergencyCutting: 0.15,
      },
      nonStandard: {
        baseRate: 275,
        surcharge: 150,
        treeHeightRates: {
          '15': 0.0,
          '16-30': 0.2,
          '31-45': 0.35,
          '46-60': 0.85,
          '60+': 1.25,
        },
        locationAdjustments: {
          frontYard: 0.0,
          backYard: 0.3,
        },
        utilityLines: 1.5,
        propertyFenced: 0.25,
        equipmentAccess: -0.1,
        emergencyCutting: 0.15,
      },
      others: {
        baseRate: 265,
        surcharge: 150,
        treeHeightRates: {
          '15': 0.0,
          '16-30': 0.2,
          '31-45': 0.35,
          '46-60': 0.85,
          '60+': 1.25,
        },
        locationAdjustments: {
          frontYard: 0.0,
          backYard: 0.3,
        },
        utilityLines: 1.5,
        propertyFenced: 0.25,
        equipmentAccess: -0.1,
        emergencyCutting: 0.15,
      },
    };
    const config =
      serviceType === 'Tree Trimming' ? trimmingConfig : removalConfig;

    const isNonStandardTree = nonStandardTreeTypes.includes(treeType);
    const isOtherTreeType =
      treeType === "I'm not sure what kind of tree I have";

    const isFicusOrCarrotwood =
      treeType === 'Ficus' || treeType === 'Carrotwood';

    const selectedConfig = isNonStandardTree
      ? config.nonStandard
      : isOtherTreeType
        ? config.others
        : config.standard;

    let amount: number = selectedConfig.baseRate;

    if (isFicusOrCarrotwood && serviceType === 'Tree Removal') {
      const ficusCarrotwoodHeightRates = {
        '15': {
          Ficus: 0.0, // 900%
          Carrotwood: 0.0, // 700%
        },
        '16-30': {
          Ficus: 0.75, // 900%
          Carrotwood: 0.75, // 700%
        },
        '31-45': {
          Ficus: 5.5, // 900%
          Carrotwood: 5.5, // 700%
        },
        '40-60': {
          Ficus: 9.0, // 900%
          Carrotwood: 7.0, // 700%
        },
        '60+': {
          Ficus: 14.5, // 1450%
          Carrotwood: 14.0, // 1400%
        },
      };
      const heightRate = ficusCarrotwoodHeightRates[treeHeight][treeType];
      if (heightRate) {
        amount += selectedConfig.baseRate * heightRate;
        console.log(
          `Applied ${heightRate * 100}% for ${treeType} with height ${treeHeight}, total amount: ${amount}`,
        );
      }
    } else {
      console.log('TreeType>>>', treeType);
      console.log('in else block ');
      const heightAdjustment = selectedConfig.treeHeightRates[treeHeight] || 0;
      amount += selectedConfig.baseRate * heightAdjustment;
      console.log('selectedConfig.baseRate', selectedConfig.baseRate);
      console.log('heightAdjustment', heightAdjustment);
      console.log('Height amount>>', amount, heightAdjustment);
    }

    if (propertyFenced) {
      amount += selectedConfig.baseRate * selectedConfig.propertyFenced;
      console.log('Fenced amount', amount);
    }

    // Stump removal adjustment
    if (serviceType === 'Tree Removal') {
      if (stumpRemoval) {
        amount += selectedConfig.stumpRemoval;
        console.log('Stump amount', amount);
      }
      // Fallen tree adjustment
      if (fallenDown) {
        amount += selectedConfig.baseRate * selectedConfig.fallenTree;
      }
    }

    // Location adjustments
    if (treeLocation === 'Back Yard') {
      amount +=
        selectedConfig.baseRate * selectedConfig.locationAdjustments.backYard;
      console.log(
        'Back Yard>>>',
        selectedConfig.baseRate,
        selectedConfig.locationAdjustments.backYard,
      );
      console.log('amount', amount);
    } else if (treeLocation === 'Front Yard') {
      amount +=
        selectedConfig.baseRate * selectedConfig.locationAdjustments.frontYard;
      console.log(
        'Front Yard>>>',
        selectedConfig.baseRate,
        selectedConfig.locationAdjustments.frontYard,
      );
    }

    // Utility lines adjustment
    if (serviceType === 'Tree Removal') {
      if (utilityLines) {
        amount += selectedConfig.utilityLines;
        console.log('utilityLines>>>', selectedConfig.utilityLines, amount);
      }
      if (emergencyCutting) {
        console.log(
          'selectedConfig.emergencyCutting>>',
          selectedConfig.emergencyCutting,
        );
        console.log('amount', amount);
        amount += selectedConfig.emergencyCutting;
      }
    } else {
      if (utilityLines) {
        amount += selectedConfig.baseRate * selectedConfig.utilityLines;
        console.log('utilityLines>>>', selectedConfig.utilityLines, amount);
      }
      if (emergencyCutting) {
        amount += selectedConfig.baseRate * selectedConfig.emergencyCutting;
      }
    }

    // Equipment access adjustment
    if (serviceType === 'Tree Removal') {
      if (!equipmentAccess) {
        amount += selectedConfig.equipmentAccess;
        console.log(
          'selectedConfig.equipmentAccess>>>',
          selectedConfig.equipmentAccess,
        );
      }
    }

    if (serviceType === 'Tree Trimming') {
      if (equipmentAccess) {
        amount += selectedConfig.equipmentAccess * selectedConfig.baseRate;
        console.log(
          'selectedConfig.equipmentAccess>>>',
          selectedConfig.equipmentAccess,
        );
      }
    }

    // Apply commission (if needed)
    amount += selectedConfig.surcharge;
    amount += amount * 0.1;
    console.log(amount);

    console.log(this.applyPricingTiers(amount), 'New Amount');
    return this.applyPricingTiers(amount);
  }

  async createQuote(createQuoteDto: CreateQuoteDto): Promise<any> {
    const { clientDetails, services } = createQuoteDto;
    let totalAmount = 0;

    for (const service of services) {
      const amount = await this.generateNewQuote({
        ...service,
      });
      totalAmount += amount;
    }
    const quoteId = uuidv4();

    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      Item: {
        quoteId: { S: quoteId },
        clientDetails: {
          M: {
            name: { S: clientDetails.name },
            address: { S: clientDetails.address },
            phone: { S: clientDetails.phone },
            email: { S: clientDetails.email },
            propertyOwner: { BOOL: clientDetails.propertyOwner },
            additionalInfo: { S: clientDetails.additionalInfo || '' },
          },
        },
        services: {
          L: services.map((service) => {
            const serviceItem = {
              M: {
                serviceType: { S: service.serviceType },
                treeLocation: { S: service.treeLocation },
                treeType: { S: service.treeType },
                treeHeight: { S: service.treeHeight },
                utilityLines: { BOOL: service.utilityLines },
                propertyFenced: { BOOL: service.propertyFenced },
                equipmentAccess: { BOOL: service.equipmentAccess },
                emergencyCutting: { BOOL: service.emergencyCutting },
              },
            };

            // Add optional fields if they exist
            if (service.numOfTrees !== undefined) {
              serviceItem.M['numOfTrees'] = {
                N: service.numOfTrees.toString(),
              };
            }
            if (service.stumpRemoval) {
              serviceItem.M['stumpRemoval'] = { BOOL: service.stumpRemoval };
            }
            if (service.fallenDown) {
              serviceItem.M['fallenDown'] = { BOOL: service.fallenDown };
            }
            if (service.imageUrls) {
              serviceItem.M['imageUrls'] = { SS: service.imageUrls };
            }

            return serviceItem;
          }),
        },
        amount: { N: totalAmount.toString() },
        dateCreated: { S: new Date().toISOString() },
      },
    };

    try {
      // Insert the quote into DynamoDB
      await this.client.send(new PutItemCommand(params));
      const dateCreated = new Date().toISOString();
      // Send an email notification to the client
      await this.sendQuoteNotification(
        quoteId,
        clientDetails,
        services,
        totalAmount,
        dateCreated,
        clientDetails.additionalInfo,
      );
      return {
        message: 'Quote inserted successfully',
        quoteId,
        amount: totalAmount,
      };
    } catch (err) {
      throw new Error(`Error inserting quote: ${err.message}`);
    }
  }

  private applyPricingTiers(amount: number): number {
    if (amount < 2500) {
      return amount;
    } else if (amount >= 2500 && amount <= 3000) {
      return 2800;
    } else if (amount > 3000 && amount <= 5299) {
      return amount;
    } else if (amount >= 5300 && amount <= 6000) {
      return 5600;
    } else if (amount > 6000 && amount <= 7699) {
      return amount;
    } else if (amount >= 7700 && amount <= 8900) {
      return 8400;
    } else if (amount > 8900 && amount <= 10599) {
      return amount;
    } else if (amount >= 10600 && amount <= 12000) {
      return 11200;
    } else if (amount > 12001) {
      return amount;
    } else {
      return amount;
    }
  }
}
