/**
 * Video processing functions
 * 
 * ⚠️ IMPORTANT: Vercel serverless functions have limitations:
 * - No ffmpeg binary available
 * - Memory and time limits
 * - Cannot execute system commands
 * 
 * For production, consider:
 * 1. Using external services (Cloudinary, Mux, etc.)
 * 2. Deploying a separate worker service
 * 3. Using Vercel Edge Functions with FFmpeg WASM
 */

import fs from "fs/promises";
import path from "path";
import os from "os";

/**
 * Convert SRT to ASS format with KelvinStyle and wipe effect
 */
function convertSRTToASSWithWipe(srtContent: string): string {
  const lines = srtContent.split("\n");
  let assContent = `[Script Info]
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: KelvinStyle,Montserrat,42,&H00FFFFFF,&H00000000,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,6,2,2,30,30,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let i = 0;
  while (i < lines.length) {
    // Skip subtitle index
    if (/^\d+$/.test(lines[i].trim())) {
      i++;
      // Parse time
      const timeLine = lines[i];
      if (timeLine && timeLine.includes("-->")) {
        const [startTime, endTime] = timeLine.split("-->").map((t) => t.trim());
        i++;
        // Get text (may span multiple lines)
        const textLines: string[] = [];
        while (i < lines.length && lines[i].trim() !== "") {
          textLines.push(lines[i].trim());
          i++;
        }

        if (textLines.length > 0) {
          const text = textLines.join("\\N");
          // Convert SRT time to ASS time (SRT: HH:MM:SS,mmm -> ASS: H:MM:SS.mm)
          const startASS = convertSRTTimeToASS(startTime);
          const endASS = convertSRTTimeToASS(endTime);

          // Wipe effect: reveal from left to right
          // Duration: 0.4 seconds for wipe effect
          const wipeDuration = 0.4;
          const startSeconds = parseSRTTimeToSeconds(startTime);
          const wipeEndSeconds = startSeconds + wipeDuration;
          
          // Wipe effect using \t with \clip animation
          // \t(t1,t2,effect) applies effect from time t1 to t2
          // \clip(x1,y1,x2,y2) clips the visible region
          // To create wipe from left to right, we animate clip from (0,0,0,height) to (0,0,width,height)
          // This reveals text progressively from left to right
          // Note: ASS clip coordinates are relative, so we use large values to ensure full reveal
          const textWithWipe = `{\\t(${startSeconds},${wipeEndSeconds},\\clip(0,0,1920,1080))}${text}`;

          assContent += `Dialogue: 0,${startASS},${endASS},KelvinStyle,,0,0,0,,${textWithWipe}\n`;
        }
      }
    }
    i++;
  }

  return assContent;
}

/**
 * Convert SRT time format to ASS time format
 * SRT: 00:00:00,000 -> ASS: 0:00:00.00
 */
function convertSRTTimeToASS(srtTime: string): string {
  // Remove spaces and split
  const cleaned = srtTime.trim();
  const [timePart, msPart] = cleaned.split(",");
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  const milliseconds = parseInt(msPart || "0", 10);
  const centiseconds = Math.floor(milliseconds / 10);

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

/**
 * Parse SRT time to seconds (for calculations)
 */
function parseSRTTimeToSeconds(srtTime: string): number {
  const cleaned = srtTime.trim();
  const [timePart, msPart] = cleaned.split(",");
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  const milliseconds = parseInt(msPart || "0", 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Convert seconds to ASS time format
 */
function convertSecondsToASSTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

/**
 * Process video using external service (recommended for Vercel)
 * 
 * This function uploads video and audio to an external processing service
 * and returns the processed video buffer.
 * 
 * Example services: Cloudinary, Mux, AWS MediaConvert, etc.
 */
export async function processVideoExternal(
  videoUrl: string,
  audioBuffer: Buffer,
  subtitleSRT: string,
  audioDuration: number
): Promise<Buffer> {
  // TODO: Implement with your chosen service
  // Example with Cloudinary:
  // 1. Upload video and audio to Cloudinary
  // 2. Use Cloudinary transformations to loop video, overlay audio, add subtitles
  // 3. Download processed video
  
  throw new Error(
    "External video processing not implemented. Please configure a video processing service (Cloudinary, Mux, etc.) or use processVideoWithFFmpegWASM()."
  );
}

/**
 * Process video using FFmpeg WASM (works in browser/Edge Functions)
 * 
 * Note: This requires @ffmpeg/ffmpeg package and works in Edge runtime
 */
export async function processVideoWithFFmpegWASM(
  videoBuffer: Buffer,
  audioBuffer: Buffer,
  subtitleSRT: string,
  audioDuration: number
): Promise<Buffer> {
  // This would use @ffmpeg/ffmpeg WebAssembly version
  // Requires: npm install @ffmpeg/ffmpeg @ffmpeg/util
  
  throw new Error(
    "FFmpeg WASM processing not implemented. Install @ffmpeg/ffmpeg and @ffmpeg/util to use this function."
  );
}

/**
 * Process video: loop video to match audio duration, overlay audio
 * 
 * ⚠️ This function requires ffmpeg binary and will NOT work on Vercel serverless.
 * Use processVideoExternal() or processVideoWithFFmpegWASM() instead.
 * 
 * @param videoPath Path to the input video file (auto.MOV)
 * @param audioBuffer Audio buffer (MP3)
 * @param outputPath Output path for the processed video (not used, kept for compatibility)
 * @param questionAudioDuration Duration of question audio + swish in seconds (for wipeup transition)
 */
export async function processVideo(
  videoPath: string,
  audioBuffer: Buffer,
  outputPath: string,
  questionAudioDuration?: number // Duration of question audio + swish in seconds
): Promise<Buffer> {
  // Check if we're in a Vercel-like environment
  if (process.env.VERCEL) {
    throw new Error(
      "Video processing with ffmpeg is not available on Vercel serverless. " +
      "Please use processVideoExternal() with a video processing service, " +
      "or deploy a separate worker service with ffmpeg installed. " +
      "See TIKTOK_AUTOMATION_SETUP.md for details."
    );
  }
  
  // On local, try to use ffmpeg from PATH if FFMPEG_PATH is not set
  // This allows local testing without setting FFMPEG_PATH env var

  // This code would only work in an environment with ffmpeg installed
  // (e.g., local development, Docker container, or separate worker service)
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  // Create temporary files
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tiktok-video-"));
  const tempAudioPath = path.join(tempDir, "audio.mp3");
  const tempOutputPath = path.join(tempDir, "output.mp4");

  try {
    // Write audio file
    await fs.writeFile(tempAudioPath, audioBuffer);

    // Get audio duration
    const audioDuration = await getAudioDuration(tempAudioPath, execAsync);
    console.log(`📊 Audio duration: ${audioDuration.toFixed(2)} seconds`);

    // Get swish.mp3 duration to calculate swish start time
    let swishDuration = 0;
    const swishPath = path.join(process.cwd(), "public", "swish.mp3");
    try {
      swishDuration = await getAudioDuration(swishPath, execAsync);
      console.log(`📊 Swish duration: ${swishDuration.toFixed(2)} seconds`);
    } catch (error) {
      console.warn(`⚠️ Could not get swish duration: ${error instanceof Error ? error.message : String(error)}`);
      // Estimate swish duration (usually 0.5-1 second)
      swishDuration = 0.6;
    }

    // FFmpeg command to:
    // 1. Loop video to match audio duration
    // 2. Replace audio with generated audio from Minimax
    // 3. Add transition effects:
    //    - Swish transition: khi phát swish.mp3 (fade/zoom effect)
    //    - Wipeup transition: sau khi swish kết thúc (nếu có questionAudioDuration)
    // Use FFMPEG_PATH if set, otherwise try "ffmpeg" from PATH
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    
    // Calculate swish start time (end of question audio, before swish)
    // questionAudioDuration = question audio + swish duration
    const swishStartTime = questionAudioDuration && questionAudioDuration > 0 
      ? questionAudioDuration - swishDuration 
      : undefined;
    
    console.log(`🔍 Debug transition timing:`);
    console.log(`   questionAudioDuration: ${questionAudioDuration?.toFixed(2)}s`);
    console.log(`   swishDuration: ${swishDuration.toFixed(2)}s`);
    console.log(`   swishStartTime: ${swishStartTime?.toFixed(2)}s`);
    console.log(`   audioDuration: ${audioDuration.toFixed(2)}s`);
    
    // Add transitions if questionAudioDuration is provided
    // Always apply swish transition if we have swishStartTime
    if (questionAudioDuration && questionAudioDuration > 0 && questionAudioDuration < audioDuration && swishStartTime && swishStartTime > 0) {
      const wipeupTransitionDuration = 0.8; // Duration of wipeup transition in seconds
      const wipeupTransitionStart = questionAudioDuration; // After swish ends
      
      // Swish transition: fade + zoom effect during swish
      const swishTransitionDuration = swishDuration;
      const swishTransitionStart = swishStartTime; // Already checked above, not undefined
      
      console.log(`🌊 Swish transition (fade + zoom) will be applied at ${swishTransitionStart.toFixed(2)}s - ${(swishTransitionStart + swishTransitionDuration).toFixed(2)}s`);
      console.log(`🌊 Wipeup transition will be applied at ${wipeupTransitionStart.toFixed(2)}s - ${(wipeupTransitionStart + wipeupTransitionDuration).toFixed(2)}s`);
      
      // Use filter_complex with multiple transitions:
      // 1. Swish transition: fade + zoom during swish sound
      // 2. Wipeup transition: after swish ends
      // Zoom x2: scale lên 2x rồi crop về kích thước gốc từ center
      // Split video into segments: before swish, during swish, after swish
      // Simplify: use scale filter with time-based expression for zoom during swish
      const ffmpegCommand = `${ffmpegPath} -y \
        -stream_loop -1 -t ${audioDuration} -i "${videoPath}" \
        -stream_loop -1 -t ${audioDuration} -i "${videoPath}" \
        -i "${tempAudioPath}" \
        -filter_complex "[0:v]scale=iw*2:ih*2,crop=iw/2:ih/2:iw/4:ih/4,trim=end=${swishTransitionStart},setpts=PTS-STARTPTS[v0];[1:v]scale=iw*2:ih*2,crop=iw/2:ih/2:iw/4:ih/4,trim=start=${swishTransitionStart}:end=${wipeupTransitionStart},setpts=PTS-STARTPTS[v1_temp];[v1_temp]fade=t=in:st=0:d=${swishTransitionDuration*0.2},fade=t=out:st=${swishTransitionDuration*0.8}:d=${swishTransitionDuration*0.2},scale=iw*1.15:ih*1.15,crop=iw/1.15:ih/1.15:iw/30:ih/30[v1_swish];[1:v]scale=iw*2:ih*2,crop=iw/2:ih/2:iw/4:ih/4,trim=start=${wipeupTransitionStart},setpts=PTS-STARTPTS[v2];[v0][v1_swish]xfade=transition=fade:duration=${swishTransitionDuration}:offset=${swishTransitionStart}[v01];[v01][v2]xfade=transition=wipeup:duration=${wipeupTransitionDuration}:offset=${wipeupTransitionStart}[v]" \
        -map "[v]" \
        -map 2:a:0 \
        -c:v libx264 -preset medium -crf 23 \
        -c:a aac -b:a 192k \
        -pix_fmt yuv420p \
        "${tempOutputPath}"`;
      
      console.log(`🎬 Running ffmpeg command with wipeup transition...`);
      console.log(`   Video: ${videoPath}`);
      console.log(`   Audio: ${tempAudioPath} (${audioBuffer.length} bytes)`);
      console.log(`   Output: ${tempOutputPath}`);
      console.log(`\n📋 Full FFmpeg command:`);
      console.log(`   ${ffmpegCommand.replace(/\s+/g, " ")}\n`);

      // Execute FFmpeg
      const { stderr } = await execAsync(ffmpegCommand);
      
      if (stderr) {
        console.log(`📝 FFmpeg processing...`);
      }

      // Read output video
      const outputBuffer = await fs.readFile(tempOutputPath);
      return outputBuffer;
    }
    
    // No wipeup transition, but check for swish transition
    // If swish start time is known, add swish transition
    if (swishStartTime && swishStartTime > 0 && swishStartTime < audioDuration) {
      const swishTransitionDuration = swishDuration;
      console.log(`🌊 Swish transition (fade + zoom) will be applied at ${swishStartTime.toFixed(2)}s - ${(swishStartTime + swishTransitionDuration).toFixed(2)}s`);
      
      // Use filter_complex for swish transition
      // Make zoom more visible (1.15x instead of 1.1x)
      const ffmpegCommand = `${ffmpegPath} -y \
        -stream_loop -1 -t ${audioDuration} -i "${videoPath}" \
        -stream_loop -1 -t ${audioDuration} -i "${videoPath}" \
        -i "${tempAudioPath}" \
        -filter_complex "[0:v]scale=iw*2:ih*2,crop=iw/2:ih/2:iw/4:ih/4,trim=end=${swishStartTime},setpts=PTS-STARTPTS[v0];[1:v]scale=iw*2:ih*2,crop=iw/2:ih/2:iw/4:ih/4,trim=start=${swishStartTime},setpts=PTS-STARTPTS[v1_temp];[v1_temp]fade=t=in:st=0:d=${swishTransitionDuration*0.2},fade=t=out:st=${swishTransitionDuration*0.8}:d=${swishTransitionDuration*0.2},scale=iw*1.15:ih*1.15,crop=iw/1.15:ih/1.15:iw/30:ih/30[v1];[v0][v1]xfade=transition=fade:duration=${swishTransitionDuration}:offset=${swishStartTime}[v]" \
        -map "[v]" \
        -map 2:a:0 \
        -c:v libx264 -preset medium -crf 23 \
        -c:a aac -b:a 192k \
        -pix_fmt yuv420p \
        "${tempOutputPath}"`;
      
      console.log(`🎬 Running ffmpeg command with swish transition...`);
      console.log(`   Video: ${videoPath}`);
      console.log(`   Audio: ${tempAudioPath} (${audioBuffer.length} bytes)`);
      console.log(`   Output: ${tempOutputPath}`);
      console.log(`\n📋 Full FFmpeg command:`);
      console.log(`   ${ffmpegCommand.replace(/\s+/g, " ")}\n`);

      const { stderr } = await execAsync(ffmpegCommand);
      
      if (stderr) {
        console.log(`📝 FFmpeg processing...`);
      }

      const outputBuffer = await fs.readFile(tempOutputPath);
      return outputBuffer;
    }
    
    // No transition, simple processing with zoom x2
    // Zoom x2: scale lên 2x rồi crop về kích thước gốc từ center
    const ffmpegCommand = `${ffmpegPath} -y \
      -stream_loop -1 -t ${audioDuration} -i "${videoPath}" \
      -i "${tempAudioPath}" \
      -map 0:v:0 \
      -map 1:a:0 \
      -vf "scale=iw*2:ih*2,crop=iw/2:ih/2:iw/4:ih/4" \
      -c:v libx264 -preset medium -crf 23 \
      -c:a aac -b:a 192k \
      -shortest \
      -pix_fmt yuv420p \
      "${tempOutputPath}"`;
    
    console.log(`🎬 Running ffmpeg command...`);
    console.log(`   Video: ${videoPath}`);
    console.log(`   Audio: ${tempAudioPath} (${audioBuffer.length} bytes)`);
    console.log(`   Output: ${tempOutputPath}`);
    console.log(`\n📋 Full FFmpeg command:`);
    console.log(`   ${ffmpegCommand.replace(/\s+/g, " ")}\n`);

    // Execute FFmpeg
    const { stderr } = await execAsync(ffmpegCommand);
    
    if (stderr) {
      // FFmpeg outputs progress to stderr, this is normal
      console.log(`📝 FFmpeg processing...`);
    }

    // Read output video
    const outputBuffer = await fs.readFile(tempOutputPath);

    return outputBuffer;
  } finally {
    // Cleanup temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Error cleaning up temp files:", error);
    }
  }
}

/**
 * Get audio duration using ffprobe
 */
async function getAudioDuration(
  audioPath: string,
  execAsync: (command: string) => Promise<{ stdout: string; stderr: string }>
): Promise<number> {
  try {
    const ffprobePath = process.env.FFPROBE_PATH || "ffprobe";
    const { stdout } = await execAsync(
      `${ffprobePath} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error("Error getting audio duration, using estimation:", error);
    // Fallback: estimate from file size
    const stats = await fs.stat(audioPath);
    // Rough estimation: 128kbps = ~16KB per second
    return stats.size / 16000;
  }
}


