/**
 * Test full flow từ câu hỏi của user ra video cuối
 *
 * Flow:
 * 1. Gen question từ OpenAI (viral, gây tranh cãi, rage bait)
 * 2. Gen content từ câu hỏi của user (OpenAI)
 * 3. Gen question audio (Minimax TTS, Vietnamese_female_4_v1) + swish
 * 4. Gen answer audio (Minimax TTS, female-shaonv)
 * 5. Nối 2 audio thành final
 * 6. Process video với final audio và wipeup transition
 *
 * Run: tsx scripts/test-full-flow.ts
 */

import {
  generateContent,
  generateAudio,
  generateQuestionAudio,
  concatenateAudioBuffers,
  generateQuestion,
} from "../lib/tiktok-automation";
import { processVideo } from "../lib/video-processor";
import fs from "fs/promises";
import * as fsSync from "fs";
import * as os from "os";
import path from "path";

// Load .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    if (!fsSync.existsSync(envPath)) {
      console.warn(
        "⚠️ .env.local file not found (this is okay if using system env vars)"
      );
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
          const cleanValue = value.replace(/^["']|["']$/g, "");
          process.env[key.trim()] = cleanValue;
        }
      }
    }
  } catch {
    console.warn(
      "⚠️ Could not load .env.local file (this is okay if using system env vars)"
    );
  }
}

async function testFullFlow() {
  loadEnv();

  const topic = process.argv.slice(2).join(" ").trim();
  const targetDurationSeconds = Number(
    process.env.TARGET_DURATION_SECONDS || "90"
  );
  const customQuestion = process.env.CUSTOM_QUESTION?.trim();

  console.log("🧪 Testing Full Flow từ câu hỏi của user ra video cuối\n");
  if (topic) {
    console.log(`🏷️ Topic override: ${topic}`);
  }
  if (customQuestion) {
    console.log(`✍️ Custom question: ${customQuestion}`);
  }
  console.log(`🎯 Target duration: ~${targetDurationSeconds} seconds\n`);

  const videosDir = path.join(process.cwd(), "videos");
  await fs.mkdir(videosDir, { recursive: true });
  const videoPath = path.join(process.cwd(), "public", "auto.MOV");

  // Check if video exists
  try {
    await fs.access(videoPath);
    console.log(`✅ Base video file found: ${videoPath}\n`);
  } catch {
    console.error(`❌ Base video file not found: ${videoPath}`);
    process.exit(1);
  }

  // Check if swish.mp3 exists
  const swishPath = path.join(process.cwd(), "public", "swish.mp3");
  try {
    await fs.access(swishPath);
    console.log(`✅ Swish audio found: ${swishPath}\n`);
  } catch {
    console.error(`❌ Swish audio not found: ${swishPath}`);
    process.exit(1);
  }

  try {
    // Step 1: Generate user question from OpenAI
    console.log(`❓ Step 1: Generating question from OpenAI...`);
    const userQuestion =
      customQuestion || (await generateQuestion({ topic }));
    console.log(`✅ Question generated: "${userQuestion}"\n`);

    // Step 2: Generate content from OpenAI
    console.log(`📝 Step 2: Generating content from OpenAI...`);
    const content = await generateContent(userQuestion, {
      targetDurationSeconds,
    });
    console.log(`✅ Content generated: ${content.substring(0, 100)}...\n`);

    // Step 3: Generate question audio (Minimax TTS + swish)
    console.log(
      `🎤 Step 3: Generating question audio with Minimax TTS (Vietnamese_female_4_v1) and swish sound...`
    );
    const questionAudioBuffer = await generateQuestionAudio(userQuestion);
    console.log(
      `✅ Question audio with swish generated: ${questionAudioBuffer.length} bytes\n`
    );

    // Save question audio for inspection
    const questionAudioPath = path.join(
      videosDir,
      `test-question-${Date.now()}.mp3`
    );
    await fs.writeFile(questionAudioPath, questionAudioBuffer);
    console.log(`💾 Question audio saved to: ${questionAudioPath}\n`);

    // Step 4: Generate answer audio from Minimax
    console.log(
      `🔊 Step 4: Generating answer audio with Minimax TTS (female-shaonv)...`
    );
    const answerAudioBuffer = await generateAudio(content);
    console.log(
      `✅ Answer audio generated: ${answerAudioBuffer.length} bytes\n`
    );

    // Save answer audio for inspection
    const answerAudioPath = path.join(
      videosDir,
      `test-answer-${Date.now()}.mp3`
    );
    await fs.writeFile(answerAudioPath, answerAudioBuffer);
    console.log(`💾 Answer audio saved to: ${answerAudioPath}\n`);

    // Step 5: Concatenate question + answer audio
    console.log(`🔗 Step 5: Concatenating question and answer audio...`);
    const finalAudioBuffer = await concatenateAudioBuffers(
      questionAudioBuffer,
      answerAudioBuffer
    );
    console.log(`✅ Final audio created: ${finalAudioBuffer.length} bytes\n`);

    // Save final audio for inspection
    const finalAudioPath = path.join(
      videosDir,
      `test-final-audio-${Date.now()}.mp3`
    );
    await fs.writeFile(finalAudioPath, finalAudioBuffer);
    console.log(`💾 Final audio saved to: ${finalAudioPath}\n`);

    // Step 6: Get question audio duration (for wipeup transition)
    console.log(
      `📊 Step 6: Getting question audio duration for wipeup transition...`
    );
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "audio-duration-"));
    const tempQuestionPath = path.join(tempDir, "question.mp3");

    let questionAudioDuration: number | undefined;
    try {
      await fs.writeFile(tempQuestionPath, questionAudioBuffer);
      const ffprobePath =
        process.env.FFPROBE_PATH ||
        process.env.FFMPEG_PATH?.replace("ffmpeg", "ffprobe") ||
        "ffprobe";
      const { stdout } = await execAsync(
        `${ffprobePath} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempQuestionPath}"`
      );
      questionAudioDuration = parseFloat(stdout.trim());
      console.log(
        `✅ Question audio duration: ${questionAudioDuration.toFixed(
          2
        )} seconds\n`
      );
    } catch (error) {
      console.warn(
        `⚠️ Could not get question audio duration: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      console.warn(`   Wipeup transition will be skipped\n`);
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    // Step 7: Process video
    console.log(`🎬 Step 7: Processing video...`);
    console.log(`⚠️ Note: This requires ffmpeg to be installed locally\n`);

    try {
      const timestamp = Date.now();
      const outputPath = path.join(
        videosDir,
        `test-output-final-${timestamp}.mp4`
      );

      const processedVideo = await processVideo(
        videoPath,
        finalAudioBuffer,
        outputPath,
        questionAudioDuration
      );

      console.log(`✅ Video processed: ${processedVideo.length} bytes\n`);

      await fs.writeFile(outputPath, processedVideo);
      console.log(`💾 Processed video saved to: ${outputPath}\n`);

      const stats = await fs.stat(outputPath);
      console.log(`📊 Video size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`\n✅ Full flow test completed successfully!`);
      console.log(`\n📋 Summary:`);
      console.log(`- Question audio: ${questionAudioPath}`);
      console.log(`- Answer audio: ${answerAudioPath}`);
      console.log(`- Final audio: ${finalAudioPath}`);
      console.log(`- Video: ${outputPath}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("Vercel serverless")) {
        console.log(
          "⏭️ Video processing skipped (Vercel environment detected)"
        );
        console.log(
          "   This is expected - video processing needs external service on Vercel\n"
        );
      } else if (
        errorMessage.includes("ffmpeg") ||
        errorMessage.includes("ffprobe")
      ) {
        console.log(
          "⚠️ Video processing failed - ffmpeg not found or error occurred:"
        );
        console.log(`   ${errorMessage}`);
        console.log("\n💡 To fix:");
        console.log(
          "   1. Install ffmpeg: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)"
        );
        console.log(
          "   2. Or set FFMPEG_PATH env var to point to ffmpeg binary"
        );
        console.log(
          "   3. Or use external video processing service for production\n"
        );
      } else {
        console.log("❌ Video processing failed:");
        console.log(`   ${errorMessage}\n`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

void testFullFlow();
