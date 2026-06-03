"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ShowInfo {
  id: string;
  name: string;
}

interface OptionResult {
  id: string;
  label: string;
  emoji: string;
  count: number;
  barWidth: number;
}

interface ResultData {
  show: ShowInfo | null;
  options: OptionResult[] | null;
  total: number;
}

export default function BigScreenPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [voteUrl, setVoteUrl] = useState("");

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch("/api/results");
      const json: ResultData = await res.json();
      setData(json);
      if (json.show && !voteUrl) {
        setVoteUrl(`${window.location.origin}/vote/${json.show.id}`);
      }
    } catch {
      // silently retry
    }
  }, [voteUrl]);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  // Update vote URL when show changes
  useEffect(() => {
    if (data?.show) {
      setVoteUrl(`${window.location.origin}/vote/${data.show.id}`);
    } else {
      setVoteUrl("");
    }
  }, [data?.show?.id]);

  // Idle: no show active
  if (!data || !data.show || !data.options) {
    return (
      <div className="min-h-screen bg-stage-bg spotlight flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-8">🎭</div>
          <h1 className="text-6xl font-bold text-stage-gold mb-6 animate-pulse-slow tracking-widest">
            即将开始
          </h1>
          <p className="text-2xl text-gray-500">请耐心等待...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stage-bg spotlight flex flex-col items-center justify-center px-16 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-stage-gold text-xl mb-3 tracking-[0.3em]">
          ★ 现 场 投 票 ★
        </div>
        <h1 className="text-7xl font-bold text-white tracking-wider">
          {data.show.name}
        </h1>
      </div>

      <div className="flex items-center gap-16 w-full max-w-6xl">
        {/* QR Code */}
        <div className="flex-shrink-0 text-center">
          <div className="bg-white p-6 rounded-3xl shadow-2xl inline-block">
            {voteUrl && (
              <QRCodeSVG
                value={voteUrl}
                size={240}
                level="M"
                fgColor="#1a1a2e"
              />
            )}
          </div>
          <p className="text-gray-400 text-lg mt-4">扫码投票</p>
        </div>

        {/* Bar Chart */}
        <div className="flex-1 space-y-7">
          {data.options.map((option) => (
            <div key={option.id} className="flex items-center gap-5">
              <div className="w-44 text-right flex items-center justify-end gap-2">
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-xl text-white font-medium">
                  {option.label}
                </span>
              </div>
              <div className="flex-1 h-12 bg-stage-card rounded-r-lg overflow-hidden">
                <div
                  className="h-full rounded-r-lg bar-grow"
                  style={{
                    width: `${option.barWidth}%`,
                    background:
                      "linear-gradient(90deg, #d4a853, #f0d78c)",
                  }}
                />
              </div>
              <div className="w-20 text-left">
                <span className="text-3xl font-bold text-stage-gold-light">
                  {option.count}
                </span>
                <span className="text-base text-gray-500 ml-1">票</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="mt-12 text-center">
        <span className="text-gray-500 text-lg">总票数 </span>
        <span className="text-stage-gold text-5xl font-bold">
          {data.total}
        </span>
      </div>

      {/* Admin link */}
      <a
        href="/admin"
        className="fixed bottom-6 right-6 text-gray-600 text-sm hover:text-gray-400 transition-colors"
      >
        管理
      </a>
    </div>
  );
}
