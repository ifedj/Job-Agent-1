import type { NormalisedJob } from "./types";

const GREENHOUSE_BOARDS = "https://boards-api.greenhouse.io/v1/boards";
const LEVER_POSTINGS = "https://api.lever.co/v0/postings";

interface GreenhouseJob {
  id: string;
  title: string;
  location: { name: string };
  absolute_url: string;
  updated_at: string;
  departments?: Array< { name: string } >;
}

interface LeverPosting {
  id: string;
  text: string;
  categories: { location?: string };
  hostedUrl: string;
  createdAt: number;
}

/**
 * Slugify company name for use in board URLs (lowercase, no spaces).
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);
}

/**
 * Fetch jobs from a Greenhouse board by board token (often company slug).
 */
async function fetchGreenhouseBoard(boardToken: string): Promise<NormalisedJob[]> {
  const url = `${GREENHOUSE_BOARDS}/${boardToken}/jobs`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  const jobs = data.jobs ?? [];
  return jobs.map((j) => ({
    externalId: `gh_${boardToken}_${j.id}`,
    source: "company_careers",
    company: boardToken,
    title: j.title ?? "",
    location: j.location?.name ?? "",
    url: j.absolute_url ?? "",
    description: "",
    salaryRaw: null,
    postedAt: j.updated_at ? new Date(j.updated_at) : null,
  }));
}

/**
 * Fetch jobs from Lever postings by company slug.
 */
async function fetchLeverPostings(companySlug: string): Promise<NormalisedJob[]> {
  const url = `${LEVER_POSTINGS}/${companySlug}?mode=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const data = (await res.json()) as LeverPosting[];
  if (!Array.isArray(data)) return [];
  return data.map((j) => ({
    externalId: `lever_${companySlug}_${j.id}`,
    source: "company_careers",
    company: companySlug,
    title: j.text ?? "",
    location: j.categories?.location ?? "",
    url: j.hostedUrl ?? "",
    description: "",
    salaryRaw: null,
    postedAt: j.createdAt ? new Date(j.createdAt) : null,
  }));
}

export interface CompanyCareersParams {
  companyNames: string[];
}

/**
 * Fetch jobs from company career pages (Greenhouse and Lever).
 * Tries each company name as a board/slug. Many companies use one of these ATS.
 */
export async function fetchCompanyCareersJobs(params: CompanyCareersParams): Promise<NormalisedJob[]> {
  const { companyNames } = params;
  if (!companyNames?.length) return [];

  const all: NormalisedJob[] = [];
  const seen = new Set<string>();

  for (const name of companyNames.slice(0, 20)) {
    const slug = toSlug(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const [gh, lever] = await Promise.all([
      fetchGreenhouseBoard(slug),
      fetchLeverPostings(slug),
    ]);

    for (const j of gh) {
      j.company = name;
      all.push(j);
    }
    for (const j of lever) {
      j.company = name;
      all.push(j);
    }
  }

  return all;
}
