import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { Quote } from './schemas/quote.schema'; // your schema file
import { ConfigService } from '@nestjs/config';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { emailTemplate } from './templates/email_template';
import { quoteNotificationTemplate } from './templates/email_info_template';
import * as Handlebars from 'handlebars';
import path from 'path';
import * as fs from 'fs';
import { QuoteOption } from './schemas/quote-options.schema';
import { QuoteProduction } from './schemas/quotes-production.schema';
import { ScoringFactor } from './schemas/scoring-factor.schema';


@Injectable()
export class QuoteService {
  private sesClient: SESClient;

  constructor(
    @InjectModel(Quote.name) private readonly quoteModel: Model<Quote>,
    @InjectModel(QuoteOption.name) private optionModel: Model<QuoteOption>,
    @InjectModel(QuoteProduction.name) private productionModel: Model<QuoteProduction>,
    @InjectModel(ScoringFactor.name) private factorModel: Model<ScoringFactor>,
    private readonly configService: ConfigService,
  ) {
    this.sesClient = new SESClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  
  async getOptions(): Promise<Record<string, string[]>> {
    const allOptions = await this.optionModel.find().lean();
  
    const grouped: Record<string, Set<string>> = {};
  
    for (const { optionType, value } of allOptions) {
      if (!grouped[optionType]) {
        grouped[optionType] = new Set();
      }
      grouped[optionType].add(value);
    }
  
    // Convert sets to arrays for the final response
    const response: Record<string, string[]> = {};
    for (const key in grouped) {
      response[key] = Array.from(grouped[key]);
    }
  
    // Optional: remap 'serviceType' to 'JOB_TYPES' if needed
    if (response['serviceType']) {
      response['JOB_TYPES'] = response['serviceType'];
      delete response['serviceType'];
    }
  
    return response;
  }
  




  async getQuote(quoteId: string): Promise<Quote> {
    return this.quoteModel.findOne({ quoteId }).lean();
  }

  async getAllQuotes(): Promise<Quote[]> {
    return this.quoteModel.find().lean();
  }

  async deleteAllQuotes(): Promise<{ message: string }> {
    await this.quoteModel.deleteMany({});
    return { message: 'All quotes deleted successfully.' };
  }

  async createQuote(createQuoteDto: CreateQuoteDto): Promise<any> {
    const { clientDetails, services } = createQuoteDto;
    let totalAmount = 0;

    for (const service of services) {
      const amount = await this.generateNewQuote(service);
      totalAmount += amount;
    }

    const quoteId = uuidv4();
    const dateCreated = new Date().toISOString();

    const newQuote = await this.quoteModel.create({
      quoteId,
      clientDetails,
      services,
      amount: totalAmount,
      dateCreated,
    });

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
