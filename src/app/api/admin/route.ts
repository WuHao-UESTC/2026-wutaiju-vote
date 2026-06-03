import { NextRequest, NextResponse } from "next/server";
import {
  enableRevote,
  getCurrentShow,
  getVotes,
  resetVotes,
  setCurrentShow,
  setVoteCount,
} from "@/lib/kv";
import { SHOWS, VOTE_OPTIONS, getShowById } from "@/lib/shows";

export const dynamic = "force-dynamic";
const FINAL_RESULTS_SHOW_ID = "__final__";

function checkAuth(request: NextRequest): boolean {
  const password = request.headers.get("x-admin-password") || "";
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  return password === expected;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const currentShowId = await getCurrentShow();
  const allVotes: Record<string, Record<string, number>> = {};

  for (const show of SHOWS) {
    allVotes[show.id] = await getVotes(show.id);
  }

  return NextResponse.json({
    currentShowId,
    shows: SHOWS,
    options: VOTE_OPTIONS,
    votes: allVotes,
  });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const { action, showId, optionId, count } = await request.json();

  switch (action) {
    case "setShow":
    case "startVoting": {
      const show = getShowById(showId);
      if (!show) {
        return NextResponse.json({ error: "节目不存在" }, { status: 400 });
      }
      await setCurrentShow(showId);
      return NextResponse.json({ success: true, currentShowId: showId });
    }

    case "showFinal": {
      await setCurrentShow(FINAL_RESULTS_SHOW_ID);
      return NextResponse.json({ success: true, currentShowId: FINAL_RESULTS_SHOW_ID });
    }

    case "stopVoting":
    case "endVoting": {
      if (showId) {
        const currentShowId = await getCurrentShow();
        if (currentShowId !== showId) {
          return NextResponse.json({ success: true, currentShowId });
        }
      }
      await setCurrentShow(null);
      return NextResponse.json({ success: true, currentShowId: null });
    }

    case "resetVotes": {
      if (!showId) {
        return NextResponse.json({ error: "请指定节目" }, { status: 400 });
      }
      await resetVotes(showId);
      return NextResponse.json({ success: true });
    }

    case "resetAllVotes": {
      for (const show of SHOWS) {
        await resetVotes(show.id);
      }
      return NextResponse.json({ success: true });
    }

    case "enableRevote": {
      if (!showId) {
        return NextResponse.json({ error: "请指定节目" }, { status: 400 });
      }
      await enableRevote(showId);
      return NextResponse.json({ success: true });
    }

    case "setVoteCount": {
      const show = getShowById(showId);
      const option = VOTE_OPTIONS.find((opt) => opt.id === optionId);
      const nextCount = Number(count);
      if (!show || !option || !Number.isFinite(nextCount) || nextCount < 0) {
        return NextResponse.json({ error: "参数错误" }, { status: 400 });
      }
      await setVoteCount(showId, optionId, nextCount);
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "未知操作" }, { status: 400 });
  }
}
