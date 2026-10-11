-- Day 2: agents, listings, listing photos, photo storage, and security rules.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

-- ─── Admins ────────────────────────────────────────────────────────────
-- Only users listed here can add or change anything.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create policy "Admins can see their own row"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Sign-ups are off, so the only user right now is Rhema.
insert into public.admins (user_id)
select id from auth.users
on conflict do nothing;

-- ─── Agents ────────────────────────────────────────────────────────────
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,            -- digits only, e.g. 2348031234567
  photo_path text,                   -- path inside the "photos" bucket
  verification_level text not null default 'id_verified'
    check (verification_level in ('id_verified', 'trusted')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.agents enable row level security;

create policy "Anyone can read active agents"
  on public.agents for select to anon, authenticated
  using (is_active);

create policy "Admin manages agents"
  on public.agents for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ─── Listings ──────────────────────────────────────────────────────────
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete restrict,
  title text not null,
  room_type text not null
    check (room_type in ('single_room', 'self_contain', 'room_parlour', 'flat', 'shared')),
  campus text not null check (campus in ('bosso', 'gidan_kwano')),
  area text,                          -- e.g. "Tunga Goro", "Dutsen Kura"
  walk_minutes integer check (walk_minutes >= 0),
  price integer not null check (price >= 0),   -- naira per year
  fees_note text,                     -- agency fee, caution fee, etc.
  description text,
  status text not null default 'available'
    check (status in ('available', 'taken')),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index listings_agent_id_idx on public.listings (agent_id);
alter table public.listings enable row level security;

create policy "Anyone can read published listings of active agents"
  on public.listings for select to anon, authenticated
  using (
    is_published
    and exists (
      select 1 from public.agents a
      where a.id = agent_id and a.is_active
    )
  );

create policy "Admin manages listings"
  on public.listings for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ─── Listing photos ────────────────────────────────────────────────────
create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index listing_photos_listing_id_idx on public.listing_photos (listing_id);
alter table public.listing_photos enable row level security;

create policy "Anyone can read photos of visible listings"
  on public.listing_photos for select to anon, authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id));

create policy "Admin manages listing photos"
  on public.listing_photos for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ─── Table access (RLS above still decides which rows) ─────────────────
grant select on public.agents, public.listings, public.listing_photos to anon, authenticated;
grant insert, update, delete on public.agents, public.listings, public.listing_photos to authenticated;
grant select on public.admins to authenticated;

-- ─── Photo storage ─────────────────────────────────────────────────────
-- Public bucket: anyone can view a photo by its link; only the admin can upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admin reads photo files"
  on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()));

create policy "Admin uploads photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (select public.is_admin()));

create policy "Admin updates photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()));

create policy "Admin deletes photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (select public.is_admin()));

-- Should say 1 (you).
select count(*) as admin_users from public.admins;
