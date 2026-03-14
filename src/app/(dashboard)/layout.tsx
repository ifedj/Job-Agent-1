import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Layout } from "../components/Layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return <Layout user={session.user}>{children}</Layout>;
}
