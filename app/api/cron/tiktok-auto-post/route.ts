import { NextRequest, NextResponse } from "next/server";
import {
  generateContent,
  generateAudio,
  generateQuestionAudio,
  concatenateAudioBuffers,
  postToTikTok,
  generateQuestion,
} from "@/lib/tiktok-automation";
import { processVideo } from "@/lib/video-processor";
import path from "path";
import fs from "fs/promises";

/**
 * Cron job endpoint để tự động tạo và đăng video TikTok
 * 
 * Setup trong vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/tiktok-auto-post",
 *     "schedule": "0 9 * * *" // 9 AM mỗi ngày (UTC)
 *   }]
 * }
 * 
 * Environment variables cần thiết:
 * - OPENAI_API_KEY
 * - MINIMAX_API_KEY
 * - TIKTOK_ACCESS_TOKEN
 * - TIKTOK_DAILY_QUESTION (optional, câu hỏi của user, nếu không có sẽ random)
 * - CRON_SECRET (optional, để bảo vệ endpoint)
 */

export async function GET(req: NextRequest) {
  // Verify cron secret if set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Verify it's called from Vercel Cron
  const vercelCron = req.headers.get("x-vercel-cron");
  if (!vercelCron && !cronSecret) {
    // Allow manual trigger if no secret is set (for testing)
    console.warn("Warning: Cron endpoint called without Vercel cron header");
  }

  try {
    // Step 1: Generate user question from OpenAI
    console.log(`❓ Generating question from OpenAI...`);
    const userQuestion = await generateQuestion();
    console.log(`✅ Question generated: "${userQuestion}"`);
    console.log(`📝 Generating content for question...`);

    // Step 2: Generate content from OpenAI (thiền sư trả lời câu hỏi)
    const content = await generateContent(userQuestion);
    console.log(`✅ Content generated: ${content.substring(0, 100)}...`);

    // Step 3: Generate question audio (Minimax TTS, Vietnamese_female_4_v1) with swish sound
    console.log(`🎤 Generating question audio (Minimax TTS, Vietnamese_female_4_v1)...`);
    const questionAudioBuffer = await generateQuestionAudio(userQuestion);
    console.log(`✅ Question audio generated: ${questionAudioBuffer.length} bytes (with swish.mp3)`);

    // Step 4: Generate answer audio from Minimax
    console.log(`🔊 Generating answer audio (Minimax TTS)...`);
    const answerAudioBuffer = await generateAudio(content);
    console.log(`✅ Answer audio generated: ${answerAudioBuffer.length} bytes`);

    // Step 5: Get question audio duration (for ripple transition)
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    const fs = await import("fs/promises");
    const path = await import("path");
    const os = await import("os");
    
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "audio-duration-"));
    const tempQuestionPath = path.join(tempDir, "question.mp3");
    
    let questionAudioDuration: number | undefined;
    try {
      await fs.writeFile(tempQuestionPath, questionAudioBuffer);
      const ffprobePath = process.env.FFPROBE_PATH || process.env.FFMPEG_PATH?.replace("ffmpeg", "ffprobe") || "ffprobe";
      const { stdout } = await execAsync(
        `${ffprobePath} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempQuestionPath}"`
      );
      questionAudioDuration = parseFloat(stdout.trim());
      console.log(`📊 Question audio duration: ${questionAudioDuration.toFixed(2)} seconds (for ripple transition)`);
    } catch (error) {
      console.warn(`⚠️ Could not get question audio duration: ${error instanceof Error ? error.message : String(error)}`);
      console.warn(`   Ripple transition will be skipped`);
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    // Step 6: Concatenate question + answer audio
    console.log(`🔗 Concatenating question and answer audio...`);
    const finalAudioBuffer = await concatenateAudioBuffers(questionAudioBuffer, answerAudioBuffer);
    console.log(`✅ Final audio created: ${finalAudioBuffer.length} bytes`);

    // Step 7: Process video (loop, overlay audio, add wipeup transition)
    // Note: Vercel serverless doesn't support ffmpeg, so we need an alternative approach
    
    let processedVideoBuffer: Buffer | null = null;
    
    // Try to use external service first (if configured)
    const videoProcessingService = process.env.VIDEO_PROCESSING_SERVICE;
    
    if (videoProcessingService === "external" || process.env.VERCEL) {
      // Use external service or save for manual processing
      console.log(`⚠️ Video processing on Vercel requires external service.`);
      
      // On Vercel, we can't save files (public/ is read-only, /tmp is ephemeral)
      if (process.env.VERCEL) {
        return NextResponse.json({
          success: false,
          message: "Video processing requires external service on Vercel.",
          note: "Please implement processVideoExternal() with cloud storage (S3, Cloudinary, etc.) or use a video processing service. See TIKTOK_AUTOMATION_SETUP.md",
          audioSize: finalAudioBuffer.length,
          content: content.substring(0, 200),
        });
      }
      
      // On local, save components to public/videos/ for manual processing
      const videosDir = path.join(process.cwd(), "public", "videos");
      await fs.mkdir(videosDir, { recursive: true });
      
      const timestamp = Date.now();
      const audioPath = path.join(videosDir, `audio-${timestamp}.mp3`);
      
      await fs.writeFile(audioPath, finalAudioBuffer);
      
      return NextResponse.json({
        success: false,
        message: "Video processing requires external service. Components saved for manual processing.",
        audioPath,
        videoPath: path.join(process.cwd(), "public", "auto.MOV"),
        content: content.substring(0, 200),
        note: "Please implement processVideoExternal() or use a video processing service. See TIKTOK_AUTOMATION_SETUP.md",
      });
    } else {
      // Try local processing (only works if ffmpeg is available)
      const videoPath = path.join(process.cwd(), "public", "auto.MOV");
      
      // Check if video exists
      try {
        await fs.access(videoPath);
      } catch {
        return NextResponse.json(
          { error: `Video file not found: ${videoPath}` },
          { status: 404 }
        );
      }

      console.log(`🎬 Processing video: ${videoPath}`);
      try {
        processedVideoBuffer = await processVideo(
          videoPath,
          finalAudioBuffer,
          path.join(process.cwd(), "public", "temp-output.mp4"),
          questionAudioDuration
        );
        console.log(`✅ Video processed: ${processedVideoBuffer.length} bytes`);
      } catch (error) {
        // If local processing fails, fall back to saving components
        console.error("Local video processing failed:", error);
        return NextResponse.json({
          success: false,
          message: "Video processing failed. Please use external service.",
          error: error instanceof Error ? error.message : String(error),
          content: content.substring(0, 200),
        });
      }
    }

    // Ensure we have a processed video before continuing
    if (!processedVideoBuffer) {
      return NextResponse.json(
        { error: "Video processing failed - no video buffer generated" },
        { status: 500 }
      );
    }

    // Step 8: Post to TikTok
    const tiktokAccessToken = process.env.TIKTOK_ACCESS_TOKEN;
    if (!tiktokAccessToken) {
      // On Vercel, we can't save files to public/ (read-only)
      // Return video as base64 or require TikTok token
      if (process.env.VERCEL) {
        return NextResponse.json({
          success: false,
          message: "TIKTOK_ACCESS_TOKEN is required on Vercel. Video cannot be saved locally.",
          note: "Please set TIKTOK_ACCESS_TOKEN to auto-post, or implement cloud storage upload.",
          videoSize: processedVideoBuffer.length,
          content: content.substring(0, 200),
        });
      }
      
      // On local, save to public/videos/ for manual upload
      const videosDir = path.join(process.cwd(), "public", "videos");
      await fs.mkdir(videosDir, { recursive: true });
      
      const outputPath = path.join(videosDir, `tiktok-${Date.now()}.mp4`);
      await fs.writeFile(outputPath, processedVideoBuffer);
      console.log(`⚠️ TikTok token not set. Video saved to: ${outputPath}`);

      return NextResponse.json({
        success: true,
        message: "Video created but not posted (no TikTok token)",
        videoPath: outputPath,
        content: content.substring(0, 200),
      });
    }

    console.log(`📤 Posting to TikTok...`);
    const result = await postToTikTok(processedVideoBuffer, content, tiktokAccessToken);
    console.log(`✅ Posted to TikTok: ${result.shareUrl}`);

    return NextResponse.json({
      success: true,
      message: "Video created and posted to TikTok",
      videoId: result.videoId,
      shareUrl: result.shareUrl,
      question: userQuestion,
      content: content.substring(0, 200),
    });
  } catch (error) {
    console.error("❌ Error in TikTok auto-post cron:", error);
    return NextResponse.json(
      {
        error: "Failed to create and post video",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Get random question for daily content
 * Câu hỏi của user để thiền sư trả lời
 * You can customize this list
 */
function getRandomQuestion(): string {
  const questions = [
    "Làm sao để tìm được sự bình an trong tâm hồn?",
    "Con cảm thấy lo lắng và căng thẳng, thầy có thể giúp con không?",
    "Làm thế nào để buông bỏ những suy nghĩ tiêu cực?",
    "Con muốn học cách sống trong hiện tại, thầy có thể hướng dẫn con không?",
    "Làm sao để tìm thấy hạnh phúc thật sự?",
    "Con cảm thấy mất phương hướng trong cuộc sống, thầy có thể giúp con không?",
    "Làm thế nào để tha thứ cho người đã làm tổn thương con?",
    "Con muốn học cách biết ơn, thầy có thể chia sẻ với con không?",
    "Làm sao để tìm thấy ánh sáng khi con đang ở trong bóng tối?",
    "Con cảm thấy khó khăn trong việc chấp nhận thực tại, thầy có thể giúp con không?",
    "Làm thế nào để tìm thấy sự kiên nhẫn trong cuộc sống?",
    "Con muốn học cách yêu thương bản thân, thầy có thể hướng dẫn con không?",
  ];

  return questions[Math.floor(Math.random() * questions.length)];
}

