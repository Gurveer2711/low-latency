import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "../config/env";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export const s3 = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

// Download a file from S3 to local disk
export async function downloadFromS3(
  key: string,
  localPath: string,
): Promise<void> {
  const command = new GetObjectCommand({
    Bucket: config.aws.bucket,
    Key: key,
  });

  const response = await s3.send(command);
  const stream = response.Body as Readable;

  await new Promise<void>((resolve, reject) => {
    const fileStream = fs.createWriteStream(localPath);
    stream.pipe(fileStream);
    fileStream.on("finish", resolve);
    fileStream.on("error", reject);
  });

  console.log(`⬇️  Downloaded ${key} to ${localPath}`);
}

// Upload a file from local disk to S3
export async function uploadToS3(
  localPath: string,
  key: string,
  contentType: string,
): Promise<void> {
  const fileStream = fs.createReadStream(localPath);
  const fileSize = fs.statSync(localPath).size;

  const command = new PutObjectCommand({
    Bucket: config.aws.bucket,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
    ContentLength: fileSize,
  });

  await s3.send(command);
  console.log(`⬆️  Uploaded ${localPath} to S3 as ${key}`);
}
