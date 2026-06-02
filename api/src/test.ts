import { config } from "./config/env";

console.log("✅ Config loaded successfully");
console.log(
  "Database URL starts with:",
  config.database.url.substring(0, 20) + "...",
);
console.log("Redis URL:", config.redis.url);
console.log("AWS Region:", config.aws.region);
console.log("S3 Bucket:", config.aws.bucket);
console.log("App Port:", config.app.port);
