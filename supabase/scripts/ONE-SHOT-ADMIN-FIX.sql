-- ============================================================
-- ONE SHOT — paste ALL of this in Supabase SQL Editor → Run
-- Email is already set to armaan.belani@gmail.com
-- Safe to run more than once
-- ============================================================

-- Types (skip if they already exist)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.profile_status AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add every profiles column your app may need (skip if present)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN status public.profile_status NOT NULL DEFAULT 'active';
  END IF;
EXCEPTION
  WHEN others THEN
    ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
END $$;

-- Admin check helper (for officer/calendar pages)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'admin'
  );
$$;

-- 1) Ensure profile row exists (only columns that always exist after ALTER above)
INSERT INTO public.profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE lower(u.email) = lower('armaan.belani@gmail.com')
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- 2) Set admin role (separate step — no updated_at / status in ON CONFLICT)
DO $$
DECLARE
  target_id uuid;
  role_udt text;
BEGIN
  SELECT u.id INTO target_id
  FROM auth.users u
  WHERE lower(u.email) = lower('armaan.belani@gmail.com');

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found for armaan.belani@gmail.com — sign up in the app first';
  END IF;

  SELECT c.udt_name INTO role_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'profiles'
    AND c.column_name = 'role';

  IF role_udt = 'user_role' THEN
    UPDATE public.profiles SET role = 'admin'::public.user_role WHERE id = target_id;
  ELSE
    UPDATE public.profiles SET role = 'admin' WHERE id = target_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    BEGIN
      UPDATE public.profiles SET status = 'active'::public.profile_status WHERE id = target_id;
    EXCEPTION WHEN others THEN
      UPDATE public.profiles SET status = 'active' WHERE id = target_id;
    END;
  END IF;
END $$;

-- 3) VERIFY — must show role = admin
SELECT id, email, full_name, role, status
FROM public.profiles
WHERE lower(email) = lower('armaan.belani@gmail.com');
