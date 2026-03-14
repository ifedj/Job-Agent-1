"use client";

import { useState, useEffect } from "react";

const COMPANY_SYSTEMS_KEY = "job-search-company-systems";

function getCachedCompanySystems(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COMPANY_SYSTEMS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function setCachedCompanySystems(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPANY_SYSTEMS_KEY, JSON.stringify(map));
  } catch {}
}

type JobItem = {
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    url: string;
    description: string | null;
    salaryRaw: string | null;
    postedAt: string | null;
    source: string;
  };
  match: {
    id: string;
    score: number | null;
    matchReasons: string[];
    status: string;
    userVerifiedOpen: boolean | null;
    approvedAt: string | null;
  } | null;
  isTopMatch?: boolean;
};

const JOBS_PER_PAGE = 20;

export function JobsList() {
  const [items, setItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  async function loadJobs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jobs/matched");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load jobs");
        setItems([]);
        return;
      }
      setItems(data.jobs ?? []);
      setPage(1);
    } catch {
      setError("Failed to load jobs");
      setItems([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function runSearch() {
    setSearching(true);
    setError("");
    try {
      const companySystems = getCachedCompanySystems();
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.keys(companySystems).length > 0 ? { companySystems } : {}
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        setSearching(false);
        return;
      }
      if (data.companySystems && typeof data.companySystems === "object") {
        setCachedCompanySystems(data.companySystems as Record<string, string>);
      }
      await loadJobs();
    } catch {
      setError("Search failed");
    }
    setSearching(false);
  }

  async function updateMatch(
    jobId: string,
    updates: { status?: string; userVerifiedOpen?: boolean }
  ) {
    const res = await fetch(`/api/jobs/${jobId}/match`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return;
    await loadJobs();
  }

  if (loading) {
    return <div className="mt-6 text-slate-500">Loading jobs…</div>;
  }

  const totalPages = Math.max(1, Math.ceil(items.length / JOBS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * JOBS_PER_PAGE;
  const pageItems = items.slice(start, start + JOBS_PER_PAGE);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={runSearch}
          disabled={searching}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {searching ? "Searching…" : "Run job search"}
        </button>
        <span className="text-sm font-medium text-slate-700">
          {items.length} job{items.length !== 1 ? "s" : ""} found
        </span>
        <span className="text-sm text-slate-500">
          Only roles from the last 30 days. Click the link to verify the role is still open, then approve or reject.
        </span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 && !error && (
        <p className="text-slate-500">No jobs yet. Run a search to fetch roles from job boards.</p>
      )}

      <ul className="space-y-3">
        {pageItems.map(({ job, match, isTopMatch }) => (
          <li
            key={job.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-slate-900">{job.title}</h3>
                  {isTopMatch && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Top match
                    </span>
                  )}
                  {match?.score != null && (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                      Match {match.score}%
                    </span>
                  )}
                  {match?.status === "approved" && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Approved
                    </span>
                  )}
                  {match?.status === "rejected" && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      Rejected
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{job.company}</p>
                {job.location && (
                  <p className="text-sm text-slate-500">{job.location}</p>
                )}
                {job.postedAt && (
                  <p className="mt-1 text-xs text-slate-400">
                    Posted {new Date(job.postedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View role (verify open)
              </a>
            </div>
            {match?.matchReasons?.length ? (
              <p className="mt-2 text-xs text-slate-500">
                {match.matchReasons.join(" · ")}
              </p>
            ) : null}
            {job.description && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {job.description}
              </p>
            )}
            {match && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={match.userVerifiedOpen ?? false}
                    onChange={(e) =>
                      updateMatch(job.id, {
                        userVerifiedOpen: e.target.checked,
                      })
                    }
                  />
                  I verified – role is open
                </label>
                {match.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateMatch(job.id, { status: "approved" })}
                      className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMatch(job.id, { status: "rejected" })}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Reject
                    </button>
                  </>
            )}
          </div>
        )}
      </li>
        ))}
      </ul>

      {items.length > JOBS_PER_PAGE && (
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
