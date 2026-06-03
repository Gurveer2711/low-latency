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

// extracts a single frame from video as a jpg thumbnail
export async function generateThumbnail(
  inputPath: string,  // path to local video file
  outputPath: string  // path to save thumbnail jpg
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-ss 00:00:02',    // seek to 2 seconds into video
        '-vframes 1',      // extract exactly 1 frame
        '-vf scale=854:480', // same size as 480p
        '-q:v 2',          // jpeg quality (1=best, 31=worst, 2=near perfect)
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`🖼️  Thumbnail generated → ${outputPath}`)
        resolve()
      })
      .on('error', (err) => {
        console.error(`❌ Thumbnail error:`, err.message)
        reject(err)
      })
      .run()
  })
}