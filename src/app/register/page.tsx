"use client";

import { useState, useRef, useCallback } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Senior PM roles at consumer health or digital health companies in Boston, paying $200k+, ideally WHOOP, Oura or similar",
  "Senior Software Engineer at Big Tech companies, location agnostic, $180k–$250k+",
  "Chief of Staff roles at Series B+ startups, any industry, open to remote or major US cities",
  "Manager roles at VC firms or venture-backed companies in New York, $150k–$200k",
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".pdf") || file.name.endsWith(".docx") || file.name.endsWith(".doc"))) {
      setCvFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Create account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "";
        if (msg.toLowerCase().includes("already exists")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else if (msg) {
          setError(msg);
        } else {
          setError("Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }

      // 2. Auto sign-in
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Account created — please sign in to continue.");
        setLoading(false);
        return;
      }

      // 3. Upload CV if provided (now that we're authenticated)
      if (cvFile) {
        const formData = new FormData();
        formData.set("file", cvFile);
        await fetch("/api/profile/cv", { method: "POST", body: formData });
      }

      // 4. Save the job description as the target role so it pre-fills onboarding step 2
      if (jobDescription.trim()) {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: { targetRole: jobDescription.trim() } }),
        });
      }

      // Full page navigation so the browser sends the session cookie to the server component
      window.location.href = "/onboarding";
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Find your next role
          </h1>
          <p className="mt-3 text-base text-[var(--muted-foreground)] sm:text-lg">
            Upload your CV and describe what you&apos;re looking for —{" "}
            <br className="hidden sm:block" />
            we&apos;ll handle the rest
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Two cards: CV + Job description */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Left: CV drop zone */}
            <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                <span>📄</span> Your CV
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "mt-3 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 transition-colors",
                  dragOver
                    ? "border-[var(--brand)] bg-[var(--brand-muted)]/40"
                    : "border-[var(--border)] bg-[var(--muted)]/30 hover:border-[var(--brand)]/50 hover:bg-[var(--brand-muted)]/20"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {cvFile ? (
                  <>
                    <span className="text-3xl">✅</span>
                    <p className="mt-2 text-center text-sm font-medium text-[var(--foreground)]">
                      {cvFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setCvFile(null); }}
                      className="mt-1 text-xs text-[var(--muted-foreground)] underline hover:no-underline"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    {/* Upload icon using inline SVG to avoid emoji inconsistency */}
                    <div className="flex h-12 w-12 items-center justify-center">
                      <svg viewBox="0 0 48 48" fill="none" className="h-12 w-12" aria-hidden>
                        <rect x="8" y="14" width="32" height="26" rx="4" fill="#e0e7ff" />
                        <rect x="14" y="8" width="20" height="28" rx="3" fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
                        <path d="M24 22v-8m0-4l-4 4m4-4l4 4" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M18 30h12M18 34h8" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                      Drop your CV here
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      or click to browse · PDF or DOCX
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right: What are you looking for */}
            <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                <span>🔍</span> What are you looking for?
              </p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                placeholder="e.g. Senior PM roles at consumer health or digital health companies in Boston, paying $200k+, ideally WHOOP, Oura or similar"
                className="mt-3 w-full flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/40"
              />
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                  Try this
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <li key={prompt}>
                      <button
                        type="button"
                        onClick={() => setJobDescription(prompt)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 text-left text-xs text-[var(--foreground)] transition-colors hover:border-[var(--brand)]/40 hover:bg-[var(--brand-muted)]/30"
                      >
                        {prompt.length > 72 ? prompt.slice(0, 72) + "…" : prompt}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Name + Email row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]"
              >
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="rounded-lg border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)]"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]"
              >
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="jane@example.com"
                className="rounded-lg border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min 8 characters"
              className="rounded-lg border-[var(--border)] bg-[var(--input-background)] text-[var(--foreground)]"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[var(--brand)] font-semibold text-[var(--brand-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Finding your jobs…" : "Find My Jobs →"}
          </Button>

          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--foreground)] underline hover:no-underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
