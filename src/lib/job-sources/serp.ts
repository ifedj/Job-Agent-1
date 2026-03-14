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
  /** SerpAPI returns jobs_results as an array of job objects (not { jobs: [] }). */
  jobs_results?: SerpJobItem[] | { jobs?: SerpJobItem[] };
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
  if (data.error) return [];
  const rawJobs: SerpJobItem[] = Array.isArray(data.jobs_results)
    ? data.jobs_results
    : (data.jobs_results?.jobs ?? []);
  if (rawJobs.length === 0) return [];

  const jobs: NormalisedJob[] = [];
  for (const j of rawJobs) {
    if (!j.title) continue;
    const allLinks = (j.apply_options ?? []).map((o) => o.link).filter(Boolean) as string[];
    const directUrl = pickDirectApplyUrl(allLinks);
    // #region agent log
    fetch('http://127.0.0.1:7754/ingest/f9ecae41-8d2e-4030-8549-ba19d6e46d59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c47cc6'},body:JSON.stringify({sessionId:'c47cc6',location:'serp.ts:pickDirectApplyUrl',message:'apply links for job',data:{title:j.title,company:j.company_name,allLinks,pickedUrl:directUrl},timestamp:Date.now(),hypothesisId:'A-B-C'})}).catch(()=>{});
    // #endregion
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
