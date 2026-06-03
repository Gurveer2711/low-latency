import { Router } from "express";
import {
  getPlaybackUrl,
  getVideoStatus,
} from "../controllers/video.controller";

const videoRouter = Router();

videoRouter.get("/:id/play", getPlaybackUrl); // GET /videos/abc123/play
videoRouter.get("/:id/status", getVideoStatus); // GET /videos/abc123/status

export default videoRouter;
