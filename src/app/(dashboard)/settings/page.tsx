import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SettingsClient } from "./SettingsClient";
import type { ProfilePreferences } from "@/types/profile";

const DEFAULT_PREFS: ProfilePreferences = { maxJobAgeDays: 30 };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/settings");
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login?callbackUrl=/settings");

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
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-600">
        Edit your profile and preferences.
      </p>
      <SettingsClient
        initialHasCv={hasCv}
        initialSummary={structuredCv?.summary}
        initialPreferences={preferences}
      />
    </div>
  );
}
