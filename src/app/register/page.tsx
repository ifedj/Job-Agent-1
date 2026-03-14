"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Show the specific error if available, otherwise a helpful fallback
        const msg = data.error ?? "";
        if (msg.toLowerCase().includes("already exists")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else if (msg.toLowerCase().includes("email and password")) {
          setError("Please enter your email and password.");
        } else if (msg) {
          setError(msg);
        } else {
          setError("Something went wrong. Please try again in a moment.");
        }
        setLoading(false);
        return;
      }
      router.push("/login?callbackUrl=/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ffffff] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <h1 className="text-xl font-semibold text-[#0a0a0a]">Create account</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          Personalised Job Search & Application
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <p className="rounded bg-[#fffbeb] px-3 py-2 text-sm text-[#92400e]">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#374151]">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[#111111] placeholder-[#6b7280] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#374151]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[#111111] placeholder-[#6b7280] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#374151]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[#111111] placeholder-[#6b7280] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#000000] px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[#6b7280]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#0a0a0a] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
