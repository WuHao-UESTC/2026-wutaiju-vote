import { NextRequest, NextResponse } from "next/server";
import { hasVoted } from "@/lib/kv";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const showId = request.nextUrl.searchParams.get("showId");
  const voterToken = request.nextUrl.searchParams.get("voterToken");

  if (!showId || !voterToken) {
    return NextResponse.json({ canVote: true });
  }

  const voted = await hasVoted(showId, voterToken);
  return NextResponse.json({ canVote: !voted });
}
