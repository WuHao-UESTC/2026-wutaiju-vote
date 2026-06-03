"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { SHOWS } from "@/lib/shows";
import Link from "next/link";

export default function QRCodesPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const downloadQR = (showId: string, name: string) => {
    const canvas = document.getElementById(
      `qr-canvas-${showId}`
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `投票二维码-${name}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <h1 className="text-lg font-bold text-gray-800">投票二维码</h1>
          </div>
          <Link
            href="/admin"
            className="text-sm text-gray-400 hover:text-stage-gold transition-colors"
          >
            ← 返回后台
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-gray-400 text-sm mb-8 text-center">
          每个节目对应固定的投票二维码，可下载保存后打印使用
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SHOWS.map((show) => (
            <div key={show.id} className="admin-card text-center">
              <h3 className="text-base font-bold text-gray-800 mb-4">
                {show.name}
              </h3>

              {origin && (
                <div className="bg-white inline-block rounded-xl p-3 mb-4 border border-gray-100">
                  <QRCodeCanvas
                    id={`qr-canvas-${show.id}`}
                    value={`${origin}/vote/${show.id}`}
                    size={160}
                    level="M"
                    fgColor="#1a1a2e"
                  />
                </div>
              )}

              <p className="text-xs text-gray-400 mb-4 break-all">
                {origin}/vote/{show.id}
              </p>

              <button
                onClick={() => downloadQR(show.id, show.name)}
                className="w-full py-2.5 rounded-xl bg-stage-gold text-white text-sm font-bold hover:bg-amber-600 active:scale-[0.97] transition-all"
              >
                下载 PNG
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-white border border-gray-100">
          <h3 className="text-base font-bold text-gray-800 mb-3">使用说明</h3>
          <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside">
            <li>点击「下载 PNG」保存每个节目的二维码图片</li>
            <li>
              将二维码图片插入到活动 PPT 中，每个节目结束后展示对应二维码
            </li>
            <li>观众使用手机扫码即可进入投票页面</li>
            <li>二维码中的链接固定不变，可重复使用</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
