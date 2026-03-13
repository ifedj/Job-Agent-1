import { auth } from "@/auth";
import { getTargetIndustries } from "@/lib/industry";
import type { IndustrySlug } from "@/lib/industry";
import { onlyDirectUrl } from "@/lib/direct-job-url";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchCompanyCareersJobs } from "@/lib/job-sources/company-careers";
import { fetchLinkedInJobs } from "@/lib/job-sources/linkedin";
import { fetchSerpJobs } from "@/lib/job-sources/serp";
import type { NormalisedJob } from "@/lib/job-sources/types";
import type { StructuredCv } from "@/types/profile";

const MAX_AGE_DAYS = 30;

/** Extra keywords per industry for Google/company search. */
const INDUSTRY_SEARCH_TERMS: Partial<Record<IndustrySlug, string>> = {
  healthcare: "health",
  fintech: "fintech",
  edtech: "education",
  ecommerce: "ecommerce",
  saas: "software",
};

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
  const { what, where } = body;

  const serpKey = (process.env.SERPAPI_API_KEY ?? "").trim();
  const linkedInEnabled = process.env.ENABLE_LINKEDIN_SCRAPER === "true";

  try {
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
    const structuredCv: StructuredCv = profile?.structuredCv
      ? (JSON.parse(profile.structuredCv) as StructuredCv)
      : { skills: [], experience: [], education: [] };
    const targetIndustries = getTargetIndustries(structuredCv, prefs);

    const dedupeKey = (j: NormalisedJob) => `${j.source}:${j.externalId}`;
    const seenKeys = new Set<string>();
    const merged: NormalisedJob[] = [];

    if (serpKey) {
      try {
        const serpJobs = await fetchSerpJobs({
          apiKey: serpKey,
          q: `${keyword} jobs${location ? ` ${location}` : ""}`,
          location: location || undefined,
          gl,
        });
        for (const j of serpJobs) {
          if (!seenKeys.has(dedupeKey(j))) {
            seenKeys.add(dedupeKey(j));
            merged.push(j);
          }
        }
        for (const ind of targetIndustries.slice(0, 2)) {
          const term = INDUSTRY_SEARCH_TERMS[ind];
          if (!term || keyword.toLowerCase().includes(term.toLowerCase())) continue;
          const extra = await fetchSerpJobs({
            apiKey: serpKey,
            q: `${keyword} ${term} jobs${location ? ` ${location}` : ""}`,
            location: location || undefined,
            gl,
          });
          for (const j of extra) {
            if (!seenKeys.has(dedupeKey(j))) {
              seenKeys.add(dedupeKey(j));
              merged.push(j);
            }
          }
        }
      } catch (_) {}
    }

    const dreamCompanies = prefs.dreamCompanies?.filter((c): c is string => typeof c === "string" && c.trim().length > 0);
    if (dreamCompanies?.length) {
      try {
        const companyJobs = await fetchCompanyCareersJobs({ companyNames: dreamCompanies });
        for (const j of companyJobs) {
          if (!seenKeys.has(dedupeKey(j))) {
            seenKeys.add(dedupeKey(j));
            merged.push(j);
          }
        }
      } catch (_) {}
    }

    if (linkedInEnabled) {
      try {
        const linkedInJobs = await fetchLinkedInJobs({ keyword, location: location || undefined });
        for (const j of linkedInJobs) {
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

    // #region agent log
    fetch("http://127.0.0.1:7754/ingest/f9ecae41-8d2e-4030-8549-ba19d6e46d59", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c47cc6" },
      body: JSON.stringify({
        sessionId: "c47cc6",
        location: "src/app/api/jobs/search/route.ts:before return",
        message: "Search complete",
        data: { fetched: normalised.length, created: created.length },
        timestamp: Date.now(),
        hypothesisId: "search-created-count",
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({
      ok: true,
      fetched: normalised.length,
      created: created.length,
    });
  } catch (e) {
    console.error("Job search error:", e);
    return NextResponse.json(
      { error: "Job search failed" },
      { status: 500 }
    );
  }
}
