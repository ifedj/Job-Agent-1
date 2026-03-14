"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type JobItem = {
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    url: string;
    salaryRaw: string | null;
    postedAt: string | null;
  };
  match: {
    id: string;
    score: number | null;
    status: string;
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
  const colors = [
    "bg-[var(--brand)]",
    "bg-blue-600",
    "bg-fuchsia-600",
    "bg-emerald-600",
  ];
  return colors[n % colors.length] ?? "bg-[var(--muted)]";
}

export function TopMatchesList() {
  const [items, setItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs/matched")
      .then((r) => r.json())
      .then((data) => {
        setItems((data.jobs ?? []).slice(0, 5));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Loading matches…
      </p>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-4">
      {items.map(({ job, match }) => (
        <li key={job.id}>
          <Card className="overflow-hidden border-[var(--border)] transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-white ${companyColor(job.company)}`}
                  >
                    {initials(job.company)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">
                      {job.title}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {job.company}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-[var(--muted-foreground)]">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                      )}
                      {job.salaryRaw && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {job.salaryRaw}
                        </span>
                      )}
                      {job.postedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Posted {formatPosted(job.postedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {match?.score != null && (
                  <span className="rounded-full bg-[var(--brand)] px-2.5 py-0.5 text-xs font-medium text-[var(--brand-foreground)]">
                    {match.score}% Match
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/jobs`}>View Details</Link>
                </Button>
                <Button variant="brand" size="sm" asChild>
                  <Link
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1"
                  >
                    Quick Apply
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-[var(--radius)] p-2 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  aria-label="Open job in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function formatPosted(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000)
  );
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
