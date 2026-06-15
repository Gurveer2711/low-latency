import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { transcodeQueue } from "../lib/queue";
import { logger } from "../lib/logger"; // new

export const handleS3Upload = async (req: Request, res: Response) => {
  try {
    const { videoId, rawKey, title, userId } = req.body;

    if (!videoId || !rawKey || !title) {
      logger.warn({ videoId, rawKey, title }, "Missing webhook fields");
      res.status(400).json({ error: "videoId, rawKey and title are required" });
      return;
    }

    const video = await prisma.video.create({
      data: { id: videoId, title, rawKey, status: "pending", userId },
    });

    const job = await transcodeQueue.add("transcode-video", {
      videoId: video.id,
      rawKey: video.rawKey,
    });

    logger.info(
      { videoId: video.id, jobId: job.id },
      "Video created and job queued",
    );

    res.json({ videoId: video.id, status: video.status, jobId: job.id });
  } catch (error) {
    logger.error({ error }, "Webhook processing failed");
    res.status(500).json({ error: "Failed to process upload webhook" });
  }
};
