"use client";

import { useState } from "react";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = ["Professional", "Friendly", "Formal", "Enthusiastic"] as const;

export function OutreachMessagesClient() {
  const [tone, setTone] = useState<(typeof TONES)[number]>("Professional");
  const [filter, setFilter] = useState<"All" | "Recruiter" | "Follow-up">("All");
  // On mobile, track whether we're viewing the detail panel
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      {/* Left: Drafts — hidden on mobile when detail is open */}
      <Card className={cn("border-[var(--border)]", showDetail && "hidden lg:block")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-[var(--foreground)]">Drafts</h2>
            <Button
              variant="brand"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowDetail(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
          <div className="mt-3 flex gap-1">
            {(["All", "Recruiter", "Follow-up"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
                  filter === f
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]/70"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              No draft messages yet. Tap{" "}
              <strong className="font-medium text-[var(--foreground)]">New</strong>{" "}
              to draft an outreach email.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Right: Message Details — hidden on mobile until New is tapped */}
      <Card className={cn("border-[var(--border)]", !showDetail && "hidden lg:block")}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Back button — mobile only */}
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] lg:hidden"
                aria-label="Back to drafts"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="font-semibold text-[var(--foreground)]">
                Message Details
              </h2>
            </div>
            <span className="rounded-md bg-[var(--brand)] px-2 py-0.5 text-xs font-medium text-[var(--brand-foreground)]">
              Draft
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                To
              </p>
              <p className="text-sm text-[var(--foreground)]">—</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                Position
              </p>
              <p className="text-sm text-[var(--foreground)]">—</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                Created
              </p>
              <p className="text-sm text-[var(--foreground)]">—</p>
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Message Type
            </label>
            <select
              className="mt-1.5 h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--foreground)] sm:max-w-xs"
              defaultValue="Initial Outreach"
            >
              <option>Initial Outreach</option>
              <option>Follow-up</option>
            </select>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Tone
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={cn(
                    "rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition-colors",
                    tone === t
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--accent)]/70"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
