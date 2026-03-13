import { auth } from "@/auth";
import { formatLocationForDisplay } from "@/lib/format-location";
import { getTargetIndustries } from "@/lib/industry";
import { scoreJob } from "@/lib/matching";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import type { StructuredCv } from "@/types/profile";

const DEFAULT_MAX_AGE_DAYS = 30;
const DEFAULT_MATCH_MIN_SCORE = 75;
const DEFAULT_MATCH_MIN_SCORE_TOP = 90;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(request.url);
  const maxAgeDays = Number(searchParams.get("maxAgeDays")) || DEFAULT_MAX_AGE_DAYS;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });
  const structuredCv: StructuredCv = profile?.structuredCv
    ? (JSON.parse(profile.structuredCv) as StructuredCv)
    : { skills: [], experience: [], education: [] };

  const prefs = profile?.preferences
    ? (JSON.parse(profile.preferences) as {
        matchMinScore?: number;
        matchMinScoreTop?: number;
        industries?: string[];
      })
    : {};
  const matchMinScore = prefs.matchMinScore ?? DEFAULT_MATCH_MIN_SCORE;
  const matchMinScoreTop = prefs.matchMinScoreTop ?? DEFAULT_MATCH_MIN_SCORE_TOP;
  const targetIndustries = getTargetIndustries(structuredCv, prefs);

  // #region agent log
  fetch("http://127.0.0.1:7754/ingest/f9ecae41-8d2e-4030-8549-ba19d6e46d59", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c47cc6" },
    body: JSON.stringify({
      sessionId: "c47cc6",
      location: "src/app/api/jobs/matched/route.ts:config",
      message: "Matched API config",
      data: {
        matchMinScore,
        matchMinScoreTop,
        targetIndustriesLen: targetIndustries.length,
        targetIndustries: targetIndustries.slice(0, 3),
        hasStructuredCv: !!profile?.structuredCv,
        skillsLen: structuredCv.skills?.length ?? 0,
      },
      timestamp: Date.now(),
      hypothesisId: "H1-H4",
    }),
  }).catch(() => {});
  // #endregion

  const jobs = await prisma.job.findMany({
    where: {
      OR: [{ postedAt: { gte: cutoff } }, { postedAt: null }],
    },
    orderBy: { postedAt: "desc" },
    take: 200,
  });

  const matches = await prisma.jobMatch.findMany({
    where: { userId },
    include: { job: true },
  });
  const matchByJobId = new Map(matches.map((m) => [m.jobId, m]));

  type ResultItem = {
    job: {
      id: string;
      title: string;
      company: string;
      location: string | null;
      url: string;
      description: string | null;
      salaryRaw: string | null;
      postedAt: string | null;
      source: string;
    };
    match: {
      id: string;
      score: number | null;
      matchReasons: string[];
      status: string;
      userVerifiedOpen: boolean | null;
      approvedAt: string | null;
    } | null;
    isTopMatch: boolean;
  };

  const result: ResultItem[] = [];

  for (const job of jobs) {
    const { score, matchReasons } = scoreJob(
      {
        title: job.title,
        description: job.description,
        company: job.company,
      },
      structuredCv,
      { targetIndustries }
    );

    let match = matchByJobId.get(job.id);
    const matchReasonsStr = JSON.stringify(matchReasons);
    if (!match) {
      const existing = await prisma.jobMatch.findFirst({
        where: { userId, jobId: job.id },
        include: { job: true },
      });
      if (existing) {
        match = existing;
        const needsUpdate =
          existing.score !== score || (existing.matchReasons ?? "") !== matchReasonsStr;
        if (needsUpdate) {
          await prisma.jobMatch.update({
            where: { id: match.id },
            data: { score, matchReasons: matchReasonsStr },
          });
        }
        match = { ...match, score, matchReasons: matchReasonsStr };
      } else {
        match = await prisma.jobMatch.create({
          data: {
            userId,
            jobId: job.id,
            score,
            matchReasons: matchReasonsStr,
            status: "pending",
          },
          include: { job: true },
        });
      }
      matchByJobId.set(job.id, match);
    } else {
      const needsUpdate =
        match.score !== score || (match.matchReasons ?? "") !== matchReasonsStr;
      if (needsUpdate) {
        await prisma.jobMatch.update({
          where: { id: match.id },
          data: { score, matchReasons: matchReasonsStr },
        });
      }
      match = { ...match, score, matchReasons: matchReasonsStr };
    }

    const numScore = match.score ?? 0;
    result.push({
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: formatLocationForDisplay(job.location) ?? job.location,
        url: job.url,
        description: job.description,
        salaryRaw: job.salaryRaw,
        postedAt: job.postedAt?.toISOString() ?? null,
        source: job.source,
      },
      match: {
        id: match.id,
        score: match.score,
        matchReasons: match.matchReasons
          ? (JSON.parse(match.matchReasons) as string[])
          : [],
        status: match.status,
        userVerifiedOpen: match.userVerifiedOpen,
        approvedAt: match.approvedAt?.toISOString() ?? null,
      },
      isTopMatch: numScore >= matchMinScoreTop,
    });
  }

  const filtered = result.filter((r) => (r.match?.score ?? 0) >= matchMinScore);
  filtered.sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));

  const scores = result.map((r) => r.match?.score ?? 0).filter((s) => s > 0);
  const minScore = scores.length ? Math.min(...scores) : 0;
  const maxScore = scores.length ? Math.max(...scores) : 0;
  const countAbove75 = result.filter((r) => (r.match?.score ?? 0) >= 75).length;

  // #region agent log
  fetch("http://127.0.0.1:7754/ingest/f9ecae41-8d2e-4030-8549-ba19d6e46d59", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c47cc6" },
    body: JSON.stringify({
      sessionId: "c47cc6",
      location: "src/app/api/jobs/matched/route.ts:after filter",
      message: "Score and filter stats",
      data: {
        jobsFromDb: jobs.length,
        resultLen: result.length,
        filteredLen: filtered.length,
        minScore,
        maxScore,
        countAbove75,
        matchMinScore,
      },
      timestamp: Date.now(),
      hypothesisId: "H1-H4",
    }),
  }).catch(() => {});
  // #endregion

  return NextResponse.json({ jobs: filtered });
}
