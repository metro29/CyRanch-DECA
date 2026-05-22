-- Yearly application window (admin-controlled)

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  applications_open boolean not null default false,
  season_label text not null default 'Officer Applications',
  closed_message text not null default 'Applications are not open at this time. Check back when your chapter announces the next officer cycle.',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.app_settings (id, applications_open, season_label)
values (1, false, 'Officer Applications')
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

create policy "Anyone authenticated can read settings"
  on public.app_settings for select
  to authenticated
  using (true);

create policy "Admins can update settings"
  on public.app_settings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can insert settings"
  on public.app_settings for insert
  with check (public.is_admin());

-- Promote your admin account (safe if already admin)
update public.profiles
set role = 'admin'
where lower(email) = lower('armaan.belani@gmail.com');
