-- FIX: "Cannot coerce the result to a single JSON object"
-- Cause: zero or duplicate profile rows for your login email
-- Run ENTIRE file in Supabase SQL Editor

-- 1) Show the problem
select 'auth login' as source, u.id, u.email, null::text as role
from auth.users u
where lower(u.email) = lower('armaan.belani@gmail.com')
union all
select 'profiles' as source, p.id, p.email, p.role::text
from public.profiles p
where lower(p.email) = lower('armaan.belani@gmail.com');

-- 2) Delete ALL profile rows for this email (removes duplicates)
delete from public.profiles
where lower(email) = lower('armaan.belani@gmail.com');

-- 3) Create ONE profile tied to auth login id
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'admin'
from auth.users u
where lower(u.email) = lower('armaan.belani@gmail.com');

-- 4) Verify exactly ONE row
select id, email, full_name, role::text as role
from public.profiles
where lower(email) = lower('armaan.belani@gmail.com');
