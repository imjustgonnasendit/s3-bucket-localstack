import { CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3';
import dotenv from 'dotenv';

dotenv.config();

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dragdrop-documents';

async function initLocalStack() {
  try {
    console.log('Creating S3 bucket:', BUCKET_NAME);
    
    // Create bucket
    await s3Client.send(
      new CreateBucketCommand({
        Bucket: BUCKET_NAME,
      })
    );

    console.log('Bucket created successfully');

    // Configure CORS
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: BUCKET_NAME,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedOrigins: ['*'],
              ExposeHeaders: ['ETag'],
            },
          ],
        },
      })
    );

    console.log('CORS configured successfully');
    console.log('LocalStack initialization complete!');
  } catch (error: any) {
    if (error.name === 'BucketAlreadyOwnedByYou') {
      console.log('Bucket already exists, skipping creation');
    } else {
      console.error('Error initializing LocalStack:', error);
      process.exit(1);
    }
  }
}

initLocalStack();
