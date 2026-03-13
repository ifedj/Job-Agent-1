const ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs";

export interface AdzunaJobRaw {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  created: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
}

export interface AdzunaSearchParams {
  appId: string;
  appKey: string;
  country: string;
  what?: string;
  where?: string;
  resultsPerPage?: number;
  page?: number;
}

export interface NormalisedJob {
  externalId: string;
  source: string;
  company: string;
  title: string;
  location: string;
  url: string;
  description: string;
  salaryRaw: string | null;
  postedAt: Date | null;
}

const MAX_AGE_DAYS = 30;

export async function fetchAdzunaJobs(
  params: AdzunaSearchParams
): Promise<NormalisedJob[]> {
  const { appId, appKey, country, what = "", where = "", resultsPerPage = 20, page = 1 } = params;
  const url = new URL(`${ADZUNA_BASE}/${country}/search/${page}`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", String(resultsPerPage));
  if (what) url.searchParams.set("what", what);
  if (where) url.searchParams.set("where", where);
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Adzuna API error: ${res.status}`);
  }
  const data = (await res.json()) as { results?: AdzunaJobRaw[] };
  const results = data.results ?? [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);

  return results
    .map((job) => {
      const postedAt = job.created ? new Date(job.created) : null;
      if (postedAt && postedAt < cutoff) return null;
      const salaryRaw =
        job.salary_min != null || job.salary_max != null
          ? [job.salary_min, job.salary_max].filter(Boolean).join(" - ")
          : null;
      return {
        externalId: job.id,
        source: "adzuna",
        company: job.company?.display_name ?? "Unknown",
        title: job.title ?? "",
        location: job.location?.display_name ?? "",
        url: job.redirect_url ?? "",
        description: job.description ?? "",
        salaryRaw,
        postedAt,
      };
    })
    .filter((j): j is NormalisedJob => j != null);
}
