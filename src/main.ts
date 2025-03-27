import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express'; 
import * as path from 'path';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); 

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // ✅ Serve "uploads/" folder from project root
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3001',
      'https://arborlove.com',
      'https://staging.arborlove.com',
      'https://develop.arborlove.com',
      'https://backoffice.arborlove.com',
      'https://backoffice-staging.arborlove.com',
      'https://backoffice-develop.arborlove.com',
    ],
  });

  const port = process.env.PORT || 3001; // Use 3001 locally, Railway assigns dynamically
  await app.listen(port, '0.0.0.0');
}

bootstrap();
