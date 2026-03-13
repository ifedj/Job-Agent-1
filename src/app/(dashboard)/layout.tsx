import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "./AppSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar user={session.user} />
      <main className="flex-1 overflow-auto px-6 py-8">{children}</main>
    </div>
  );
}
