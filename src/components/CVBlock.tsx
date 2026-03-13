"use client";

import { useState } from "react";
import type { StructuredCv } from "@/types/profile";

type CVBlockProps = {
  hasCv: boolean;
  summary?: string;
  onUploaded: (data: { structuredCv: StructuredCv; preferences: Record<string, unknown> }) => void;
  onRemoved: () => void;
};

export function CVBlock({ hasCv, summary, onUploaded, onRemoved }: CVBlockProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/profile/cv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        setUploading(false);
        return;
      }
      onUploaded({ structuredCv: data.structuredCv, preferences: data.preferences });
      setFile(null);
    } catch {
      setUploadError("Upload failed");
    }
    setUploading(false);
  }

  async function handleRemove() {
    if (!confirm("Remove your CV? You can upload a new one anytime.")) return;
    setUploadError("");
    try {
      const res = await fetch("/api/profile/cv", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove");
      onRemoved();
    } catch {
      setUploadError("Failed to remove CV");
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Your CV</h2>
      <p className="mt-1 text-sm text-slate-500">
        Upload a PDF or DOCX to extract your skills and experience.
      </p>
      <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <label className="block text-sm font-medium text-slate-700">
            {hasCv ? "Replace with another file (PDF or DOCX)" : "Choose file (PDF or DOCX)"}
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setUploadError("");
            }}
            className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={!file || uploading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : hasCv ? "Replace CV" : "Upload CV"}
        </button>
        {hasCv && (
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Remove CV
          </button>
        )}
      </form>
      {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
      {hasCv && summary && (
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Extracted summary (first 4000 chars)</p>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-sm text-slate-600">
            {summary}
          </pre>
        </div>
      )}
    </section>
  );
}
