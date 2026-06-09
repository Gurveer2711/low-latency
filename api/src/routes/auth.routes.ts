import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { verifyToken } from "../lib/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, me);

export default router;
