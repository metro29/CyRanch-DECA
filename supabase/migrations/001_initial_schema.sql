-- DECA Officer Application Portal — initial schema
-- Run this in the Supabase SQL Editor

-- Extensions
create extension if not exists "uuid-ossp";

-- Enums
create type public.user_role as enum ('user', 'admin');
create type public.application_status as enum ('draft', 'submitted');

-- Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Applications (one submitted per user; drafts allowed)
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'draft',
  leadership_experience text not null default '',
  motivation text not null default '',
  officer_goals text not null default '',
  ideas_for_year text not null default '',
  execution_plan text not null default '',
  skills text not null default '',
  resume_path text,
  resume_filename text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_user_id_key unique (user_id)
);

-- Admin scores (one per application)
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade unique,
  leadership smallint not null check (leadership between 1 and 10),
  creativity smallint not null check (creativity between 1 and 10),
  commitment smallint not null check (commitment between 1 and 10),
  total_score smallint generated always as (leadership + creativity + commitment) stored,
  notes text,
  scored_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index applications_status_idx on public.applications (status);
create index applications_submitted_at_idx on public.applications (submitted_at desc nulls last);
create index scores_total_score_idx on public.scores (total_score desc);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.handle_updated_at();

create trigger scores_updated_at
  before update on public.scores
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.scores enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "Admins can update any profile role"
  on public.profiles for update
  using (public.is_admin());

-- Applications policies
create policy "Users can view own application"
  on public.applications for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can insert own application"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own draft application"
  on public.applications for update
  using (
    auth.uid() = user_id
    and (status = 'draft' or public.is_admin())
  )
  with check (auth.uid() = user_id or public.is_admin());

-- Scores policies (admin only)
create policy "Admins can view all scores"
  on public.scores for select
  using (public.is_admin());

create policy "Admins can insert scores"
  on public.scores for insert
  with check (public.is_admin());

create policy "Admins can update scores"
  on public.scores for update
  using (public.is_admin());

create policy "Admins can delete scores"
  on public.scores for delete
  using (public.is_admin());

-- Storage bucket for resumes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload own resume"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own resume"
  on storage.objects for update
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own resume"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

create policy "Users can delete own resume"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- To promote a user to admin after signup:
-- update public.profiles set role = 'admin' where email = 'your-admin@email.com';
