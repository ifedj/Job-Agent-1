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
    include: { contacts: { include: { outreachs: true } } },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contacts = application.contacts.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    source: c.source,
    linkedinUrl: c.linkedinUrl,
    outreachs: c.outreachs.map((o) => ({
      id: o.id,
      emailSubject: o.emailSubject,
      emailBody: o.emailBody,
      status: o.status,
      sentAt: o.sentAt?.toISOString() ?? null,
    })),
  }));

  return NextResponse.json({ contacts });
}

export async function POST(
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
  const { name, email, linkedinUrl } = body;
  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email required" },
      { status: 400 }
    );
  }

  const contact = await prisma.contact.create({
    data: {
      applicationId: application.id,
      name: String(name).trim(),
      email: String(email).trim(),
      source: "manual",
      linkedinUrl: linkedinUrl ? String(linkedinUrl).trim() : null,
    },
  });

  return NextResponse.json({
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      source: contact.source,
      linkedinUrl: contact.linkedinUrl,
    },
  });
}
