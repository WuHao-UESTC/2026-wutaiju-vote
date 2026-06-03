import { NextResponse } from "next/server";
import { getCurrentShow, getVotes } from "@/lib/kv";
import { SHOWS, VOTE_OPTIONS, getShowById } from "@/lib/shows";

export const dynamic = "force-dynamic";

const FINAL_RESULTS_SHOW_ID = "__final__";
const OPTION_SCORES: Record<string, number> = {
  amazing: 4,
  good: 3,
  ok: 2,
  poor: 1,
};

async function getFinalResults() {
  const shows = await Promise.all(
    SHOWS.map(async (show) => {
      const votes = await getVotes(show.id);
      const optionCounts = VOTE_OPTIONS.map((option) => ({
        ...option,
        count: votes[option.id] || 0,
        score: OPTION_SCORES[option.id] || 0,
      }));
      const totalVotes = optionCounts.reduce((sum, option) => sum + option.count, 0);
      const totalScore = optionCounts.reduce(
        (sum, option) => sum + option.count * option.score,
        0
      );
      const averageScore = totalVotes > 0 ? totalScore / totalVotes : 0;

      return {
        ...show,
        options: optionCounts,
        totalVotes,
        totalScore,
        averageScore,
      };
    })
  );
  const maxScore = Math.max(...shows.map((show) => show.totalScore), 1);
  return shows.map((show) => ({
    ...show,
    barWidth: (show.totalScore / maxScore) * 100,
  }));
}

export async function GET() {
  const currentShowId = await getCurrentShow();

  if (!currentShowId) {
    return NextResponse.json({ mode: "idle", show: null, options: null, total: 0 });
  }

  if (currentShowId === FINAL_RESULTS_SHOW_ID) {
    return NextResponse.json({
      mode: "final",
      show: null,
      options: null,
      total: 0,
      finalShows: await getFinalResults(),
    });
  }

  const show = getShowById(currentShowId);
  if (!show) {
    return NextResponse.json({ mode: "idle", show: null, options: null, total: 0 });
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

  return NextResponse.json({ mode: "voting", show, options, total });
}
