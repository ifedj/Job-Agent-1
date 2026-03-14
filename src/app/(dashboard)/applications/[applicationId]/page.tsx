import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ApplicationEditor } from "./ApplicationEditor";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/applications");
  const userId = (session.user as { id: string }).id;
  const { applicationId } = await params;

  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      jobMatch: { userId },
    },
    include: { jobMatch: { include: { job: true } } },
  });

  if (!application) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#0a0a0a]">
        {application.jobMatch.job.title} at {application.jobMatch.job.company}
      </h1>
      <a
        href={application.jobMatch.job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm text-[#7c3aed] hover:underline"
      >
        View job listing
      </a>
      <ApplicationEditor
        applicationId={application.id}
        initialCv={application.tailoredCvText ?? ""}
        initialCoverLetter={application.tailoredCoverLetterText ?? ""}
        jobUrl={application.jobMatch.job.url}
        jobTitle={application.jobMatch.job.title}
        jobCompany={application.jobMatch.job.company}
      />
    </div>
  );
}
