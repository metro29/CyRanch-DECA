-- Run in Supabase → SQL Editor (change email first)
-- Step A adds missing columns; Step B makes you admin

-- A) Missing columns on profiles
do $$ begin
  create type public.profile_status as enum ('active', 'suspended');
exception when duplicate_object then null;
end $$;

alter table public.profiles add column if not exists grade text;
alter table public.profiles
  add column if not exists status public.profile_status not null default 'active';

-- B) Admin account (change email)
insert into public.profiles (id, email, full_name, role, status)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'admin'::public.user_role,
  'active'::public.profile_status
from auth.users u
where lower(u.email) = lower('YOUR-EMAIL@gmail.com')
on conflict (id) do update
set role = 'admin'::public.user_role, status = 'active'::public.profile_status, updated_at = now();

select id, email, full_name, role, status from public.profiles
where lower(email) = lower('YOUR-EMAIL@gmail.com');
