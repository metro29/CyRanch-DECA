-- ============================================================
-- MAKE armaan.belani@gmail.com ADMIN (run entire file once)
-- ============================================================

-- A) Diagnose — auth user vs profile (ids MUST match)
select
  u.id as auth_user_id,
  u.email as auth_email,
  p.id as profile_id,
  p.role,
  case when p.id is null then 'NO PROFILE — will create'
       when p.id <> u.id then 'WRONG PROFILE ID — will fix'
       when p.role::text = 'admin' then 'ALREADY ADMIN'
       else 'NEEDS ADMIN UPDATE'
  end as status
from auth.users u
left join public.profiles p on p.id = u.id
where lower(u.email) = lower('armaan.belani@gmail.com');

-- B) Remove broken profile rows (same email, wrong id)
delete from public.profiles p
where lower(p.email) = lower('armaan.belani@gmail.com')
  and p.id not in (
    select u.id from auth.users u
    where lower(u.email) = lower('armaan.belani@gmail.com')
  );

-- C) Ensure role column exists
do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles
      add column role public.user_role not null default 'user';
  end if;
end $$;

-- D) Create / update profile linked to auth user
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'admin'::public.user_role
from auth.users u
where lower(u.email) = lower('armaan.belani@gmail.com')
on conflict (id) do update
set
  role = 'admin'::public.user_role,
  email = excluded.email;

-- E) Fallback if role is text not enum
update public.profiles
set role = 'admin'
where id in (
  select u.id from auth.users u
  where lower(u.email) = lower('armaan.belani@gmail.com')
)
and role::text is distinct from 'admin';

-- F) Verify
select id, email, full_name, role::text as role
from public.profiles
where id in (
  select id from auth.users
  where lower(email) = lower('armaan.belani@gmail.com')
);
