import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3001',
      'https://arborlove.com', // Master
      'https://staging.arborlove.com', // Staging
      'https://develop.arborlove.com', // Develop
      'https://backoffice.arborlove.com', // Backoffice Master
      'https://backoffice-staging.arborlove.com', // Backoffice Staging
      'https://backoffice-develop.arborlove.com', // Backoffice Develop,
    ],
  });
  await app.listen(3001);
}

bootstrap();
