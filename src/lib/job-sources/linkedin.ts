import type { NormalisedJob } from "./types";

/**
 * LinkedIn job search scraper.
 *
 * DISCLAIMER: LinkedIn's Terms of Service prohibit automated scraping. They use
 * anti-bot measures and may restrict or ban accounts/IPs. Use at your own risk.
 * This module is provided for experimentation only; for production use consider
 * LinkedIn's official APIs or partners.
 *
 * When ENABLE_LINKEDIN_SCRAPER is not set or false, this returns [] without
 * making any requests.
 */
export interface LinkedInSearchParams {
  keyword: string;
  location?: string;
}

export async function fetchLinkedInJobs(_params: LinkedInSearchParams): Promise<NormalisedJob[]> {
  if (process.env.ENABLE_LINKEDIN_SCRAPER !== "true") return [];

  try {
    const q = encodeURIComponent(`${_params.keyword} jobs${_params.location ? ` ${_params.location}` : ""}`);
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${q}&location=&start=0`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const jobs = parseLinkedInJobCards(html);
    return jobs;
  } catch {
    return [];
  }
}

function parseLinkedInJobCards(html: string): NormalisedJob[] {
  const jobs: NormalisedJob[] = [];
  const baseUrl = "https://www.linkedin.com";
  const cardRegex = /<div[^>]*class="[^"]*base-card[^"]*"[^>]*>[\s\S]*?<a[^>]*href="(\/[^"]+)"[^>]*>[\s\S]*?<span[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/g;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = cardRegex.exec(html)) !== null) {
    const [, path, title, company, location] = m;
    const link = path?.startsWith("http") ? path : `${baseUrl}${path || ""}`;
    const t = stripHtml(title ?? "").trim();
    const c = stripHtml(company ?? "").trim();
    const loc = stripHtml(location ?? "").trim();
    if (!t || seen.has(link)) continue;
    seen.add(link);
    jobs.push({
      externalId: `linkedin_${Buffer.from(link).toString("base64url").slice(0, 64)}`,
      source: "linkedin",
      company: c || "Unknown",
      title: t,
      location: loc,
      url: link,
      description: "",
      salaryRaw: null,
      postedAt: null,
    });
  }
  return jobs;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
