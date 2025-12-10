/**
 * Test script for TikTok automation
 * 
 * Run: tsx scripts/test-tiktok-automation.ts
 * 
 * This script tests each step of the automation process locally
 */

import {
  generateContent,
  generateAudio,
  generateSubtitleSRT,
  estimateAudioDuration,
} from "../lib/tiktok-automation";
import { processVideo } from "../lib/video-processor";
import fs from "fs/promises";
import * as fsSync from "fs";
import path from "path";

// Load .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    if (!fsSync.existsSync(envPath)) {
      console.warn("⚠️ .env.local file not found (this is okay if using system env vars)");
      return;
    }
    const envContent = fsSync.readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, "");
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  } catch {
    // .env.local might not exist, that's okay
    console.warn("⚠️ Could not load .env.local file (this is okay if using system env vars)");
  }
}

// Load environment variables
loadEnv();

async function testTikTokAutomation() {
  console.log("🧪 Testing TikTok Automation Workflow\n");

  // Create videos directory if it doesn't exist
  const videosDir = path.join(process.cwd(), "public", "videos");
  await fs.mkdir(videosDir, { recursive: true });

  try {
    // Step 1: Generate content
    console.log("📝 Step 1: Generating content...");
    const userQuestion = process.env.TIKTOK_DAILY_QUESTION || "Làm sao để tìm được sự bình an trong tâm hồn?";
    console.log(`❓ User question: ${userQuestion}\n`);
    const content = await generateContent(userQuestion);
    console.log(`✅ Content generated (${content.length} chars):`);
    console.log(content.substring(0, 200) + "...\n");

    // Step 2: Generate audio
    console.log("🔊 Step 2: Generating audio...");
    const audioBuffer = await generateAudio(content);
    console.log(`✅ Audio generated: ${audioBuffer.length} bytes\n`);

    // Save audio for inspection
    const timestamp = Date.now();
    const audioPath = path.join(videosDir, `test-audio-${timestamp}.mp3`);
    await fs.writeFile(audioPath, audioBuffer);
    console.log(`💾 Audio saved to: ${audioPath}\n`);

    // Step 3: Generate subtitles
    console.log("📄 Step 3: Generating subtitles...");
    const audioDuration = estimateAudioDuration(audioBuffer);
    console.log(`⏱️ Estimated audio duration: ${audioDuration.toFixed(2)} seconds`);
    const subtitleSRT = generateSubtitleSRT(content, audioDuration);
    console.log(`✅ Subtitles generated: ${subtitleSRT.split("\n\n").length} segments\n`);

    // Save subtitles for inspection
    const subtitlePath = path.join(videosDir, `test-subtitles-${timestamp}.srt`);
    await fs.writeFile(subtitlePath, subtitleSRT);
    console.log(`💾 Subtitles saved to: ${subtitlePath}\n`);

    // Step 4: Process video (only if ffmpeg is available)
    const videoPath = path.join(process.cwd(), "public", "auto.MOV");
    try {
      await fs.access(videoPath);
      console.log("🎬 Step 4: Processing video...");
      console.log("⚠️ Note: This requires ffmpeg to be installed locally");
      console.log("   If ffmpeg is not installed, this step will be skipped\n");

      try {
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if it's a Vercel error or actual ffmpeg error
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
      }
    } catch {
      console.log(`⚠️ Video file not found: ${videoPath}`);
      console.log("Skipping video processing step\n");
    }

    // Step 5: TikTok upload (skip in test, requires valid token)
    console.log("📤 Step 5: TikTok upload");
    console.log("⏭️ Skipped in test mode (requires TIKTOK_ACCESS_TOKEN)\n");

    console.log("✅ All steps completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`- Content: ${content.length} characters`);
    console.log(`- Audio: ${audioBuffer.length} bytes (${(audioBuffer.length / 1024).toFixed(2)} KB)`);
    console.log(`- Duration: ~${audioDuration.toFixed(2)} seconds`);
    console.log(`- Subtitles: ${subtitleSRT.split("\n\n").length} segments`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

void testTikTokAutomation();

