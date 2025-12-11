import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/s3';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dragdrop-documents';

export const uploadToS3 = async (
  file: Express.Multer.File
): Promise<{ key: string; bucket: string }> => {
  const fileKey = `uploads/${uuidv4()}-${file.originalname}`;

  console.log('☁️  [LOCALSTACK S3] Uploading file to S3');
  console.log('   Bucket:', BUCKET_NAME);
  console.log('   Key:', fileKey);
  console.log('   File Size:', file.size, 'bytes');
  console.log('   Content Type:', file.mimetype);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);
  console.log('✅ [LOCALSTACK S3] File uploaded successfully to S3');

  return {
    key: fileKey,
    bucket: BUCKET_NAME,
  };
};

export const getDownloadUrl = async (key: string): Promise<string> => {
  console.log('☁️  [LOCALSTACK S3] Generating presigned URL for download');
  console.log('   Bucket:', BUCKET_NAME);
  console.log('   Key:', key);
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // URL expires in 1 hour
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  console.log('✅ [LOCALSTACK S3] Presigned URL generated (expires in 1 hour)');
  return url;
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};
