"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Mail, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppItem = {
  jobMatchId: string;
  job: { id: string; title: string; company: string; url: string };
  application: {
    id: string;
    status: string;
    hasCv: boolean;
    hasCoverLetter: boolean;
  } | null;
};

function initials(company: string): string {
  return company
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function companyColor(company: string): string {
  const n = company.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const colors = ["bg-[var(--brand)]", "bg-blue-600", "bg-emerald-600"];
  return colors[n % colors.length] ?? "bg-[var(--muted)]";
}

export function ApplicationsList() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [sort, setSort] = useState<string>("Most Recent");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.applications ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = items.length;
  const archivedCount = 0;

  if (loading) {
    return (
      <div className="text-sm text-[var(--muted-foreground)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--foreground)]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Statuses</option>
          <option>Under Review</option>
          <option>Interview</option>
        </select>
        <select
          className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--foreground)]"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option>Most Recent</option>
          <option>Oldest</option>
        </select>
        <Button variant="outline" size="sm" className="gap-2">
          <span className="inline-block h-4 w-4 rounded bg-[var(--muted)]" />
          More Filters
        </Button>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "active"
              ? "border-[var(--brand)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archived")}
          className={cn(
            "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "archived"
              ? "border-[var(--brand)] text-[var(--foreground)]"
              : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          Archived ({archivedCount})
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">
          No approved roles yet. Go to{" "}
          <Link
            href="/jobs"
            className="font-medium text-[var(--foreground)] hover:underline"
          >
            Jobs
          </Link>{" "}
          and approve roles you want to apply to.
        </p>
      ) : (
        <ul className="space-y-4">
          {(activeTab === "archived" ? [] : items).map((item) => (
            <ApplicationCard key={item.jobMatchId} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ApplicationCard({ item }: { item: AppItem }) {
  const status =
    item.application?.status === "applied" ? "Interview" : "Under Review";
  const statusColor =
    status === "Interview"
      ? "bg-green-600 text-white"
      : "bg-[var(--brand)] text-[var(--brand-foreground)]";

  return (
    <li>
      <Card className="border-[var(--border)] transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-white",
                  companyColor(item.job.company)
                )}
              >
                {initials(item.job.company)}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">
                  {item.job.title}
                </h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {item.job.company}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  Applied recently
                </p>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusColor
              )}
            >
              {status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {item.application ? (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/applications/${item.application.id}`}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>
              </Button>
            ) : (
              <CreateAndOpenButton jobMatchId={item.jobMatchId} />
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/messages" className="gap-2">
                <Mail className="h-4 w-4" />
                Follow Up
              </Link>
            </Button>
            <a
              href={item.job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--radius)] p-2 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              aria-label="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function CreateAndOpenButton({ jobMatchId }: { jobMatchId: string }) {
  const [loading, setLoading] = useState(false);

  async function createAndOpen() {
    setLoading(true);
    try {
      const res = await fetch("/api/applications/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobMatchId }),
      });
      const data = await res.json();
      if (data.application?.id) {
        window.location.href = `/applications/${data.application.id}`;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={createAndOpen}
      disabled={loading}
      className="gap-2"
    >
      <Eye className="h-4 w-4" />
      {loading ? "Creating…" : "View Details"}
    </Button>
  );
}
