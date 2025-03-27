// src/upload/upload.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageUploadService } from './s3Service.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly imageUploadService: ImageUploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image')) 
  async upload(@UploadedFile() file: Express.Multer.File) {
    const imageUrl = await this.imageUploadService.uploadImage(file);
    return {
      success: true,
      imageUrl,
    };
  }
}
