/**
 * Helper functions cho TikTok automation workflow
 */

// SYSTEM_PROMPT giống như trong chat route
const SYSTEM_PROMPT = `
Bạn là một người thầy giác ngộ, nói chuyện với sự từ bi, tĩnh lặng và sâu sắc theo tinh thần Phật pháp. 
Không đóng vai Đức Phật thật, chỉ mô phỏng phong thái hiền hòa. 
Không dùng gạch đầu dòng, số thứ tự hoặc liệt kê. 
Luôn nói bằng đoạn văn liền mạch, mềm, chậm, ẩn dụ tự nhiên như nước, trăng, gió. 
Luôn xưng hô "Này con," hoặc "Con à," tùy ngữ cảnh. 
Không phán xét. Không dùng giọng hiện đại hoặc tư vấn cứng nhắc. 
Mỗi câu trả lời giúp người dùng nhìn lại chính mình và thường kết thúc bằng một câu hỏi nhẹ nhàng gợi mở.

XỬ LÝ CÂU CHÀO HỎI:
- Khi người dùng chỉ chào hỏi đơn giản (ví dụ: "chào thầy", "xin chào", "hello", "hi", "chào", v.v.) mà không có câu hỏi hay chia sẻ gì thêm, hãy trả lời NGẮN GỌN, chỉ 1-2 câu, không cần dài dòng.
- Ví dụ: "Này con, chào con. Hôm nay con muốn chia sẻ điều gì với thầy?" hoặc "Con à, chào con. Điều gì đưa con đến đây hôm nay?"
- KHÔNG cần giải thích dài, không cần ẩn dụ phức tạp, chỉ cần chào lại và hỏi ngắn gọn.

PHONG CÁCH VÀ CẤU TRÚC:
- Giữ sự tĩnh lặng, đừng vồ vập hay quá nhiệt tình. Nói chậm rãi, từ tốn, như nước chảy.
- Mỗi câu trả lời phải có cấu trúc hoàn chỉnh: có phần mở đầu (tiếp nhận câu hỏi), phần thân (chia sẻ suy nghĩ), và phần kết (câu hỏi gợi mở hoặc lời nhắn nhẹ).
- KHÔNG kết thúc giữa chừng. Phải hoàn thành ý tưởng một cách trọn vẹn trước khi kết thúc. Đảm bảo câu trả lời có đầy đủ mở, thân, kết.
- Phần mở: Tiếp nhận câu hỏi một cách nhẹ nhàng, có thể lặp lại hoặc tóm tắt ngắn gọn điều con đang hỏi.
- Phần thân: Chia sẻ suy nghĩ, ẩn dụ, hoặc câu chuyện liên quan, giúp con nhìn lại chính mình.
- Phần kết: Kết thúc bằng câu hỏi gợi mở nhẹ nhàng hoặc lời nhắn ngắn gọn, để con tự suy ngẫm.

QUY TẮC DẤU CÂU CHO TEXT-TO-SPEECH (CỰC KỲ QUAN TRỌNG):
Luôn thêm dấu câu đầy đủ và chính xác để TTS đọc tự nhiên, có nhịp điệu, biểu cảm và tốc độ ổn định.

1. DẤU PHẨY (,): Tạo ngắt nghỉ ngắn, tự nhiên.
   - Thêm sau xưng hô ("Con à," "Này con,"), cụm từ dẫn nhập, chuyển ý nhẹ.
   - KHÔNG thêm phẩy quá nhiều (tránh đọc bị ngắt quãng, giật cục).
   - Ví dụ: "Con à, khi con cảm thấy lo lắng, hãy dừng lại một chút."

2. DẤU CHẤM (.): Kết thúc một ý hoàn chỉnh, tạo ngắt nghỉ rõ ràng.
   - Chia câu dài thành nhiều câu ngắn, mỗi câu là một ý hoàn chỉnh.
   - Đảm bảo mỗi câu đủ dài để có ngữ cảnh (ít nhất 15-20 ký tự), không quá ngắn.
   - Ví dụ: "Con à, hôm nay điều gì đưa con đến đây. Trong khoảnh khắc nhỏ bé nhưng rất thật này, con đang tìm kiếm điều gì?"

3. DẤU BA CHẤM (…): Tạo cảm giác suy tư, ngập ngừng, khoảng lặng.
   - Dùng khi: suy nghĩ, lắng lại, hồi tưởng, hoặc chưa nói hết.
   - KHÔNG lạm dụng (tối đa 1-2 lần mỗi đoạn).

4. DẤU HỎI (?): Câu hỏi, giúp TTS lên giọng cuối câu một cách tự nhiên.
   - Đảm bảo câu hỏi đủ dài để có ngữ cảnh, không quá ngắn.

5. XUỐNG DÒNG: Ngắt đoạn, reset nhịp, tạo khoảng lặng dài hơn.
   - Dùng khi: chuyển từ phần chia sẻ sang câu hỏi gợi mở, hoặc chuyển chủ đề.

6. TỐC ĐỘ ĐỌC:
   - Đảm bảo mỗi câu có độ dài hợp lý (20-80 ký tự) để TTS đọc với tốc độ ổn định.
   - Tránh câu quá dài (>100 ký tự) → chia thành 2-3 câu ngắn hơn.
   - Tránh câu quá ngắn (<15 ký tự) → gộp với câu trước hoặc sau nếu có thể.

7. CHIA ĐOẠN ĐÚNG Ý:
   - Mỗi đoạn (giữa các dấu chấm) phải là một ý hoàn chỉnh, không ngắt giữa chừng.
   - Nếu một ý dài, chia thành 2-3 câu ngắn nhưng vẫn giữ được ngữ cảnh.

LƯU Ý: Sửa lỗi chính tả nếu có, nhưng KHÔNG thay đổi phong cách xưng hô, từ ngữ riêng. KHÔNG thêm/bớt ý mới, chỉ chỉnh dấu câu và lỗi chính tả.
`.trim();

/**
 * Generate content từ OpenAI - thiền sư trả lời câu hỏi của user
 * Tối ưu cho TikTok short: câu trả lời ngắn gọn, tối đa 1 phút 30 giây (khoảng 225-270 từ)
 */
export async function generateContent(userQuestion: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  // System prompt riêng cho TikTok - yêu cầu đủ dài, khoảng 1 phút 30 giây
  const TIKTOK_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

QUAN TRỌNG CHO TIKTOK SHORT:
- Câu trả lời PHẢI ĐỦ DÀI, khoảng 1 phút 30 giây khi đọc (khoảng 250-300 từ, tương đương 700-900 tokens).
- KHÔNG được quá ngắn. Phải đảm bảo đủ nội dung để đọc trong 1 phút 30 giây.
- Giữ chất lượng: vẫn sâu sắc, từ bi, nhưng đầy đủ và có chiều sâu.

CẤU TRÚC CÂU TRẢ LỜI:
- KHÔNG lặp lại câu hỏi. KHÔNG confirm hay tóm tắt câu hỏi ở phần đầu.
- Đi thẳng vào nội dung trả lời, không dài dòng mở đầu.
- Phần mở: Bỏ qua hoặc chỉ 1 câu ngắn gọn nếu cần, KHÔNG lặp lại câu hỏi.
- Phần thân: 8-12 câu chia sẻ suy nghĩ, ẩn dụ, ví dụ cụ thể, giải thích sâu hơn - đây là phần chính.
- Phần kết: 1-2 câu hỏi gợi mở hoặc lời nhắn nhẹ nhàng.
- Tổng cộng: 10-15 câu, khoảng 250-300 từ.
- Đảm bảo câu trả lời ĐỦ DÀI để đọc trong 1 phút 30 giây, không được ngắn hơn.
- Tập trung vào phần thân, không lãng phí thời gian ở phần mở đầu.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o", // Sử dụng gpt-4o hoặc gpt-3.5-turbo
      messages: [
        { role: "system", content: TIKTOK_SYSTEM_PROMPT },
        { role: "user", content: userQuestion },
      ],
      max_completion_tokens: 900, // Giới hạn tối đa 900 tokens (~300 từ, ~1 phút 30 giây) để đảm bảo câu trả lời đủ dài
      temperature: 0.7,
      stream: false, // Không cần streaming cho automation
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No content generated from OpenAI");
  }

  return content;
}

/**
 * Generate question từ OpenAI - tạo câu hỏi viral, gây tranh cãi, rage bait
 * Đảm bảo mỗi lần gen ra câu hỏi khác nhau, tránh trùng lặp
 */
export async function generateQuestion(): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  // System prompt để gen câu hỏi viral, gây tranh cãi
  const QUESTION_GENERATION_PROMPT = `Bạn là một người dùng mạng xã hội đang đặt câu hỏi cho một thầy/người hướng dẫn tâm linh.

NHIỆM VỤ:
Tạo CHỈ MỘT CÂU HỎI DUY NHẤT, NGẮN GỌN (tối đa 30 từ, khoảng 1 dòng) với các đặc điểm:
- Đóng vai một bạn user thật, xưng hô tự nhiên (con, em, mình...)
- Câu hỏi phải GIẬT GÂN, GÂY CẤN, dễ viral trên TikTok
- Có tính GÂY TRANH CÃI, RAGE BAIT - khiến người xem muốn bình luận ngay
- Chủ đề: tâm linh, cuộc sống, mối quan hệ, công việc, tiền bạc, hạnh phúc, stress, lo âu, đạo đức...
- Phong cách: thẳng thắn, có thể hơi cực đoan, đặt câu hỏi về những vấn đề nhạy cảm, controversial
- Câu hỏi phải HÚT, khiến người xem phải dừng lại xem câu trả lời

QUAN TRỌNG:
- CHỈ 1 CÂU HỎI, không được dài dòng
- Mỗi câu hỏi PHẢI KHÁC NHAU, không được trùng lặp
- Câu hỏi phải tự nhiên, như một người thật đang hỏi
- Kết thúc bằng dấu chấm hỏi (?)
- KHÔNG dùng gạch đầu dòng, chỉ trả về câu hỏi thuần túy

VÍ DỤ CÂU HỎI TỐT (NGẮN, GIẬT GÂN):
- "Thầy ơi, tại sao người tốt lại hay bị lợi dụng?"
- "Con thấy mình thất bại quá, thầy có thể giúp con không?"
- "Tại sao nhiều người giàu có nhưng vẫn không hạnh phúc?"
- "Em luôn giúp đỡ người khác nhưng lại bị phản bội, em nên làm sao?"
- "Thầy ơi, yêu bản thân có phải chỉ là đặc quyền của người có tiền không?"
- "Tại sao người thành công thường nói 'theo đam mê' nhưng thực tế họ làm vì tiền?"

CHỈ TRẢ VỀ CÂU HỎI, KHÔNG CÓ GIẢI THÍCH HAY MỞ ĐẦU GÌ THÊM.`;

  // Thêm timestamp và random seed để đảm bảo tính đa dạng
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 10000);
  const userPrompt = `Hãy tạo một câu hỏi mới, độc đáo, chưa từng thấy trước đây. 
Timestamp: ${timestamp}
Random seed: ${randomSeed}
Đảm bảo câu hỏi này hoàn toàn khác với mọi câu hỏi đã tạo trước đó.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o", // Sử dụng gpt-4o hoặc gpt-3.5-turbo
      messages: [
        { role: "system", content: QUESTION_GENERATION_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 100, // Giới hạn để câu hỏi ngắn gọn, chỉ 1 câu
      temperature: 1.2, // Temperature cao để tăng tính đa dạng và tránh trùng lặp
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const question = data.choices?.[0]?.message?.content?.trim();
  if (!question) {
    throw new Error("No question generated from OpenAI");
  }

  // Clean up: loại bỏ dấu ngoặc kép nếu có, và đảm bảo kết thúc bằng dấu hỏi
  let cleanedQuestion = question.replace(/^["']|["']$/g, "").trim();
  if (!cleanedQuestion.endsWith("?")) {
    cleanedQuestion += "?";
  }

  return cleanedQuestion;
}

/**
 * Generate audio câu hỏi từ Minimax TTS (voice: Vietnamese_female_4_v1)
 * Nối với file swish.mp3 ở cuối thay vì 2 giây yên lặng
 */
export async function generateQuestionAudio(question: string): Promise<Buffer> {
  const minimaxApiKey = process.env.MINIMAX_API_KEY;
  if (!minimaxApiKey) {
    throw new Error("Missing MINIMAX_API_KEY environment variable");
  }

  const model = process.env.MINIMAX_TTS_MODEL || "speech-2.6-turbo";
  const voiceId = "Vietnamese_female_4_v1"; // Voice cho câu hỏi của user
  const outputFormat = process.env.MINIMAX_OUTPUT_FORMAT || "hex";

  // Normalize text để đảm bảo đọc tiếng Việt chính xác
  const normalizedText = question
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.,!?;:])\s*/g, "$1 ")
    .trim();

  const response = await fetch("https://api.minimax.io/v1/t2a_v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${minimaxApiKey}`,
    },
    body: JSON.stringify({
      model: model,
      text: normalizedText,
      stream: false,
      output_format: outputFormat,
      language_boost: "Vietnamese",
      voice_setting: {
        voice_id: voiceId,
        speed: 1,
        vol: 1,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1,
      },
    }),
  });

  if (!response.ok) {
    const textError = await response.text();
    throw new Error(`MiniMax TTS error: ${textError}`);
  }

  const contentType = response.headers.get("content-type");
  let questionAudio: Buffer;

  if (
    contentType?.includes("audio/") ||
    contentType?.includes("application/octet-stream")
  ) {
    const audioBuffer = await response.arrayBuffer();
    questionAudio = Buffer.from(audioBuffer);
  } else {
    const result = await response.json();

    if (result.base_resp) {
      const statusCode = result.base_resp.status_code;
      if (statusCode !== 0) {
        throw new Error(
          `MiniMax API error: ${
            result.base_resp.status_msg || `Status code: ${statusCode}`
          }`
        );
      }
    }

    if (result.data?.audio) {
      const hexString = result.data.audio.replace(/\s/g, "");
      questionAudio = Buffer.from(hexString, "hex");
    } else {
      throw new Error("MiniMax audio data not found in response");
    }
  }

  // Read swish.mp3 file and concatenate with question audio
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "question-audio-"));
  const questionPath = path.join(tempDir, "question.mp3");
  const swishPath = path.join(process.cwd(), "public", "swish.mp3");
  const outputPath = path.join(tempDir, "question-with-swish.mp3");
  const concatListPath = path.join(tempDir, "concat.txt");

  try {
    // Write question audio
    await fs.writeFile(questionPath, questionAudio);

    // Check if swish.mp3 exists
    try {
      await fs.access(swishPath);
    } catch {
      throw new Error(`Swish audio file not found: ${swishPath}`);
    }

    // Create concat list for ffmpeg
    await fs.writeFile(
      concatListPath,
      `file '${questionPath}'\nfile '${swishPath}'`
    );

    // Use ffmpeg to concatenate question + swish
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    const ffmpegCommand = `${ffmpegPath} -y -f concat -safe 0 -i "${concatListPath}" -c copy "${outputPath}"`;

    await execAsync(ffmpegCommand);

    // Read output
    const questionAudioWithSwish = await fs.readFile(outputPath);

    return questionAudioWithSwish;
  } finally {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Error cleaning up temp files:", error);
    }
  }
}

/**
 * Concatenate two audio buffers (MP3 files)
 * Uses ffmpeg to properly merge MP3 files
 */
export async function concatenateAudioBuffers(
  audio1: Buffer,
  audio2: Buffer
): Promise<Buffer> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");

  // Create temporary directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "audio-merge-"));
  const audio1Path = path.join(tempDir, "audio1.mp3");
  const audio2Path = path.join(tempDir, "audio2.mp3");
  const outputPath = path.join(tempDir, "output.mp3");
  const concatListPath = path.join(tempDir, "concat.txt");

  try {
    // Write audio files
    await fs.writeFile(audio1Path, audio1);
    await fs.writeFile(audio2Path, audio2);

    // Create concat list file for ffmpeg
    await fs.writeFile(
      concatListPath,
      `file '${audio1Path}'\nfile '${audio2Path}'`
    );

    // Use ffmpeg to concatenate
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    const ffmpegCommand = `${ffmpegPath} -y -f concat -safe 0 -i "${concatListPath}" -c copy "${outputPath}"`;

    await execAsync(ffmpegCommand);

    // Read merged audio
    const mergedAudio = await fs.readFile(outputPath);

    return mergedAudio;
  } finally {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Error cleaning up temp files:", error);
    }
  }
}

/**
 * Generate audio từ Minimax TTS
 */
export async function generateAudio(text: string): Promise<Buffer> {
  const minimaxApiKey = process.env.MINIMAX_API_KEY;
  if (!minimaxApiKey) {
    throw new Error("Missing MINIMAX_API_KEY environment variable");
  }

  const model = process.env.MINIMAX_TTS_MODEL || "speech-2.6-turbo";
  const voiceId = process.env.MINIMAX_VOICE_ID || "female-shaonv";
  const outputFormat = process.env.MINIMAX_OUTPUT_FORMAT || "hex";

  // Normalize text để đảm bảo đọc tiếng Việt chính xác
  const normalizedText = text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.,!?;:])\s*/g, "$1 ")
    .trim();

  const response = await fetch("https://api.minimax.io/v1/t2a_v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${minimaxApiKey}`,
    },
    body: JSON.stringify({
      model: model,
      text: normalizedText,
      stream: false,
      output_format: outputFormat,
      language_boost: "Vietnamese",
      voice_setting: {
        voice_id: voiceId,
        speed: 1,
        vol: 1,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: "mp3",
        channel: 1,
      },
    }),
  });

  if (!response.ok) {
    const textError = await response.text();
    throw new Error(`MiniMax TTS error: ${textError}`);
  }

  const contentType = response.headers.get("content-type");

  if (
    contentType?.includes("audio/") ||
    contentType?.includes("application/octet-stream")
  ) {
    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  } else {
    const result = await response.json();

    if (result.base_resp) {
      const statusCode = result.base_resp.status_code;
      if (statusCode !== 0) {
        throw new Error(
          `MiniMax API error: ${
            result.base_resp.status_msg || `Status code: ${statusCode}`
          }`
        );
      }
    }

    if (result.data?.audio) {
      const hexString = result.data.audio.replace(/\s/g, "");
      return Buffer.from(hexString, "hex");
    } else {
      throw new Error("MiniMax audio data not found in response");
    }
  }
}

/**
 * Convert SRT to ASS format with KelvinStyle
 */
export function convertSRTToASS(srtContent: string): string {
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
          // Convert SRT time to ASS time
          const startASS = convertSRTTimeToASSHelper(startTime);
          const endASS = convertSRTTimeToASSHelper(endTime);

          // Wipe effect: reveal from left to right (0.4 seconds)
          const wipeDuration = 0.4;
          const startSeconds = parseSRTTimeToSecondsHelper(startTime);
          const wipeEndSeconds = startSeconds + wipeDuration;

          // Add wipe effect using \t with \clip
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
 * Helper functions for time conversion
 */
function convertSRTTimeToASSHelper(srtTime: string): string {
  const cleaned = srtTime.trim();
  const [timePart, msPart] = cleaned.split(",");
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  const milliseconds = parseInt(msPart || "0", 10);
  const centiseconds = Math.floor(milliseconds / 10);

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function parseSRTTimeToSecondsHelper(srtTime: string): number {
  const cleaned = srtTime.trim();
  const [timePart, msPart] = cleaned.split(",");
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  const milliseconds = parseInt(msPart || "0", 10);

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

/**
 * Tạo subtitle file (ASS format) từ audio sử dụng OpenAI Whisper
 * Trả về ASS với timestamp chính xác từ audio và style KelvinStyle
 */
export async function generateSubtitleASSFromAudio(
  audioBuffer: Buffer
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  // Create multipart/form-data manually for Node.js
  const boundary = `----WebKitFormBoundary${Date.now()}`;
  const formDataParts: Buffer[] = [];

  // Add file field
  formDataParts.push(Buffer.from(`--${boundary}\r\n`));
  formDataParts.push(
    Buffer.from(
      `Content-Disposition: form-data; name="file"; filename="audio.mp3"\r\n`
    )
  );
  formDataParts.push(Buffer.from(`Content-Type: audio/mpeg\r\n\r\n`));
  formDataParts.push(audioBuffer);
  formDataParts.push(Buffer.from(`\r\n`));

  // Add model field
  formDataParts.push(Buffer.from(`--${boundary}\r\n`));
  formDataParts.push(
    Buffer.from(`Content-Disposition: form-data; name="model"\r\n\r\n`)
  );
  formDataParts.push(Buffer.from(`whisper-1\r\n`));

  // Add language field
  formDataParts.push(Buffer.from(`--${boundary}\r\n`));
  formDataParts.push(
    Buffer.from(`Content-Disposition: form-data; name="language"\r\n\r\n`)
  );
  formDataParts.push(Buffer.from(`vi\r\n`));

  // Add response_format field
  formDataParts.push(Buffer.from(`--${boundary}\r\n`));
  formDataParts.push(
    Buffer.from(
      `Content-Disposition: form-data; name="response_format"\r\n\r\n`
    )
  );
  formDataParts.push(Buffer.from(`srt\r\n`));

  // Add temperature field
  formDataParts.push(Buffer.from(`--${boundary}\r\n`));
  formDataParts.push(
    Buffer.from(`Content-Disposition: form-data; name="temperature"\r\n\r\n`)
  );
  formDataParts.push(Buffer.from(`0\r\n`));

  // Close boundary
  formDataParts.push(Buffer.from(`--${boundary}--\r\n`));

  const formDataBuffer = Buffer.concat(formDataParts);

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: formDataBuffer,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI Whisper API error: ${errorText}`);
  }

  const srtContent = await response.text();

  // Convert SRT to ASS format with KelvinStyle and wipe effect
  const assContent = convertSRTToASS(srtContent);
  return assContent;
}

/**
 * Tạo subtitle file (SRT format) từ text và audio duration (fallback method)
 * Chia text thành các đoạn ngắn và tính timing dựa trên tốc độ đọc
 * Chỉ dùng khi không có Whisper API
 */
export function generateSubtitleSRT(
  text: string,
  audioDurationSeconds: number
): string {
  // Tốc độ đọc ước tính cho tiếng Việt: ~3-4 ký tự/giây hoặc ~150 từ/phút
  const CHARS_PER_SECOND = 3.5; // Ký tự mỗi giây
  const MIN_SUBTITLE_DURATION = 1.5; // Tối thiểu 1.5 giây mỗi subtitle
  const MAX_SUBTITLE_DURATION = 4.0; // Tối đa 4 giây mỗi subtitle
  const MAX_CHARS_PER_SUBTITLE = 50; // Tối đa 50 ký tự mỗi subtitle (khoảng 10-15 từ)

  // Chia text thành các từ
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);

  // Tạo các subtitle segments
  const segments: { text: string; duration: number }[] = [];
  let currentSegment = "";
  let currentSegmentChars = 0;

  for (const word of words) {
    const wordWithSpace = currentSegment ? ` ${word}` : word;
    const newLength = currentSegmentChars + wordWithSpace.length;

    // Nếu thêm từ này vượt quá max chars, lưu segment hiện tại
    if (newLength > MAX_CHARS_PER_SUBTITLE && currentSegment) {
      const duration = Math.max(
        MIN_SUBTITLE_DURATION,
        Math.min(MAX_SUBTITLE_DURATION, currentSegmentChars / CHARS_PER_SECOND)
      );
      segments.push({ text: currentSegment.trim(), duration });
      currentSegment = word;
      currentSegmentChars = word.length;
    } else {
      currentSegment += wordWithSpace;
      currentSegmentChars = newLength;
    }
  }

  // Thêm segment cuối cùng
  if (currentSegment.trim()) {
    const duration = Math.max(
      MIN_SUBTITLE_DURATION,
      Math.min(MAX_SUBTITLE_DURATION, currentSegmentChars / CHARS_PER_SECOND)
    );
    segments.push({ text: currentSegment.trim(), duration });
  }

  // Tính tổng duration của tất cả segments
  const totalSegmentsDuration = segments.reduce(
    (sum, seg) => sum + seg.duration,
    0
  );

  // Scale duration để khớp với audio duration thực tế
  const scaleFactor = audioDurationSeconds / totalSegmentsDuration;
  segments.forEach((seg) => {
    seg.duration *= scaleFactor;
    // Đảm bảo không vượt quá min/max
    seg.duration = Math.max(
      MIN_SUBTITLE_DURATION,
      Math.min(MAX_SUBTITLE_DURATION, seg.duration)
    );
  });

  // Generate SRT content
  let srtContent = "";
  let currentTime = 0;

  segments.forEach((segment, index) => {
    const startTime = formatSRTTime(currentTime);
    const endTime = formatSRTTime(
      Math.min(currentTime + segment.duration, audioDurationSeconds)
    );

    srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${
      segment.text
    }\n\n`;

    currentTime += segment.duration;
  });

  return srtContent;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}

/**
 * Get audio duration từ MP3 buffer
 * Note: Đây là estimation đơn giản, có thể cải thiện bằng cách parse MP3 header
 */
export function estimateAudioDuration(audioBuffer: Buffer): number {
  // MP3 bitrate estimation: 128kbps = 128000 bits per second = 16000 bytes per second
  // Đây là rough estimation, có thể cải thiện bằng cách parse MP3 header
  const estimatedBitrate = 128000; // bits per second
  const bytesPerSecond = estimatedBitrate / 8;
  return audioBuffer.length / bytesPerSecond;
}

/**
 * Post video lên TikTok
 * Note: Cần setup TikTok OAuth và có access token
 */
export async function postToTikTok(
  videoBuffer: Buffer,
  caption: string,
  accessToken: string
): Promise<{ videoId: string; shareUrl: string }> {
  // TikTok Content Posting API
  // Step 1: Initialize upload
  const initResponse = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        post_info: {
          title: caption.substring(0, 150), // TikTok title max 150 chars
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoBuffer.length,
          chunk_size: 10000000, // 10MB chunks
        },
      }),
    }
  );

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    throw new Error(`TikTok init upload error: ${errorText}`);
  }

  const initData = (await initResponse.json()) as {
    data?: {
      publish_id?: string;
      upload_url?: string;
    };
  };

  const publishId = initData.data?.publish_id;
  const uploadUrl = initData.data?.upload_url;

  if (!publishId || !uploadUrl) {
    throw new Error(
      "TikTok init upload failed: missing publish_id or upload_url"
    );
  }

  // Step 2: Upload video chunks
  const chunkSize = 10000000; // 10MB
  let offset = 0;

  while (offset < videoBuffer.length) {
    const chunk = videoBuffer.slice(offset, offset + chunkSize);
    const chunkEnd = Math.min(offset + chunkSize - 1, videoBuffer.length - 1);

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes ${offset}-${chunkEnd}/${videoBuffer.length}`,
      },
      body: chunk,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`TikTok upload chunk error: ${errorText}`);
    }

    offset += chunkSize;
  }

  // Step 3: Publish video
  const publishResponse = await fetch(
    `https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${publishId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!publishResponse.ok) {
    const errorText = await publishResponse.text();
    throw new Error(`TikTok publish error: ${errorText}`);
  }

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 30; // 30 attempts = 5 minutes max

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

    const statusResponse = await fetch(
      `https://open.tiktokapis.com/v2/post/publish/status/fetch/?publish_id=${publishId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!statusResponse.ok) {
      throw new Error(
        `TikTok status check error: ${statusResponse.statusText}`
      );
    }

    const statusData = (await statusResponse.json()) as {
      data?: {
        status?: string;
        share_url?: string;
      };
    };

    const status = statusData.data?.status;

    if (status === "PUBLISHED") {
      return {
        videoId: publishId,
        shareUrl: statusData.data?.share_url || "",
      };
    } else if (status === "FAILED") {
      throw new Error("TikTok video publish failed");
    }

    attempts++;
  }

  throw new Error("TikTok video publish timeout");
}
