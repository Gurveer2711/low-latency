import { Request, Response } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3"; // command to GET object from S3
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // generates temporary URL
import { prisma } from "../lib/prisma"; // DB connection
import { s3 } from "../lib/s3"; // S3 connection
import { config } from "../config/env"; // env variables
import { transcodeQueue } from "../lib/queue";
import { logger } from "../lib/logger";
export const getPlaybackUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // get video id from URL: /videos/abc123/play

    // 1. find video in DB
    const video = await prisma.video.findUnique({
      where: { id },
    });

    // 2. handle not found
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    // 3. check video is ready to play
    if (video.status !== "processed") {
      res.status(400).json({
        error: "Video not ready yet",
        status: video.status, // tell client current status
      });
      return;
    }

    // 4. get the 480p key from variants JSON
    // variants looks like: { "480p": "processed/uuid/480p.mp4" }
    const variants = video.variants as Record<string, string>;
    const key480p = variants["480p"];

    if (!key480p) {
      res.status(400).json({ error: "No 480p variant available" });
      return;
    }

    // 5. generate presigned GET URL — expires in 1 hour
    const command = new GetObjectCommand({
      Bucket: config.aws.bucket,
      Key: key480p,
    });

    const playUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600, // 1 hour
    });
    // generate signed URL for thumbnail (if exists)
    let thumbUrl = null;
    if (video.thumbKey) {
      thumbUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: config.aws.bucket,
          Key: video.thumbKey,
        }),
        { expiresIn: 3600 },
      );
    } 
    // 6. return playback URL
    res.json({
      videoId: video.id,
      title: video.title,
      playUrl, // paste this in browser to watch!
      thumbUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    logger.error({ error }, "Failed to generate playback URL");
    res.status(500).json({ error: "Failed to generate playback URL" });
  }
};

// bonus endpoint — get video status
export const getVideoStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true, // only return these fields
        variants: true,
        createdAt: true,
      },
    });

    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    res.json(video);
  } catch (error) {
    logger.error({ error }, "Failed to get video status");
    res.status(500).json({ error: "Failed to get video status" });
  }
};

// get all failed jobs from the queue
export const getFailedJobs = async (req: Request, res: Response) => {
  try {
    // get all jobs in failed state
    const failedJobs = await transcodeQueue.getFailed()

      const jobs = failedJobs.map((job) => ({
        jobId: job.id,
        videoId: job.data.videoId,
        failedReason: job.failedReason, // why it failed
        attemptsMade: job.attemptsMade, // how many times tried
        failedAt: new Date(job.timestamp).toLocaleString(), // when job was created
      }));
    logger.info({ count: jobs.length }, "Failed jobs fetched");
    res.json({ count: jobs.length, jobs })

  } catch (error) {
    logger.error({ error }, "Failed to get failed jobs");
    res.status(500).json({ error: 'Failed to get failed jobs' })
  }
}