import { Queue } from "bullmq";
import { config } from "../config/env";

export const transcodeQueue = new Queue("transcode", {
  connection: {
    url: config.redis.url,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});
