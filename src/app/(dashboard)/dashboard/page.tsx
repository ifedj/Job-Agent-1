import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
  const [jobsCount, pendingCount, approvedCount, rejectedCount, applicationsCount, outreachSentCount] = await Promise.all([
    prisma.job.count({ where: { OR: [{ postedAt: { gte: cutoff } }, { postedAt: null }] } }),
    prisma.jobMatch.count({ where: { userId, status: "pending" } }),
    prisma.jobMatch.count({ where: { userId, status: "approved" } }),
    prisma.jobMatch.count({ where: { userId, status: "rejected" } }),
    prisma.application.count({ where: { jobMatch: { userId } } }),
    prisma.outreach.count({ where: { status: "sent", contact: { jobMatch: { userId } } } }),
  ]);

  const preferences = profile ? (JSON.parse(profile.preferences) as Record<string, unknown>) : {};
  const name = (session.user as { name?: string | null }).name ?? session.user.email ?? "there";

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
    />
  );
}
