import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTailoredCv, generateCoverLetter } from "@/lib/llm";
import type { StructuredCv } from "@/types/profile";

export async function POST(
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

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });
  if (!profile?.structuredCv) {
    return NextResponse.json(
      { error: "Upload your CV on the dashboard first" },
      { status: 400 }
    );
  }

  const structuredCv = JSON.parse(profile.structuredCv) as StructuredCv;
  const job = application.jobMatch.job;

  try {
    const [tailoredCvText, tailoredCoverLetterText] = await Promise.all([
      generateTailoredCv(
        structuredCv,
        job.title,
        job.company,
        job.description ?? ""
      ),
      generateCoverLetter(
        structuredCv,
        job.title,
        job.company,
        job.description ?? ""
      ),
    ]);

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        tailoredCvText,
        tailoredCoverLetterText,
        status: "draft",
      },
    });

    return NextResponse.json({
      ok: true,
      tailoredCvText,
      tailoredCoverLetterText,
    });
  } catch (e) {
    console.error("Generate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
