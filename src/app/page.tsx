"use client";

import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

interface ShowInfo {
  id: string;
  name: string;
}

interface OptionResult {
  id: string;
  label: string;
  count: number;
  barWidth: number;
}

interface ResultData {
  show: ShowInfo | null;
  options: OptionResult[] | null;
  total: number;
}

function StageOrnaments() {
  return (
    <>
      <div className="stage-ribbon stage-ribbon-left" />
      <div className="stage-ribbon stage-ribbon-right" />
      <div className="stage-light stage-light-left" />
      <div className="stage-light stage-light-right" />
      <div className="stage-grain" />
    </>
  );
}

function BrandStrip({ idle = false }: { idle?: boolean }) {
  return (
    <div className={`brand-strip ${idle ? "idle-brand-strip" : ""}`} aria-label="活动主视觉元素">
      <img src="/pic/main-k-college-badges-cutout.png" alt="英才实验学院徽章" className="brand-badges" />
      <img src="/pic/main-k-title-cutout.png" alt="烽火岁月映芳华 峥嵘历程谱新篇" className="brand-title-art" />
      <img src="/pic/main-k-u70-cutout.png" alt="电子科技大学70周年校庆" className="brand-u70" />
    </div>
  );
}

export default function BigScreenPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [visible, setVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevShowId = useRef<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      const json: ResultData = await res.json();

      if (json.show && json.show.id !== prevShowId.current) {
        setVisible(false);
        setTimeout(() => setVisible(true), 60);
      }
      prevShowId.current = json.show?.id ?? null;
      setData(json);
    } catch {
      // Keep polling after transient network errors.
    }
  }, []);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 2000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  useEffect(() => {
    setVisible(true);
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  };

  if (!data || !data.show || !data.options) {
    return (
      <main className="stage-page h-screen overflow-hidden text-white">
        <StageOrnaments />
        {!isFullscreen && (
          <button className="fullscreen-button" onClick={enterFullscreen}>
            全屏展示
          </button>
        )}
        <section className="idle-stage relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
          <BrandStrip idle />
          <div className="gold-medallion mt-10">LIVE</div>
          <p className="stage-kicker mt-8">现场实时投票</p>
          <h1 className="stage-idle-title mt-4">即将开始</h1>
          <p className="mt-5 text-lg tracking-[0.3em] text-white/68">请等待管理员开启节目</p>
        </section>
      </main>
    );
  }

  const posterSrc = `/pic/show${data.show.id}.png`;

  return (
    <main className="stage-page h-screen overflow-hidden text-white">
      <StageOrnaments />
      {!isFullscreen && (
        <button className="fullscreen-button" onClick={enterFullscreen}>
          全屏展示
        </button>
      )}

      <section
        className={`stage-layout relative z-10 h-full w-full px-5 py-5 md:px-8 ${
          visible ? "entrance-stage" : "opacity-0"
        }`}
      >
        <aside
          className="poster-hero"
          style={{ "--poster-art": `url(${posterSrc})` } as CSSProperties}
        >
          <img src={posterSrc} alt={data.show.name} className="poster-hero-image" />
        </aside>

        <header className="stage-brand-panel">
          <BrandStrip />
          <div className="stage-title-row">
            <div className="min-w-0">
              <p className="stage-kicker text-left">英才实验学院中国近代史舞台剧展演 · 现场投票</p>
              <h1 className="stage-title mt-2 truncate text-3xl font-black leading-tight md:text-5xl xl:text-6xl">
                {data.show.name}
              </h1>
            </div>
            <div className="total-panel">
              <span>总票数</span>
              <strong>{data.total}</strong>
            </div>
          </div>
        </header>

        <section className="result-board min-h-0">
          {data.options.map((option, index) => {
            const percent = data.total > 0 ? Math.round((option.count / data.total) * 100) : 0;
            return (
              <div
                key={option.id}
                className="result-row"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="result-label">
                  <span className="result-rank">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{option.label}</strong>
                </div>
                <div className="result-meter">
                  <div
                    className={`result-fill ${index === 0 ? "leading" : ""}`}
                    style={{ width: `${Math.max(option.barWidth, option.count > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <div className="result-count">
                  <strong>{option.count}</strong>
                  <span>{percent}%</span>
                </div>
              </div>
            );
          })}
        </section>

        <footer className="stage-footer">
          <span>LIVE VOTING RESULTS</span>
          <a href="/admin" className="transition-colors hover:text-stage-gold-light">
            管理后台
          </a>
        </footer>
      </section>
    </main>
  );
}
