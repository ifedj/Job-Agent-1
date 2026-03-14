#!/usr/bin/env node
/**
 * Quick test: SerpAPI Google Jobs returns results with SERPAPI_API_KEY from .env.local
 * Run: node scripts/test-serp-api.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

let apiKey = "";
try {
  const content = readFileSync(envPath, "utf8");
  const m = content.match(/SERPAPI_API_KEY=(.+)/);
  if (m) apiKey = m[1].trim().replace(/^["']|["']$/g, "");
} catch (e) {
  console.error("Could not read .env.local:", e.message);
  process.exit(1);
}

if (!apiKey) {
  console.error("SERPAPI_API_KEY not found in .env.local");
  process.exit(1);
}

const params = new URLSearchParams({
  engine: "google_jobs",
  api_key: apiKey,
  q: "software engineer jobs Boston",
  gl: "us",
});
const url = `https://serpapi.com/search?${params.toString()}`;

console.log("Calling SerpAPI Google Jobs (q=software engineer jobs Boston)...");
const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
const data = await res.json();

if (data.error) {
  console.error("SerpAPI error:", data.error);
  process.exit(1);
}

const rawJobs = Array.isArray(data.jobs_results) ? data.jobs_results : (data.jobs_results?.jobs ?? []);
console.log("OK – SerpAPI returned", rawJobs.length, "job(s).");
if (rawJobs.length > 0) {
  const sample = rawJobs[0];
  console.log("Sample:", sample.title, "at", sample.company_name, "| apply_options:", sample.apply_options?.length ?? 0, "link(s)");
}
