import { pickDirectApplyUrl } from "@/lib/direct-job-url";
import type { NormalisedJob } from "./types";

const SERP_API = "https://serpapi.com/search";

interface SerpJobItem {
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  job_id?: string;
  apply_options?: Array< { link?: string } >;
  detected_extensions?: { posted_at?: string; salary?: string };
}

interface SerpResponse {
  jobs_results?: {
    jobs?: SerpJobItem[];
  };
  error?: string;
}

export interface SerpSearchParams {
  apiKey: string;
  q: string;
  location?: string;
  gl?: string;
}

/**
 * Fetch job listings from the web via SerpAPI Google Jobs.
 * Uses apply_options[].link for direct company/board URLs when available.
 */
export async function fetchSerpJobs(params: SerpSearchParams): Promise<NormalisedJob[]> {
  const { apiKey, q, location, gl = "us" } = params;
  const searchParams = new URLSearchParams({
    engine: "google_jobs",
    api_key: apiKey,
    q: q,
    gl,
  });
  if (location) searchParams.set("location", location);

  const res = await fetch(`${SERP_API}?${searchParams.toString()}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as SerpResponse;
  if (data.error || !data.jobs_results?.jobs) return [];

  const jobs: NormalisedJob[] = [];
  for (const j of data.jobs_results.jobs) {
    if (!j.title) continue;
    const allLinks = (j.apply_options ?? []).map((o) => o.link).filter(Boolean) as string[];
    const directUrl = pickDirectApplyUrl(allLinks);
    if (!directUrl) continue;
    jobs.push({
      externalId: j.job_id ?? `serp_${encodeURIComponent(j.title + (j.company_name ?? ""))}`,
      source: "serp",
      company: j.company_name ?? "Unknown",
      title: j.title,
      location: j.location ?? "",
      url: directUrl,
      description: j.description ?? "",
      salaryRaw: j.detected_extensions?.salary ?? null,
      postedAt: null,
    });
  }
  return jobs;
}
