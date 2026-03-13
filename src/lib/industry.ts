import type { StructuredCv } from "@/types/profile";

/** Normalized industry slugs used for matching. */
export const INDUSTRY_SLUGS = [
  "healthcare",
  "fintech",
  "edtech",
  "ecommerce",
  "saas",
  "government",
  "nonprofit",
  "manufacturing",
  "media",
  "other",
] as const;

export type IndustrySlug = (typeof INDUSTRY_SLUGS)[number];

/** Keywords in company name, role title, or description that suggest an industry. */
const INDUSTRY_KEYWORDS: Record<IndustrySlug, string[]> = {
  healthcare: [
    "health", "medical", "hospital", "clinic", "nurse", "patient", "clinical",
    "pharma", "biotech", "emr", "hipaa", "healthcare", "medicare", "medicaid",
    "mayo", "cleveland clinic", "kaiser", "johns hopkins", "cv health", "optum",
    "insurance", "life sciences", "diagnostics", "therapy", "wellness",
  ],
  fintech: [
    "fintech", "payments", "stripe", "bank", "trading", "compliance", "lending",
    "crypto", "blockchain", "wealth", "investment", "card", "payroll",
    "square", "plaid", "chime", "robinhood", "affirm", "financial",
  ],
  edtech: [
    "education", "edtech", "learning", "course", "university", "school",
    "coursera", "udemy", "duolingo", "khan", "student", "academic",
  ],
  ecommerce: [
    "ecommerce", "e-commerce", "retail", "marketplace", "shopify", "amazon",
    "fulfillment", "merchandising", "e-tail",
  ],
  saas: [
    "saas", "software", "cloud", "platform", "api", "enterprise", "b2b",
    "subscription", "sdk", "developer tools",
  ],
  government: [
    "government", "federal", "state", "municipal", "public sector", "defense",
    "cleared", "security clearance",
  ],
  nonprofit: [
    "nonprofit", "non-profit", "foundation", "ngo", "charity", "mission-driven",
  ],
  manufacturing: [
    "manufacturing", "industrial", "supply chain", "logistics", "automotive",
    "aerospace", "chemical", "production",
  ],
  media: [
    "media", "entertainment", "streaming", "content", "publishing", "news",
    "netflix", "spotify", "gaming",
  ],
  other: [],
};

/** Strong employers in a vertical (company name slug → industry). Used for tier boost. */
const STRONG_EMPLOYERS_BY_INDUSTRY: Partial<Record<IndustrySlug, string[]>> = {
  healthcare: ["apple", "amazon", "google", "microsoft", "meta", "jpmorgan", "unitedhealth", "anthem", "cigna", "humana", "pfizer", "johnson & johnson", "merck", "abbvie", "bristol-myers", "mayo clinic", "cleveland clinic", "kaiser permanente", "optum", "cvs"],
  fintech: ["stripe", "square", "paypal", "visa", "mastercard", "jpmorgan", "goldman", "morgan stanley", "bank of america", "plaid", "chime", "robinhood", "coinbase"],
  edtech: ["coursera", "udemy", "duolingo", "khan academy", "2u", "instructure", "quizlet"],
  ecommerce: ["amazon", "shopify", "walmart", "target", "ebay", "alibaba"],
  saas: ["salesforce", "adobe", "microsoft", "oracle", "sap", "workday", "servicenow", "slack", "atlassian", "zoom", "dropbox"],
};

/**
 * Infers one or more industries from the user's CV (experience, summary, skills).
 * Returns normalized industry slugs, ordered by strength of signal.
 */
export function inferIndustriesFromCv(cv: StructuredCv): IndustrySlug[] {
  const text = [
    ...(cv.experience ?? []).flatMap((e) => [
      e.role ?? "",
      e.company ?? "",
      e.description ?? "",
    ]),
    cv.summary ?? "",
    (cv.skills ?? []).join(" "),
    ...(cv.education ?? []).flatMap((e) => [e.degree ?? "", e.institution ?? ""]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const scores: Partial<Record<IndustrySlug, number>> = {};

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS) as [IndustrySlug, string[]][]) {
    if (industry === "other") continue;
    let count = 0;
    for (const kw of keywords) {
      if (kw.length < 2) continue;
      if (text.includes(kw.toLowerCase())) count++;
    }
    if (count > 0) scores[industry] = count;
  }

  const sorted = (Object.entries(scores) as [IndustrySlug, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([slug]) => slug);

  return sorted.length > 0 ? sorted : ["other"];
}

const PREFERENCE_TO_SLUG: Record<string, IndustrySlug> = {
  healthcare: "healthcare", "health care": "healthcare",
  fintech: "fintech", "financial technology": "fintech",
  edtech: "edtech", "education technology": "edtech",
  ecommerce: "ecommerce", "e-commerce": "ecommerce",
  saas: "saas",
  government: "government", "gov": "government",
  nonprofit: "nonprofit", "non-profit": "nonprofit",
  manufacturing: "manufacturing",
  media: "media", "entertainment": "media",
  other: "other",
};

/**
 * Returns target industries for matching: user's explicit preferences, or inferred from CV.
 */
export function getTargetIndustries(
  cv: StructuredCv,
  preferences: { industries?: string[] } | null | undefined
): IndustrySlug[] {
  const explicit = preferences?.industries?.filter(Boolean).map((s) => s.toLowerCase().trim());
  if (explicit && explicit.length > 0) {
    const slugs = new Set<IndustrySlug>();
    for (const s of explicit) {
      const slug = PREFERENCE_TO_SLUG[s] ?? (INDUSTRY_SLUGS.includes(s as IndustrySlug) ? (s as IndustrySlug) : null);
      if (slug) slugs.add(slug);
    }
    return [...slugs];
  }
  return inferIndustriesFromCv(cv);
}

/**
 * Detects if the job (title, description, company) belongs to any of the given industries.
 */
export function detectJobIndustries(
  job: { title: string; description: string | null; company: string }
): IndustrySlug[] {
  const text = `${job.title ?? ""} ${job.description ?? ""} ${job.company ?? ""}`.toLowerCase();
  const matched: IndustrySlug[] = [];
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS) as [IndustrySlug, string[]][]) {
    if (industry === "other") continue;
    for (const kw of keywords) {
      if (kw.length < 2) continue;
      if (text.includes(kw.toLowerCase())) {
        matched.push(industry);
        break;
      }
    }
  }
  return matched.length > 0 ? matched : ["other"];
}

/**
 * Returns true if the job is at a strong employer in the given industry (e.g. Apple Health, Amazon Health).
 */
export function isStrongEmployerInIndustry(
  company: string,
  industry: IndustrySlug,
  jobText: string
): boolean {
  const list = STRONG_EMPLOYERS_BY_INDUSTRY[industry];
  if (!list) return false;
  const companyLower = company.toLowerCase();
  const jobLower = jobText.toLowerCase();
  for (const name of list) {
    if (!companyLower.includes(name.toLowerCase())) continue;
    if (industry === "healthcare" && (name === "apple" || name === "amazon" || name === "google" || name === "microsoft" || name === "meta" || name === "jpmorgan")) {
      if (!jobLower.includes("health") && !jobLower.includes("medical") && !jobLower.includes("care")) continue;
    }
    return true;
  }
  return false;
}
