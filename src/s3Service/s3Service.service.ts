// import { Injectable } from '@nestjs/common';
// import { S3Client } from '@aws-sdk/client-s3';
// import { Upload } from '@aws-sdk/lib-storage';
// import { v4 as uuidv4 } from 'uuid';

// @Injectable()
// export class ImageUploadService {
//   private readonly s3Client: S3Client;
//   private readonly bucketName: string;

//   constructor() {
//     this.s3Client = new S3Client({
//       region: process.env.AWS_REGION,
//       credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//       },
//     });
//     this.bucketName = process.env.AWS_S3_BUCKET_NAME;
//   }

//   async uploadImage(file: any): Promise<string> {
//     const fileName = `${uuidv4()}-${file.originalname}`;
//     const uploadParams = {
//       Bucket: this.bucketName,
//       Key: fileName,
//       Body: file.buffer,
//       ContentType: file.mimetype,
//     };

//     try {
//       const upload = new Upload({
//         client: this.s3Client,
//         params: uploadParams,
//       });

//       await upload.done();
//       const s3Url = `https://${this.bucketName}.s3.amazonaws.com/${fileName}-${file.size}`;
//       return s3Url;
//     } catch (error) {
//       throw new Error(`Failed to upload image to S3: ${error.message}`);
//     }
//   }
// }




/////////////////// if using locally use below one if using production use above one //////////////////////




// with minioadmin s3 bucket local
import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageUploadService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: 'http://localhost:9000', // MinIO local endpoint
      forcePathStyle: true,              // Required for MinIO
      credentials: {
        accessKeyId: 'minioadmin',
        secretAccessKey: 'minioadmin',
      },
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'localbucketarbolove';
  }

  async uploadImage(file: any): Promise<string> {
    const fileName = `${uuidv4()}-${file.originalname}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: uploadParams,
      });

      await upload.done();

      // Return MinIO URL (local)
      const s3Url = `http://localhost:9000/${this.bucketName}/${fileName}`;
      return s3Url;
    } catch (error) {
      throw new Error(`Failed to upload image to MinIO: ${error.message}`);
    }
  }
}
