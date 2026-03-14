import Link from "next/link";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function targetingSummary(preferences: Record<string, unknown>): string {
  const role = preferences.targetRole as string | undefined;
  const industries = preferences.industries as string[] | undefined;
  const locations = preferences.locations as string[] | undefined;
  const parts: string[] = [];
  if (role) parts.push(role);
  if (industries?.length) parts.push(industries.slice(0, 2).join(", ") + (industries.length > 2 ? ` +${industries.length - 2}` : ""));
  if (locations?.length) parts.push(locations.slice(0, 2).join(", ") + (locations.length > 2 ? ` +${locations.length - 2}` : ""));
  if (parts.length === 0) return "Set your preferences in Settings.";
  return "Targeting " + parts.join(" in ");
}

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
};

export function DashboardStats({ userName, preferences, stats }: DashboardStatsProps) {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div>
      <p className="text-sm text-[#6b7280]">{dateStr}</p>
      <h1 className="mt-1 text-2xl font-semibold text-[#0a0a0a]">
        {greeting()}, {userName} 👋
      </h1>
      <p className="mt-2 text-[#374151]">{targetingSummary(preferences)}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Jobs found"
          value={stats.jobsCount}
          href="/jobs"
          icon="📋"
        />
        <StatCard
          label="Pending review"
          value={stats.pendingCount}
          href="/jobs"
          icon="⏳"
        />
        <StatCard
          label="Approved"
          value={stats.approvedCount}
          href="/jobs"
          icon="✓"
        />
        <StatCard
          label="Applications"
          value={stats.applicationsCount}
          href="/applications"
          icon="📄"
        />
        <StatCard
          label="Outreach sent"
          value={stats.outreachSentCount}
          href="/applications"
          icon="✉️"
        />
      </div>

      {stats.jobsCount === 0 && (
        <div className="mt-8 rounded-xl border border-[#e5e7eb] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <p className="text-[#374151]">No jobs yet. Run a search to find roles that match your profile.</p>
          <Link
            href="/jobs"
            className="mt-4 inline-block rounded-lg bg-[#000000] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Go to Jobs
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md"
    >
      <span className="text-2xl" aria-hidden>{icon}</span>
      <p className="mt-2 text-2xl font-semibold text-[#0a0a0a]">{value}</p>
      <p className="text-sm font-medium text-[#6b7280]">{label}</p>
    </Link>
  );
}
