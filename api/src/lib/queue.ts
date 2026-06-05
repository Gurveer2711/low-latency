import { Queue } from 'bullmq'
import { config } from '../config/env'

// main transcoding queue
export const transcodeQueue = new Queue('transcode', {
  connection: { url: config.redis.url },
  defaultJobOptions: {
    attempts: 3,              // try 3 times before giving up
    backoff: {
      type: 'exponential',   // wait longer between each retry
      delay: 5000,           // 5s → 25s → 125s
    },
    removeOnComplete: {
      count: 100,            // keep last 100 completed jobs in Redis
    },
    removeOnFail: false,     // keep ALL failed jobs (for DLQ inspection)
  },
})

// dead letter queue — failed jobs land here after all retries exhausted
export const dlQueue = new Queue('transcode-dlq', {
  connection: { url: config.redis.url },
})