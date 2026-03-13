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
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-medium text-zinc-900">Your CV</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Upload a PDF or DOCX to extract your skills and experience. Only roles from the last 30 days are shown.
        </p>
        <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-zinc-700">
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
              className="mt-1 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
            />
          </div>
          <button
            type="submit"
            disabled={!file || uploading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload CV"}
          </button>
        </form>
        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
        {profile && (
          <div className="mt-4 rounded-lg bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-700">Extracted summary (first 4000 chars)</p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm text-zinc-600">
              {profile.structuredCv.summary || "No text extracted."}
            </pre>
          </div>
        )}
      </section>

      {profile && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-medium text-zinc-900">Preferences</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Max job age: {profile.preferences.maxJobAgeDays ?? 30} days. You can edit this in a future settings page.
          </p>
        </section>
      )}

      {hasProfile && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-medium text-zinc-900">Next steps</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-zinc-600">
            <li>Go to <a href="/jobs" className="font-medium text-zinc-900 hover:underline">Jobs</a> to run a search and see matched roles.</li>
            <li>Click job links to verify they are still open, then approve roles you want to pursue.</li>
            <li>For each approved role you can generate a tailored CV and cover letter, then apply or prepare an application.</li>
          </ul>
        </section>
      )}
    </div>
  );
}
