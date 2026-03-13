import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { jobId } = await params;

  const jobMatch = await prisma.jobMatch.findFirst({
    where: { userId, jobId },
    include: { job: true },
  });

  if (!jobMatch) {
    return NextResponse.json({ match: null });
  }

  return NextResponse.json({
    match: {
      id: jobMatch.id,
      jobId: jobMatch.jobId,
      score: jobMatch.score,
      matchReasons: jobMatch.matchReasons ? JSON.parse(jobMatch.matchReasons) : [],
      status: jobMatch.status,
      userVerifiedOpen: jobMatch.userVerifiedOpen,
      job: {
        id: jobMatch.job.id,
        title: jobMatch.job.title,
        company: jobMatch.job.company,
        url: jobMatch.job.url,
      },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { jobId } = await params;

  const body = await request.json().catch(() => ({}));
  const { status, userVerifiedOpen } = body;

  if (status !== "approved" && status !== "rejected" && status !== "pending") {
    return NextResponse.json(
      { error: "Invalid status. Use approved, rejected, or pending." },
      { status: 400 }
    );
  }

  const jobMatch = await prisma.jobMatch.findFirst({
    where: { userId, jobId },
  });

  if (!jobMatch) {
    return NextResponse.json(
      { error: "No match found for this job. Run matching first." },
      { status: 404 }
    );
  }

  const updated = await prisma.jobMatch.update({
    where: { id: jobMatch.id },
    data: {
      ...(status != null && { status }),
      ...(status === "approved" && { approvedAt: new Date() }),
      ...(typeof userVerifiedOpen === "boolean" && { userVerifiedOpen }),
    },
  });

  return NextResponse.json({
    match: {
      id: updated.id,
      status: updated.status,
      userVerifiedOpen: updated.userVerifiedOpen,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
    },
  });
}
