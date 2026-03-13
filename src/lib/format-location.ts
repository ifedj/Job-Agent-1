/**
 * Format job location for display (e.g. "South Boston, Suffolk County" -> "Boston, Massachusetts").
 */
const LOCATION_DISPLAY_MAP: Array<{ pattern: RegExp; display: string }> = [
  { pattern: /south boston\s*,?\s*suffolk county/i, display: "Boston, Massachusetts" },
  { pattern: /boston\s*,?\s*suffolk county/i, display: "Boston, Massachusetts" },
  { pattern: /suffolk county\s*,?\s*(?:ma|mass\.?|massachusetts)/i, display: "Boston, Massachusetts" },
  { pattern: /^suffolk county$/i, display: "Boston, Massachusetts" },
];

export function formatLocationForDisplay(location: string | null): string | null {
  if (location == null || location.trim() === "") return location;
  const trimmed = location.trim();
  for (const { pattern, display } of LOCATION_DISPLAY_MAP) {
    if (pattern.test(trimmed)) return display;
  }
  return trimmed;
}
