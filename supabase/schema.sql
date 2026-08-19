-- Run this once in the Supabase Dashboard: Project -> SQL Editor -> New query -> Run
-- Creates the 3 datasets used by the CareWell report site.

-- 1 & 2) LINE OA daily stats (one row per day per account: @carewellteam / @carewell)
create table if not exists public.line_oa_daily_stats (
  id uuid primary key default gen_random_uuid(),
  account text not null check (account in ('carewellteam', 'carewell')),
  stat_date date not null,
  contacts integer,
  target_reaches integer,
  blocks integer,
  imported_at timestamptz not null default now(),
  unique (account, stat_date)
);

-- 3) Caregivers registered in the system
create table if not exists public.caregivers (
  id uuid primary key default gen_random_uuid(),
  caregiver_code text unique not null,
  prefix text,
  full_name text,
  phone text,
  gender text,
  status text,
  registered_date date,
  approved_date date,
  bank_name text,
  bank_account_no text,
  position text,
  job_type text,
  province text,
  special_skill text,
  lifestyle text,
  badge text,
  updated_date date,
  imported_at timestamptz not null default now()
);

-- 4) Service recipients (ผู้รับบริการ) — entered manually via a form, not CSV import.
create table if not exists public.service_recipients (
  id uuid primary key default gen_random_uuid(),
  job_code text,
  service_date date,
  care_level text,
  work_format text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) Freeform report notes (ประเด็นเพิ่มเติม) — shown as the closing slide(s).
create table if not exists public.report_notes (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  detail text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Lock every table down by default. The app only ever talks to Supabase
-- from server-side code using the service_role key, which bypasses RLS,
-- so no policies need to be added here (anon/public get zero access).
alter table public.line_oa_daily_stats enable row level security;
alter table public.caregivers enable row level security;
alter table public.service_recipients enable row level security;
alter table public.report_notes enable row level security;

create index if not exists line_oa_daily_stats_date_idx on public.line_oa_daily_stats (stat_date);
create index if not exists caregivers_province_idx on public.caregivers (province);
create index if not exists caregivers_status_idx on public.caregivers (status);
create index if not exists service_recipients_service_date_idx on public.service_recipients (service_date);
create index if not exists report_notes_sort_idx on public.report_notes (sort_order, created_at);
