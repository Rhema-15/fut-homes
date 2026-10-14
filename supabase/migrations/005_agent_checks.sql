-- Agent badges now come from three checks Rhema ticks in admin
-- (no more ID checks). Safe to run more than once.
-- Supabase → SQL Editor → New query → paste → Run.

alter table public.agents add column if not exists long_time_poster boolean not null default false;
alter table public.agents add column if not exists still_posting boolean not null default false;
alter table public.agents add column if not exists students_confirmed boolean not null default false;

-- Agents already marked Trusted keep that: past students confirmed them.
update public.agents set students_confirmed = true where is_trusted and not students_confirmed;

select 'ok' as agent_checks_setup;
