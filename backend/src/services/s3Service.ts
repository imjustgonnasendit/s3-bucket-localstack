import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/s3";

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "dragdrop-documents";

interface PresignedPostOptions {
  key: string;
  contentType: string;
  fileSizeLimit: number;
}

export const generatePresignedPost = async (
  options: PresignedPostOptions
): Promise<{ uploadUrl: string; fields: Record<string, string> }> => {
  console.log("☁️  [S3 SERVICE] Generating presigned POST URL");
  console.log("   Bucket:", BUCKET_NAME);
  console.log("   Key:", options.key);
  console.log("   Content-Type:", options.contentType);
  console.log("   Size limit:", options.fileSizeLimit, "bytes");

  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: BUCKET_NAME,
    Key: options.key,
    Conditions: [
      ["content-length-range", 0, options.fileSizeLimit],
      ["eq", "$Content-Type", options.contentType],
    ],
    Fields: {
      "Content-Type": options.contentType,
    },
    Expires: 3600, // URL valid for 1 hour
  });

  // For LocalStack, replace the AWS URL with LocalStack endpoint
  const s3Endpoint = process.env.S3_ENDPOINT || "http://localhost:4566";
  let localstackUrl = url
    .replace("https://s3.amazonaws.com", s3Endpoint)
    .replace("https://dragdrop-documents.s3.amazonaws.com", s3Endpoint);

  // Replace 'localstack' hostname with 'localhost' for browser access
  localstackUrl = localstackUrl.replace(
    "http://localstack:",
    "http://localhost:"
  );

  console.log(
    "✅ [S3 SERVICE] Presigned POST URL generated (expires in 1 hour)"
  );
  console.log("   Original URL:", url);
  console.log("   LocalStack URL:", localstackUrl);

  return {
    uploadUrl: localstackUrl,
    fields,
  };
};

export const verifyFileExists = async (key: string): Promise<boolean> => {
  try {
    console.log("🔍 [S3 SERVICE] Checking if file exists:", key);

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    console.log("✅ [S3 SERVICE] File exists in S3");
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      console.log("❌ [S3 SERVICE] File not found in S3");
      return false;
    }
    throw error;
  }
};

export const getDownloadUrl = async (key: string): Promise<string> => {
  console.log("☁️  [S3 SERVICE] Generating presigned GET URL for download");
  console.log("   Bucket:", BUCKET_NAME);
  console.log("   Key:", key);

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // URL expires in 15 minutes
  const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  console.log(
    "✅ [S3 SERVICE] Presigned URL generated (expires in 15 minutes)"
  );
  return url;
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  console.log("🗑️  [S3 SERVICE] Deleting file from S3:", key);

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);

  console.log("✅ [S3 SERVICE] File deleted from S3");
};
