import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const matches = await prisma.jobMatch.findMany({
    where: { userId, status: "approved" },
    include: {
      job: true,
      application: true,
    },
    orderBy: { approvedAt: "desc" },
  });

  const applications = matches.map((m) => ({
    jobMatchId: m.id,
    job: {
      id: m.job.id,
      title: m.job.title,
      company: m.job.company,
      url: m.job.url,
    },
    application: m.application
      ? {
          id: m.application.id,
          status: m.application.status,
          hasCv: !!m.application.tailoredCvText,
          hasCoverLetter: !!m.application.tailoredCoverLetterText,
        }
      : null,
  }));

  return NextResponse.json({ applications });
}
