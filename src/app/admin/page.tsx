"use client";

import { useState } from "react";
import { SHOWS, VOTE_OPTIONS } from "@/lib/shows";
import Link from "next/link";

interface AdminData {
  currentShowId: string | null;
  shows: { id: string; name: string }[];
  options: { id: string; label: string; emoji: string }[];
  votes: Record<string, Record<string, number>>;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const fetchData = async (pwd: string) => {
    setLoginError(false);
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-password": pwd },
      });
      if (res.ok) {
        setAuthed(true);
        setData(await res.json());
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    }
  };

  const doAction = async (action: string, showId?: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ action, showId }),
      });
      if (res.ok) {
        await fetchData(password);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  // ====== Login Screen ======
  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-amber-50/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎭</div>
            <h1 className="text-2xl font-bold text-gray-800">管理后台</h1>
            <p className="text-gray-400 text-sm mt-1">舞台剧投票系统</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLoginError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && fetchData(password)}
              placeholder="请输入管理员密码"
              className={`w-full px-5 py-3.5 rounded-2xl border text-center text-base outline-none transition-all ${
                loginError
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 focus:border-stage-gold focus:ring-4 focus:ring-stage-gold/10"
              }`}
              autoFocus
            />
            {loginError && (
              <p className="text-red-400 text-sm text-center">密码错误</p>
            )}
            <button
              onClick={() => fetchData(password)}
              className="w-full py-3.5 bg-gradient-to-r from-stage-gold-dark to-stage-gold text-white rounded-2xl text-base font-bold hover:shadow-lg hover:shadow-stage-gold/20 active:scale-[0.98] transition-all"
            >
              进入后台
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { currentShowId, shows, options, votes } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎭</span>
            <h1 className="text-lg font-bold text-gray-800">管理后台</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/qrcodes"
              className="text-xs text-gray-400 hover:text-stage-gold transition-colors"
            >
              二维码
            </Link>
            {currentShowId ? (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                投票中
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                未开始
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Show Selector */}
        <div className="admin-card">
          <h2 className="text-base font-bold text-gray-800 mb-4">节目控制</h2>
          <div className="flex flex-wrap gap-3">
            {shows.map((show) => (
              <button
                key={show.id}
                onClick={() => doAction("setShow", show.id)}
                disabled={loading}
                className={`admin-btn ${
                  currentShowId === show.id ? "active" : "inactive"
                }`}
              >
                {show.name}
              </button>
            ))}
            <button
              onClick={() => doAction("stopVoting")}
              disabled={loading}
              className="admin-btn danger"
            >
              停止投票
            </button>
          </div>
        </div>

        {/* Results Cards */}
        {shows.map((show) => {
          const showVotes = votes[show.id] || {};
          const total = Object.values(showVotes).reduce(
            (a: number, b: number) => a + b,
            0
          );
          const maxVal = Math.max(...Object.values(showVotes), 1);

          return (
            <div key={show.id} className="admin-card">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-800">
                    {show.name}
                  </h3>
                  {currentShowId === show.id && (
                    <span className="px-2 py-0.5 rounded-full bg-stage-gold/15 text-stage-gold-dark text-[11px] font-semibold">
                      当前
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{total} 票</span>
                  <button
                    onClick={() => doAction("enableRevote", show.id)}
                    disabled={loading}
                    className="text-xs text-stage-gold hover:text-stage-gold-dark transition-colors font-medium"
                    title="清除投票记录，允许观众重新投票"
                  >
                    允许重投
                  </button>
                  <button
                    onClick={() => doAction("resetVotes", show.id)}
                    disabled={loading}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium"
                  >
                    清空票数
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {options.map((opt) => {
                  const val = showVotes[opt.id] || 0;
                  return (
                    <div key={opt.id} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-gray-500 flex items-center gap-2">
                        <span>{opt.emoji}</span>
                        {opt.label}
                      </span>
                      <div className="flex-1 h-7 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-600"
                          style={{
                            width: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`,
                            background:
                              "linear-gradient(90deg, #c8943e 0%, #e2b96f 100%)",
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm font-bold text-gray-700 tabular-nums">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Danger Zone */}
        <div className="rounded-2xl p-6 bg-red-50/50 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-red-800">危险操作</h3>
              <p className="text-sm text-red-400 mt-0.5">
                重置全部节目的投票数据，不可恢复
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm("确定要重置所有投票数据吗？")) {
                  doAction("resetAllVotes");
                }
              }}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 active:scale-[0.97] transition-all"
            >
              全部重置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
