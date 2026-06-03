import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { transcodeQueue } from "../lib/queue";

export const handleS3Upload = async (req: Request, res: Response) => {
  try {
    const { videoId, rawKey, title } = req.body;

    if (!videoId || !rawKey || !title) {
      res.status(400).json({ error: "videoId, rawKey and title are required" });
      return;
    }

    // 1. Create video record in Postgres
    const video = await prisma.video.create({
      data: {
        id: videoId,
        title,
        rawKey,
        status: "pending",
      },
    });

    // 2. Push job into queue
    const job = await transcodeQueue.add("transcode-video", {
      videoId: video.id,
      rawKey: video.rawKey,
    });

    console.log(`✅ Video ${video.id} created, job ${job.id} queued`);

    res.json({
      videoId: video.id,
      status: video.status,
      jobId: job.id,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Failed to process upload webhook" });
  }
};
