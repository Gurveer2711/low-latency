import { Router } from "express";
import { handleS3Upload } from "../controllers/webhook.controller";

const webhookRouter = Router();

webhookRouter.post("/s3-upload", handleS3Upload);

export default webhookRouter;
