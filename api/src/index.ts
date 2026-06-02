import express from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = express();
app.use(express.json());

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

app.post("/upload/request", async (req, res) => {
  const { title } = req.body;
  const videoId = uuidv4();
  const key = `videos/${videoId}/raw.mp4`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: "video/mp4",
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    res.json({ url, key, videoId });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
