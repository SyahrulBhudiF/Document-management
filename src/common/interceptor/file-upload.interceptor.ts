import { UnsupportedMediaTypeException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 } from 'uuid';

interface FileUploadOptions {
  fieldName: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  destination?: string;
  isMultiple?: boolean;
  maxFiles?: number;
}

export function fileUploadInterceptor(options: FileUploadOptions) {
  const storageConfig = diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/profile';
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const hashedName = `${Date.now()}-${v4()}${ext}`;
      cb(null, hashedName);
    },
  });

  const limits = {
    fileSize: options.maxFileSize,
    files: options.maxFiles || Infinity,
  };

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!options.allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new UnsupportedMediaTypeException(
          `File type not supported. Accepted types are: ${options.allowedMimeTypes.join(', ')}`,
        ),
        false,
      );
    }
    cb(null, true);
  };

  if (options.isMultiple) {
    return FilesInterceptor(options.fieldName, options.maxFiles, {
      storage: storageConfig,
      limits,
      fileFilter,
    });
  } else {
    return FileInterceptor(options.fieldName, {
      storage: storageConfig,
      limits,
      fileFilter,
    });
  }
}
