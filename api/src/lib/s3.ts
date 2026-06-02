import { S3Client } from "@aws-sdk/client-s3";
import { config } from "../config/env";

export const s3 = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});
