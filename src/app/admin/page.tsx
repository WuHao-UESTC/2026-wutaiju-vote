"use client";

import { useState } from "react";
import { SHOWS, VOTE_OPTIONS } from "@/lib/shows";

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

  const fetchData = async (pwd: string) => {
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-password": pwd },
      });
      if (res.ok) {
        setAuthed(true);
        setData(await res.json());
      } else {
        alert("密码错误");
      }
    } catch {
      alert("网络错误");
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
      alert("操作失败");
    }
    setLoading(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6">管理后台</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData(password)}
            placeholder="请输入管理员密码"
            className="w-full px-4 py-3 border rounded-xl mb-4 text-center text-lg outline-none focus:ring-2 focus:ring-stage-gold"
            autoFocus
          />
          <button
            onClick={() => fetchData(password)}
            className="w-full py-3 bg-stage-gold text-white rounded-xl text-lg font-bold hover:bg-amber-600 transition-colors"
          >
            进入
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { currentShowId, shows, options, votes } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">管理后台</h1>

        {/* Show Control */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">切换节目</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            {shows.map((show) => (
              <button
                key={show.id}
                onClick={() => doAction("setShow", show.id)}
                disabled={loading}
                className={`px-5 py-3 rounded-xl font-bold text-lg transition-all ${
                  currentShowId === show.id
                    ? "bg-stage-gold text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {show.name}
              </button>
            ))}
            <button
              onClick={() => doAction("stopVoting")}
              disabled={loading}
              className="px-5 py-3 rounded-xl font-bold text-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
            >
              停止投票
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            当前:{" "}
            {currentShowId
              ? shows.find((s) => s.id === currentShowId)?.name
              : "未开始"}
          </p>
        </div>

        {/* Results per Show */}
        {shows.map((show) => {
          const showVotes = votes[show.id] || {};
          const total = Object.values(showVotes).reduce((a, b) => a + b, 0);
          return (
            <div
              key={show.id}
              className="bg-white rounded-2xl shadow p-6 mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{show.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">
                    共 {total} 票
                  </span>
                  <button
                    onClick={() => doAction("resetVotes", show.id)}
                    disabled={loading}
                    className="text-sm text-red-500 hover:text-red-700 transition-colors"
                  >
                    重置
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <span className="w-28 text-gray-600 text-sm">
                      {opt.emoji} {opt.label}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stage-gold rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            total > 0
                              ? ((showVotes[opt.id] || 0) / total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-10 text-right font-bold text-sm">
                      {showVotes[opt.id] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
          <h3 className="text-lg font-bold text-red-800 mb-2">危险操作</h3>
          <button
            onClick={() => {
              if (
                confirm("确定要重置所有节目的投票数据吗？此操作不可恢复！")
              ) {
                doAction("resetAllVotes");
              }
            }}
            disabled={loading}
            className="px-5 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
          >
            重置全部数据
          </button>
        </div>
      </div>
    </div>
  );
}
