-- Save rooms with details missing (as hidden), and a note on why a room is hidden.
-- A room can only be shown on the site once agent, room type, campus and price are filled in.
-- Safe to run more than once.
-- Supabase → SQL Editor → New query → paste → Run.

alter table public.listings alter column agent_id drop not null;
alter table public.listings alter column room_type drop not null;
alter table public.listings alter column campus drop not null;
alter table public.listings alter column price drop not null;
alter table public.listings add column if not exists admin_note text;

-- Drafts saved earlier with price 0 really have no price yet.
update public.listings set price = null where price = 0 and not is_published;
update public.listings set is_published = false, price = null, admin_note = coalesce(admin_note, 'No price yet')
  where price = 0 and is_published;

alter table public.listings drop constraint if exists listings_complete_when_published;
alter table public.listings add constraint listings_complete_when_published check (
  not is_published
  or (agent_id is not null and room_type is not null and campus is not null and price is not null and price > 0)
);

select 'ok' as incomplete_listings_setup;
