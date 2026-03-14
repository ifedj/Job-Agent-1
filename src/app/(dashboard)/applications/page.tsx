import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ApplicationsList } from "./ApplicationsList";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/applications");
  const userId = (session.user as { id: string }).id;

  const [total, underReview, interviews] = await Promise.all([
    prisma.application.count({
      where: { jobMatch: { userId } },
    }),
    prisma.application.count({
      where: { jobMatch: { userId }, status: { in: ["draft", "ready"] } },
    }),
    prisma.application.count({
      where: { jobMatch: { userId }, status: "applied" },
    }),
  ]);
  const responseRate = total > 0 ? Math.round((interviews / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Applications
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Track and manage all your job applications
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applications" value={total} />
        <StatCard label="Under Review" value={underReview} />
        <StatCard label="Interviews" value={interviews} />
        <StatCard label="Response Rate" value={`${responseRate}%`} />
      </div>

      <ApplicationsList />
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <p className="text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-sm font-medium text-[var(--muted-foreground)]">
        {label}
      </p>
    </div>
  );
}
