# Personalised Job Search & Application App

A web app that ingests your CV, searches job boards (and company career pages), matches roles to your profile, and lets you approve roles, tailor CVs and cover letters, and send outreach to hiring managers—with you in control at every step.

## Features

- **Auth**: Sign up / sign in (credentials). Profile and CV stored per user.
- **CV upload**: Upload PDF or DOCX. Text is extracted and stored; you can use it for matching and tailored documents.
- **Job search**: Fetches jobs from **multiple sources**. Only roles from the **last 30 days** are shown. **Only direct company job URLs** are stored (no aggregator links). You can change the window in profile preferences later.
  - **SerpAPI (Google Jobs)** (recommended): Set `SERPAPI_API_KEY` for web job search; uses direct apply links when available.
  - **Company career pages**: If you set dream companies in preferences, the app uses Greenhouse and Lever career APIs for those companies and stores **direct job URLs**.
  - **LinkedIn** (optional, use at your own risk): Set `ENABLE_LINKEDIN_SCRAPER=true` to attempt fetching from LinkedIn; see [LinkedIn scraper disclaimer](src/lib/job-sources/linkedin.ts). Not recommended for production.
- **Matching**: Jobs are scored against your profile (skills, experience). You see a match score and short reasons.
- **Verify & approve**: Each job has a **clickable link** to the listing. Open it to confirm the role is still open, then **Approve** or **Reject**. Optional “I verified – role is open” checkbox.
- **Applications**: For each approved role you can generate a **tailored CV and cover letter** (OpenAI), edit them, and download a bundle (CV + cover letter + job link) or open the job link.
- **Outreach**: Add contacts (hiring manager / CEO) manually (name, email, optional LinkedIn URL). Generate an outreach email, edit and approve, then **send** (Resend) or **copy to clipboard** if email is not configured.

## Setup

1. **Install and DB**
   ```bash
   npm install
   npx prisma db push   # or migrate, and ensure DATABASE_URL in .env.local
   ```

2. **Environment (`.env.local`)**
   - `DATABASE_URL` – SQLite default: `file:./prisma/dev.db`
   - `AUTH_SECRET` – any random string for sessions
   - `NEXTAUTH_URL` – e.g. `http://localhost:3000`
  - `SERPAPI_API_KEY` – [SerpAPI](https://serpapi.com/) for Google Jobs search (recommended; direct apply links when available)
  - `OPENAI_API_KEY` – for tailored CV, cover letter, and outreach email
   - Optional: `ENABLE_LINKEDIN_SCRAPER=true` – attempt LinkedIn job fetch (ToS risk; see `src/lib/job-sources/linkedin.ts`)
   - Optional: `RESEND_API_KEY` and `OUTREACH_FROM_EMAIL` – to send outreach emails; otherwise “Send” copies to clipboard
   - In **Settings**, add **dream companies** (company names) to pull jobs from their career pages (Greenhouse/Lever) when available.

3. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Sign up, upload your CV, then go to Jobs to run a search and approve roles.

## Tech

- **Next.js 16** (App Router), **TypeScript**, **Tailwind**
- **Prisma** + **SQLite** (MVP); **NextAuth** (credentials)
- **Job sources**: SerpAPI (Google Jobs), company career pages (Greenhouse/Lever via dream companies), LinkedIn (optional, at your own risk). Only **direct company job URLs** are stored. **OpenAI** for CV/cover letter/outreach; **Resend** (optional) for email

## Plan alignment

- Only roles from the **last 30 days** are included when fetching and listing.
- LinkedIn job fetch is **optional** and off by default; hiring manager/CEO are added manually (and optional LinkedIn URL is stored and linked). **All job links shown to the user are direct company job URLs** (no aggregator redirects).
- You **approve** roles before any application or outreach; you can **edit** CV, cover letter, and outreach email before saving or sending.
