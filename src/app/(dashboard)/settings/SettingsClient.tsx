"use client";

import { useState } from "react";
import { CVBlock } from "@/components/CVBlock";
import { PreferencesForm } from "@/components/PreferencesForm";
import type { StructuredCv, ProfilePreferences } from "@/types/profile";

type SettingsClientProps = {
  initialHasCv: boolean;
  initialSummary?: string;
  initialPreferences: ProfilePreferences;
};

export function SettingsClient({
  initialHasCv,
  initialSummary,
  initialPreferences,
}: SettingsClientProps) {
  const [hasCv, setHasCv] = useState(initialHasCv);
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [preferences, setPreferences] = useState<ProfilePreferences>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"saved" | "error" | null>(null);

  async function handleSavePreferences() {
    setMessage(null);
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
      setMessage("saved");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
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
      <PreferencesForm preferences={preferences} onChange={setPreferences} section="all" />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSavePreferences}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
        {message === "saved" && (
          <span className="text-sm text-green-600">Preferences saved.</span>
        )}
        {message === "error" && (
          <span className="text-sm text-red-600">Failed to save. Try again.</span>
        )}
      </div>
    </div>
  );
}
