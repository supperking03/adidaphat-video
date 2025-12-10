# TikTok Automation Setup Guide

Hướng dẫn thiết lập hệ thống tự động tạo và đăng video TikTok hàng ngày.

## Tổng quan

Hệ thống này tự động:
1. ✅ Generate content từ OpenAI - thiền sư trả lời câu hỏi của user (giống chat)
2. ✅ Generate audio từ Minimax TTS
3. ✅ Xử lý video: loop video `auto.MOV`, overlay audio, thêm subtitle
4. ✅ Đăng video lên TikTok

## Cài đặt

### 1. Environment Variables

Thêm các biến môi trường sau vào Vercel (Settings → Environment Variables):

```env
# OpenAI (đã có sẵn)
OPENAI_API_KEY=your_openai_key

# Minimax TTS (đã có sẵn)
MINIMAX_API_KEY=your_minimax_key
MINIMAX_TTS_MODEL=speech-2.6-turbo
MINIMAX_VOICE_ID=female-shaonv

# TikTok API
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token

# Optional: Câu hỏi của user (nếu không có sẽ random)
TIKTOK_DAILY_QUESTION=Làm sao để tìm được sự bình an trong tâm hồn?

# Optional: Bảo vệ cron endpoint
CRON_SECRET=your_random_secret_string
```

### 2. TikTok API Setup

#### Bước 1: Tạo TikTok App
1. Truy cập [TikTok Developers](https://developers.tiktok.com/)
2. Tạo một app mới
3. Chọn scopes: `video.upload`, `video.publish`
4. Lấy **Client Key** và **Client Secret**

#### Bước 2: OAuth Flow để lấy Access Token
TikTok yêu cầu OAuth để lấy access token. Bạn có thể:

**Option A: Sử dụng TikTok OAuth Helper (khuyến nghị)**
- Tạo một endpoint helper để lấy access token
- Hoặc sử dụng tool như [Postman](https://www.postman.com/) để test OAuth flow

**Option B: Sử dụng Refresh Token**
- Lưu refresh token và tự động refresh access token khi cần

**OAuth Flow:**
1. Redirect user đến TikTok authorization URL
2. User authorize app
3. Nhận authorization code
4. Exchange code lấy access token và refresh token
5. Lưu tokens vào environment variables

**Example OAuth URL:**
```
https://www.tiktok.com/v2/auth/authorize/
  ?client_key=YOUR_CLIENT_KEY
  &scope=video.upload,video.publish
  &response_type=code
  &redirect_uri=YOUR_REDIRECT_URI
  &state=random_state_string
```

#### Bước 3: Lưu Access Token
- Lưu `TIKTOK_ACCESS_TOKEN` vào Vercel environment variables
- Token thường có thời hạn, cần refresh định kỳ

### 3. Video Processing Setup

⚠️ **Lưu ý quan trọng về Video Processing:**

Vercel serverless functions có giới hạn:
- Memory limit: 1GB (Pro) hoặc 512MB (Hobby)
- Execution time: 10s (Hobby) hoặc 60s (Pro)
- Không có ffmpeg sẵn

**Giải pháp:**

#### Option A: Sử dụng External Service (Khuyến nghị)
Sử dụng dịch vụ bên ngoài như:
- **Cloudinary**: Có API để xử lý video
- **Mux**: Video processing service
- **AWS Lambda + MediaConvert**: Nếu dùng AWS
- **Render.com** hoặc **Railway**: Deploy worker riêng cho video processing

#### Option B: Sử dụng Vercel Edge Functions với FFmpeg WASM
- Có thể dùng `@ffmpeg/ffmpeg` (WebAssembly)
- Nhưng vẫn có giới hạn về memory và time

#### Option C: Deploy Worker riêng
- Tạo một service riêng (Node.js + ffmpeg) để xử lý video
- Gọi service này từ cron job

**Hiện tại code đã có sẵn function `processVideo()` sử dụng ffmpeg.**
Bạn cần:
1. Đảm bảo ffmpeg có sẵn trong môi trường (không khả thi trên Vercel serverless)
2. Hoặc modify để sử dụng external service

### 4. Cron Job Schedule

Cron job đã được cấu hình trong `vercel.json`:
- Schedule: `0 9 * * *` (9:00 AM UTC mỗi ngày)

Bạn có thể thay đổi schedule trong `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/tiktok-auto-post",
    "schedule": "0 9 * * *"  // Thay đổi theo nhu cầu
  }]
}
```

**Cron schedule format:** `minute hour day month weekday`
- `0 9 * * *` = 9:00 AM mỗi ngày
- `0 14 * * *` = 2:00 PM mỗi ngày (UTC)
- `0 9 * * 1` = 9:00 AM mỗi thứ 2

### 5. Testing

#### Test thủ công:
```bash
# Test endpoint (nếu không có CRON_SECRET)
curl https://your-domain.vercel.app/api/cron/tiktok-auto-post

# Test với CRON_SECRET
curl -H "Authorization: Bearer your_cron_secret" \
  https://your-domain.vercel.app/api/cron/tiktok-auto-post
```

#### Test từng bước:
1. Test content generation: Gọi `generateContent()` với một topic
2. Test audio generation: Gọi `generateAudio()` với content
3. Test video processing: Gọi `processVideo()` với video và audio
4. Test TikTok upload: Gọi `postToTikTok()` với video buffer

## Troubleshooting

### Lỗi: "Video file not found"
- Đảm bảo file `public/auto.MOV` tồn tại
- Kiểm tra path trong code

### Lỗi: "ffmpeg not found"
- Vercel serverless không có ffmpeg
- Cần sử dụng external service hoặc modify code

### Lỗi: "TikTok API error"
- Kiểm tra access token còn hạn không
- Kiểm tra scopes đã đúng chưa (cần `video.upload`, `video.publish`)
- Kiểm tra video format (TikTok yêu cầu MP4, H.264)

### Lỗi: "Memory limit exceeded"
- Video quá lớn
- Cần optimize video hoặc sử dụng external processing

### Lỗi: "Execution timeout"
- Video processing mất quá nhiều thời gian
- Cần sử dụng external service hoặc optimize

## Cải thiện trong tương lai

1. **Subtitle timing chính xác hơn**: Sử dụng speech-to-text API để có timing chính xác
2. **Video processing tốt hơn**: Sử dụng external service (Cloudinary, Mux)
3. **Error handling**: Retry logic, error notifications
4. **Monitoring**: Logging, analytics
5. **Content scheduling**: Lưu trữ content và schedule đăng
6. **Multiple topics**: Rotate topics, A/B testing

## Tài liệu tham khảo

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api/)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [MiniMax TTS API](https://platform.minimax.io/docs/api-reference/speech-t2a-intro)

