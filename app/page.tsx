export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>AdiDatPhat Video - TikTok Automation Service</h1>
      <p>
        This is a standalone service for TikTok video generation automation.
      </p>
      <h2>API Endpoints</h2>
      <ul>
        <li>
          <code>GET /api/cron/tiktok-auto-post</code> - Cron job để tự động tạo
          và đăng video
        </li>
        <li>
          <code>GET /api/tiktok/oauth</code> - TikTok OAuth helper để lấy access
          token
        </li>
      </ul>
      <h2>Documentation</h2>
      <ul>
        <li>
          <a href="/TIKTOK_AUTOMATION_README.md">TIKTOK_AUTOMATION_README.md</a>{" "}
          - Tổng quan
        </li>
        <li>
          <a href="/TIKTOK_AUTOMATION_SETUP.md">TIKTOK_AUTOMATION_SETUP.md</a> -
          Hướng dẫn setup
        </li>
      </ul>
    </main>
  );
}
