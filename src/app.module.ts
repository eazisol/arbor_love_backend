// @ts-ignore

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuoteModule } from './quote/quote.module';
import { ImageUploadModule } from './s3Service/s3Service.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI, {
      dbName: 'arbor_love',
    }),
    QuoteModule,
    ImageUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
