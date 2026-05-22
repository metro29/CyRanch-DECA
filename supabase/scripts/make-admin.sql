-- Run in Supabase SQL Editor to grant yourself admin access
-- Replace the email if needed, then sign out and sign back in.

update public.profiles
set role = 'admin'
where lower(email) = lower('armaan.belani@gmail.com');

-- Verify:
select email, role, status from public.profiles
where lower(email) = lower('armaan.belani@gmail.com');
