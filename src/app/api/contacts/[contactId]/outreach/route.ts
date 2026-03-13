import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOutreachEmail } from "@/lib/llm";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { contactId } = await params;

  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      application: { jobMatch: { userId } },
    },
    include: { application: { include: { jobMatch: { include: { job: true } } } } },
  });

  if (!contact?.application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const job = contact.application.jobMatch.job;

  try {
    const { subject, body } = await generateOutreachEmail(
      job.title,
      job.company,
      contact.name
    );

    const outreach = await prisma.outreach.create({
      data: {
        contactId: contact.id,
        applicationId: contact.applicationId ?? undefined,
        emailSubject: subject,
        emailBody: body,
        status: "draft",
      },
    });

    return NextResponse.json({
      outreach: {
        id: outreach.id,
        emailSubject: outreach.emailSubject,
        emailBody: outreach.emailBody,
        status: outreach.status,
      },
    });
  } catch (e) {
    console.error("Outreach generate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
