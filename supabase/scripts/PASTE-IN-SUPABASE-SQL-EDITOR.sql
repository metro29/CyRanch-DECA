-- ============================================================
-- PASTE THIS ENTIRE FILE in Supabase → SQL Editor → Run
-- (Fixes missing is_admin + creates club pages tables)
-- ============================================================

-- 1) Admin helper (required for officer/calendar/reports security)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role::text = 'admin'
  );
$$;

-- 2) Officer team
create table if not exists public.officers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  image_path text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists officers_display_order_idx on public.officers (display_order);
alter table public.officers enable row level security;

drop policy if exists "Anyone can view officers" on public.officers;
create policy "Anyone can view officers"
  on public.officers for select using (true);

drop policy if exists "Admins manage officers" on public.officers;
create policy "Admins manage officers"
  on public.officers for all
  using (public.is_admin())
  with check (public.is_admin());

-- 3) Reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  category text not null default 'general',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_user_id_idx on public.reports (user_id);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
alter table public.reports enable row level security;

drop policy if exists "Users insert own reports" on public.reports;
create policy "Users insert own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users view own reports" on public.reports;
create policy "Users view own reports"
  on public.reports for select
  using (auth.uid() = user_id);

drop policy if exists "Admins view all reports" on public.reports;
create policy "Admins view all reports"
  on public.reports for select
  using (public.is_admin());

-- 4) Calendar
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_events_starts_at_idx on public.calendar_events (starts_at);
alter table public.calendar_events enable row level security;

drop policy if exists "Anyone can view calendar events" on public.calendar_events;
create policy "Anyone can view calendar events"
  on public.calendar_events for select using (true);

drop policy if exists "Admins manage calendar events" on public.calendar_events;
create policy "Admins manage calendar events"
  on public.calendar_events for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5) Follow us
create table if not exists public.club_socials (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  label text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists club_socials_display_order_idx on public.club_socials (display_order);
alter table public.club_socials enable row level security;

drop policy if exists "Anyone can view club socials" on public.club_socials;
create policy "Anyone can view club socials"
  on public.club_socials for select using (true);

drop policy if exists "Admins manage club socials" on public.club_socials;
create policy "Admins manage club socials"
  on public.club_socials for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.club_info (
  id int primary key default 1 check (id = 1),
  description text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.club_info (id, description)
values (1, 'Connect with our DECA chapter for meeting times, competition updates, and chapter news.')
on conflict (id) do nothing;

alter table public.club_info enable row level security;

drop policy if exists "Anyone can view club info" on public.club_info;
create policy "Anyone can view club info"
  on public.club_info for select using (true);

drop policy if exists "Admins update club info" on public.club_info;
create policy "Admins update club info"
  on public.club_info for update
  using (public.is_admin())
  with check (public.is_admin());

-- 6) Officer photo storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'officer-photos',
  'officer-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

drop policy if exists "Anyone can view officer photos" on storage.objects;
create policy "Anyone can view officer photos"
  on storage.objects for select
  using (bucket_id = 'officer-photos');

drop policy if exists "Admins upload officer photos" on storage.objects;
create policy "Admins upload officer photos"
  on storage.objects for insert
  with check (bucket_id = 'officer-photos' and public.is_admin());

drop policy if exists "Admins update officer photos" on storage.objects;
create policy "Admins update officer photos"
  on storage.objects for update
  using (bucket_id = 'officer-photos' and public.is_admin());

drop policy if exists "Admins delete officer photos" on storage.objects;
create policy "Admins delete officer photos"
  on storage.objects for delete
  using (bucket_id = 'officer-photos' and public.is_admin());
