import { NextResponse } from "next/server";
import { getVotes } from "@/lib/kv";
import { SHOWS, VOTE_OPTIONS } from "@/lib/shows";

export const dynamic = "force-dynamic";

const OPTION_SCORES: Record<string, number> = {
  amazing: 4,
  good: 3,
  ok: 2,
  poor: 1,
};

export async function GET() {
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

  return NextResponse.json({
    shows: shows.map((show) => ({
      ...show,
      barWidth: (show.totalScore / maxScore) * 100,
    })),
    maxScore,
  });
}
