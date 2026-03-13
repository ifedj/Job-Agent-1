"use client";

import { TagInput } from "./TagInput";
import { CheckboxGrid } from "./CheckboxGrid";
import { INDUSTRY_OPTIONS, COMPANY_STAGE_OPTIONS } from "@/lib/preference-options";
import type { ProfilePreferences } from "@/types/profile";

export type PreferencesFormSection = "target" | "targeting" | "all";

type PreferencesFormProps = {
  preferences: ProfilePreferences;
  onChange: (preferences: ProfilePreferences) => void;
  section?: PreferencesFormSection;
};

export function PreferencesForm({ preferences, onChange, section = "all" }: PreferencesFormProps) {
  const showTarget = section === "target" || section === "all";
  const showTargeting = section === "targeting" || section === "all";
  const locations = preferences.locations ?? (preferences.location ? [preferences.location] : []);
  const industries = preferences.industries ?? [];
  const companyTypes = preferences.companyTypes ?? [];
  const dreamCompanies = preferences.dreamCompanies ?? [];

  const update = (patch: Partial<ProfilePreferences>) => {
    onChange({ ...preferences, ...patch });
  };

  return (
    <div className="space-y-6">
      {showTarget && (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Set your target</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tell us who you are and what you&apos;re looking for.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Target role</label>
            <input
              type="text"
              value={preferences.targetRole ?? ""}
              onChange={(e) => update({ targetRole: e.target.value || undefined })}
              placeholder="e.g. Senior Product Manager"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Years of experience</label>
            <input
              type="text"
              value={preferences.yearsOfExperience ?? ""}
              onChange={(e) => update({ yearsOfExperience: e.target.value || undefined })}
              placeholder="e.g. 8 years"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Salary range</label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                value={preferences.salaryMin ?? ""}
                onChange={(e) => update({ salaryMin: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Min"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="number"
                value={preferences.salaryMax ?? ""}
                onChange={(e) => update({ salaryMax: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Max"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Preferred locations</label>
            <div className="mt-1">
              <TagInput
                tags={locations}
                onChange={(tags) => {
                  update({ locations: tags, location: tags[0] });
                }}
                placeholder="Add a location..."
                hint="Press Enter or comma to add a location"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Max job age (days)</label>
            <select
              value={preferences.maxJobAgeDays ?? 30}
              onChange={(e) => update({ maxJobAgeDays: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
        </div>
      </section>
      )}

      {showTargeting && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">What are you targeting?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Help focus on the right opportunities.
            </p>
            <div className="mt-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Industries</label>
                <div className="mt-2">
                  <CheckboxGrid
                    options={INDUSTRY_OPTIONS}
                    selected={industries}
                    onChange={(v) => update({ industries: v })}
                    columns={2}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Company stage</label>
                <div className="mt-2">
                  <CheckboxGrid
                    options={COMPANY_STAGE_OPTIONS}
                    selected={companyTypes}
                    onChange={(v) => update({ companyTypes: v })}
                    columns={2}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Dream companies (optional)
                </label>
                <div className="mt-1">
                  <TagInput
                    tags={dreamCompanies}
                    onChange={(v) => update({ dreamCompanies: v })}
                    placeholder="Google, Stripe, OpenAI..."
                    hint="Press Enter to add a company"
                  />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
