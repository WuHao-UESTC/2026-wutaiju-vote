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
  mode?: "idle" | "voting" | "final";
  show: ShowInfo | null;
  options: OptionResult[] | null;
  total: number;
  finalShows?: FinalShow[];
}

interface FinalShow {
  id: string;
  name: string;
  totalVotes: number;
  totalScore: number;
  averageScore: number;
  barWidth: number;
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
  const [posterSlots, setPosterSlots] = useState([0, 1, 2, 3]);
  const [isPosterAdvancing, setIsPosterAdvancing] = useState(false);
  const [leavingPosterIndex, setLeavingPosterIndex] = useState<number | null>(null);
  const [recycledPosterIndex, setRecycledPosterIndex] = useState<number | null>(null);
  const [returningPosterIndex, setReturningPosterIndex] = useState<number | null>(null);
  const [freezePosterStack, setFreezePosterStack] = useState(false);
  const prevShowId = useRef<string | null>(null);
  const posterAnimating = useRef(false);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch("/api/results", { cache: "no-store" });
      const json: ResultData = await res.json();

      const nextViewId = json.mode === "final" ? "__final__" : json.show?.id ?? null;
      if (nextViewId !== prevShowId.current) {
        setVisible(false);
        setTimeout(() => setVisible(true), 60);
      }
      prevShowId.current = nextViewId;
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
    const posterInterval = setInterval(() => {
      if (posterAnimating.current) return;
      posterAnimating.current = true;
      setReturningPosterIndex(null);
      setPosterSlots((slots) => {
        const first = slots.findIndex((slot) => slot === 0);
        setLeavingPosterIndex(first);
        setIsPosterAdvancing(true);
        return slots;
      });
    }, 4300);
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      clearInterval(posterInterval);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const enterFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  };

  const handlePosterDrawEnd = (index: number) => {
    if (index !== leavingPosterIndex) return;

    setFreezePosterStack(true);
    setRecycledPosterIndex(index);
    setPosterSlots((current) => current.map((slot) => (slot === 0 ? 3 : slot - 1)));
    setIsPosterAdvancing(false);
    setLeavingPosterIndex(null);

    setTimeout(() => {
      setRecycledPosterIndex(null);
      setFreezePosterStack(false);
      setReturningPosterIndex(index);

      setTimeout(() => {
        setReturningPosterIndex(null);
        posterAnimating.current = false;
      }, 720);
    }, 420);
  };

  if (data?.mode === "final" && data.finalShows) {
    return (
      <main className="stage-page h-screen overflow-hidden text-white">
        <StageOrnaments />
        {!isFullscreen && (
          <button className="fullscreen-button" onClick={enterFullscreen}>
            全屏展示
          </button>
        )}
        <section className={`final-layout relative z-10 h-full w-full px-5 py-5 md:px-8 ${visible ? "entrance-stage" : "opacity-0"}`}>
          <aside
            className={`final-poster-stack ${isPosterAdvancing ? "advancing" : ""} ${
              freezePosterStack ? "frozen" : ""
            }`}
            aria-label="节目海报轮播"
          >
            {[0, 1, 2, 3].map((index) => {
              const stackPosition = posterSlots[index];
              const visualPosition =
                isPosterAdvancing && stackPosition > 0 ? stackPosition - 1 : stackPosition;
              return (
                <img
                  key={index}
                  src={`/pic/show${index + 1}.png`}
                  alt=""
                  className={`final-poster-card ${
                    leavingPosterIndex === index ? "leaving" : ""
                  } ${recycledPosterIndex === index ? "recycled" : ""
                  } ${returningPosterIndex === index ? "returning" : ""}`}
                  style={{ "--stack-position": visualPosition } as CSSProperties}
                  onAnimationEnd={() => handlePosterDrawEnd(index)}
                />
              );
            })}
          </aside>

          <header className="final-brand-panel">
            <div className="brand-strip final-brand-strip" aria-label="活动主视觉元素">
              <img src="/pic/main-k-college-badges-cutout.png" alt="英才实验学院徽章" className="brand-badges" />
              <img src="/pic/main-k-title-cutout.png" alt="烽火岁月映芳华 峥嵘历程谱新篇" className="brand-title-art" />
              <img src="/pic/main-k-u70-cutout.png" alt="电子科技大学70周年校庆" className="brand-u70" />
            </div>
            <p className="stage-kicker mt-2 text-center">最终票数统计</p>
          </header>

          <section className="final-score-board">
            {data.finalShows.map((show, index) => (
              <article key={show.id} className="final-score-row" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="final-show-meta">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{show.name}</strong>
                  <small>{show.totalVotes} 票 · 均分 {show.averageScore.toFixed(2)}</small>
                </div>
                <div className="final-score-meter">
                  <div className="final-score-fill" style={{ width: `${Math.max(show.barWidth, show.totalScore > 0 ? 5 : 0)}%` }} />
                </div>
                <div className="final-score-number">
                  <strong>{show.totalScore}</strong>
                  <span>分</span>
                </div>
              </article>
            ))}
          </section>

          <footer className="stage-footer final-footer">
            <span>FINAL SCORE RESULTS</span>
            <a href="/admin" className="transition-colors hover:text-stage-gold-light">
              管理后台
            </a>
          </footer>
        </section>
      </main>
    );
  }

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

