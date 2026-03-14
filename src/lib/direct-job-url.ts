/**
 * Ensures only URLs that go directly to the company's job posting are used.
 * No aggregator or third-party job board links (Adzuna, Indeed, LinkedIn, etc.).
 */

const AGGREGATOR_HOSTS = new Set([
  // Adzuna
  "adzuna.com", "www.adzuna.com", "adzuna.co.uk",
  // Indeed
  "indeed.com", "www.indeed.com",
  // LinkedIn
  "linkedin.com", "www.linkedin.com",
  // Glassdoor
  "glassdoor.com", "www.glassdoor.com",
  // ZipRecruiter
  "ziprecruiter.com", "www.ziprecruiter.com",
  // Dice
  "dice.com", "www.dice.com",
  // Monster / CareerBuilder / SimplyHired
  "monster.com", "careerbuilder.com", "simplyhired.com", "flexjobs.com",
  // Google
  "google.com", "www.google.com",
  // Talent.com / BeBee
  "talent.com", "bebee.com",
  // SerpAPI
  "serpapi.com",
  // BioSpace (life sciences aggregator)
  "biospace.com", "www.biospace.com", "jobs.biospace.com",
  // Teal / TealHQ (career management / aggregator)
  "teal.dev", "app.teal.dev", "tealhq.com", "www.tealhq.com", "app.tealhq.com",
  // Handshake
  "joinhandshake.com", "app.joinhandshake.com",
  // Wellfound / AngelList
  "wellfound.com", "angel.co",
  // Ladders / The Muse / Snagajob
  "theladders.com", "themuse.com", "snagajob.com",
  // Lensa / Jooble / Neuvoo
  "lensa.com", "jooble.org", "neuvoo.com",
  // Getwork / Jobot (staffing aggregators)
  "getwork.com", "jobot.com",
  // Recruitics / SmartRecruiters job aggregator pages
  "jobs.smartrecruiters.com",
  // Remote.co / We Work Remotely / Remote OK
  "remote.co", "weworkremotely.com", "remoteok.com", "remoteok.io",
  // Ladders
  "ladders.com",
  // Otta
  "otta.com",
  // Built In
  "builtin.com", "builtinboston.com", "builtinnyc.com", "builtinchicago.com",
  "builtinsf.com", "builtinaustin.com", "builtinla.com", "builtinseattle.com",
  // Seek (Australia/NZ)
  "seek.com.au", "seek.co.nz",
  // Reed / Totaljobs (UK)
  "reed.co.uk", "totaljobs.com",
]);

function getHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True only if the URL is a direct company job posting (company site or known ATS).
 * Rejects known aggregators (Indeed, Adzuna, LinkedIn, ZipRecruiter, BioSpace, Teal, etc.).
 */
export function isDirectCompanyJobUrl(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  const host = getHost(url);
  if (!host) return false;
  // Exact match (including www. variants stored in the set)
  if (AGGREGATOR_HOSTS.has(host)) return false;
  // Strip www. and check again
  const bare = host.replace(/^www\./, "");
  if (AGGREGATOR_HOSTS.has(bare)) return false;
  // Subdomain of a known aggregator (e.g. jobs.indeed.com, boston.linkedin.com)
  if (AGGREGATOR_HOSTS.has(bare) || [...AGGREGATOR_HOSTS].some((h) => bare.endsWith(`.${h}`))) return false;
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
