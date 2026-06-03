import { Worker, Job } from "bullmq";
import { config } from "./config/env";
import { prisma } from "./lib/prisma";
import { downloadFromS3, uploadToS3 } from "./lib/s3";
import { transcodeTo480p, generateThumbnail } from "./lib/transcoder"; // added generateThumbnail
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

    // define all temp file paths upfront
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `${videoId}-raw.mp4`);
    const outputPath = path.join(tmpDir, `${videoId}-480p.mp4`);
    const thumbPath = path.join(tmpDir, `${videoId}-thumb.jpg`); 

    // define S3 destination keys
    const outputKey = `processed/${videoId}/480p.mp4`;
    const thumbKey = `processed/${videoId}/thumb.jpg`; 
    try {
      // 1. update status → processing
      await prisma.video.update({
        where: { id: videoId },
        data: { status: "processing" },
      });
      console.log(`📝 Status → processing`);

      // 2. download raw video from S3 to local disk
      await downloadFromS3(rawKey, inputPath);

      // 3. transcode to 480p
      await transcodeTo480p(inputPath, outputPath);

      // 4. generate thumbnail from transcoded video
      await generateThumbnail(outputPath, thumbPath);

      // 5. upload transcoded video to S3
      await uploadToS3(outputPath, outputKey, "video/mp4");

      // 6. upload thumbnail to S3
      await uploadToS3(thumbPath, thumbKey, "image/jpeg");

      // 7. update DB with all results
      await prisma.video.update({
        where: { id: videoId },
        data: {
          status: "processed",
          variants: { "480p": outputKey },
          thumbKey: thumbKey, // save thumbnail S3 key
        },
      });
      console.log(`📝 Status → processed`);
      console.log(`🖼️  Thumbnail saved at ${thumbKey}`);
    } finally {
      // always clean up temp files even if something fails
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

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error.message);
});

console.log("🚀 Worker running and waiting for jobs...");
