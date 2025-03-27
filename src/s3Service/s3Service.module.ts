import { Module } from '@nestjs/common';
import { ImageUploadService } from './s3Service.service';
import { UploadController } from './s3Service.controller';

@Module({
  providers: [ImageUploadService],
  controllers: [UploadController],
})
export class ImageUploadModule {}
