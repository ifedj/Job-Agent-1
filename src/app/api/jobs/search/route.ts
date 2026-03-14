import { auth } from "@/auth";
import { onlyDirectUrl } from "@/lib/direct-job-url";
import { jobMatchesTargetRole } from "@/lib/role-match";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchCompanyCareersJobs } from "@/lib/job-sources/company-careers";
import { fetchLinkedInJobs } from "@/lib/job-sources/linkedin";
import { fetchSerpJobs } from "@/lib/job-sources/serp";
import type { NormalisedJob } from "@/lib/job-sources/types";
import type { StructuredCv } from "@/types/profile";

const MAX_AGE_DAYS = 30;

/** Infer region for Google Jobs (gl param). US locations use "us"; UK use "uk". */
function inferGlFromLocation(location: string): string {
  const lower = location.toLowerCase().trim();
  const ukHints = ["london", "manchester", "birmingham", "leeds", "glasgow", "liverpool", "bristol", "sheffield", "edinburgh", "uk", "united kingdom", "england", "scotland", "wales"];
  for (const h of ukHints) if (lower.includes(h)) return "uk";
  return "us";
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { what, where, companySystems: clientCompanySystems } = body as {
    what?: string;
    where?: string;
    companySystems?: Record<string, "greenhouse" | "lever" | "serp">;
  };

  const serpKey = (process.env.SERPAPI_API_KEY ?? "").trim();
  const linkedInEnabled = process.env.ENABLE_LINKEDIN_SCRAPER === "true";

  try {
    // Job search uses two main sources (no Adzuna):
    // 1. SerpAPI (Google Jobs) – returns only direct company career page links (no aggregators).
    // 2. Company career pages – roles from Greenhouse, Lever, etc. via dream companies list.
    const profile = await prisma.profile.findUnique({
      where: { userId: (session.user as { id: string }).id },
    });
    const prefs = profile?.preferences
      ? (JSON.parse(profile.preferences) as { maxJobAgeDays?: number; targetRole?: string; locations?: string[]; location?: string; country?: string; industries?: string[]; dreamCompanies?: string[] })
      : {};
    const maxAgeDays = prefs.maxJobAgeDays ?? MAX_AGE_DAYS;
    const keyword =
      what ??
      prefs.targetRole ??
      (profile?.structuredCv ? (JSON.parse(profile.structuredCv) as { skills?: string[] }).skills?.slice(0, 2).join(" ") : undefined) ??
      "developer";
    const location = where ?? prefs.locations?.[0] ?? prefs.location ?? "";
    const gl = inferGlFromLocation(location);
    const dedupeKey = (j: NormalisedJob) => `${j.source}:${j.externalId}`;
    const seenKeys = new Set<string>();
    const merged: NormalisedJob[] = [];
    let companySystems: Record<string, "greenhouse" | "lever" | "serp"> = {};

    // Target companies from profile only (onboarding Step 3 / Settings).
    const dreamCompanies = prefs.dreamCompanies?.filter((c): c is string => typeof c === "string" && c.trim().length > 0) ?? [];

    // Company career pages: Greenhouse first, then Lever; else mark as "serp". Use client cache when provided.
    // Only include roles that match the user's target role / job title.
    if (dreamCompanies.length > 0) {
      try {
        const result = await fetchCompanyCareersJobs({
          companyNames: dreamCompanies,
          companySystems: clientCompanySystems ?? undefined,
        });
        companySystems = result.companySystems;
        for (const j of result.jobs) {
          if (!jobMatchesTargetRole(j, keyword)) continue;
          if (!seenKeys.has(dedupeKey(j))) {
            seenKeys.add(dedupeKey(j));
            merged.push(j);
          }
        }
      } catch (_) {}
    }

    // SerpAPI: one targeted query per dream company that has no Greenhouse/Lever board.
    // No broad "all jobs" query — results must come from target companies only.
    if (serpKey) {
      const serpCompanies = dreamCompanies.filter((c) => companySystems[c.trim()] === "serp");
      for (const company of serpCompanies.slice(0, 10)) {
        try {
          const q = `${keyword} jobs at ${company}${location ? ` ${location}` : ""}`;
          const extra = await fetchSerpJobs({
            apiKey: serpKey,
            q,
            location: location || undefined,
            gl,
          });
          for (const j of extra) {
            if (!jobMatchesTargetRole(j, keyword)) continue;
            if (!seenKeys.has(dedupeKey(j))) {
              seenKeys.add(dedupeKey(j));
              merged.push(j);
            }
          }
        } catch (_) {}
      }
    }

    if (linkedInEnabled) {
      try {
        const linkedInJobs = await fetchLinkedInJobs({ keyword, location: location || undefined });
        for (const j of linkedInJobs) {
          if (!jobMatchesTargetRole(j, keyword)) continue;
          if (!seenKeys.has(dedupeKey(j))) {
            seenKeys.add(dedupeKey(j));
            merged.push(j);
          }
        }
      } catch (_) {}
    }

    let normalised = merged
      .map((j) => ({ ...j, url: onlyDirectUrl(j.url) }))
      .filter((j) => j.url.length > 0);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxAgeDays);

    const created: string[] = [];
    for (const job of normalised) {
      if (job.postedAt && job.postedAt < cutoff) continue;
      const existing = await prisma.job.findFirst({
        where: {
          source: job.source,
          externalId: job.externalId,
        },
      });
      if (existing) continue;
      const createdJob = await prisma.job.create({
        data: {
          externalId: job.externalId,
          source: job.source,
          company: job.company,
          title: job.title,
          location: job.location,
          url: job.url,
          description: job.description,
          salaryRaw: job.salaryRaw,
          postedAt: job.postedAt,
        },
      });
      created.push(createdJob.id);
    }

    return NextResponse.json({
      ok: true,
      fetched: normalised.length,
      created: created.length,
      companySystems,
    });
  } catch (e) {
    console.error("Job search error:", e);
    return NextResponse.json(
      { error: "Job search failed" },
      { status: 500 }
    );
  }
}
