import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { s3 } from "../lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { config } from "../config/env";

export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const videos = await prisma.video.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ count: videos.length, videos });
  } catch (error) {
    logger.error({ error }, "Failed to fetch all videos");
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } });
    res.json({ count: users.length, users });
  } catch (error) {
    logger.error({ error }, "Failed to fetch users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const adminDeleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) return res.status(404).json({ error: "Video not found" });
    if (video.rawKey) {
      try { await s3.send(new DeleteObjectCommand({ Bucket: config.aws.bucket, Key: video.rawKey })); } catch (e) { logger.warn({ e }, "s3 raw delete failed"); }
    }
    if (video.thumbKey) {
      try { await s3.send(new DeleteObjectCommand({ Bucket: config.aws.bucket, Key: video.thumbKey })); } catch (e) { logger.warn({ e }, "s3 thumb delete failed"); }
    }
    await prisma.video.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Failed to delete video");
    res.status(500).json({ error: "Failed to delete video" });
  }
};

export const adminDeleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // deleting user should cascade? we'll delete videos first
    await prisma.video.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "Failed to delete user");
    res.status(500).json({ error: "Failed to delete user" });
  }
};
