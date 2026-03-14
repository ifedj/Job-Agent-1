import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApplicationsList } from "./ApplicationsList";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/applications");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#0a0a0a]">Applications</h1>
      <p className="mt-1 text-zinc-600">
        For each approved role you can generate a tailored CV and cover letter, edit them, then download or prepare your application.
      </p>
      <ApplicationsList />
    </div>
  );
}
