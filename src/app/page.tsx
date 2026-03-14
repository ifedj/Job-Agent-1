import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#ffffff] px-4">
      <h1 className="text-2xl font-semibold text-[#0a0a0a]">
        Personalised Job Search & Application
      </h1>
      <p className="mt-2 max-w-md text-center text-[#374151]">
        Upload your CV, search job boards and company career pages, match roles to your profile, and apply with tailored CVs and cover letters.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-[#000000] px-5 py-2.5 font-medium text-white hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-[#f3f4f6] px-5 py-2.5 font-medium text-[#111111] hover:bg-[#e5e7eb]"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
