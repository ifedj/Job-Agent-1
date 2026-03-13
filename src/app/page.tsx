import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Personalised Job Search & Application
      </h1>
      <p className="mt-2 max-w-md text-center text-zinc-600">
        Upload your CV, search job boards and company career pages, match roles to your profile, and apply with tailored CVs and cover letters.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white hover:bg-zinc-800"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 font-medium text-zinc-900 hover:bg-zinc-50"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
