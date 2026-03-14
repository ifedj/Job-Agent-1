"use client";

import { useState } from "react";
import type { StructuredCv, ProfilePreferences } from "@/types/profile";

type ProfileState = {
  structuredCv: StructuredCv;
  preferences: ProfilePreferences;
} | null;

export function DashboardHome({
  hasProfile,
  initialProfile,
}: {
  hasProfile: boolean;
  initialProfile: ProfileState;
}) {
  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/profile/cv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        setUploading(false);
        return;
      }
      setProfile({
        structuredCv: data.structuredCv,
        preferences: data.preferences,
      });
      setFile(null);
    } catch {
      setUploadError("Upload failed");
    }
    setUploading(false);
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-medium text-[#0a0a0a]">Your CV</h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          Upload a PDF or DOCX to extract your skills and experience. Only roles from the last 30 days are shown.
        </p>
        <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#374151]">
              Choose file (PDF or DOCX)
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f ?? null);
                setUploadError("");
              }}
              className="mt-1 block w-full text-sm text-[#111111] file:mr-4 file:rounded-lg file:border-0 file:bg-[#f3f4f6] file:px-4 file:py-2 file:font-medium file:text-[#111111] hover:file:bg-[#e5e7eb]"
            />
          </div>
          <button
            type="submit"
            disabled={!file || uploading}
            className="rounded-lg bg-[#000000] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload CV"}
          </button>
        </form>
        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
        {profile && (
          <div className="mt-4 rounded-lg bg-[#f9fafb] border border-[#e5e7eb] p-4">
            <p className="text-sm font-medium text-[#374151]">Extracted summary (first 4000 chars)</p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm font-mono text-[#111111]">
              {profile.structuredCv.summary || "No text extracted."}
            </pre>
          </div>
        )}
      </section>

      {profile && (
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-medium text-[#0a0a0a]">Preferences</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Max job age: {profile.preferences.maxJobAgeDays ?? 30} days. You can edit this in a future settings page.
          </p>
        </section>
      )}

      {hasProfile && (
        <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-medium text-[#0a0a0a]">Next steps</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#374151]">
            <li>Go to <a href="/jobs" className="font-medium text-[#0a0a0a] hover:underline">Jobs</a> to run a search and see matched roles.</li>
            <li>Click job links to verify they are still open, then approve roles you want to pursue.</li>
            <li>For each approved role you can generate a tailored CV and cover letter, then apply or prepare an application.</li>
          </ul>
        </section>
      )}
    </div>
  );
}
