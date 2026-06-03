import { NextRequest, NextResponse } from "next/server";
import { addVote, hasVoted, markVoted } from "@/lib/kv";
import { VOTE_OPTIONS, getShowById } from "@/lib/shows";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { showId, optionId, voterToken } = await request.json();

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

  const alreadyVoted = await hasVoted(showId, voterToken);
  if (alreadyVoted) {
    return NextResponse.json({ error: "您已投过票了" }, { status: 409 });
  }

  await addVote(showId, optionId);
  await markVoted(showId, voterToken);

  return NextResponse.json({ success: true });
}
