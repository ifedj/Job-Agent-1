"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export function ApplicationsList() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.applications ?? []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mt-6 text-slate-500">Loading…</div>;
  if (items.length === 0) {
    return (
      <p className="mt-6 text-slate-500">
        No approved roles yet. Go to{" "}
        <Link href="/jobs" className="font-medium text-zinc-900 hover:underline">
          Jobs
        </Link>{" "}
        and approve roles you want to apply to.
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li
          key={item.jobMatchId}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-medium text-zinc-900">{item.job.title}</h3>
              <p className="text-sm text-zinc-600">{item.job.company}</p>
            </div>
            {item.application ? (
              <Link
                href={`/applications/${item.application.id}`}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {item.application.hasCv || item.application.hasCoverLetter
                  ? "Edit & download"
                  : "Generate CV & cover letter"}
              </Link>
            ) : (
              <CreateAndOpenButton jobMatchId={item.jobMatchId} />
            )}
          </div>
        </li>
      ))}
    </ul>
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
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={createAndOpen}
      disabled={loading}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {loading ? "Creating…" : "Start application"}
    </button>
  );
}
