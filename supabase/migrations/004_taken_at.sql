-- Day 4: remember when a room was marked taken, so taken rooms
-- drop off search results after 7 days.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

alter table public.listings add column if not exists taken_at timestamptz;

update public.listings set taken_at = now() where status = 'taken' and taken_at is null;

select 'ok' as day4_setup;
