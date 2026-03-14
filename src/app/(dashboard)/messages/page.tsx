import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OutreachMessagesClient } from "./OutreachMessagesClient";
import { prisma } from "@/lib/db";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/messages");
  const userId = (session.user as { id: string }).id;

  const [draftCount, sentThisWeek, outreachTotal] = await Promise.all([
    prisma.outreach.count({
      where: {
        contact: { jobMatch: { userId } },
        status: "draft",
      },
    }),
    prisma.outreach.count({
      where: {
        contact: { jobMatch: { userId } },
        status: "sent",
        sentAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.outreach.count({
      where: { contact: { jobMatch: { userId } }, status: "sent" },
    }),
  ]);
  const responseCount = 0; // placeholder until we track responses
  const responseRate =
    outreachTotal > 0
      ? Math.round((responseCount / outreachTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Outreach Messages
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          AI-generated personalized emails to boost your applications
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OutreachStatCard label="Draft Messages" value={String(draftCount)} />
        <OutreachStatCard label="Sent This Week" value={String(sentThisWeek)} />
        <OutreachStatCard label="Response Rate" value={`${responseRate}%`} />
        <OutreachStatCard label="Avg. Response Time" value="—" />
      </div>

      <OutreachMessagesClient />
    </div>
  );
}

function OutreachStatCard({
  label,
  value,
}: {
  label: string;
  value: string;
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
