"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONES = ["Professional", "Friendly", "Formal", "Enthusiastic"] as const;

export function OutreachMessagesClient() {
  const [tone, setTone] = useState<(typeof TONES)[number]>("Professional");
  const [filter, setFilter] = useState<"All" | "Recruiter" | "Follow-up">("All");

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Left: Drafts */}
      <Card className="border-[var(--border)]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-[var(--foreground)]">Drafts</h2>
            <Button variant="brand" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            {(["All", "Recruiter", "Follow-up"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === f
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]/70"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-0 border-t border-[var(--border)] pt-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              No draft messages yet. Create an application and add contacts to
              draft outreach emails.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Right: Message Details */}
      <Card className="border-[var(--border)]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-semibold text-[var(--foreground)]">
              Message Details
            </h2>
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
              className="mt-1.5 w-full max-w-xs rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--foreground)]"
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
                    "rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium transition-colors",
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
