"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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
  const [visible, setVisible] = useState(false);
  const prevShowId = useRef<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      const json: ResultData = await res.json();

      if (json.show && json.show.id !== prevShowId.current) {
        setVisible(false);
        setTimeout(() => setVisible(true), 50);
      }
      prevShowId.current = json.show?.id ?? null;
      setData(json);
    } catch {
      // silently retry
    }
  }, []);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  useEffect(() => {
    setVisible(true);
  }, []);

  // ====== Idle State ======
  if (!data || !data.show || !data.options) {
    return (
      <div className="min-h-screen stage-bg flex items-center justify-center relative overflow-hidden">
        {/* Particles */}
        <div className="particles">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className={`particle ${i % 5 === 0 ? "star" : i % 3 === 0 ? "gold" : "red"}`}
            >
              {i % 5 === 0 ? "★" : ""}
            </div>
          ))}
        </div>

        {/* Center content */}
        <div className="text-center relative z-10">
          {/* Star decoration */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <span className="text-stage-gold text-2xl opacity-60">★</span>
            <span className="text-6xl md:text-8xl">🎭</span>
            <span className="text-stage-gold text-2xl opacity-60">★</span>
          </div>

          <div className="decorative-line mb-8">
            <span className="text-stage-gold text-base md:text-lg tracking-[0.4em] font-medium px-4">
              L I V E &nbsp; V O T I N G
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-[0.15em]"
            style={{
              color: "#d4a853",
              textShadow: "0 0 60px rgba(196,30,58,0.4), 0 0 120px rgba(196,30,58,0.15)",
            }}
          >
            即 将 开 始
          </h1>

          <p className="text-xl text-gray-500 tracking-wider">请耐心等待...</p>

          {/* Bottom stars */}
          <div className="flex justify-center gap-12 mt-10 opacity-30">
            <span className="text-stage-gold text-sm">★</span>
            <span className="text-stage-gold text-lg">★</span>
            <span className="text-stage-gold text-sm">★</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen stage-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Floating particles */}
      <div className="particles">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className={`particle ${i % 5 === 0 ? "star" : i % 3 === 0 ? "gold" : "red"}`}
          >
            {i % 5 === 0 ? "★" : ""}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div
        className={`relative z-10 w-full max-w-7xl px-8 md:px-16 py-8 flex flex-col items-center ${
          visible ? "entrance-stage" : "opacity-0"
        }`}
      >
        {/* ===== Header ===== */}
        <div className="text-center mb-10 md:mb-14">
          {/* Top star row */}
          <div className="flex items-center justify-center gap-8 mb-5 opacity-50">
            <span className="text-stage-gold text-sm">★</span>
            <span className="decorative-line-red w-16" />
            <span className="text-stage-gold text-lg">★</span>
            <span className="decorative-line-red w-16" />
            <span className="text-stage-gold text-sm">★</span>
          </div>

          <div className="decorative-line mb-6">
            <span className="text-stage-gold/70 text-sm md:text-base tracking-[0.35em] font-medium px-6">
              ★ 现 场 投 票 ★
            </span>
          </div>

          <h1
            className="text-4xl md:text-6xl lg:text-8xl font-bold text-white tracking-[0.08em] leading-tight"
            style={{
              textShadow:
                "0 0 40px rgba(196,30,58,0.4), 0 0 80px rgba(196,30,58,0.15), 0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {data.show.name}
          </h1>

          {/* Bottom star row */}
          <div className="flex items-center justify-center gap-8 mt-5 opacity-40">
            <span className="text-stage-gold text-sm">★</span>
            <span className="text-stage-gold text-lg">★</span>
            <span className="text-stage-gold text-sm">★</span>
          </div>
        </div>

        {/* ===== Poster + Bar Chart ===== */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 w-full">
          {/* Poster Image */}
          <div className="flex-shrink-0 text-center">
            <div
              className="relative overflow-hidden border-2 border-red-700/30"
              style={{ width: "160px", height: "360px" }}
            >
              <img
                src={`/pic/show${data.show.id}.png`}
                alt={data.show.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-gray-500 text-xs mt-3 tracking-wider">
              {data.show.name}
            </p>
          </div>

          {/* ===== Bar Chart ===== */}
          <div className="flex-1 w-full space-y-5 md:space-y-7">
            {data.options.map((option, index) => (
              <div
                key={option.id}
                className="flex items-center gap-4 md:gap-5"
                style={{
                  animation: `slideUp 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Label */}
                <div className="w-36 md:w-44 text-right flex items-center justify-end gap-2 md:gap-3">
                  <span className="text-xl md:text-2xl">{option.emoji}</span>
                  <span className="text-sm md:text-lg text-white/80 font-medium whitespace-nowrap">
                    {option.label}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-10 md:h-14 bar-track overflow-hidden">
                  <div
                    className={`h-full bar-fill ${index === 0 ? "leading" : ""}`}
                    style={{ width: `${option.barWidth}%` }}
                  />
                </div>

                {/* Count */}
                <div className="w-16 md:w-20 text-left">
                  <span className="text-2xl md:text-3xl font-bold text-stage-gold-light tabular-nums">
                    {option.count}
                  </span>
                  <span className="text-xs md:text-sm text-gray-500 ml-1">票</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Total ===== */}
        <div className="mt-10 md:mt-14 text-center">
          <div className="flex items-center gap-4 mb-2 opacity-30">
            <span className="text-stage-gold text-xs">━━</span>
            <span className="text-stage-gold text-sm">★</span>
            <span className="text-stage-gold text-xs">━━</span>
          </div>
          <span className="text-gray-500 text-sm tracking-wider mr-3">累 计</span>
          <span
            className="text-stage-gold text-4xl md:text-6xl font-bold tabular-nums"
            style={{ textShadow: "0 0 40px rgba(196,30,58,0.35)" }}
          >
            {data.total}
          </span>
          <span className="text-gray-500 text-sm tracking-wider ml-3">票</span>
        </div>
      </div>

      {/* Footer */}
      <a
        href="/admin"
        className="fixed bottom-6 right-6 text-gray-600 text-xs hover:text-gray-400 transition-colors z-20 tracking-wider"
      >
        管 理
      </a>
    </div>
  );
}
