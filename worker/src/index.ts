import { Worker, Job } from "bullmq";
import { config } from "./config/env";
import { prisma } from "./lib/prisma";

// Define what data each job carries
interface TranscodeJobData {
  videoId: string;
  rawKey: string;
}

const worker = new Worker(
  "transcode", // must match queue name in api
  async (job: Job<TranscodeJobData>) => {
    const { videoId, rawKey } = job.data;

    console.log(`🎬 Processing job ${job.id} for video ${videoId}`);

    // 1. Update status to processing
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "processing" },
    });

    console.log(`⚙️  Video ${videoId} status → processing`);

    // 2. Simulate work for now (we add FFmpeg in Step 10)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Update status to processed
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "processed" },
    });

    console.log(`✅ Video ${videoId} status → processed`);
  },
  {
    connection: {
      url: config.redis.url,
    },
    concurrency: 2, // process 2 jobs at the same time
  },
);

// Event listeners — important for observability
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error.message);
});

worker.on("active", (job) => {
  console.log(`🔄 Job ${job.id} started`);
});

console.log("🚀 Worker is running and waiting for jobs...");
