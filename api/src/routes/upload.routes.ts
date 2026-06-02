import { Router } from "express";
import { requestUploadUrl } from "../controllers/upload.controller";

const router = Router();

router.post("/request", requestUploadUrl);

export default router;
