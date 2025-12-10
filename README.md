# AdiDatPhat Video - TikTok Automation Service

Project riêng biệt để tự động tạo và đăng video TikTok hàng ngày. Được tách từ `adidaphat-website` để quản lý độc lập.

## 📁 Cấu trúc Project

```
adidaphat-video/
├── app/
│   └── api/
│       ├── cron/
│       │   └── tiktok-auto-post/
│       │       └── route.ts          # Cron job endpoint chính
│       └── tiktok/
│           └── oauth/
│               └── route.ts          # TikTok OAuth helper
├── lib/
│   ├── tiktok-automation.ts          # Core functions: generate content, audio, post to TikTok
│   └── video-processor.ts            # Video processing với ffmpeg
├── scripts/
│   ├── test-tiktok-automation.ts     # Test từng bước automation
│   ├── test-full-flow.ts             # Test full flow từ câu hỏi ra video
│   └── test-video-processing.ts      # Test video processing
├── public/
│   ├── auto.MOV                      # Base video file
│   └── swish.mp3                     # Swish sound effect
├── vercel.json                       # Cron job configuration
└── package.json
```

## 🚀 Quick Start

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` thành `.env.local` và điền các giá trị:

```bash
cp .env.example .env.local
```

Các biến môi trường cần thiết:

- `OPENAI_API_KEY`: OpenAI API key để generate content
- `MINIMAX_API_KEY`: Minimax API key để generate TTS
- `TIKTOK_ACCESS_TOKEN`: TikTok access token (lấy qua OAuth)
- `TIKTOK_CLIENT_KEY` & `TIKTOK_CLIENT_SECRET`: TikTok OAuth credentials

### 3. Lấy TikTok Access Token

1. Tạo TikTok App tại [TikTok Developers](https://developers.tiktok.com/)
2. Truy cập: `http://localhost:3000/api/tiktok/oauth?action=authorize`
3. Authorize và copy access token
4. Thêm vào `.env.local` hoặc Vercel environment variables

### 4. Chạy development server

```bash
npm run dev
```

### 5. Test

```bash
# Test từng bước automation
npm run test-tiktok-automation

# Test full flow từ câu hỏi ra video
npm run test-full-flow

# Test video processing
npm run test-video-processing
```

## 📚 Tài liệu

- [TIKTOK_AUTOMATION_README.md](./TIKTOK_AUTOMATION_README.md) - Tổng quan về hệ thống
- [TIKTOK_AUTOMATION_SETUP.md](./TIKTOK_AUTOMATION_SETUP.md) - Hướng dẫn setup chi tiết

## 🔧 Workflow

1. **Cron job trigger** (9 AM UTC mỗi ngày - config trong `vercel.json`)
2. **Generate content** từ OpenAI - thiền sư trả lời câu hỏi của user
3. **Generate question audio** từ Minimax TTS (Vietnamese_female_4_v1) + swish sound
4. **Generate answer audio** từ Minimax TTS (female-shaonv)
5. **Concatenate audio** - nối question + answer audio
6. **Process video** - loop video `auto.MOV`, overlay audio, thêm transitions
7. **Post to TikTok** (nếu có access token)

## ⚠️ Lưu ý quan trọng về Video Processing

**Vercel serverless functions KHÔNG hỗ trợ ffmpeg!**

Hiện tại code sẽ:

- ✅ Generate content từ OpenAI
- ✅ Generate audio từ Minimax
- ✅ Generate subtitles
- ⚠️ **Lưu video components** (video, audio, subtitle) để xử lý thủ công nếu không có external service

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

#### Option 3: Local Processing

- Cron job tạo audio và subtitle
- Xử lý video thủ công bằng ffmpeg local
- Upload video đã xử lý lên TikTok

## 🧪 Testing

### Test local:

```bash
npm run test-full-flow
```

### Test endpoint:

```bash
curl http://localhost:3000/api/cron/tiktok-auto-post
```

## 📦 Deploy

### Deploy lên Vercel

1. Push code lên Git repository
2. Import project vào Vercel
3. Thêm environment variables trong Vercel dashboard
4. Deploy

Cron job sẽ tự động chạy mỗi ngày lúc 9 AM UTC (config trong `vercel.json`).

## 🔗 Liên quan

- **adidaphat-website**: Website chính và API server
- **adidaphat-mobile**: Mobile app (Expo/React Native)

Project này được tách từ `adidaphat-website` để quản lý độc lập và dễ maintain.
