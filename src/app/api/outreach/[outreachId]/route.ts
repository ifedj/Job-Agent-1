import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ outreachId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;
  const { outreachId } = await params;

  const outreach = await prisma.outreach.findFirst({
    where: {
      id: outreachId,
      contact: { application: { jobMatch: { userId } } },
    },
  });

  if (!outreach) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { emailSubject, emailBody, status } = body;

  const updated = await prisma.outreach.update({
    where: { id: outreachId },
    data: {
      ...(typeof emailSubject === "string" && { emailSubject }),
      ...(typeof emailBody === "string" && { emailBody }),
      ...(status && ["draft", "approved", "sent"].includes(status) && { status }),
    },
  });

  return NextResponse.json({
    outreach: {
      id: updated.id,
      emailSubject: updated.emailSubject,
      emailBody: updated.emailBody,
      status: updated.status,
    },
  });
}
