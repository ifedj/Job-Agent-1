import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { applicationId } = await params;

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      jobMatch: { userId },
    },
    include: {
      jobMatch: { include: { job: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    application: {
      id: application.id,
      jobMatchId: application.jobMatchId,
      tailoredCvText: application.tailoredCvText,
      tailoredCoverLetterText: application.tailoredCoverLetterText,
      status: application.status,
      job: {
        id: application.jobMatch.job.id,
        title: application.jobMatch.job.title,
        company: application.jobMatch.job.company,
        url: application.jobMatch.job.url,
        description: application.jobMatch.job.description,
      },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { applicationId } = await params;

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      jobMatch: { userId },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { tailoredCvText, tailoredCoverLetterText, status } = body;

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      ...(typeof tailoredCvText === "string" && { tailoredCvText }),
      ...(typeof tailoredCoverLetterText === "string" && {
        tailoredCoverLetterText,
      }),
      ...(status && ["draft", "ready", "applied"].includes(status) && { status }),
    },
  });

  return NextResponse.json({
    application: {
      id: updated.id,
      tailoredCvText: updated.tailoredCvText,
      tailoredCoverLetterText: updated.tailoredCoverLetterText,
      status: updated.status,
    },
  });
}
