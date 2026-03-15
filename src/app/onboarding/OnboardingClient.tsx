"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Briefcase, Sparkles, HelpCircle } from "lucide-react";
import { CVBlock } from "@/components/CVBlock";
import { PreferencesForm } from "@/components/PreferencesForm";
import { JobPreferencesStep } from "./JobPreferencesStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { StructuredCv, ProfilePreferences } from "@/types/profile";

const STEPS = [
  { id: 1, title: "Your CV" },
  { id: 2, title: "Set your target" },
  { id: 3, title: "What you're targeting" },
];

type OnboardingClientProps = {
  initialHasCv: boolean;
  initialSummary?: string;
  initialPreferences: ProfilePreferences;
  initialStep?: number;
};

export function OnboardingClient({
  initialHasCv,
  initialSummary,
  initialPreferences,
  initialStep,
}: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep ?? 1);
  const [hasCv, setHasCv] = useState(initialHasCv);
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [preferences, setPreferences] = useState<ProfilePreferences>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canFinish =
    hasCv &&
    (preferences.locations?.length ?? 0) > 0 &&
    (preferences.industries?.length ?? 0) > 0 &&
    (preferences.companyTypes?.length ?? 0) > 0;

  async function handleFinish() {
    if (!canFinish) {
      setError("Please add at least one location, one industry, and one company stage.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-[var(--foreground)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold">JobAgent</span>
        </Link>
        <span className="text-sm font-medium text-[var(--muted-foreground)]">
          Step {step} of 3
        </span>
      </div>
      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--brand)] to-indigo-500 transition-[width]"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
      {step !== 2 && (
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step > s.id
                  ? "bg-[#7c3aed] text-white"
                  : step === s.id
                    ? "border-2 border-[#7c3aed] bg-white text-[#7c3aed]"
                    : "border border-[#e5e7eb] bg-white text-[#6b7280]"
              }`}
            >
              {step > s.id ? "✓" : s.id}
            </div>
            <span className={`text-sm font-medium ${step >= s.id ? "text-[#0a0a0a]" : "text-[#6b7280]"}`}>
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px w-4 bg-[var(--border)]" aria-hidden />
            )}
          </div>
        ))}
      </div>
      )}

      {step === 1 && (
        <>
          <Card className="overflow-hidden border-[var(--border)]">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)] to-indigo-500 text-white">
                  <Upload className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
                  Upload Your CV
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Let&apos;s start by understanding your background and experience.
                </p>
              </div>
              <div className="mt-6">
                <CVBlock
                  hasCv={hasCv}
                  summary={summary}
                  onUploaded={(data) => {
                    setHasCv(true);
                    setSummary(data.structuredCv.summary ?? "");
                    if (data.preferences) setPreferences((p) => ({ ...p, ...data.preferences }));
                  }}
                  onRemoved={() => {
                    setHasCv(false);
                    setSummary("");
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard">← Back</Link>
            </Button>
            <Button variant="brand" onClick={() => setStep(2)} disabled={!hasCv}>
              Continue →
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <JobPreferencesStep preferences={preferences} onChange={setPreferences} />
          <div className="relative mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="brand"
                className="bg-gradient-to-r from-[var(--brand)] to-indigo-500"
                onClick={() => setStep(3)}
              >
                Continue →
              </Button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                aria-label="Help"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <PreferencesForm preferences={preferences} onChange={setPreferences} section="targeting" />
          {error && <p className="mt-2 text-sm text-[#92400e] bg-[#fffbeb] px-2 py-1 rounded">{error}</p>}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
            <Button variant="brand" onClick={handleFinish} disabled={!canFinish || saving}>
              {saving ? "Saving…" : "Start my job search →"}
            </Button>
          </div>
          {!canFinish && (
            <p className="mt-2 text-sm text-[#6b7280]">
              Select at least one industry and one company stage to continue.
            </p>
          )}
        </>
      )}
    </div>
  );
}
