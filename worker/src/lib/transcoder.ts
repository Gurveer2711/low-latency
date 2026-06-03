import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

// Transcode video to 480p
export async function transcodeTo480p(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        "-vf scale=854:480", // resize to 480p (854x480)
        "-c:v libx264", // video codec: H.264 (most compatible)
        "-crf 23", // quality (18=best, 28=worst, 23=default)
        "-preset fast", // encoding speed vs compression tradeoff
        "-c:a aac", // audio codec: AAC
        "-b:a 128k", // audio bitrate
        "-movflags +faststart", // puts metadata at start (better streaming)
      ])
      .output(outputPath)
      .on("start", (cmd) => {
        console.log(`🎬 FFmpeg started`);
      })
      .on("progress", (progress) => {
        console.log(`⚙️  Transcoding: ${Math.round(progress.percent ?? 0)}%`);
      })
      .on("end", () => {
        console.log(`✅ Transcoding complete → ${outputPath}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`❌ FFmpeg error:`, err.message);
        reject(err);
      })
      .run();
  });
}
