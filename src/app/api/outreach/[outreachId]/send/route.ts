import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
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
    include: { contact: true },
  });

  if (!outreach) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (outreach.status === "sent") {
    return NextResponse.json(
      { error: "Already sent" },
      { status: 400 }
    );
  }

  const fromEmail = process.env.OUTREACH_FROM_EMAIL ?? process.env.EMAIL_FROM;
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey && fromEmail) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: outreach.contact.email,
          subject: outreach.emailSubject,
          text: outreach.emailBody,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: err.message ?? "Send failed" },
          { status: 500 }
        );
      }
    } catch (e) {
      console.error("Resend error:", e);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } else {
    return NextResponse.json(
      {
        ok: false,
        copied: true,
        message: "Email not sent (no RESEND_API_KEY or OUTREACH_FROM_EMAIL). Copy below.",
        email: {
          to: outreach.contact.email,
          subject: outreach.emailSubject,
          body: outreach.emailBody,
        },
      },
      { status: 200 }
    );
  }

  await prisma.outreach.update({
    where: { id: outreachId },
    data: { status: "sent", sentAt: new Date() },
  });

  return NextResponse.json({ ok: true, sent: true });
}
