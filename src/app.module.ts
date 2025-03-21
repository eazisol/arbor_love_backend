// @ts-ignore

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuoteModule } from './quote/quote.module';
import { ImageUploadModule } from './s3Service/s3Service.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestDynamoController } from './test/test-dynamo.controller'; // ✅


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    QuoteModule,
    ImageUploadModule,
  ],
  controllers: [AppController, TestDynamoController],
  providers: [AppService],
})
export class AppModule {}
