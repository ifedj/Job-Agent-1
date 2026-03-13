/**
 * Ensures only URLs that go directly to the company's job posting are used.
 * No aggregator or third-party job board links (Adzuna, Indeed, LinkedIn, etc.).
 */

const AGGREGATOR_HOSTS = new Set([
  "adzuna.com",
  "www.adzuna.com",
  "adzuna.co.uk",
  "indeed.com",
  "www.indeed.com",
  "ziprecruiter.com",
  "www.ziprecruiter.com",
  "dice.com",
  "www.dice.com",
  "linkedin.com",
  "www.linkedin.com",
  "glassdoor.com",
  "www.glassdoor.com",
  "flexjobs.com",
  "simplyhired.com",
  "careerbuilder.com",
  "monster.com",
  "google.com",
  "www.google.com",
  "talent.com",
  "bebee.com",
  "serpapi.com",
]);

function getHost(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * True only if the URL is a direct company job posting (company site or known ATS).
 * Rejects known aggregators (Indeed, Adzuna, LinkedIn, ZipRecruiter, Dice, etc.).
 */
export function isDirectCompanyJobUrl(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  const host = getHost(url);
  if (!host) return false;
  if (AGGREGATOR_HOSTS.has(host)) return false;
  if (host.endsWith(".indeed.com") || host.endsWith(".linkedin.com")) return false;
  return true;
}

/**
 * From multiple apply links, pick the first that is a direct company URL, or null.
 */
export function pickDirectApplyUrl(links: (string | undefined)[]): string | null {
  for (const link of links) {
    if (link && isDirectCompanyJobUrl(link)) return link;
  }
  return null;
}

/**
 * If the job URL is not direct, return empty string so the job can be filtered out.
 */
export function onlyDirectUrl(url: string): string {
  return isDirectCompanyJobUrl(url) ? url : "";
}
