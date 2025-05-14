import { fileUploadInterceptor } from '../file-upload.interceptor';

const MAX_PROFILE_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_PROFILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const ProfileUploadInterceptor = fileUploadInterceptor({
  fieldName: 'profilePicture',
  maxFileSize: MAX_PROFILE_FILE_SIZE,
  allowedMimeTypes: ACCEPTED_PROFILE_TYPES,
  destination: './uploads/profile',
});
