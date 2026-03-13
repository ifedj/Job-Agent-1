import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const body = await request.json().catch(() => ({}));
  const { jobMatchId } = body;
  if (!jobMatchId) {
    return NextResponse.json(
      { error: "jobMatchId required" },
      { status: 400 }
    );
  }

  const jobMatch = await prisma.jobMatch.findFirst({
    where: { id: jobMatchId, userId, status: "approved" },
    include: { application: true },
  });

  if (!jobMatch) {
    return NextResponse.json(
      { error: "Approved job match not found" },
      { status: 404 }
    );
  }

  if (jobMatch.application) {
    return NextResponse.json({
      application: {
        id: jobMatch.application.id,
        jobMatchId: jobMatch.application.jobMatchId,
      },
    });
  }

  const application = await prisma.application.create({
    data: {
      jobMatchId: jobMatch.id,
      status: "draft",
    },
  });

  return NextResponse.json({
    application: {
      id: application.id,
      jobMatchId: application.jobMatchId,
    },
  });
}
