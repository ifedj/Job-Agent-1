import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Briefcase,
  Mail,
  TrendingUp,
  Target,
  Lightbulb,
} from "lucide-react";
import { TopMatchesList } from "./TopMatchesList";

type DashboardStatsProps = {
  userId: string;
  userName: string;
  preferences: Record<string, unknown>;
  stats: {
    jobsCount: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    applicationsCount: number;
    outreachSentCount: number;
  };
  profileComplete: boolean;
  hasCv: boolean;
  hasPreferences: boolean;
};

export function DashboardStats({
  userName,
  stats,
  profileComplete,
  hasCv,
  hasPreferences,
}: DashboardStatsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-3xl">
          Welcome back, {userName}!
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)] sm:text-base">
          Here are your personalized job matches for today.
        </p>
      </div>

      {/* Metric cards — 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-4 sm:p-5">
            <Sparkles className="h-4 w-4 text-[var(--brand)] sm:h-5 sm:w-5" />
            <p className="mt-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {stats.jobsCount}
            </p>
            <p className="text-xs font-medium text-[var(--muted-foreground)] sm:text-sm">
              New Matches
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              +{stats.pendingCount} pending
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-4 sm:p-5">
            <Briefcase className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
            <p className="mt-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {stats.applicationsCount}
            </p>
            <p className="text-xs font-medium text-[var(--muted-foreground)] sm:text-sm">
              Applications
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {stats.approvedCount} approved
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-4 sm:p-5">
            <Mail className="h-4 w-4 text-[var(--brand)] sm:h-5 sm:w-5" />
            <p className="mt-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {stats.outreachSentCount}
            </p>
            <p className="text-xs font-medium text-[var(--muted-foreground)] sm:text-sm">
              Messages Sent
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              From applications
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-4 sm:p-5">
            <TrendingUp className="h-4 w-4 text-pink-500 sm:h-5 sm:w-5" />
            <p className="mt-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              —
            </p>
            <p className="text-xs font-medium text-[var(--muted-foreground)] sm:text-sm">
              Profile Views
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two columns: Top Matches + Sidebar — stacked on mobile */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Top Matches
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/jobs">Filter</Link>
            </Button>
          </div>
          <div className="mt-4">
            <TopMatchesList />
          </div>
          {stats.jobsCount === 0 && (
            <Card className="mt-6 p-6 text-center">
              <CardContent className="p-0">
                <p className="text-[var(--muted-foreground)]">
                  No jobs yet. Run a search to find roles that match your
                  profile.
                </p>
                <Button asChild className="mt-4" variant="brand">
                  <Link href="/jobs">Go to Jobs</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Profile Strength</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Completion {profileComplete ? "100" : hasCv && hasPreferences ? "85" : hasCv ? "50" : "25"}%
                </p>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--foreground)]"
                    style={{
                      width: profileComplete ? "100%" : hasCv && hasPreferences ? "85%" : hasCv ? "50%" : "25%",
                    }}
                  />
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${hasCv ? "bg-green-500" : "bg-[var(--muted-foreground)]"}`}
                  />
                  CV uploaded
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${hasPreferences ? "bg-green-500" : "bg-[var(--muted-foreground)]"}`}
                  />
                  Preferences set
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Add portfolio
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              <Button variant="outline" size="sm" className="justify-start" asChild>
                <Link href="/applications" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  View Applications
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start" asChild>
                <Link href="/applications" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Draft Outreach
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="justify-start" asChild>
                <Link href="/settings" className="gap-2">
                  <Target className="h-4 w-4" />
                  Update Preferences
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-gradient-to-br from-[var(--brand)] to-indigo-700 text-[var(--brand-foreground)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                <h3 className="font-semibold">Pro Tip</h3>
              </div>
              <p className="mt-2 text-sm opacity-95">
                Jobs posted in the last 24 hours get 3x more applications. Apply
                early to stand out!
              </p>
              <Button
                size="sm"
                className="mt-4 bg-white text-[var(--brand)] hover:bg-white/90"
                asChild
              >
                <Link href="/jobs">Learn More</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
