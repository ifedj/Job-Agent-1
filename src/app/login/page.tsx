"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ffffff] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[#e5e7eb] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <h1 className="text-xl font-semibold text-[#0a0a0a]">Sign in</h1>
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
              className="mt-1 block w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[#111111] placeholder-[#6b7280] focus:border-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#0a0a0a]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#000000] px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[#6b7280]">
          No account?{" "}
          <Link href="/register" className="font-medium text-[#0a0a0a] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#ffffff] text-[#374151]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
