import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { extractTextFromFile } from "@/lib/cv-parse";
import type { StructuredCv, ProfilePreferences } from "@/types/profile";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "cv");
const EMPTY_CV: StructuredCv = { skills: [], experience: [], education: [] };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    if (
      !name.endsWith(".pdf") &&
      !name.endsWith(".docx") &&
      !name.endsWith(".doc")
    ) {
      return NextResponse.json(
        { error: "Only PDF and DOCX are supported" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const userDir = path.join(UPLOAD_DIR, userId);
    await mkdir(userDir, { recursive: true });
    const ext = path.extname(file.name) || ".bin";
    const savedName = `${Date.now()}${ext}`;
    const filePath = path.join(userDir, savedName);
    await writeFile(filePath, buffer);

    const rawText = await extractTextFromFile(buffer, ext);
    const structuredCv: StructuredCv = {
      skills: [],
      experience: [],
      education: [],
      summary: rawText.slice(0, 4000),
    };
    const relativePath = path.relative(process.cwd(), filePath);

    const existing = await prisma.profile.findUnique({ where: { userId } });
    const defaultPrefs: ProfilePreferences = { maxJobAgeDays: 30 };
    const mergedPrefs = existing?.preferences
      ? { ...defaultPrefs, ...(JSON.parse(existing.preferences) as ProfilePreferences) }
      : defaultPrefs;

    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        structuredCv: JSON.stringify(structuredCv),
        originalCvPath: relativePath,
        preferences: JSON.stringify(mergedPrefs),
      },
      update: {
        structuredCv: JSON.stringify(structuredCv),
        originalCvPath: relativePath,
        preferences: JSON.stringify(mergedPrefs),
      },
    });

    return NextResponse.json({
      ok: true,
      structuredCv,
      preferences: mergedPrefs,
    });
  } catch (e) {
    console.error("CV upload error:", e);
    return NextResponse.json(
      { error: "Failed to process CV" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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
    return NextResponse.json({ ok: true, profile: null });
  }

  if (profile.originalCvPath) {
    try {
      const fullPath = path.join(process.cwd(), profile.originalCvPath);
      await unlink(fullPath);
    } catch {
      // ignore file not found
    }
  }

  const updated = await prisma.profile.update({
    where: { userId },
    data: {
      originalCvPath: null,
      structuredCv: JSON.stringify(EMPTY_CV),
    },
  });

  const prefs = JSON.parse(updated.preferences);
  return NextResponse.json({
    ok: true,
    structuredCv: EMPTY_CV,
    preferences: prefs,
  });
}
