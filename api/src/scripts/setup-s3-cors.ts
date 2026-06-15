import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";
import { config } from "../config/env";
import { logger } from "../lib/logger";

async function run() {
  try {
    const bucket = config.aws.bucket;
    logger.info(`Attempting to apply CORS configuration to S3 bucket: ${bucket}`);

    const command = new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["PUT", "POST", "GET", "DELETE", "HEAD"],
            // Allow all origins, or you can specify ["http://localhost:3001", "http://localhost:3000"]
            AllowedOrigins: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });

    await s3.send(command);
    logger.info("✅ S3 CORS configuration successfully updated!");
  } catch (error) {
    logger.error("Failed to configure S3 CORS", error);
  }
}

run();
