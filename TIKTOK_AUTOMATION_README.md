# TikTok Automation - Tổng quan

Hệ thống tự động hóa đã được tạo để tự động tạo và đăng video TikTok hàng ngày.

## 📁 Các file đã tạo

### Core Functions
- **`lib/tiktok-automation.ts`**: Các helper functions chính
  - `generateContent()`: Tạo content từ OpenAI - thiền sư trả lời câu hỏi của user (giống chat)
  - `generateAudio()`: Tạo audio từ Minimax TTS
  - `generateSubtitleSRT()`: Tạo subtitle file
  - `postToTikTok()`: Đăng video lên TikTok

- **`lib/video-processor.ts`**: Xử lý video
  - `processVideo()`: Xử lý video với ffmpeg (chỉ hoạt động local)
  - `processVideoExternal()`: Xử lý video với external service (khuyến nghị cho Vercel)
  - `processVideoWithFFmpegWASM()`: Xử lý video với FFmpeg WASM

### API Endpoints
- **`app/api/cron/tiktok-auto-post/route.ts`**: Cron job endpoint chính
- **`app/api/tiktok/oauth/route.ts`**: Helper để lấy TikTok access token

### Configuration
- **`vercel.json`**: Cấu hình cron job (9 AM UTC mỗi ngày)

### Scripts
- **`scripts/test-tiktok-automation.ts`**: Script test local

### Documentation
- **`TIKTOK_AUTOMATION_SETUP.md`**: Hướng dẫn setup chi tiết

## 🚀 Quick Start

### 1. Setup Environment Variables

Thêm vào Vercel Environment Variables:

```env
OPENAI_API_KEY=your_key
MINIMAX_API_KEY=your_key
TIKTOK_ACCESS_TOKEN=your_token
TIKTOK_DAILY_QUESTION=Làm sao để tìm được sự bình an trong tâm hồn?  # optional, câu hỏi của user
CRON_SECRET=your_secret  # optional, để bảo vệ endpoint
```

### 2. Lấy TikTok Access Token

1. Tạo TikTok App tại [TikTok Developers](https://developers.tiktok.com/)
2. Truy cập: `https://your-domain.vercel.app/api/tiktok/oauth?action=authorize`
3. Authorize và copy access token
4. Thêm vào Vercel environment variables

### 3. Deploy lên Vercel

```bash
git add .
git commit -m "Add TikTok automation"
git push
```

Cron job sẽ tự động chạy mỗi ngày lúc 9 AM UTC.

## ⚠️ Lưu ý quan trọng về Video Processing

**Vercel serverless functions KHÔNG hỗ trợ ffmpeg!**

Hiện tại code sẽ:
- ✅ Generate content từ OpenAI
- ✅ Generate audio từ Minimax
- ✅ Generate subtitles
- ⚠️ **Lưu video components** (video, audio, subtitle) để xử lý thủ công

### Giải pháp cho Video Processing:

#### Option 1: External Service (Khuyến nghị)
Sử dụng dịch vụ như Cloudinary, Mux để xử lý video:
- Upload video và audio lên service
- Dùng API của service để loop video, overlay audio, thêm subtitle
- Download video đã xử lý

#### Option 2: Separate Worker Service
Deploy một service riêng (Node.js + ffmpeg) để xử lý video:
- Service này có thể chạy trên Render.com, Railway, hoặc VPS
- Cron job gọi service này để xử lý video

#### Option 3: Manual Processing
- Cron job tạo audio và subtitle
- Bạn xử lý video thủ công bằng ffmpeg local
- Upload video đã xử lý lên TikTok

## 🧪 Testing

### Test local:
```bash
npm run test-tiktok-automation
```

### Test endpoint:
```bash
curl https://your-domain.vercel.app/api/cron/tiktok-auto-post
```

## 📝 Workflow

1. **Cron job trigger** (9 AM UTC mỗi ngày)
2. **Generate content** từ OpenAI - thiền sư trả lời câu hỏi của user (giống chat)
3. **Generate audio** từ Minimax TTS
4. **Generate subtitles** từ content
5. **Process video** (loop, overlay audio, add subtitles)
   - ⚠️ Hiện tại lưu components nếu không có external service
6. **Post to TikTok** (nếu có access token)

## 🔧 Customization

### Thay đổi schedule:
Sửa `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/tiktok-auto-post",
    "schedule": "0 14 * * *"  // 2 PM UTC
  }]
}
```

### Thay đổi câu hỏi:
Sửa function `getRandomQuestion()` trong `app/api/cron/tiktok-auto-post/route.ts` hoặc set `TIKTOK_DAILY_QUESTION` env var

### Thêm video processing service:
Implement `processVideoExternal()` trong `lib/video-processor.ts`

## 📚 Tài liệu tham khảo

- [TIKTOK_AUTOMATION_SETUP.md](./TIKTOK_AUTOMATION_SETUP.md) - Hướng dẫn setup chi tiết
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api/)

## ❓ Troubleshooting

Xem [TIKTOK_AUTOMATION_SETUP.md](./TIKTOK_AUTOMATION_SETUP.md) phần Troubleshooting.

