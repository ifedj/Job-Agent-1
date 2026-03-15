import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-[var(--foreground)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-[var(--brand-foreground)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight">JobAgent</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="brand" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <main className="mx-auto max-w-6xl px-4 pt-20 pb-12 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Left: copy + CTAs + stats */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-muted)] px-3.5 py-1.5 text-sm font-medium text-[var(--brand)]">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Job Search
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-5xl">
              Your Personal AI Job Agent
            </h1>
            <p className="mt-4 text-base text-[var(--muted-foreground)] sm:text-lg">
              Find your dream job faster with AI that personalizes your CV, crafts
              compelling cover letters, and drafts perfect outreach emails for
              every opportunity.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button variant="brand" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/register" className="inline-flex items-center justify-center gap-2">
                  Start Finding Jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-8">
              <div>
                <p className="text-xl font-semibold text-[var(--foreground)] sm:text-3xl">
                  50K+
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)] sm:text-sm">
                  Jobs Matched
                </p>
              </div>
              <div>
                <p className="text-xl font-semibold text-[var(--foreground)] sm:text-3xl">
                  10K+
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)] sm:text-sm">
                  Happy Users
                </p>
              </div>
              <div>
                <p className="text-xl font-semibold text-[var(--foreground)] sm:text-3xl">
                  95%
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)] sm:text-sm">
                  Success Rate
                </p>
              </div>
            </div>
          </div>

          {/* Right: hero image — hidden on mobile to keep page light */}
          <div className="relative hidden lg:block lg:pl-4">
            <div className="relative overflow-hidden rounded-2xl bg-[var(--muted)] shadow-xl ring-1 ring-[var(--border)]">
              <Image
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
                alt="Modern office workspace"
                width={800}
                height={600}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Everything You Need */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Everything You Need to Land Your Dream Job
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-[var(--muted-foreground)] sm:text-base">
            Our AI-powered platform handles the heavy lifting so you can focus
            on what matters—getting hired.
          </p>
          <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {[
              {
                title: "Smart Job Matching",
                desc: "Our AI analyzes your skills and preferences to find the perfect roles that match your career goals.",
                icon: "target",
                color: "bg-[var(--brand)]",
              },
              {
                title: "Custom CV Generation",
                desc: "Automatically tailor your CV for each job application, highlighting the most relevant experience.",
                icon: "file",
                color: "bg-blue-600",
              },
              {
                title: "Outreach Emails",
                desc: "Get AI-drafted personalized emails to hiring managers and recruiters that get responses.",
                icon: "mail",
                color: "bg-blue-500",
              },
              {
                title: "One-Click Apply",
                desc: "Apply to multiple jobs in seconds with pre-filled applications and customized materials.",
                icon: "bolt",
                color: "bg-[var(--brand)]",
              },
              {
                title: "Application Tracking",
                desc: "Monitor all your applications in one place with status updates and follow-up reminders.",
                icon: "chart",
                color: "bg-pink-500",
              },
              {
                title: "AI Cover Letters",
                desc: "Generate compelling, personalized cover letters that showcase why you're the perfect fit.",
                icon: "sparkle",
                color: "bg-[var(--brand)]",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              >
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${f.color} text-white`}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-[var(--foreground)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
            How It Works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[var(--muted-foreground)] sm:text-base">
            Get started in minutes and let AI do the work
          </p>
          <div className="mt-8 grid gap-6 sm:mt-12 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload Your CV",
                desc: "Share your resume and tell us about your dream job. Our AI will understand your skills and career goals.",
              },
              {
                step: "02",
                title: "Get Matched",
                desc: "Receive personalized job recommendations with AI-customized CVs and cover letters for each role.",
              },
              {
                step: "03",
                title: "Apply & Track",
                desc: "Apply with one click and track all your applications with automated follow-ups and status updates.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--brand)] bg-[var(--brand)] text-lg font-semibold text-white">
                  {s.step}
                </div>
                <h3 className="mt-4 font-semibold text-[var(--foreground)]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-gradient-to-r from-[var(--brand)] to-indigo-700 px-6 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Ready to Find Your Next Role?
            </h2>
            <p className="mt-3 text-sm text-white/90 sm:text-base">
              Join thousands of professionals who&apos;ve landed their dream
              jobs with JobAgent
            </p>
            <Button
              size="lg"
              className="mt-6 w-full bg-white text-[var(--brand)] hover:bg-white/90 sm:w-auto"
              asChild
            >
              <Link href="/register" className="inline-flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
