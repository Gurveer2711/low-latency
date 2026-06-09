import { Router } from "express";
import {
  getPlaybackUrl,
  getVideoStatus,
  getFailedJobs,
  listPublicVideos,
  listMyVideos,
  patchVideo,
  deleteVideo,
} from "../controllers/video.controller";
import { verifyToken } from "../lib/auth.middleware";

const videoRouter = Router();

videoRouter.get("/:id/play", getPlaybackUrl); // GET /videos/abc123/play
videoRouter.get("/:id/status", getVideoStatus); // GET /videos/abc123/status
videoRouter.get("/failed/jobs", getFailedJobs);
videoRouter.get("/", listPublicVideos);
videoRouter.get("/mine", verifyToken, listMyVideos);
videoRouter.patch("/:id", verifyToken, patchVideo);
videoRouter.delete("/:id", verifyToken, deleteVideo);
export default videoRouter;
