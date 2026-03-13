"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import type { User } from "next-auth";

export function DashboardNav({ user }: { user: User }) {
  return (
    <nav className="flex items-center gap-4">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        Dashboard
      </Link>
      <Link
        href="/jobs"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        Jobs
      </Link>
      <Link
        href="/applications"
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        Applications
      </Link>
      <span className="text-sm text-zinc-500">{user.email}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        Sign out
      </button>
    </nav>
  );
}
