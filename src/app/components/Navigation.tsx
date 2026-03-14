"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { User } from "next-auth";
import {
  LayoutDashboard,
  Briefcase,
  Mail,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Navigation({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[var(--foreground)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-[var(--brand-foreground)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            JobAgent
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}>
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--brand)] text-[var(--brand-foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <span
            className="max-w-[140px] truncate text-xs text-[var(--muted-foreground)] sm:max-w-[180px]"
            title={user.email ?? undefined}
          >
            {user.email}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
