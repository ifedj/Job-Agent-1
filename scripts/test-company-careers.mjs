#!/usr/bin/env node
/**
 * Test that Greenhouse and Lever APIs return jobs.
 * Uses the same endpoints as src/lib/job-sources/company-careers.ts
 * Run: node scripts/test-company-careers.mjs
 */
const GREENHOUSE_BOARDS = "https://boards-api.greenhouse.io/v1/boards";
const LEVER_POSTINGS = "https://api.lever.co/v0/postings";

async function fetchGreenhouse(boardToken) {
  const url = `${GREENHOUSE_BOARDS}/${boardToken}/jobs`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return { ok: false, status: res.status, jobs: [] };
    const data = await res.json();
    const jobs = data.jobs ?? [];
    return { ok: true, jobs };
  } catch (e) {
    return { ok: false, error: e.message, jobs: [] };
  }
}

async function fetchLever(companySlug) {
  const url = `${LEVER_POSTINGS}/${companySlug}?mode=json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return { ok: false, status: res.status, jobs: [] };
    const data = await res.json();
    const jobs = Array.isArray(data) ? data : [];
    return { ok: true, jobs };
  } catch (e) {
    return { ok: false, error: e.message, jobs: [] };
  }
}

// Well-known companies that use Greenhouse or Lever (board/slug names)
const GREENHOUSE_SLUGS = ["stripe", "figma", "notion", "plaid", "retool", "airtable", "discord"];
// leverdemo is Lever's public demo; others are common Lever job board slugs
const LEVER_SLUGS = ["leverdemo", "dropbox", "lattice", "gusto", "box"];

console.log("Testing Greenhouse boards...");
let ghTotal = 0;
for (const slug of GREENHOUSE_SLUGS) {
  const r = await fetchGreenhouse(slug);
  const n = r.jobs?.length ?? 0;
  ghTotal += n;
  const sample = n > 0 ? r.jobs[0].title : (r.error ? `(${r.error})` : r.status ? `HTTP ${r.status}` : "-");
  console.log(`  ${slug}: ${n} jobs ${n ? `(e.g. "${sample}")` : ""}`);
}

console.log("\nTesting Lever postings...");
let leverTotal = 0;
for (const slug of LEVER_SLUGS) {
  try {
    const r = await fetchLever(slug);
    const n = r.jobs?.length ?? 0;
    leverTotal += n;
  const sample = n > 0 ? r.jobs[0].text : (r.error ? `(${r.error})` : r.status ? `HTTP ${r.status}` : "-");
  console.log(`  ${slug}: ${n} jobs ${n ? `(e.g. "${sample}")` : ""}`);
  } catch (e) {
    console.log(`  ${slug}: error - ${e.message}`);
  }
}

console.log("\n---");
console.log("Greenhouse total:", ghTotal, "jobs from", GREENHOUSE_SLUGS.length, "boards");
console.log("Lever total:", leverTotal, "jobs from", LEVER_SLUGS.length, "postings");
if (ghTotal > 0 && leverTotal > 0) {
  console.log("OK – Both Greenhouse and Lever return jobs.");
} else if (ghTotal > 0 || leverTotal > 0) {
  console.log("OK – At least one source returns jobs.");
} else {
  console.log("WARN – No jobs returned. Slugs may have changed or APIs may be rate-limiting.");
  process.exit(1);
}
