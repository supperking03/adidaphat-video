/**
 * Test script chỉ test video processing với files có sẵn
 * Không gen content và TTS để tiết kiệm tiền
 * 
 * Run: tsx scripts/test-video-processing.ts
 */

import { processVideo } from "../lib/video-processor";
import fs from "fs/promises";
import * as fsSync from "fs";
import path from "path";

async function testVideoProcessing() {
  console.log("🧪 Testing Video Processing với files có sẵn\n");

  // Paths to existing files
  const videosDir = path.join(process.cwd(), "public", "videos");
  const audioPath = path.join(videosDir, "test-audio-1765124641701.mp3");
  // Use Whisper-generated subtitle (newer, more accurate)
  const subtitlePath = path.join(videosDir, "test-subtitles-whisper-1765130305149.srt");
  const videoPath = path.join(process.cwd(), "public", "auto.MOV");

  // Check if files exist
  try {
    await fs.access(audioPath);
    console.log(`✅ Audio file found: ${audioPath}`);
  } catch {
    console.error(`❌ Audio file not found: ${audioPath}`);
    process.exit(1);
  }

  // Try Whisper subtitle first, fallback to old subtitle
  let actualSubtitlePath = subtitlePath;
  try {
    await fs.access(subtitlePath);
    console.log(`✅ Subtitle file found: ${subtitlePath} (Whisper-generated)`);
  } catch {
    // Fallback to old subtitle
    const oldSubtitlePath = path.join(videosDir, "test-subtitles-1765124641701.srt");
    try {
      await fs.access(oldSubtitlePath);
      console.log(`⚠️ Whisper subtitle not found, using old subtitle: ${oldSubtitlePath}`);
      actualSubtitlePath = oldSubtitlePath;
    } catch {
      console.error(`❌ Subtitle file not found: ${subtitlePath}`);
      console.error(`   Also tried: ${oldSubtitlePath}`);
      process.exit(1);
    }
  }

  try {
    await fs.access(videoPath);
    console.log(`✅ Video file found: ${videoPath}\n`);
  } catch {
    console.error(`❌ Video file not found: ${videoPath}`);
    process.exit(1);
  }

  // Read audio and subtitle files
  console.log("📖 Reading files...");
  const audioBuffer = await fs.readFile(audioPath);
  const subtitleSRT = await fsSync.readFileSync(actualSubtitlePath, "utf-8");
  
  console.log(`✅ Audio: ${audioBuffer.length} bytes`);
  console.log(`✅ Subtitles: ${subtitleSRT.length} chars\n`);

  // Process video
  console.log("🎬 Processing video...");
  console.log("⚠️ Note: This requires ffmpeg to be installed locally\n");

  try {
    const timestamp = Date.now();
    const outputPath = path.join(videosDir, `test-output-${timestamp}.mp4`);
    
    const processedVideo = await processVideo(
      videoPath,
      audioBuffer,
      subtitleSRT,
      outputPath
    );
    
    console.log(`✅ Video processed: ${processedVideo.length} bytes\n`);

    await fs.writeFile(outputPath, processedVideo);
    console.log(`💾 Processed video saved to: ${outputPath}\n`);
    
    const stats = await fs.stat(outputPath);
    console.log(`📊 Video size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`✅ Test completed successfully!`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("Vercel serverless")) {
      console.log("⏭️ Video processing skipped (Vercel environment detected)");
      console.log("   This is expected - video processing needs external service on Vercel\n");
    } else if (errorMessage.includes("ffmpeg") || errorMessage.includes("ffprobe")) {
      console.log("⚠️ Video processing failed - ffmpeg not found or error occurred:");
      console.log(`   ${errorMessage}`);
      console.log("\n💡 To fix:");
      console.log("   1. Install ffmpeg: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)");
      console.log("   2. Or set FFMPEG_PATH env var to point to ffmpeg binary");
      console.log("   3. Or use external video processing service for production\n");
    } else {
      console.log("❌ Video processing failed:");
      console.log(`   ${errorMessage}\n`);
    }
    process.exit(1);
  }
}

void testVideoProcessing();

