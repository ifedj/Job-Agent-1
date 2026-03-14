"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { User } from "next-auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-[#e5e7eb] bg-[#f8f9fa]">
      <div className="flex h-14 items-center gap-2 border-b border-[#e5e7eb] px-4">
        <Link href="/dashboard" className="font-semibold text-[#0a0a0a]">
          <span className="text-[#7c3aed]">Job</span> Search
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ href, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#f3f4f6] text-[#000000]"
                  : "text-[#374151] hover:bg-[#f3f4f6]/70 hover:text-[#0a0a0a]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#e5e7eb] p-3">
        <p className="truncate px-3 py-1 text-xs text-[#6b7280]" title={user.email ?? undefined}>
          {user.email}
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#374151] hover:bg-[#f3f4f6] hover:text-[#0a0a0a]"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
