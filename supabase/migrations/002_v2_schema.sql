-- DECA Portal v2 upgrade — run after 001_initial_schema.sql
-- Safe to run on fresh or existing projects

-- Grade on profiles
alter table public.profiles
  add column if not exists grade text;

-- Expand application status enum
alter type public.application_status add value if not exists 'under_review';
alter type public.application_status add value if not exists 'accepted';
alter type public.application_status add value if not exists 'rejected';

-- New application columns
alter table public.applications
  add column if not exists answers jsonb not null default '{}'::jsonb,
  add column if not exists admin_notes text,
  add column if not exists resume_url text;

-- Migrate legacy columns into answers + resume_url
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'leadership_experience'
  ) then
    update public.applications set
      answers = jsonb_build_object(
        'leadership_experience', coalesce(leadership_experience, ''),
        'motivation', coalesce(motivation, ''),
        'officer_goals', coalesce(officer_goals, ''),
        'ideas_for_year', coalesce(ideas_for_year, ''),
        'execution_plan', coalesce(execution_plan, ''),
        'skills', coalesce(skills, '')
      ),
      resume_url = coalesce(resume_url, resume_path)
    where answers = '{}'::jsonb or answers is null;

    alter table public.applications
      drop column if exists leadership_experience,
      drop column if exists motivation,
      drop column if exists officer_goals,
      drop column if exists ideas_for_year,
      drop column if exists execution_plan,
      drop column if exists skills,
      drop column if exists resume_path,
      drop column if exists resume_filename;
  end if;
end $$;

-- Execution dimension on scores
alter table public.scores
  add column if not exists execution smallint;

update public.scores set execution = 5 where execution is null;

alter table public.scores
  alter column execution set not null;

-- Recreate total_score with 4 dimensions (drop generated, re-add)
alter table public.scores drop column if exists total_score;

alter table public.scores
  add column total_score smallint generated always as (
    leadership + creativity + execution + commitment
  ) stored;

alter table public.scores
  drop constraint if exists scores_execution_check;

alter table public.scores
  add constraint scores_execution_check check (execution between 1 and 10);

-- Indexes
create index if not exists applications_user_id_idx on public.applications (user_id);
create index if not exists applications_created_at_idx on public.applications (created_at desc);
create index if not exists profiles_grade_idx on public.profiles (grade);

-- Ensure signup always creates role = user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, grade)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user',
    new.raw_user_meta_data->>'grade'
  );
  return new;
end;
$$;

-- Stricter RLS: drop and recreate application policies
drop policy if exists "Users can view own application" on public.applications;
drop policy if exists "Users can insert own application" on public.applications;
drop policy if exists "Users can update own draft application" on public.applications;
drop policy if exists "Admins manage applications" on public.applications;

create policy "Users select own application"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Admins select all applications"
  on public.applications for select
  using (public.is_admin());

create policy "Users insert own application"
  on public.applications for insert
  with check (auth.uid() = user_id and status = 'draft');

create policy "Users update own draft"
  on public.applications for update
  using (auth.uid() = user_id and status = 'draft')
  with check (
    auth.uid() = user_id
    and status in ('draft', 'submitted')
  );

create policy "Admins full access applications"
  on public.applications for all
  using (public.is_admin())
  with check (public.is_admin());

-- Users cannot read scores
drop policy if exists "Admins can view all scores" on public.scores;

create policy "Admins select scores"
  on public.scores for select
  using (public.is_admin());

-- PDF-only storage bucket
update storage.buckets
set allowed_mime_types = array['application/pdf'],
    file_size_limit = 5242880
where id = 'resumes';
