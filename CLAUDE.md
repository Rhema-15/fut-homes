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
- 2026-10-12, Day 1: Next.js + Supabase set up. /admin/login (email + password), /admin (shows email, log out), proxy.ts guards all /admin routes, home page is a "Coming soon" placeholder. Live on Vercel. Env vars were missing at first (caused Internal Server Error on /admin); added as "Config" type on Oct 12; the URL value was also wrong at first ("fetch failed" on login) and was re-pasted. Admin password reset via SQL.
- 2026-10-12, Day 2: SQL in supabase/migrations/001_agents_listings.sql (admins, agents, listings, listing_photos, public "photos" bucket, RLS: public reads active/published, only admins table members write). Admin panel: dashboard counts, /admin/agents (+ new), /admin/listings (+ new). Photos are compressed in the browser and uploaded straight to Storage. Listing photos can also come from a video: the browser pulls 6 still shots (agents share rooms as WhatsApp videos), and the video itself is shrunk in the browser (MediaRecorder, no sound, ~700kbps; falls back to original ≤25MB) and stored in the public "videos" bucket as listings.video_path (SQL: 002_listing_videos.sql). Not built yet: edit/delete. Next: Day 3 public home + search + listing page.
- 2026-10-12, open issue: on the Day 2 test Rhema got "Error: JWT failed verification" (not yet known whether in photo/video upload, Save listing, or the SQL editor; not known if 002_listing_videos.sql ran). First thing next session: find where it appears, try log out/in, then finish testing add agent + add listing (photos and video). Then Day 3 needs Rhema's brand basics (logo/wordmark, 2-3 colours, font, vibe).
