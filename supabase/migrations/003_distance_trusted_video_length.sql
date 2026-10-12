-- Day 3: what the student pages need.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

-- Distance shown on cards: "1.2 km to Bosso campus".
alter table public.listings
  add column if not exists distance_km numeric(4, 1) check (distance_km >= 0);

-- Video length shown on the video pill: "▶ 0:45".
alter table public.listings
  add column if not exists video_seconds integer check (video_seconds >= 0);

-- Trusted badge: set by hand in admin. Every agent is "ID verified" by default.
alter table public.agents
  add column if not exists is_trusted boolean not null default false;

-- Carry over anyone already marked trusted with the old dropdown.
update public.agents set is_trusted = true where verification_level = 'trusted';

select 'ok' as day3_setup;
