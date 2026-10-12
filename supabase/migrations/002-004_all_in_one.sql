-- FUT Homes: 002 + 003 + 004 in one go. Safe to run more than once.
-- Supabase → SQL Editor → New query → paste everything → Run.

-- ── 002: room videos ───────────────────────────────────────────────
alter table public.listings add column if not exists video_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 26214400, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do nothing;

drop policy if exists "Admin reads video files" on storage.objects;
create policy "Admin reads video files"
  on storage.objects for select to authenticated
  using (bucket_id = 'videos' and (select public.is_admin()));

drop policy if exists "Admin uploads videos" on storage.objects;
create policy "Admin uploads videos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and (select public.is_admin()));

drop policy if exists "Admin updates videos" on storage.objects;
create policy "Admin updates videos"
  on storage.objects for update to authenticated
  using (bucket_id = 'videos' and (select public.is_admin()));

drop policy if exists "Admin deletes videos" on storage.objects;
create policy "Admin deletes videos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and (select public.is_admin()));

-- ── 003: distance, video length, trusted badge ─────────────────────
alter table public.listings
  add column if not exists distance_km numeric(4, 1) check (distance_km >= 0);
alter table public.listings
  add column if not exists video_seconds integer check (video_seconds >= 0);
alter table public.agents
  add column if not exists is_trusted boolean not null default false;
update public.agents set is_trusted = true where verification_level = 'trusted';

-- ── 004: when a room was taken ─────────────────────────────────────
alter table public.listings add column if not exists taken_at timestamptz;
update public.listings set taken_at = now() where status = 'taken' and taken_at is null;

-- Should show: photos, videos
select string_agg(id, ', ' order by id) as buckets, 'all set' as status from storage.buckets;
