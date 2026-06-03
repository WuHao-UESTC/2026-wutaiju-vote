"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { VOTE_OPTIONS, getShowById } from "@/lib/shows";

const CONFETTI_COLORS = [
  "#c41e3a", "#e8394a", "#d4a853", "#f5d98e",
  "#ff4757", "#ff6348", "#ffd700", "#ff6b81",
];

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
        const res = await fetch(
          `/api/check-vote?showId=${showId}&voterToken=${token}`
        );
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

  const spawnConfetti = () => {
    const pieces: ConfettiPiece[] = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      dx: (Math.random() - 0.5) * 400,
      dy: -(Math.random() * 400 + 100),
      dr: (Math.random() - 0.5) * 720,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setConfetti(pieces);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-2 border-stage-red border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <p className="text-xl text-gray-400">节目不存在</p>
      </div>
    );
  }

  if (alreadyVoted || submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-red-50/30 flex items-center justify-center p-4 relative overflow-hidden">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              top: "50%",
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--dr": `${p.dr}deg`,
            } as React.CSSProperties}
          />
        ))}

        <div className="text-center relative z-10 animate-scale-in">
          <div className="mb-6 flex justify-center">
            <svg width="100" height="100" viewBox="0 0 100 100" className="animate-bounce">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#c41e3a" strokeWidth="3" opacity="0.3" />
              <circle cx="50" cy="50" r="45" fill="#c41e3a" opacity="0.08" />
              <path
                d="M30 52 L44 66 L70 38"
                fill="none"
                stroke="#c41e3a"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="50"
                strokeDashoffset="50"
                style={{ animation: "checkDraw 0.4s ease-out 0.2s forwards" }}
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {submitted ? "投票成功!" : "您已投过票"}
          </h1>
          <p className="text-gray-400 text-lg">
            {submitted ? "感谢您的参与" : "每人限投一票"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-red-50/20 flex flex-col items-center justify-center p-5">
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-block px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-medium tracking-wider mb-4">
          现场投票
        </div>
        <h1 className="text-4xl font-bold text-gray-800 tracking-wide">{show.name}</h1>
        <p className="text-gray-400 mt-2 text-base">请为你喜欢的节目投票</p>
      </div>

      <div className="w-full max-w-md space-y-3 animate-slide-up">
        {VOTE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`vote-option ${selected === option.id ? "selected" : ""}`}
          >
            <span className="emoji">{option.emoji}</span>
            <span>{option.label}</span>
            <span className="check-circle" />
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-red-500 text-sm animate-fade-in">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!selected || submitting}
        className={`mt-8 px-16 py-4 rounded-full text-lg font-bold transition-all duration-300 ${
          selected && !submitting
            ? "bg-gradient-to-r from-stage-red-dark to-stage-red text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 active:scale-[0.97]"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"
        }`}
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            提交中...
          </span>
        ) : (
          "提交投票"
        )}
      </button>

      <p className="mt-6 text-gray-300 text-xs">每人限投一票</p>
    </div>
  );
}
