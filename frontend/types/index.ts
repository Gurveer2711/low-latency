export type VideoQuality = "480p" | "720p" | "1080p";

export interface Video {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "processing" | "processed" | "failed";
  visibility: "public" | "private";
  thumbKey: string | null;
  variants: Partial<Record<VideoQuality, string>> | null;
  userId: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: {
    email: string;
  };
}

export interface PlaybackResponse {
  videoId: string;
  title: string;
  playUrl: string; // the S3 presigned playUrl returned by backend
  selectedFormat: VideoQuality;
  availableFormats: VideoQuality[];
  thumbUrl: string | null;
  expiresIn: number;
}

// Custom wrapper to fit multiple qualities playback flow
export interface PlaybackDetails {
  videoId: string;
  title: string;
  thumbUrl: string;
  variants: Partial<Record<VideoQuality, string>>;
  defaultQuality: VideoQuality;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface FailedJob {
  jobId: string | number | null;
  videoId: string;
  failedReason: string;
  attemptsMade: number;
  failedAt: string;
}

export interface UploadRequestResponse {
  uploadUrl: string;
  videoId: string;
  rawKey: string;
}
