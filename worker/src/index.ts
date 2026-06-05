import { Worker, Job } from "bullmq";
import { config } from "./config/env";
import { prisma } from "./lib/prisma";
import { downloadFromS3, uploadToS3 } from "./lib/s3";
import { transcodeTo480p, generateThumbnail } from "./lib/transcoder";
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

    console.log(
      `\n🎬 Job ${job.id} started | attempt ${job.attemptsMade + 1}/3`,
    );

    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `${videoId}-raw.mp4`);
    const outputPath = path.join(tmpDir, `${videoId}-480p.mp4`);
    const thumbPath = path.join(tmpDir, `${videoId}-thumb.jpg`);
    const outputKey = `processed/${videoId}/480p.mp4`;
    const thumbKey = `processed/${videoId}/thumb.jpg`;

    try {
      // update status → processing
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "processing",
        },
      });

      // download → transcode → thumbnail → upload
      await downloadFromS3(rawKey, inputPath);
      await transcodeTo480p(inputPath, outputPath);
      await generateThumbnail(outputPath, thumbPath);
      await uploadToS3(outputPath, outputKey, "video/mp4");
      await uploadToS3(thumbPath, thumbKey, "image/jpeg");

      // update DB → processed
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "processed",
          variants: { "480p": outputKey },
          thumbKey,
        },
      });

      console.log(`✅ Job ${job.id} completed`);
    } catch (error) {
      const err = error as Error;

      // check if this was the LAST attempt
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 3);

      if (isLastAttempt) {
        // all retries exhausted → mark as failed in DB
        console.error(`💀 Job ${job.id} exhausted all retries → moving to DLQ`);

        await prisma.video.update({
          where: { id: videoId },
          data: {
            status: "failed", // mark as failed in DB
            variants: {
              // store error details in variants
              error: err.message,
              failedAt: new Date().toISOString(),
              attempts: job.attemptsMade + 1,
            },
          },
        });
      } else {
        // more retries coming → log and rethrow so BullMQ retries
        console.warn(
          `⚠️  Job ${job.id} failed attempt ${job.attemptsMade + 1} → retrying...`,
        );
      }

      throw error; // always rethrow so BullMQ knows job failed
    } finally {
      // always clean up temp files
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      console.log(`🧹 Temp files cleaned up`);
    }
  },
  {
    connection: { url: config.redis.url },
    concurrency: 2,
  },
);

// job completed successfully
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} done`);
});

// job failed one attempt (will retry)
worker.on("failed", (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error.message);
});

console.log("🚀 Worker running and waiting for jobs...");
