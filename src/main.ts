import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express'; 
import * as path from 'path';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); 
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // Serve "uploads/" folder from project root
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });


  app.enableCors({
    origin: [
      //new working origins
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3001',
      'https://arborlove.com',
      'https://backoffice.arborlove.com',
      'https://www.arborlove.com'

      // //old origins
      // 'https://staging.arborlove.com',
      // 'https://develop.arborlove.com',
      // 'https://backoffice.arborlove.com',
      // 'https://backoffice-staging.arborlove.com',
      // 'https://backoffice-develop.arborlove.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  

  // const port = process.env.PORT || 5000; // Use 3001 locally
  // await app.listen(5000, '0.0.0.0');
  await app.listen(5000);

}

bootstrap();
