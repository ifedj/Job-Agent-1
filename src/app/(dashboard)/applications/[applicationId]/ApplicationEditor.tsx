"use client";

import { useState, useEffect } from "react";
import { OutreachSection } from "./OutreachSection";

type Props = {
  applicationId: string;
  initialCv: string;
  initialCoverLetter: string;
  jobUrl: string;
  jobTitle: string;
  jobCompany: string;
};

export function ApplicationEditor({
  applicationId,
  initialCv,
  initialCoverLetter,
  jobUrl,
  jobTitle,
  jobCompany,
}: Props) {
  const [cv, setCv] = useState(initialCv);
  const [coverLetter, setCoverLetter] = useState(initialCoverLetter);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCv(initialCv);
    setCoverLetter(initialCoverLetter);
  }, [initialCv, initialCoverLetter]);

  async function generate() {
    setGenerating(true);
    setMessage("");
    try {
      const res = await fetch(`/api/applications/${applicationId}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Generation failed");
        return;
      }
      if (data.tailoredCvText != null) setCv(data.tailoredCvText);
      if (data.tailoredCoverLetterText != null)
        setCoverLetter(data.tailoredCoverLetterText);
      setMessage("Generated. Edit below and save.");
    } catch {
      setMessage("Generation failed");
    }
    setGenerating(false);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailoredCvText: cv,
          tailoredCoverLetterText: coverLetter,
        }),
      });
      if (!res.ok) {
        setMessage("Save failed");
        return;
      }
      setMessage("Saved.");
    } catch {
      setMessage("Save failed");
    }
    setSaving(false);
  }

  function downloadPrep() {
    const blob = new Blob(
      [
        `Application: ${jobTitle} at ${jobCompany}\n\n`,
        `Job link: ${jobUrl}\n\n`,
        "--- TAILORED CV ---\n\n",
        cv,
        "\n\n--- COVER LETTER ---\n\n",
        coverLetter,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application-${jobCompany.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasContent = cv || coverLetter;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="rounded-lg bg-[#000000] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate CV & cover letter"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-2 text-sm font-medium text-[#111111] hover:bg-[#e5e7eb] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save edits"}
        </button>
        {hasContent && (
          <button
            type="button"
            onClick={downloadPrep}
            className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6]"
          >
            Download (CV + cover letter + link)
          </button>
        )}
        <a
          href={jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f3f4f6]"
        >
          Open job link
        </a>
      </div>

      {message && (
        <p className="rounded-lg bg-[#f9fafb] border border-[#e5e7eb] px-3 py-2 text-sm font-mono text-[#111111]">
          {message}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-[#374151]">
          Tailored CV (edit as needed)
        </label>
        <textarea
          value={cv}
          onChange={(e) => setCv(e.target.value)}
          rows={12}
          className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white p-3 font-mono text-sm text-[#111111]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#374151]">
          Cover letter (edit as needed)
        </label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={10}
          className="mt-1 w-full rounded-lg border border-[#e5e7eb] bg-white p-3 font-mono text-sm text-[#111111]"
        />
      </div>

      <OutreachSection applicationId={applicationId} />
    </div>
  );
}
