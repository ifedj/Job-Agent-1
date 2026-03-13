import {
  detectJobIndustries,
  isStrongEmployerInIndustry,
  type IndustrySlug,
} from "@/lib/industry";
import type { StructuredCv } from "@/types/profile";

export interface MatchResult {
  score: number;
  matchReasons: string[];
}

const INDUSTRY_MATCH_BOOST = 18;
const STRONG_EMPLOYER_BOOST = 5;

export interface ScoreJobOptions {
  targetIndustries?: IndustrySlug[];
}

export function scoreJob(
  job: { title: string; description: string | null; company?: string | null },
  profile: StructuredCv,
  options?: ScoreJobOptions
): MatchResult {
  const reasons: string[] = [];
  const desc = `${(job.title ?? "").toLowerCase()} ${(job.description ?? "").toLowerCase()}`;
  const jobText = `${job.title ?? ""} ${job.description ?? ""} ${job.company ?? ""}`;
  const company = job.company ?? "";

  const skills = profile.skills ?? [];
  let matched = 0;
  for (const skill of skills) {
    if (!skill || typeof skill !== "string") continue;
    const term = skill.toLowerCase();
    if (desc.includes(term)) {
      matched++;
      reasons.push(`Skill: ${skill}`);
    }
  }
  const experienceKeywords = profile.experience?.flatMap((e) => [
    e.role,
    e.company,
  ]).filter(Boolean) ?? [];
  for (const kw of experienceKeywords.slice(0, 5)) {
    const term = String(kw).toLowerCase();
    if (term.length > 2 && desc.includes(term)) {
      reasons.push(`Experience: ${kw}`);
    }
  }

  let score = skills.length > 0
    ? Math.min(100, Math.round((matched / skills.length) * 80) + (reasons.length > 0 ? 10 : 0))
    : 60;

  const targetIndustries = options?.targetIndustries ?? [];
  if (targetIndustries.length > 0) {
    const jobIndustries = detectJobIndustries({
      title: job.title,
      description: job.description,
      company,
    });
    const industryOverlap = targetIndustries.filter((t) => jobIndustries.includes(t));
    if (industryOverlap.length > 0) {
      score = Math.min(100, score + INDUSTRY_MATCH_BOOST);
      for (const ind of industryOverlap.slice(0, 2)) {
        reasons.push(`Industry: ${ind}`);
      }
    }
    for (const ind of targetIndustries) {
      if (isStrongEmployerInIndustry(company, ind, jobText)) {
        score = Math.min(100, score + STRONG_EMPLOYER_BOOST);
        reasons.push(`Strong employer in ${ind}`);
        break;
      }
    }
  }

  return { score, matchReasons: reasons.slice(0, 8) };
}
