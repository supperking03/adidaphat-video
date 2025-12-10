import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AdiDatPhat Video - TikTok Automation",
  description: "TikTok video generation automation service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
