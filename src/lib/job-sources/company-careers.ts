import type { NormalisedJob } from "./types";

const GREENHOUSE_BOARDS = "https://boards-api.greenhouse.io/v1/boards";
const LEVER_POSTINGS = "https://api.lever.co/v0/postings";

export type CompanySystem = "greenhouse" | "lever" | "serp";

interface GreenhouseJob {
  id: string;
  title: string;
  location: { name: string };
  absolute_url: string;
  updated_at: string;
  departments?: Array<{ name: string }>;
}

interface LeverPosting {
  id: string;
  text: string;
  categories: { location?: string };
  hostedUrl: string;
  createdAt: number;
}

/**
 * Slugify company name for board/API URLs (lowercase, no spaces, alphanumeric).
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);
}

async function fetchGreenhouseBoard(
  boardToken: string,
  displayName: string
): Promise<NormalisedJob[]> {
  const url = `${GREENHOUSE_BOARDS}/${boardToken}/jobs`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];
  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  const jobs = data.jobs ?? [];
  return jobs.map((j) => ({
    externalId: `gh_${boardToken}_${j.id}`,
    source: "company_careers",
    company: displayName,
    title: j.title ?? "",
    location: j.location?.name ?? "",
    url: j.absolute_url ?? "",
    description: "",
    salaryRaw: null,
    postedAt: j.updated_at ? new Date(j.updated_at) : null,
  }));
}

async function fetchLeverPostings(
  companySlug: string,
  displayName: string
): Promise<NormalisedJob[]> {
  const url = `${LEVER_POSTINGS}/${companySlug}?mode=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) return [];
  const data = (await res.json()) as LeverPosting[];
  if (!Array.isArray(data)) return [];
  return data.map((j) => ({
    externalId: `lever_${companySlug}_${j.id}`,
    source: "company_careers",
    company: displayName,
    title: j.text ?? "",
    location: j.categories?.location ?? "",
    url: j.hostedUrl ?? "",
    description: "",
    salaryRaw: null,
    postedAt: j.createdAt ? new Date(j.createdAt) : null,
  }));
}

/** Probe Greenhouse: returns true if board exists (200 with jobs array). */
export async function probeGreenhouse(slug: string): Promise<boolean> {
  const url = `${GREENHOUSE_BOARDS}/${slug}/jobs`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Probe Lever: returns true if postings exist (200 with array). */
export async function probeLever(slug: string): Promise<boolean> {
  const url = `${LEVER_POSTINGS}/${slug}?mode=json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length >= 0;
  } catch {
    return false;
  }
}

export interface FetchCompanyCareersParams {
  companyNames: string[];
  /** Optional cache: company display name -> system. If provided, skips probing. */
  companySystems?: Record<string, CompanySystem>;
}

export interface FetchCompanyCareersResult {
  jobs: NormalisedJob[];
  companySystems: Record<string, CompanySystem>;
}

/**
 * For each company: try Greenhouse first; if 404, try Lever; else mark as "serp".
 * Fetches jobs only from Greenhouse/Lever. Companies marked "serp" should be queried via SerpAPI by the caller.
 */
export async function fetchCompanyCareersJobs(
  params: FetchCompanyCareersParams
): Promise<FetchCompanyCareersResult> {
  const { companyNames, companySystems: cache } = params;
  const companySystems: Record<string, CompanySystem> = cache ? { ...cache } : {};
  const all: NormalisedJob[] = [];
  const seenSlugs = new Set<string>();

  for (const displayName of companyNames) {
    const name = displayName.trim();
    if (!name) continue;
    const slug = toSlug(name);
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    let system: CompanySystem;
    if (cache && cache[name] !== undefined) {
      system = cache[name];
    } else {
      const ghOk = await probeGreenhouse(slug);
      if (ghOk) {
        system = "greenhouse";
      } else {
        const leverOk = await probeLever(slug);
        system = leverOk ? "lever" : "serp";
      }
      companySystems[name] = system;
    }

    if (system === "greenhouse") {
      const jobs = await fetchGreenhouseBoard(slug, name);
      all.push(...jobs);
    } else if (system === "lever") {
      const jobs = await fetchLeverPostings(slug, name);
      all.push(...jobs);
    }
    // "serp" → caller will add SerpAPI queries
  }

  return { jobs: all, companySystems };
}
