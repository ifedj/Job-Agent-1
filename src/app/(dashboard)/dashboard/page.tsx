import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isDirectCompanyJobUrl } from "@/lib/direct-job-url";
import { DashboardStats } from "./DashboardStats";

function isOnboardingComplete(profile: { originalCvPath: string | null; structuredCv: string; preferences: string } | null): boolean {
  if (!profile) return false;
  const hasCv = !!profile.originalCvPath || (profile.structuredCv && profile.structuredCv !== "{}");
  if (!hasCv) return false;
  const prefs = JSON.parse(profile.preferences || "{}");
  return (
    (prefs.locations?.length > 0) ||
    (prefs.industries?.length > 0) ||
    (prefs.companyTypes?.length > 0) ||
    prefs.targetRole != null
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login?callbackUrl=/dashboard");

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!isOnboardingComplete(profile)) {
    redirect("/onboarding");
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const targetRole = (profile?.preferences ? (JSON.parse(profile.preferences) as { targetRole?: string }).targetRole : undefined)?.trim() ?? "";

  const titleFilter = targetRole.toLowerCase().includes("product manager")
    ? { title: { contains: "product manager" } }
    : targetRole
      ? { title: { contains: targetRole } }
      : {};

  // Fetch all role-matching job matches with their job URLs so we can filter out aggregator links
  const [allMatches, applicationsCount, outreachSentCount] = await Promise.all([
    prisma.jobMatch.findMany({
      where: { userId, job: { AND: [{ OR: [{ postedAt: { gte: cutoff } }, { postedAt: null }] }, titleFilter] } },
      select: { status: true, job: { select: { url: true } } },
    }),
    prisma.application.count({ where: { jobMatch: { userId } } }),
    prisma.outreach.count({ where: { status: "sent", contact: { jobMatch: { userId } } } }),
  ]);

  // Exclude jobs with aggregator URLs (same rule as the matched API)
  const directMatches = allMatches.filter((m) => isDirectCompanyJobUrl(m.job.url));
  const jobsCount = directMatches.filter((m) => m.status !== "rejected").length;
  const pendingCount = directMatches.filter((m) => m.status === "pending").length;
  const approvedCount = directMatches.filter((m) => m.status === "approved").length;
  const rejectedCount = directMatches.filter((m) => m.status === "rejected").length;

  const preferences = profile ? (JSON.parse(profile.preferences) as Record<string, unknown>) : {};
  const name = (session.user as { name?: string | null }).name ?? session.user.email ?? "there";
  const hasCv = !!profile?.originalCvPath || (profile?.structuredCv && profile.structuredCv !== "{}");
  const prefs = profile?.preferences ? (JSON.parse(profile.preferences) as Record<string, unknown>) : {};
  const hasPreferences =
    (Array.isArray(prefs.locations) && prefs.locations.length > 0) ||
    (Array.isArray(prefs.industries) && prefs.industries.length > 0) ||
    (Array.isArray(prefs.companyTypes) && prefs.companyTypes.length > 0) ||
    prefs.targetRole != null;

  return (
    <DashboardStats
      userId={userId}
      userName={name}
      preferences={preferences}
      stats={{
        jobsCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        applicationsCount,
        outreachSentCount,
      }}
      profileComplete={!!profile && isOnboardingComplete(profile)}
      hasCv={!!hasCv}
      hasPreferences={!!hasPreferences}
    />
  );
}
