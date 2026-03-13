# Product specification: Job Search App

## Goals

### Business goals

- Provide a single place for users to manage job search: one profile, one set of preferences, one dashboard.
- Differentiate by putting the user in control: approve roles, edit tailored CV/cover letter and outreach before applying or sending.
- Use job boards and profile-based matching (no LinkedIn scraping) to stay compliant and maintainable.

### User goals

- Upload one CV and set preferences once (role, locations, industries, company types, salary) so the app only shows relevant, recent roles.
- See a clear dashboard (stats and targeting summary) and run job search on demand.
- Verify each role (open link), then approve or reject; for approved roles, get tailored CV and cover letter, edit them, and apply or prepare an application.
- Optionally add hiring manager/CEO contacts, generate and edit outreach email, then send or copy—all after explicit approval.

---

## Non-Goals (for this version)

- No LinkedIn scraping or automated LinkedIn apply; no "agent running live" or background automation.
- No API keys or sensitive config in the UI (keys stay in env only).
- No multi-tenant or B2B features; single user per account.
- No mobile app or native client; web only.

---

## User stories

- **Onboarding:** As a user, I can sign up, upload my CV (or replace/remove it), and set my target (role, salary, experience, locations, industries, company stage, dream companies) in a guided flow so that my first visit is focused and my preferences are saved before I search.
- **Dashboard:** As a user, I see a greeting, my targeting summary, and stats (jobs found, pending, approved, applications, outreach sent) with links to Jobs and Applications so I know where I stand at a glance.
- **Job search:** As a user, I can run a job search (using my preferences) and see matched roles with score and match reasons, open job links to verify they're still open, and approve or reject roles so only roles I want move forward.
- **Applications:** As a user, for each approved role I can generate a tailored CV and cover letter, edit them, and download a bundle or open the job link so I can apply on my terms.
- **Outreach:** As a user, I can add a contact (name, email, optional LinkedIn URL) for an application, generate an outreach email, edit and approve it, then send (if email is configured) or copy so I control what gets sent.
- **Settings:** As a user, I can change my CV (upload, replace, remove) and edit all my preferences (target, locations, industries, company stage, salary, etc.) in one place so my profile stays up to date.

---

## Architecture

- **App shell:** Single dashboard layout with a left sidebar (Dashboard, Jobs, Applications, Settings), light theme (slate/indigo). All authenticated routes share this shell; unauthenticated users redirect to login with callbackUrl.
- **Routes:** `/` (home), `/register`, `/login`, `/dashboard` (stats; redirects to `/onboarding` if profile incomplete), `/onboarding` (multi-step: CV, Set target, Targeting), `/jobs` (run search, matched list, approve/reject), `/applications` (list), `/applications/[id]` (editor + outreach), `/settings` (CV + preferences).
- **Data flow:** Profile (CV + preferences JSON) stored in DB; job search uses Adzuna API and preferences (keyword, location, max age); matched jobs scored and stored as JobMatch; approved roles get Application records; contacts and Outreach linked to applications. APIs: profile (GET/PATCH), profile/cv (POST/DELETE), jobs/search (POST), jobs/matched (GET), jobs/[jobId]/match (PATCH), applications (GET), applications/create (POST), applications/[id] (PATCH), applications/[id]/generate (POST), applications/[id]/contacts (GET/POST), contacts/[id]/outreach (POST), outreach/[id] (PATCH), outreach/[id]/send (POST).
