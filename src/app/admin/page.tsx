"use client";

import Link from "next/link";
import { useState } from "react";

const FINAL_RESULTS_SHOW_ID = "__final__";

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
  const [draftVotes, setDraftVotes] = useState<Record<string, Record<string, number>>>({});

  const fetchData = async (pwd: string) => {
    setLoginError(false);
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-password": pwd },
      });
      if (res.ok) {
        const json: AdminData = await res.json();
        setAuthed(true);
        setData(json);
        setDraftVotes(json.votes);
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    }
  };

  const doAction = async (
    action: string,
    payload: { showId?: string; optionId?: string; count?: number } = {}
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        const json = await res.json();
        if ("currentShowId" in json) {
          setData((current) =>
            current ? { ...current, currentShowId: json.currentShowId } : current
          );
          setLoading(false);
          void fetchData(password);
          return;
        }
        await fetchData(password);
      }
    } catch {
      // keep UI state; next manual refresh will recover
    } finally {
      setLoading(false);
    }
  };

  const updateDraftVote = (showId: string, optionId: string, value: string) => {
    const nextValue = Math.max(0, Math.floor(Number(value) || 0));
    setDraftVotes((current) => ({
      ...current,
      [showId]: {
        ...(current[showId] || {}),
        [optionId]: nextValue,
      },
    }));
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-amber-50/20 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">票</div>
            <h1 className="text-2xl font-bold text-gray-800">
              2026历史舞台剧后台控制系统
            </h1>
            <p className="text-gray-400 text-sm mt-1">现场投票与大屏控制</p>
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
            {loginError && <p className="text-red-400 text-sm text-center">密码错误</p>}
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
  const isFinalMode = currentShowId === FINAL_RESULTS_SHOW_ID;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">票</span>
            <h1 className="text-lg font-bold text-gray-800">后台控制系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-gray-400 hover:text-stage-gold transition-colors">
              大屏
            </Link>
            <Link href="/admin/qrcodes" className="text-xs text-gray-400 hover:text-stage-gold transition-colors">
              二维码
            </Link>
            {isFinalMode ? (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                最终统计展示中
              </span>
            ) : currentShowId ? (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                投票中
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                未展示
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="admin-card">
          <h2 className="text-base font-bold text-gray-800 mb-4">节目控制</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {shows.map((show) => (
              <div key={show.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-gray-800">{show.name}</div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {currentShowId === show.id ? "投票中" : "未开放"}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => doAction("startVoting", { showId: show.id })}
                    disabled={loading || currentShowId === show.id}
                    className={`admin-btn px-4 py-2 text-xs ${currentShowId === show.id ? "active" : "inactive"}`}
                  >
                    开始
                  </button>
                  <button
                    onClick={() => doAction("endVoting", { showId: show.id })}
                    disabled={loading || currentShowId !== show.id}
                    className="admin-btn danger px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    结束
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
            <button
              onClick={() => doAction("showFinal")}
              disabled={loading}
              className={`admin-btn ${isFinalMode ? "active" : "inactive"}`}
            >
              展示最终统计
            </button>
            <button
              onClick={() => doAction("endVoting")}
              disabled={loading}
              className="admin-btn danger"
            >
              清空大屏状态
            </button>
          </div>
        </div>

        {shows.map((show) => {
          const showVotes = votes[show.id] || {};
          const showDraftVotes = draftVotes[show.id] || {};
          const total = Object.values(showVotes).reduce((a: number, b: number) => a + b, 0);
          const maxVal = Math.max(...Object.values(showVotes), 1);

          return (
            <div key={show.id} className="admin-card">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-800">{show.name}</h3>
                  {currentShowId === show.id && (
                    <span className="px-2 py-0.5 rounded-full bg-stage-gold/15 text-stage-gold-dark text-[11px] font-semibold">
                      当前投票
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{total} 票</span>
                  <button
                    onClick={() => doAction("enableRevote", { showId: show.id })}
                    disabled={loading}
                    className="text-xs text-stage-gold hover:text-stage-gold-dark transition-colors font-medium"
                  >
                    允许重投
                  </button>
                  <button
                    onClick={() => doAction("resetVotes", { showId: show.id })}
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
                  const draftVal = showDraftVotes[opt.id] ?? val;
                  return (
                    <div key={opt.id} className="grid grid-cols-[120px_1fr_92px_56px] items-center gap-3">
                      <span className="text-sm text-gray-500 font-medium">{opt.label}</span>
                      <div className="h-7 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-600"
                          style={{
                            width: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%`,
                            background: "linear-gradient(90deg, #c8943e 0%, #e2b96f 100%)",
                          }}
                        />
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={draftVal}
                        onChange={(e) => updateDraftVote(show.id, opt.id, e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-right text-sm font-bold text-gray-700 outline-none focus:border-stage-gold focus:ring-4 focus:ring-stage-gold/10"
                      />
                      <button
                        onClick={() =>
                          doAction("setVoteCount", {
                            showId: show.id,
                            optionId: opt.id,
                            count: draftVal,
                          })
                        }
                        disabled={loading}
                        className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white active:scale-[0.97] disabled:opacity-40"
                      >
                        保存
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="rounded-2xl p-6 bg-red-50/50 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-red-800">危险操作</h3>
              <p className="text-sm text-red-400 mt-0.5">重置全部节目票数，不可恢复。</p>
            </div>
            <button
              onClick={() => {
                if (confirm("确定要重置全部投票数据吗？")) {
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
