-- Admin system: profile status, RLS hardening

create type public.profile_status as enum ('active', 'suspended');

alter table public.profiles
  add column if not exists status public.profile_status not null default 'active';

create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_role_idx on public.profiles (role);

-- Ensure signup always creates active user role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, grade, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user',
    new.raw_user_meta_data->>'grade',
    'active'
  );
  return new;
end;
$$;

-- Profiles RLS refresh
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update any profile role" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;

create policy "Users view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id and status = 'active')
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and status = 'active'
  );

create policy "Admins update all profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Block suspended users from applications (except admins)
drop policy if exists "Users select own application" on public.applications;
drop policy if exists "Users insert own application" on public.applications;
drop policy if exists "Users update own draft" on public.applications;

create policy "Users select own application"
  on public.applications for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'active'
    )
  );

create policy "Admins select all applications"
  on public.applications for select
  using (public.is_admin());

create policy "Users insert own application"
  on public.applications for insert
  with check (
    auth.uid() = user_id
    and status = 'draft'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'active'
    )
  );

create policy "Users update own draft"
  on public.applications for update
  using (
    auth.uid() = user_id
    and status = 'draft'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and status = 'active'
    )
  )
  with check (
    auth.uid() = user_id
    and status in ('draft', 'submitted')
  );

create policy "Admins full access applications"
  on public.applications for all
  using (public.is_admin())
  with check (public.is_admin());
