import { Request, Response } from "express";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"; // commands for S3
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // generates temporary URL
import { prisma } from "../lib/prisma"; // DB connection
import { s3 } from "../lib/s3"; // S3 connection
import { config } from "../config/env"; // env variables
import { transcodeQueue } from "../lib/queue";
import { logger } from "../lib/logger";

const PLAYBACK_FORMATS = ["480p", "720p", "1080p"] as const;
type PlaybackFormat = (typeof PLAYBACK_FORMATS)[number];

function isPlaybackFormat(format: string): format is PlaybackFormat {
  return PLAYBACK_FORMATS.includes(format as PlaybackFormat);
}

export const getPlaybackUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // get video id from URL: /videos/abc123/play
    const requestedFormatRaw = typeof req.query.format === "string" ? req.query.format : "480p";
    const requestedFormat = requestedFormatRaw.toLowerCase().endsWith("p")
      ? requestedFormatRaw.toLowerCase()
      : `${requestedFormatRaw.toLowerCase()}p`;

    if (!isPlaybackFormat(requestedFormat)) {
      res.status(400).json({
        error: "Unsupported format",
        requestedFormat,
        availableFormats: PLAYBACK_FORMATS,
      });
      return;
    }

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

    // variants looks like: { "480p": "...", "720p": "...", "1080p": "..." }
    const variants = video.variants as Record<string, string>;
    const selectedKey = variants?.[requestedFormat];

    if (!selectedKey) {
      const availableFormats = PLAYBACK_FORMATS.filter((format) => Boolean(variants?.[format]));
      res.status(400).json({
        error: "Requested format not available",
        requestedFormat,
        availableFormats,
      });
      return;
    }

    // 5. generate presigned GET URL — expires in 1 hour
    const command = new GetObjectCommand({
      Bucket: config.aws.bucket,
      Key: selectedKey,
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
      selectedFormat: requestedFormat,
      availableFormats: PLAYBACK_FORMATS.filter((format) => Boolean(variants?.[format])),
      thumbUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    logger.error({ error }, "Failed to generate playback URL");
    res.status(500).json({ error: "Failed to generate playback URL" });
  }
};

// public listing of videos (only public visibility)
export const listPublicVideos = async (req: Request, res: Response) => {
  try {
    const videos = await prisma.video.findMany({
      where: { visibility: "public" },
      select: { id: true, title: true, thumbKey: true, createdAt: true, visibility: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ count: videos.length, videos });
  } catch (error) {
    logger.error({ error }, "Failed to list public videos");
    res.status(500).json({ error: "Failed to list videos" });
  }
};

// current user's videos
export const listMyVideos = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const videos = await prisma.video.findMany({ where: { userId: user.id } });
    res.json({ count: videos.length, videos });
  } catch (error) {
    logger.error({ error }, "Failed to list user videos");
    res.status(500).json({ error: "Failed to list videos" });
  }
};

export const patchVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, visibility } = req.body;
    const user = (req as any).user;

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ error: "Video not found" });
    if (video.userId !== user.id) return res.status(403).json({ error: "Not owner" });

    const updated = await prisma.video.update({ where: { id }, data: { title, description, visibility } });
    res.json({ video: updated });
  } catch (error) {
    logger.error({ error }, "Failed to patch video");
    res.status(500).json({ error: "Failed to update video" });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ error: "Video not found" });
    // allow owner or admin
    if (video.userId !== user.id && user.role !== "admin") return res.status(403).json({ error: "Not allowed" });

    // delete S3 files if present
    if (video.rawKey) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: config.aws.bucket, Key: video.rawKey }));
      } catch (e) {
        logger.warn({ err: e }, "Failed to delete rawKey from S3");
      }
    }
    if (video.thumbKey) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: config.aws.bucket, Key: video.thumbKey }));
      } catch (e) {
        logger.warn({ err: e }, "Failed to delete thumbKey from S3");
      }
    }

    await prisma.video.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Failed to delete video");
    res.status(500).json({ error: "Failed to delete video" });
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