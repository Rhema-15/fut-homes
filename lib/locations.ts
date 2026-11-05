-- Locations: each listing gets a top location (GK, Dama, Gidan Painti, Bosso,
-- Gidan Mangoro). The existing "area" stays as the sub-area (Talba Road...).
-- Run once in Supabase (SQL Editor). Safe to run again.

alter table public.listings add column if not exists location text;
create index if not exists listings_location_idx on public.listings (location);

-- Fill in existing rooms from what they already say.
update public.listings set location = case
  when lower(coalesce(area, '')) like '%dama%' then 'dama'
  when lower(coalesce(area, '')) like '%painti%' then 'gidan_painti'
  when lower(coalesce(area, '')) like '%mangoro%' then 'gidan_mangoro'
  when campus = 'bosso' then 'bosso'
  when campus = 'gidan_kwano' then 'gk'
  else null end
where location is null;

select 'locations ready' as result;
  
