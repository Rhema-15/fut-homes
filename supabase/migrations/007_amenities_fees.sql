-- "What's included" ticks and fee amounts for the room page.
-- Safe to run more than once.
-- Supabase → SQL Editor → New query → paste → Run.

alter table public.listings add column if not exists amenities text[] not null default '{}';
alter table public.listings add column if not exists agent_fee integer check (agent_fee is null or agent_fee >= 0);
alter table public.listings add column if not exists caution_fee integer check (caution_fee is null or caution_fee >= 0);

select 'ok' as amenities_fees_setup;
