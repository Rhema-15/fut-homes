# FUTMINNA Accommodation Site

## What this is
A listing site where FUTMINNA students find verified off-campus accommodation (Bosso, Gidan Kwano and around Minna) through trusted agents. Owner and only admin: Rhema.

## Launch scope (hard deadline: Oct 19, 2026, when freshers resume)
Launch is a **concierge** version:
- Rhema adds every agent and listing himself through an admin panel. Only Rhema logs in.
- Students do NOT log in. They browse listings and contact the agent on WhatsApp.
- NO payments, NO agent accounts, NO student accounts, NO reviews at launch. Do not build these unless asked.
- Speed over polish. Keep designs plain; Rhema will do the visual design himself later.
- Every listing shows: "Never pay before inspecting."

## Stack
- Next.js 16 (App Router, TypeScript, Tailwind v4). Route protection lives in `proxy.ts` (Next 16 renamed middleware to proxy).
- Supabase (auth + Postgres + storage for photos), using @supabase/ssr. Clients in `lib/supabase/`.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`).
- Code lives on GitHub (Rhema-15/fut-homes); Vercel builds and hosts it from there.
- Built from the FUT HOMES project chat on claude.ai, not locally, because Rhema's laptop struggles with installs.
- Public sign-ups are disabled in Supabase; the one admin user was created manually.

## Build order (one feature per day)
1. Project setup + admin login (/admin/login, protected /admin)
2. Admin forms: add agents (name, WhatsApp number, photo, verification level) and listings with photos under each agent
3. Home + search/filters (price, distance from campus, room type) + listing page
4. "Book inspection" button (opens agent's WhatsApp with a prefilled message) + "mark as taken"
5. Mobile polish + deploy, load 20+ listings, test with 10 students

After launch: payments (held until the student confirms move-in, agent pays a percentage), agent self-signup, reviews.

## Verification levels (for the agent's badge field)
- **ID verified**: ID photo + selfie checked by Rhema, real name and WhatsApp on profile. Enough to list.
- **Trusted agent**: past students the agent housed confirm he's legit (references Rhema finds himself).

## Rules for working on this code
- Build only what the current task asks. No extra libraries or features.
- Every table gets Row Level Security: the public can only read published agents/listings; only the authenticated admin can insert/update/delete.
- Never commit .env.local or any keys.
- Mobile first: most students will use phones on slow data, so keep pages light and images compressed.
- At the end of each session, update the Progress log below in 2-4 lines: what was built, what's left, any problems.

## Progress log
- 2026-10-12, Day 1: Next.js + Supabase set up. /admin/login (email + password), /admin (shows email, log out), proxy.ts guards all /admin routes, home page is a "Coming soon" placeholder. Next: connect Vercel, add env vars, test login live. Day 2: agents + listings tables with RLS, admin forms.
