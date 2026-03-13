import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
  });
  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({
    profile: {
      structuredCv: JSON.parse(profile.structuredCv),
      preferences: JSON.parse(profile.preferences),
      originalCvPath: profile.originalCvPath,
      updatedAt: profile.updatedAt,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { structuredCv, preferences } = body;

  const data: { structuredCv?: string; preferences?: string } = {};
  if (structuredCv != null) data.structuredCv = JSON.stringify(structuredCv);
  if (preferences != null) data.preferences = JSON.stringify(preferences);

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      structuredCv: data.structuredCv ?? "{}",
      preferences: data.preferences ?? "{}",
    },
    update: data,
  });

  return NextResponse.json({
    profile: {
      structuredCv: JSON.parse(profile.structuredCv),
      preferences: JSON.parse(profile.preferences),
      updatedAt: profile.updatedAt,
    },
  });
}
