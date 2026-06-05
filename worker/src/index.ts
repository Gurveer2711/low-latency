import { Worker, Job } from "bullmq";
import { config } from "./config/env";
import { prisma } from "./lib/prisma";
import { downloadFromS3, uploadToS3 } from "./lib/s3";
import { transcodeTo480p, generateThumbnail } from "./lib/transcoder";
import { logger } from "./lib/logger";
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
    const startTime = Date.now(); // track total processing time

    logger.info(
      { jobId: job.id, videoId, attempt: job.attemptsMade + 1 },
      "Job started",
    );

    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `${videoId}-raw.mp4`);
    const outputPath = path.join(tmpDir, `${videoId}-480p.mp4`);
    const thumbPath = path.join(tmpDir, `${videoId}-thumb.jpg`);
    const outputKey = `processed/${videoId}/480p.mp4`;
    const thumbKey = `processed/${videoId}/thumb.jpg`;

    try {
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing" },
      });

      await downloadFromS3(rawKey, inputPath);
      logger.info({ jobId: job.id, videoId }, "Downloaded from S3");

      await transcodeTo480p(inputPath, outputPath);
      logger.info({ jobId: job.id, videoId }, "Transcoding complete");

      await generateThumbnail(outputPath, thumbPath);
      logger.info({ jobId: job.id, videoId }, "Thumbnail generated");

      await uploadToS3(outputPath, outputKey, "video/mp4");
      await uploadToS3(thumbPath, thumbKey, "image/jpeg");
      logger.info({ jobId: job.id, videoId }, "Uploaded to S3");

      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "processed",
          variants: { "480p": outputKey },
          thumbKey,
        },
      });

      const durationMs = Date.now() - startTime;
      logger.info({ jobId: job.id, videoId, durationMs }, "Job completed");
    } catch (error) {
      const err = error as Error;
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 3);

      if (isLastAttempt) {
        logger.error(
          { jobId: job.id, videoId, error: err.message },
          "Job exhausted all retries",
        );

        await prisma.video.update({
          where: { id: videoId },
          data: {
            status: "failed",
            variants: {
              error: err.message,
              failedAt: new Date().toISOString(),
              attempts: job.attemptsMade + 1,
            },
          },
        });
      } else {
        logger.warn(
          {
            jobId: job.id,
            videoId,
            attempt: job.attemptsMade + 1,
            error: err.message,
          },
          "Job attempt failed, retrying",
        );
      }

      throw error;
    } finally {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      logger.info({ jobId: job.id, videoId }, "Temp files cleaned up");
    }
  },
  {
    connection: { url: config.redis.url },
    concurrency: 2,
  },
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Worker completed job");
});

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, error: error.message }, "Worker job failed");
});

logger.info("🚀 Worker running and waiting for jobs...");
