import express from "express";
import { config } from "./config/env";
import uploadRouter from "./routes/upload.routes";
import webhookRouter from "./routes/webhook.routes";
import videoRouter from "./routes/video.routes"

const app = express();

app.use(express.json());

app.use("/upload", uploadRouter);
app.use("/webhook", webhookRouter);
app.use("/videos", videoRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(config.app.port, () => {
  console.log(`🚀 API server running on port ${config.app.port}`);
});
