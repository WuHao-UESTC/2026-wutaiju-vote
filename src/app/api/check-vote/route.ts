import { NextRequest, NextResponse } from "next/server";
import { getCurrentShow, hasDeviceVoted, hasVoted } from "@/lib/kv";
import { buildVoterIdentityKeys } from "@/lib/voter-identity";

export const dynamic = "force-dynamic";
const FINAL_RESULTS_SHOW_ID = "__final__";

export async function GET(request: NextRequest) {
  const showId = request.nextUrl.searchParams.get("showId");
  const voterToken = request.nextUrl.searchParams.get("voterToken");
  const deviceFingerprint = request.nextUrl.searchParams.get("deviceFingerprint");

  if (!showId || !voterToken) {
    return NextResponse.json({ canVote: false, reason: "参数不完整" });
  }

  const currentShowId = await getCurrentShow();
  if (!currentShowId || currentShowId === FINAL_RESULTS_SHOW_ID) {
    return NextResponse.json({ canVote: false, reason: "投票尚未开始或已经结束" });
  }

  if (currentShowId !== showId) {
    return NextResponse.json({ canVote: false, reason: "当前节目未开放投票" });
  }

  const voted = await hasVoted(showId, voterToken);
  const voterIdentityKeys = buildVoterIdentityKeys(request, deviceFingerprint);
  let identityVoted = false;

  for (const identityKey of voterIdentityKeys) {
    if (await hasDeviceVoted(showId, identityKey)) {
      identityVoted = true;
      break;
    }
  }

  return NextResponse.json({
    canVote: !voted && !identityVoted,
    reason: voted || identityVoted ? "您已经投过票了" : "",
  });
}
