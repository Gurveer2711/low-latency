import { Worker, Job } from "bullmq";
import { config } from "./config/env";
import { prisma } from "./lib/prisma";
import { downloadFromS3, uploadToS3 } from "./lib/s3";
import { transcodeTo480p } from "./lib/transcoder";
import path from "path";
import fs from "fs";
import os from "os";

interface TranscodeJobData {
  videoId: string;
  rawKey: string;
}

const worker = new Worker(
  "transcode",
  async (job: Job<TranscodeJobData>) => {
    const { videoId, rawKey } = job.data;

    console.log(`\n🎬 Job ${job.id} started for video ${videoId}`);

    // Use OS temp folder for intermediate files
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `${videoId}-raw.mp4`);
    const outputPath = path.join(tmpDir, `${videoId}-480p.mp4`);
    const outputKey = `processed/${videoId}/480p.mp4`;

    try {
      // 1. Update status → processing
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing" },
      });
      console.log(`📝 Status → processing`);

      // 2. Download raw video from S3
      await downloadFromS3(rawKey, inputPath);

      // 3. Transcode to 480p
      await transcodeTo480p(inputPath, outputPath);

      // 4. Upload transcoded video to S3
      await uploadToS3(outputPath, outputKey, "video/mp4");

      // 5. Update DB with processed key + status
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "processed",
          variants: { "480p": outputKey },
        },
      });
      console.log(`📝 Status → processed`);
    } finally {
      // 6. Always clean up temp files
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.log(`🧹 Temp files cleaned up`);
    }
  },
  {
    connection: {
      url: config.redis.url,
    },
    concurrency: 2,
  },
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error.message);
});

console.log("🚀 Worker running and waiting for jobs...");
