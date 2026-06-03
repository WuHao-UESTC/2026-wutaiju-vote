"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { VOTE_OPTIONS, getShowById } from "@/lib/shows";

const CONFETTI_COLORS = ["#b40f1d", "#e83535", "#d9a84f", "#f7df99", "#7d0b13", "#fff2c4"];

interface ConfettiPiece {
  id: number;
  color: string;
  dx: number;
  dy: number;
  dr: number;
  left: number;
  delay: number;
}

function getDeviceFingerprint(): string {
  const parts = [
    screen.width,
    screen.height,
    window.devicePixelRatio || 1,
    navigator.platform || "",
    navigator.hardwareConcurrency || 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ];
  return parts.join("|");
}

function VoteBrand() {
  return (
    <div className="vote-brand" aria-label="活动主视觉元素">
      <div className="flex items-center justify-between gap-4">
        <img src="/pic/main-k-college-badges-cutout.png" alt="英才实验学院徽章" className="vote-brand-badges" />
        <img src="/pic/main-k-u70-cutout.png" alt="电子科技大学70周年校庆" className="vote-brand-u70" />
      </div>
      <img src="/pic/main-k-title-cutout.png" alt="烽火岁月映芳华 峥嵘历程谱新篇" className="vote-brand-title" />
    </div>
  );
}

export default function VotePage() {
  const params = useParams();
  const showId = params.showId as string;
  const show = getShowById(showId);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voterToken, setVoterToken] = useState("");
  const [error, setError] = useState("");
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [checking, setChecking] = useState(true);
  const deviceFingerprint = useRef("");

  useEffect(() => {
    deviceFingerprint.current = getDeviceFingerprint();

    let token = localStorage.getItem(`voter_token_${showId}`);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(`voter_token_${showId}`, token);
    }
    setVoterToken(token);

    const hasCookie = document.cookie.includes(`voted_${showId}=1`);

    async function check() {
      try {
        const res = await fetch(`/api/check-vote?showId=${showId}&voterToken=${token}`);
        const data = await res.json();
        if (!data.canVote) {
          setAlreadyVoted(true);
        }
      } catch {
        if (hasCookie) {
          setAlreadyVoted(true);
        }
      }
      setChecking(false);
    }

    if (hasCookie) {
      check();
    } else {
      setChecking(false);
    }
  }, [showId]);

  const spawnConfetti = () => {
    const pieces: ConfettiPiece[] = Array.from({ length: 48 }).map((_, i) => ({
      id: i,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      dx: (Math.random() - 0.5) * 420,
      dy: -(Math.random() * 420 + 120),
      dr: (Math.random() - 0.5) * 720,
      left: Math.random() * 100,
      delay: Math.random() * 0.45,
    }));
    setConfetti(pieces);
  };

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId,
          optionId: selected,
          voterToken,
          deviceFingerprint: deviceFingerprint.current,
        }),
      });
      if (res.ok) {
        document.cookie = `voted_${showId}=1; max-age=86400; path=/`;
        setSubmitted(true);
        spawnConfetti();
      } else if (res.status === 409) {
        setAlreadyVoted(true);
      } else {
        const json = await res.json();
        setError(json.error || "投票失败，请重试");
      }
    } catch {
      setError("网络错误，请重试");
    }
    setSubmitting(false);
  };

  if (checking) {
    return (
      <main className="vote-page flex min-h-screen items-center justify-center p-5">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-stage-gold border-t-transparent" />
      </main>
    );
  }

  if (!show) {
    return (
      <main className="vote-page flex min-h-screen items-center justify-center p-5 text-white">
        <p className="text-xl font-semibold">节目不存在</p>
      </main>
    );
  }

  if (alreadyVoted || submitted) {
    return (
      <main className="vote-page relative flex min-h-screen items-center justify-center overflow-hidden p-5 text-white">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="confetti-piece"
            style={
              {
                left: `${p.left}%`,
                top: "52%",
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
                "--dr": `${p.dr}deg`,
              } as React.CSSProperties
            }
          />
        ))}
        <section className="vote-success animate-scale-in">
          <VoteBrand />
          <div className="success-seal">
            <svg width="88" height="88" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="45" fill="rgba(255,255,255,0.08)" stroke="#f7df99" strokeWidth="3" />
              <path
                d="M30 52 L44 66 L70 38"
                fill="none"
                stroke="#f7df99"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="6"
                strokeDasharray="50"
                strokeDashoffset="50"
                style={{ animation: "checkDraw 0.45s ease-out 0.2s forwards" }}
              />
            </svg>
          </div>
          <p className="stage-kicker">现场投票</p>
          <h1 className="mt-3 text-3xl font-black">{submitted ? "投票成功" : "您已投过票"}</h1>
          <p className="mt-3 text-white/68">{submitted ? "此刻心意，已汇入舞台回响" : "每人限投一票"}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="vote-page min-h-screen overflow-hidden px-5 py-5 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-md flex-col justify-center">
        <VoteBrand />

        <header className="mb-6 mt-5">
          <div className="vote-badge">现场投票</div>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-wide">{show.name}</h1>
          <p className="mt-3 text-base font-semibold text-white/70">请以一票作注，为舞台上滚烫的历史回声加冕。</p>
        </header>

        <section className="space-y-3">
          {VOTE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={`vote-option ${selected === option.id ? "selected" : ""}`}
            >
              <span className="option-text">{option.label}</span>
              <span className="check-circle" />
            </button>
          ))}
        </section>

        {error && <p className="mt-4 text-sm font-semibold text-stage-gold-light">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!selected || submitting}
          className={`vote-submit ${selected && !submitting ? "enabled" : "disabled"}`}
        >
          {submitting ? "提交中..." : "提交投票"}
        </button>

        <p className="mt-5 text-center text-xs font-bold tracking-[0.24em] text-stage-gold/75">每人限投一票</p>
      </div>
    </main>
  );
}
