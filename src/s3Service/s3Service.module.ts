import { Module } from '@nestjs/common';
import { ImageUploadService } from './s3Service.service';
import { ImageUploadController } from './s3Service.controller';

@Module({
  providers: [ImageUploadService],
  controllers: [ImageUploadController],
})
export class ImageUploadModule {}
