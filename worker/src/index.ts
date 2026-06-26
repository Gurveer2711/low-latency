import { Worker, Job, Queue } from "bullmq";
import { config } from "./config/env";
import { prisma } from "./lib/prisma";
import { downloadFromS3, uploadToS3 } from "./lib/s3";
import {
  transcodeToFormat,
  generateThumbnail,
  VideoVariantFormat,
} from "./lib/transcoder";
import { logger } from "./lib/logger";
import path from "path";
import fs from "fs";
import os from "os";

interface TranscodeJobData {
  videoId: string;
  rawKey: string;
}

const TARGET_FORMATS: VideoVariantFormat[] = ["480p", "720p", "1080p"];

// dead letter queue — failed jobs land here after all retries exhausted
const dlQueue = new Queue("transcode-dlq", {
  connection: { url: config.redis.url },
});

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
    const outputPaths: Record<VideoVariantFormat, string> = {
      "480p": path.join(tmpDir, `${videoId}-480p.mp4`),
      "720p": path.join(tmpDir, `${videoId}-720p.mp4`),
      "1080p": path.join(tmpDir, `${videoId}-1080p.mp4`),
    };
    const thumbPath = path.join(tmpDir, `${videoId}-thumb.jpg`);
    const outputKeys: Record<VideoVariantFormat, string> = {
      "480p": `processed/${videoId}/480p.mp4`,
      "720p": `processed/${videoId}/720p.mp4`,
      "1080p": `processed/${videoId}/1080p.mp4`,
    };
    const thumbKey = `processed/${videoId}/thumb.jpg`;

    try {
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing" },
      });

      await downloadFromS3(rawKey, inputPath);
      logger.info({ jobId: job.id, videoId }, "Downloaded from S3");

      for (const format of TARGET_FORMATS) {
        await transcodeToFormat(inputPath, outputPaths[format], format);
      }
      logger.info({ jobId: job.id, videoId, formats: TARGET_FORMATS }, "Transcoding complete");

      await generateThumbnail(outputPaths["480p"], thumbPath);
      logger.info({ jobId: job.id, videoId }, "Thumbnail generated");

      for (const format of TARGET_FORMATS) {
        await uploadToS3(outputPaths[format], outputKeys[format], "video/mp4");
      }
      await uploadToS3(thumbPath, thumbKey, "image/jpeg");
      logger.info({ jobId: job.id, videoId }, "Uploaded to S3");

      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "processed",
          variants: {
            "480p": outputKeys["480p"],
            "720p": outputKeys["720p"],
            "1080p": outputKeys["1080p"],
          },
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
          "Job exhausted all retries, sending to DLQ",
        );

        // Add the job details into the dead-letter queue
        await dlQueue.add("transcode-failed", {
          videoId,
          rawKey,
          failedAt: new Date().toISOString(),
          error: err.message,
          attempts: job.attemptsMade + 1,
        });

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
      for (const format of TARGET_FORMATS) {
        const outputPath = outputPaths[format];
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }
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
