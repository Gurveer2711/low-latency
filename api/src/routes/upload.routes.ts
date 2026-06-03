import { Router } from "express";
import { requestUploadUrl } from "../controllers/upload.controller";

const uploadRouter = Router();

uploadRouter.post("/request", requestUploadUrl);

export default uploadRouter;
