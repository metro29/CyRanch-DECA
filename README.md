# DECA Officer Application Portal

Production-style application tracking system with **Supabase Auth**, **role-based access**, multi-step applications, and an admin dashboard.

## Features

### Authentication & roles
- Email/password via Supabase Auth
- **Signup always creates `role = user`** (never admin)
- Admins use the same login; access is controlled by `profiles.role` in the database
- Middleware protects `/apply` (logged in) and `/dashboard` (admin only)
- **Row Level Security** enforces permissions at the database layer

### Application system
- **4-step form** with per-step validation
- **Auto-save drafts** every 3 seconds
- **One application per user** (`unique` on `user_id`)
- Submit locks the application (`status` → `submitted`)
- **Read-only** after submit unless an admin unlocks (sets status back to `draft`)
- PDF-only resume upload with progress bar → `resume_url` in Supabase Storage

### Admin dashboard (`/dashboard`)
- View all applications (live from Supabase)
- Search by name/email
- Filter by **grade**, **status**, scored/unscored
- Sort by **newest** or **highest score**
- Full review modal
- Update status: `submitted` → `under_review` → `accepted` → `rejected`
- Private **admin notes** on each application
- Score: leadership, creativity, execution, commitment (1–10 each)
- **Total score** auto-calculated (max 40) and persisted
- Download resumes via signed URLs

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order in the **SQL Editor**:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_v2_schema.sql`
3. Configure `.env.local` (see `.env.local.example`)

### 2. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Create an admin

After signing up (as a normal user), run in SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@school.edu';
```

## Routes

| Route | Access |
|-------|--------|
| `/` | Public |
| `/about`, `/officers`, `/calendar`, `/follow-us` | Public |
| `/login`, `/signup` | Public |
| `/apply` | Authenticated users |
| `/reports`, `/settings` | Authenticated members |
| `/confirmation` | Users with a non-draft application |
| `/dashboard` | **Admin only** |

## Database schema

**profiles** — `id`, `email`, `full_name`, `grade`, `role`, `created_at`

**applications** — `id`, `user_id` (unique), `answers` (jsonb), `status`, `resume_url`, `admin_notes`, timestamps

**scores** — `application_id`, `leadership`, `creativity`, `execution`, `commitment`, `total_score` (generated)

## Security

- RLS enabled on all tables
- Users: read/write **only their own** application while `status = draft`
- Users: **cannot** read `scores` or other users’ data
- Admins: full access via `is_admin()` policies
- Non-admins hitting `/dashboard` are redirected to `/apply`

## Tech stack

Next.js 15 · Tailwind CSS v4 · Supabase · Sonner (toasts)
