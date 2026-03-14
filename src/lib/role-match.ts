const ROLE_STOP_WORDS = new Set([
  "the", "and", "or", "in", "at", "to", "for", "of", "with", "a", "an",
]);
const SENIORITY_WORDS = new Set([
  "senior", "lead", "principal", "staff", "junior", "associate", "head", "chief",
]);

/**
 * True only if the job TITLE indicates the same role as the user's target.
 * Strict rule: if the target role contains "product manager", the job title must contain
 * the phrase "product manager" (so we never return engineering or other roles).
 */
export function jobMatchesTargetRole(
  job: { title: string; description?: string },
  targetRole: string
): boolean {
  const role = targetRole.trim().toLowerCase();
  if (!role) return true;
  const titleLower = (job.title ?? "").trim().toLowerCase();
  if (!titleLower) return false;

  if (role.includes("product manager")) {
    return titleLower.includes("product manager");
  }

  if (titleLower.includes(role)) return true;
  const words = role
    .split(/\s+/)
    .filter(
      (w) => w.length >= 2 && !ROLE_STOP_WORDS.has(w) && !SENIORITY_WORDS.has(w)
    );
  if (words.length === 0) return true;
  return words.every((w) => titleLower.includes(w));
}
