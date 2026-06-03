import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "舞台剧投票系统",
  description: "现场实时投票",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
