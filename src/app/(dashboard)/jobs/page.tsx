import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { JobsList } from "./JobsList";

export default async function JobsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/jobs");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#0a0a0a]">Jobs</h1>
      <p className="mt-1 text-[#374151]">
        Only roles published in the past 30 days are shown. Click a job link to verify it is still open before approving.
      </p>
      <JobsList />
    </div>
  );
}
