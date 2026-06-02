import { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { s3 } from "../lib/s3";
import { config } from "../config/env";

export const requestUploadUrl = async (req: Request, res: Response) => {
  try {
    const { title, contentType } = req.body;

    if (!title || !contentType) {
      res.status(400).json({ error: "title and contentType are required" });
      return;
    }

    const videoId = uuidv4();
    const rawKey = `raw/${videoId}/${title}`;

    const command = new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: rawKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    res.json({ uploadUrl, videoId, rawKey });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
};
