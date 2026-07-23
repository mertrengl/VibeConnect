import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import 'multer';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    folderName: string = 'vibeconnect_media',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: folderName,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            const errorMessage =
              typeof error === 'object' && error !== null && 'message' in error
                ? String(error.message)
                : 'Cloudinary yükleme hatası';
            return reject(new Error(errorMessage));
          }
          if (!result) {
            return reject(new BadRequestException('Dosya yüklenemedi.'));
          }
          resolve(result);
        },
      );

      upload.end(file.buffer);
    });
  }
  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return this.uploadFile(file, 'vibeconnect_media');
  }
}
