-- Room freshness: when Rhema last confirmed a room is still available.
-- Rooms not confirmed for 14 days hide from search until confirmed again.
-- Safe to run more than once.
-- Supabase → SQL Editor → New query → paste → Run.

alter table public.listings add column if not exists confirmed_at timestamptz not null default now();

-- Existing rooms count as confirmed when they were added.
update public.listings set confirmed_at = created_at where confirmed_at > created_at + interval '1 minute' and confirmed_at > now() - interval '5 minutes';

select 'ok' as confirmed_at_setup;
