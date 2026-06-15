import { useState } from "react";
import axios from "axios";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";
import { logger } from "../lib/logger";

export function useUpload() {
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const uploadVideo = async (file: File, title: string, description: string, userId: string) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);
    logger.info("useUpload: Initiating S3 upload sequence...", { fileName: file.name, fileSizeMb: (file.size / (1024 * 1024)).toFixed(2), title, userId });

    try {
      // Step 1: Request presigned S3 URL
      logger.debug("useUpload: Step 1 - Requesting presigned URL from /upload/request");
      const requestResponse = await api.post("/upload/request", {
        title: file.name,
        contentType: file.type || "video/mp4",
      });

      const { uploadUrl, videoId, rawKey } = requestResponse.data;
      logger.debug("useUpload: Step 1 success - Presigned URL details received:", { videoId, rawKey });

      if (!uploadUrl || !videoId || !rawKey) {
        throw new Error("Failed to get presigned upload URL from server");
      }

      // Step 2: Upload directly to S3 via PUT
      logger.info("useUpload: Step 2 - Uploading raw file directly to S3 bucket via PUT request...");
      let lastReportedProgress = -1;
      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type || "video/mp4",
        },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          const percentage = Math.round((progressEvent.loaded * 100) / total);
          setProgress(percentage);
          if (percentage % 10 === 0 && percentage !== lastReportedProgress) {
            logger.debug(`useUpload: S3 upload progress: ${percentage}%`);
            lastReportedProgress = percentage;
          }
        },
      });
      logger.info("useUpload: Step 2 success - File payload stored in S3.");

      // Step 3: Trigger backend webhook to create record and queue job
      logger.debug("useUpload: Step 3 - Triggering backend webhook /webhook/s3-upload");
      const webhookRes = await api.post("/webhook/s3-upload", {
        videoId,
        rawKey,
        title,
        userId,
      });
      logger.debug("useUpload: Step 3 success - Webhook responded:", webhookRes.data);

      // Step 4: Proactively save description and visibility details via PATCH
      if (description) {
        logger.debug("useUpload: Step 4 - Updating video description and visibility");
        const patchRes = await api.patch(`/videos/${videoId}`, {
          title,
          description,
          visibility: "public",
        });
        logger.debug("useUpload: Step 4 success - Metadata updated:", patchRes.data);
      }

      logger.info("useUpload: Video upload workflow successfully finished. Navigating back to Studio.");
      setIsUploading(false);
      router.push("/studio");
    } catch (err: any) {
      logger.error("useUpload: S3 upload flow failed", {
        message: err.message,
        response: err.response?.data,
      });
      setIsUploading(false);
      setError(err.response?.data?.error || err.message || "Something went wrong during upload");
      throw err;
    }
  };

  return {
    uploadVideo,
    progress,
    isUploading,
    error,
  };
}
