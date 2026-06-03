import { NextRequest, NextResponse } from "next/server";
import { addVote, hasVoted, markVoted, hasDeviceVoted, markDeviceVoted } from "@/lib/kv";
import { VOTE_OPTIONS, getShowById } from "@/lib/shows";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { showId, optionId, voterToken, deviceFingerprint } = await request.json();

  if (!showId || !optionId || !voterToken) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const show = getShowById(showId);
  if (!show) {
    return NextResponse.json({ error: "节目不存在" }, { status: 404 });
  }

  const option = VOTE_OPTIONS.find((o) => o.id === optionId);
  if (!option) {
    return NextResponse.json({ error: "投票选项不存在" }, { status: 400 });
  }

  // 检查浏览器令牌是否已投票
  const alreadyVoted = await hasVoted(showId, voterToken);
  if (alreadyVoted) {
    return NextResponse.json({ error: "您已投过票了" }, { status: 409 });
  }

  // 检查同设备是否已通过其他浏览器投过票（防止微信+QQ双投）
  if (deviceFingerprint) {
    const deviceVoted = await hasDeviceVoted(showId, deviceFingerprint);
    if (deviceVoted) {
      return NextResponse.json({ error: "该设备已投过票" }, { status: 409 });
    }
  }

  await addVote(showId, optionId);
  await markVoted(showId, voterToken);
  if (deviceFingerprint) {
    await markDeviceVoted(showId, deviceFingerprint);
  }

  return NextResponse.json({ success: true });
}
