import { NextRequest, NextResponse } from "next/server";
import {
  addVote,
  getCurrentShow,
  hasDeviceVoted,
  hasVoted,
  markDeviceVoted,
  markVoted,
} from "@/lib/kv";
import { VOTE_OPTIONS, getShowById } from "@/lib/shows";

export const dynamic = "force-dynamic";
const FINAL_RESULTS_SHOW_ID = "__final__";

export async function POST(request: NextRequest) {
  const { showId, optionId, voterToken, deviceFingerprint } = await request.json();

  if (!showId || !optionId || !voterToken) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const show = getShowById(showId);
  if (!show) {
    return NextResponse.json({ error: "节目不存在" }, { status: 404 });
  }

  const currentShowId = await getCurrentShow();
  if (!currentShowId || currentShowId === FINAL_RESULTS_SHOW_ID) {
    return NextResponse.json({ error: "投票尚未开始或已经结束" }, { status: 403 });
  }
  if (currentShowId !== showId) {
    return NextResponse.json({ error: "当前节目未开放投票" }, { status: 403 });
  }

  const option = VOTE_OPTIONS.find((o) => o.id === optionId);
  if (!option) {
    return NextResponse.json({ error: "投票选项不存在" }, { status: 400 });
  }

  const alreadyVoted = await hasVoted(showId, voterToken);
  if (alreadyVoted) {
    return NextResponse.json({ error: "您已经投过票了" }, { status: 409 });
  }

  if (deviceFingerprint) {
    const deviceVoted = await hasDeviceVoted(showId, deviceFingerprint);
    if (deviceVoted) {
      return NextResponse.json({ error: "该设备已经投过票" }, { status: 409 });
    }
  }

  await addVote(showId, optionId);
  await markVoted(showId, voterToken);
  if (deviceFingerprint) {
    await markDeviceVoted(showId, deviceFingerprint);
  }

  return NextResponse.json({ success: true });
}
