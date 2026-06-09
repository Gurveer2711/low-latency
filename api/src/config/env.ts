import dotenv from "dotenv";
import path from "path";

// Load .env from project root (works for both api/ and worker/)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function require_env(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  database: {
    url: require_env("DATABASE_URL"),
  },
  redis: {
    url: require_env("REDIS_URL"),
  },
  aws: {
    accessKeyId: require_env("AWS_ACCESS_KEY_ID"),
    secretAccessKey: require_env("AWS_SECRET_ACCESS_KEY"),
    region: require_env("AWS_REGION"),
    bucket: require_env("S3_BUCKET"),
  },
  app: {
    port: parseInt(process.env.PORT || "3000"),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "please-set-a-secret",
    expiresDays: parseInt(process.env.JWT_EXPIRES_DAYS || "7"),
  },
};
