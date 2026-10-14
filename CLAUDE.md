# FUTMINNA Accommodation Site

## What this is
A listing site where FUTMINNA students find verified off-campus accommodation (Bosso, Gidan Kwano and around Minna) through trusted agents. Owner and only admin: Rhema.

## Launch scope (hard deadline: Oct 19, 2026, when freshers resume)
Launch is a **concierge** version:
- Rhema adds every agent and listing himself through an admin panel. Only Rhema logs in.
- Students do NOT log in. They browse listings and contact the agent on WhatsApp.
- NO payments, NO agent accounts, NO student accounts, NO reviews at launch. Do not build these unless asked.
- Follow Rhema's brand: kit https://claude.ai/artifact/QcBb9Hy117D8SwFF5Sf4MD (tokens, components), screens https://claude.ai/artifact/3tZGkyKCK71nZdKufXUqpJ, brand doc https://claude.ai/code/artifact/ef8df7d9-610c-4db7-ba51-97df60395631. Tokens live in app/globals.css (@theme). Plus Jakarta Sans 400/600/800 via next/font (latin + latin-ext for ₦). Wordmark is lowercase text "fut homes" until the logo is final. Admin pages stay plain.
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

## Agent badges (no ID checks since Oct 14)
Rhema ticks three checks per agent in admin (agents.long_time_poster, still_posting, students_confirmed; logic in lib/agent-checks.ts):
1. Has been posting rooms around FUT for a long time
2. Still actively posting rooms
3. Past students (found by Rhema) confirmed they rented through the agent
Nothing ticked: no badge. 1 or 2: "Verified". 3: "Trusted agent". The badge sheet lists only the ticked checks. Never claim ID checks anywhere.

## Rules for working on this code
- Build only what the current task asks. No extra libraries or features.
- Every table gets Row Level Security: the public can only read published agents/listings; only the authenticated admin can insert/update/delete.
- Never commit .env.local or any keys.
- Mobile first: most students will use phones on slow data, so keep pages light and images compressed.
- At the end of each session, update the Progress log below in 2-4 lines: what was built, what's left, any problems.

## Progress log
- 2026-10-12, Day 1: Next.js + Supabase set up. /admin/login (email + password), /admin (shows email, log out), proxy.ts guards all /admin routes, home page is a "Coming soon" placeholder. Live on Vercel. Env vars were missing at first (caused Internal Server Error on /admin); added as "Config" type on Oct 12; the URL value was also wrong at first ("fetch failed" on login) and was re-pasted. Admin password reset via SQL.
- 2026-10-12, Day 2: SQL in supabase/migrations/001_agents_listings.sql (admins, agents, listings, listing_photos, public "photos" bucket, RLS: public reads active/published, only admins table members write). Admin panel: dashboard counts, /admin/agents (+ new), /admin/listings (+ new). Photos are compressed in the browser and uploaded straight to Storage. Listing photos can also come from a video: the browser pulls 6 still shots (agents share rooms as WhatsApp videos), and the video itself is shrunk in the browser (MediaRecorder, no sound, ~700kbps; falls back to original ≤25MB) and stored in the public "videos" bucket as listings.video_path (SQL: 002_listing_videos.sql). Not built yet: edit/delete. Next: Day 3 public home + search + listing page.
- 2026-10-12, Day 3: JWT fix (uploads check the login first; expired logins show "log out and back in"). Photos now WebP ≤1000px. SQL 003_distance_trusted_video_length.sql adds listings.distance_km, listings.video_seconds, agents.is_trusted (admin: checkbox; verification_level kept in sync). Public pages in app/(site): home (search + new rooms), /rooms (filters as GET params, chips, sort, empty state), /rooms/[id] (swipe gallery, tap-to-load video, badge sheet, safety warning, sticky WhatsApp bar with prefilled message), /how-it-works. Public reads use an anon client in lib/public-data.ts. Local builds need NEXT_FONT_GOOGLE_MOCKED_RESPONSES (Google Fonts blocked in the build container). Next (Day 4): report via WhatsApp to Rhema's number, For agents page, mark as taken + edit/delete in admin, official WhatsApp glyph.
- 2026-10-12, Day 4: SQL 004_taken_at.sql (listings.taken_at; taken rooms drop off search after 7 days). Admin: edit pages for listings (all fields + photos/video, Make cover, mark taken/available, hide/show, delete with storage cleanup) and agents (edit, hide agent + their listings, delete only with 0 listings). Public: /report (WhatsApp to Rhema 2349133615232 with reason, listing # and agent prefilled; links from listing page, badge sheet, footer, how-it-works), /for-agents (concierge: WhatsApp button with prefilled sign-up message, free at launch). Header shows "For agents". Contact number in lib/contact.ts. Still a placeholder: official WhatsApp glyph. Next (Day 5): load 20+ real listings, phone testing with students, polish from their feedback.
- 2026-10-12: Listing gallery works on PC: prev/next arrow buttons (only on mouse devices, hidden at first/last photo) + keyboard arrow keys; chevron-left/right icons added.
- 2026-10-14: Share feature. lib/share-card.ts draws a 1080x1350 branded JPEG in the browser (canvas: cover photo, amber price pill, type · area, distance, badge, short link, safety line). components/public/share-room.tsx: share sheet (Web Share API with file + caption → WhatsApp; fallback save image + copy caption). On listing pages (top-right share button, hidden when taken) and admin edit page ("Share kit"). Short links /r/<first 6 hex of id> redirect to the listing (app/(site)/r/[code]/route.ts). Rhema's growth plan: demand first (listings as content on WhatsApp TV/status) so agents want to list.
- 2026-10-14: Dropped ID checks. SQL 005_agent_checks.sql adds the three check columns. "ID-checked/ID verified" wording replaced with "verified" on home, layout metadata, cards, sheet, how-it-works, for-agents (no ID photo asked), share image + caption. Admin agent form: three checkboxes instead of the Trusted tick (is_trusted/verification_level kept in sync).
