-- Day 2b: one optional room video per listing.
-- Run once in Supabase → SQL Editor → New query → paste → Run.

alter table public.listings add column if not exists video_path text;

-- Public bucket for videos: anyone can watch by link, only the admin uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 26214400, array['video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do nothing;

create policy "Admin reads video files"
  on storage.objects for select to authenticated
  using (bucket_id = 'videos' and (select public.is_admin()));

create policy "Admin uploads videos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'videos' and (select public.is_admin()));

create policy "Admin updates videos"
  on storage.objects for update to authenticated
  using (bucket_id = 'videos' and (select public.is_admin()));

create policy "Admin deletes videos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'videos' and (select public.is_admin()));

-- Should list both buckets.
select id, public, file_size_limit from storage.buckets order by id;
