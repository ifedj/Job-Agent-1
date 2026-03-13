import { isDirectCompanyJobUrl } from "@/lib/direct-job-url";

const RESOLVE_TIMEOUT_MS = 6000;
const RESOLVE_CONCURRENCY = 6;
const EXTRACT_TIMEOUT_MS = 8000;

/**
 * Follows redirects and returns the final URL (direct company page).
 * Use for third-party job links (e.g. Adzuna) so we store the real destination.
 */
export async function resolveRedirectToFinalUrl(redirectUrl: string): Promise<string> {
  if (!redirectUrl || !redirectUrl.startsWith("http")) return redirectUrl;
  try {
    const res = await fetch(redirectUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobSearchBot/1.0)" },
    });
    return res.url ?? redirectUrl;
  } catch {
    return redirectUrl;
  }
}

/** Run async tasks with a concurrency limit. */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker(): Promise<void> {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

/**
 * Resolve Adzuna (or other redirect) job URLs to final destination URLs in batch.
 * Leaves non-http or already-direct URLs unchanged.
 */
export async function resolveJobUrls<T extends { source: string; url: string }>(jobs: T[]): Promise<T[]> {
  const indicesToResolve = jobs
    .map((j, i) => (j.source === "adzuna" && j.url.startsWith("http") ? i : -1))
    .filter((i) => i >= 0);
  if (indicesToResolve.length === 0) return jobs;
  const results = await runWithConcurrency(
    indicesToResolve,
    RESOLVE_CONCURRENCY,
    async (idx) => resolveRedirectToFinalUrl(jobs[idx].url)
  );
  const urlByIndex = new Map(indicesToResolve.map((idx, i) => [idx, results[i]]));
  return jobs.map((job, i) =>
    urlByIndex.has(i) ? { ...job, url: urlByIndex.get(i)! } : job
  );
}

/**
 * Fetch aggregator page and try to find a direct company apply link (e.g. "Apply on company site").
 * Returns that URL if found and direct, else returns empty string.
 */
export async function extractDirectApplyFromPage(aggregatorUrl: string): Promise<string> {
  if (!aggregatorUrl.startsWith("http")) return "";
  try {
    const res = await fetch(aggregatorUrl, {
      signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36" },
    });
    const html = await res.text();
    const baseUrl = new URL(aggregatorUrl).origin;
    const hrefRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = hrefRegex.exec(html)) !== null) {
      const raw = m[1];
      if (!raw || raw.startsWith("#") || raw.startsWith("javascript:")) continue;
      const absolute = raw.startsWith("http") ? raw : new URL(raw, baseUrl).href;
      if (isDirectCompanyJobUrl(absolute)) return absolute;
    }
    return "";
  } catch {
    return "";
  }
}
