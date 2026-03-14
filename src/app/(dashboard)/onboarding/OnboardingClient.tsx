"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CVBlock } from "@/components/CVBlock";
import { PreferencesForm } from "@/components/PreferencesForm";
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
};

export function OnboardingClient({
  initialHasCv,
  initialSummary,
  initialPreferences,
}: OnboardingClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
    <div className="mx-auto max-w-2xl">
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
              <div className="mx-1 h-px w-4 bg-[#e5e7eb]" aria-hidden />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
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
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!hasCv}
              className="rounded-lg bg-[#000000] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <PreferencesForm preferences={preferences} onChange={setPreferences} section="target" />
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-2 text-sm font-medium text-[#111111] hover:bg-[#e5e7eb]"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-lg bg-[#000000] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <PreferencesForm preferences={preferences} onChange={setPreferences} section="targeting" />
          {error && <p className="mt-2 text-sm text-[#92400e] bg-[#fffbeb] px-2 py-1 rounded">{error}</p>}
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-2 text-sm font-medium text-[#111111] hover:bg-[#e5e7eb]"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={!canFinish || saving}
              className="rounded-lg bg-[#000000] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Start my job search →"}
            </button>
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
