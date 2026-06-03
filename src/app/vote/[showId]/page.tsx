"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { VOTE_OPTIONS, getShowById } from "@/lib/shows";

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

  useEffect(() => {
    const voted = document.cookie.includes(`voted_${showId}=1`);
    if (voted) setAlreadyVoted(true);

    let token = localStorage.getItem(`voter_token_${showId}`);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(`voter_token_${showId}`, token);
    }
    setVoterToken(token);
  }, [showId]);

  const handleSubmit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId, optionId: selected, voterToken }),
      });
      if (res.ok) {
        document.cookie = `voted_${showId}=1; max-age=86400; path=/`;
        setSubmitted(true);
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

  if (!show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-xl text-gray-500">节目不存在</p>
      </div>
    );
  }

  if (alreadyVoted || submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">投票成功!</h1>
          <p className="text-gray-500 text-lg">感谢您的参与</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-amber-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{show.name}</h1>
      <p className="text-gray-400 mb-10 text-lg">请为你喜欢的节目投票</p>

      <div className="w-full max-w-md space-y-4">
        {VOTE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`w-full p-5 rounded-2xl text-left text-xl font-medium transition-all active:scale-[0.97] ${
              selected === option.id
                ? "bg-stage-gold text-white shadow-lg ring-2 ring-stage-gold-light ring-offset-2"
                : "bg-white text-gray-700 shadow hover:shadow-md active:bg-gray-50"
            }`}
          >
            <span className="text-2xl mr-4">{option.emoji}</span>
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-red-500 text-sm">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selected || submitting}
        className={`mt-10 px-14 py-4 rounded-full text-xl font-bold transition-all ${
          selected && !submitting
            ? "bg-stage-gold text-white shadow-lg hover:shadow-xl active:scale-[0.97]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {submitting ? "提交中..." : "提交投票"}
      </button>
    </div>
  );
}
