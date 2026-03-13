import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OnboardingClient } from "./OnboardingClient";
import type { ProfilePreferences } from "@/types/profile";

const DEFAULT_PREFS: ProfilePreferences = { maxJobAgeDays: 30 };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/onboarding");
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login?callbackUrl=/onboarding");

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  const hasCv = !!(profile?.originalCvPath || (profile?.structuredCv && profile.structuredCv !== "{}"));
  const structuredCv = profile?.structuredCv ? (JSON.parse(profile.structuredCv) as { summary?: string }) : null;
  const preferences: ProfilePreferences = profile?.preferences
    ? (JSON.parse(profile.preferences) as ProfilePreferences)
    : DEFAULT_PREFS;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Welcome</h1>
      <p className="mt-1 text-slate-600">
        Set up your profile so we can find the right roles for you.
      </p>
      <OnboardingClient
        initialHasCv={hasCv}
        initialSummary={structuredCv?.summary}
        initialPreferences={preferences}
      />
    </div>
  );
}
