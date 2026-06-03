import { NextResponse } from "next/server";
import { getVotes, getCurrentShow } from "@/lib/kv";
import { VOTE_OPTIONS, getShowById } from "@/lib/shows";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentShowId = await getCurrentShow();

  if (!currentShowId) {
    return NextResponse.json({ show: null, options: null, total: 0 });
  }

  const show = getShowById(currentShowId);
  if (!show) {
    return NextResponse.json({ show: null, options: null, total: 0 });
  }

  const votes = await getVotes(currentShowId);
  const total = Object.values(votes).reduce((sum, c) => sum + c, 0);
  const maxCount = Math.max(...Object.values(votes), 1);

  const options = VOTE_OPTIONS.map((opt) => ({
    ...opt,
    count: votes[opt.id] || 0,
    percentage: total > 0 ? ((votes[opt.id] || 0) / total) * 100 : 0,
    barWidth: ((votes[opt.id] || 0) / maxCount) * 100,
  }));

  return NextResponse.json({ show, options, total });
}
