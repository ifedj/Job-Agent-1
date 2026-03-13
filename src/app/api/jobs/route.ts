import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_MAX_AGE_DAYS = 30;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const maxAgeDays = Number(searchParams.get("maxAgeDays")) || DEFAULT_MAX_AGE_DAYS;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const jobs = await prisma.job.findMany({
    where: {
      OR: [
        { postedAt: { gte: cutoff } },
        { postedAt: null },
      ],
    },
    orderBy: { postedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      externalId: j.externalId,
      source: j.source,
      company: j.company,
      title: j.title,
      location: j.location,
      url: j.url,
      description: j.description,
      salaryRaw: j.salaryRaw,
      postedAt: j.postedAt?.toISOString() ?? null,
    })),
  });
}
