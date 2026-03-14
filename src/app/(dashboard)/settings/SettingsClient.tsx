"use client";

import { useState, useCallback } from "react";
import { CVBlock } from "@/components/CVBlock";
import { PreferencesForm } from "@/components/PreferencesForm";
import type { StructuredCv, ProfilePreferences } from "@/types/profile";

const COMPANY_SYSTEMS_KEY = "job-search-company-systems";

function getCachedCompanySystems(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COMPANY_SYSTEMS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function setCachedCompanySystems(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPANY_SYSTEMS_KEY, JSON.stringify(map));
  } catch {}
}

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
  const [targetCompanyInput, setTargetCompanyInput] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ fetched: number; created: number } | null>(null);

  const dreamCompanies = preferences.dreamCompanies ?? [];

  const savePreferences = useCallback(
    async (nextPrefs: ProfilePreferences) => {
      setSaving(true);
      setMessage(null);
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: nextPrefs }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to save");
        }
        setPreferences(nextPrefs);
        setMessage("saved");
        setTimeout(() => setMessage(null), 3000);
      } catch {
        setMessage("error");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  async function handleSavePreferences() {
    await savePreferences(preferences);
  }

  function handleRemoveTargetCompany(company: string) {
    const next = dreamCompanies.filter((c) => c !== company);
    setPreferences((p) => ({ ...p, dreamCompanies: next }));
    savePreferences({ ...preferences, dreamCompanies: next });
  }

  function handleAddTargetCompany() {
    const name = targetCompanyInput.trim();
    if (!name || dreamCompanies.includes(name)) {
      setTargetCompanyInput("");
      return;
    }
    const next = [...dreamCompanies, name];
    setPreferences((p) => ({ ...p, dreamCompanies: next }));
    setTargetCompanyInput("");
    savePreferences({ ...preferences, dreamCompanies: next });
  }

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const companySystems = getCachedCompanySystems();
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companySystems: Object.keys(companySystems).length ? companySystems : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      if (data.companySystems && typeof data.companySystems === "object") {
        setCachedCompanySystems(data.companySystems as Record<string, string>);
      }
      setRefreshResult({ fetched: data.fetched ?? 0, created: data.created ?? 0 });
    } catch {
      setRefreshResult(null);
      setMessage("error");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Target Companies</h2>
        <p className="mt-1 text-sm text-slate-500">
          Companies you’re targeting. Used for job search (Greenhouse, Lever, or Google).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {dreamCompanies.map((company) => (
            <span
              key={company}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm text-slate-800"
            >
              {company}
              <button
                type="button"
                onClick={() => handleRemoveTargetCompany(company)}
                className="rounded-full p-1 hover:bg-slate-200"
                aria-label={`Remove ${company}`}
              >
                <span className="sr-only">Remove</span>
                <span aria-hidden>×</span>
              </button>
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={targetCompanyInput}
            onChange={(e) => setTargetCompanyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTargetCompany();
              }
            }}
            placeholder="Add a company (e.g. Stripe, Figma)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddTargetCompany}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || dreamCompanies.length === 0}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {refreshResult !== null && (
          <p className="mt-2 text-sm text-slate-600">
            Fetched {refreshResult.fetched} jobs, {refreshResult.created} new.
          </p>
        )}
      </section>

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
