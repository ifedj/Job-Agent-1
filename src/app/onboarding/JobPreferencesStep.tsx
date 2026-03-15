"use client";

import { useState } from "react";
import { Briefcase, MapPin, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ProfilePreferences } from "@/types/profile";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const KEY_SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Java",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "SQL",
  "MongoDB",
  "Machine Learning",
];

type JobPreferencesStepProps = {
  preferences: ProfilePreferences;
  onChange: (preferences: ProfilePreferences) => void;
};

function formatSalary(min?: number, max?: number): string {
  if (min != null && max != null) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  }
  return "";
}

export function JobPreferencesStep({ preferences, onChange }: JobPreferencesStepProps) {
  const [salaryInput, setSalaryInput] = useState(() =>
    formatSalary(preferences.salaryMin, preferences.salaryMax)
  );

  const update = (patch: Partial<ProfilePreferences>) => {
    onChange({ ...preferences, ...patch });
  };

  const keySkills = preferences.keySkills ?? [];
  const toggleSkill = (skill: string) => {
    const next = keySkills.includes(skill)
      ? keySkills.filter((s) => s !== skill)
      : [...keySkills, skill];
    update({ keySkills: next });
  };

  const locationStr =
    (preferences.locations ?? []).join(", ") || (preferences.location ?? "");

  return (
    <div className="rounded-2xl bg-gradient-to-b from-white via-white to-[var(--brand-muted)]/30 px-3 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-lg">
          <div className="p-5 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand)] text-white sm:h-16 sm:w-16">
                <Briefcase className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h2 className="mt-3 text-xl font-bold text-[var(--foreground)] sm:mt-4 sm:text-2xl">
                Job Preferences
              </h2>
              <p className="mt-1.5 text-sm text-[var(--muted-foreground)] sm:mt-2 sm:text-base">
                Tell us what you&apos;re looking for in your next role
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
              <div className="space-y-2">
                <Label htmlFor="desired-role" className="text-[var(--foreground)]">
                  Desired Role
                </Label>
                <Input
                  id="desired-role"
                  type="text"
                  value={preferences.targetRole ?? ""}
                  onChange={(e) => update({ targetRole: e.target.value || undefined })}
                  placeholder="e.g., Senior Frontend Engineer"
                  className="rounded-lg bg-[var(--input-background)] border-[var(--border)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-type" className="text-[var(--foreground)]">
                  Job Type
                </Label>
                <select
                  id="job-type"
                  value={preferences.jobType ?? ""}
                  onChange={(e) => update({ jobType: e.target.value || undefined })}
                  className="flex h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  <option value="">Select type</option>
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1.5 text-[var(--foreground)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  Location
                </Label>
                <Input
                  id="location"
                  type="text"
                  value={locationStr}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    update({
                      locations: v ? v.split(/,\s*/) : [],
                      location: v ? v.split(/,\s*/)[0] : undefined,
                    });
                  }}
                  placeholder="e.g., San Francisco, CA"
                  className="rounded-lg bg-[var(--input-background)] border-[var(--border)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary" className="flex items-center gap-1.5 text-[var(--foreground)]">
                  <DollarSign className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                  Expected Salary
                </Label>
                <Input
                  id="salary"
                  type="text"
                  value={salaryInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSalaryInput(v);
                    const match = v.match(/\$?\s*([\d,]+)\s*[-–to]+\s*\$?\s*([\d,]+)/i);
                    if (match) {
                      update({
                        salaryMin: parseInt(match[1].replace(/,/g, ""), 10) || undefined,
                        salaryMax: parseInt(match[2].replace(/,/g, ""), 10) || undefined,
                      });
                    } else if (!v) {
                      update({ salaryMin: undefined, salaryMax: undefined });
                    }
                  }}
                  placeholder="e.g., $120,000 - $150,000"
                  className="rounded-lg bg-[var(--input-background)] border-[var(--border)]"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="work-mode" className="text-[var(--foreground)]">
                  Work Mode
                </Label>
                <select
                  id="work-mode"
                  value={preferences.workMode ?? ""}
                  onChange={(e) => update({ workMode: e.target.value || undefined })}
                  className="flex h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--foreground)] sm:max-w-[280px]"
                >
                  <option value="">Select work mode</option>
                  {WORK_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <Label className="text-[var(--foreground)]">Key Skills</Label>
              <div className="mt-3 flex flex-wrap gap-2">
                {KEY_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:px-3 sm:py-1.5",
                      keySkills.includes(skill)
                        ? "bg-[var(--brand)] text-[var(--brand-foreground)]"
                        : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]"
                    )}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
