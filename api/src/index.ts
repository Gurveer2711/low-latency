import express, { Request, Response, NextFunction } from "express";
import { config } from "./config/env";
import { logger } from "./lib/logger"; // new
import uploadRouter from "./routes/upload.routes";
import webhookRouter from "./routes/webhook.routes";
import videoRouter from "./routes/video.routes";
import authRouter from "./routes/auth.routes";
import adminRouter from "./routes/admin.routes";

const app = express();

app.use(express.json());

// request logger middleware — logs every incoming request
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now(); // record start time

  res.on("finish", () => {
    const durationMs = Date.now() - start; // calculate how long request took
    logger.info(
      {
        method: req.method, // GET, POST etc
        url: req.url, // /upload/request
        statusCode: res.statusCode, // 200, 404 etc
        durationMs, // how long it took
      },
      "Request completed",
    );
  });

  next(); // pass to next middleware
});

app.use("/upload", uploadRouter);
app.use("/webhook", webhookRouter);
app.use("/videos", videoRouter);
app.use("/auth", authRouter);
app.use("/admin", adminRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// global error handler — catches any unhandled errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err, url: req.url }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.app.port, () => {
  logger.info({ port: config.app.port }, "🚀 API server started");
});
