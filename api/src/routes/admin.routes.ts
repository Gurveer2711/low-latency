import { Router } from "express";
import { getAllVideos, getAllUsers, adminDeleteVideo, adminDeleteUser } from "../controllers/admin.controller";
import { verifyToken, requireRole } from "../lib/auth.middleware";

const router = Router();

router.use(verifyToken, requireRole("admin"));

router.get("/videos", getAllVideos);
router.get("/users", getAllUsers);
router.delete("/videos/:id", adminDeleteVideo);
router.delete("/users/:id", adminDeleteUser);

export default router;
