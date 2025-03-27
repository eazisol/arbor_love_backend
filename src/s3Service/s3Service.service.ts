import { Injectable } from '@nestjs/common';
import { join, extname, basename } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs'; 
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageUploadService {
  private readonly uploadPath = join(process.cwd(), 'uploads');

  async uploadImage(file: Express.Multer.File): Promise<string> {
    // Ensure uploads directory exists
    if (!existsSync(this.uploadPath)) {
      await mkdir(this.uploadPath, { recursive: true });
    }

    // Get original file extension
    const ext = extname(file.originalname);
    const originalBaseName = basename(file.originalname, ext);

    // Clean filename, ensuring full name is preserved
    const cleanBaseName = originalBaseName
      .replace(/\s+/g, '-')                      // replace spaces with -
      .replace(/[^a-zA-Z0-9._-]/g, '');          // remove special chars

    // Ensure full filename with UUID and extension
    const fileName = `${uuidv4()}-${cleanBaseName}${ext}`;
    const filePath = join(this.uploadPath, fileName);

    try {
      await writeFile(filePath, file.buffer);
      return `/uploads/${fileName}`;  // Return full filename with extension
    } catch (err) {
      throw new Error(`Failed to save image locally: ${err.message}`);
    }
  }
}