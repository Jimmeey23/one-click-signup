-- Our own copy of every signup that comes through the forms.
--
-- Until now a submission only existed in Momence: the member record plus whatever the
-- leads webhook accepted. When that webhook fails the lead is simply gone, and there is
-- no way to see what was submitted or to replay it. These two tables are that record.
--
-- signup_submissions  - someone completed the form and a Momence member was created.
-- partial_submissions - someone filled in enough to be contacted but never submitted.
--
-- They are kept apart rather than split by a stage column so the completed table stays
-- the clean source of truth for reporting, and the partial table can be pruned on its own.

create extension if not exists pgcrypto;

create table if not exists public.signup_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Who
  first_name text not null default '',
  last_name text not null default '',
  email text not null default '',
  phone_e164 text not null default '',

  -- What they signed up for
  home_location_id integer,
  center text not null default '',
  class_type text,
  source_id text,
  source_form text,

  -- Consent, captured as submitted
  waiver_accepted boolean not null default false,
  whatsapp_consent boolean not null default false,
  whatsapp_consent_at timestamptz,

  -- Juniors only
  child_name text,
  child_age text,
  child_date_of_birth text,
  batch text,

  -- Attribution
  ab_variant text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  fbclid text,
  fbp text,
  fbc text,
  referrer text,
  landing_page text,
  meta_event_id text,

  -- Outcome
  member_id bigint,
  lead_webhook_ok boolean,
  lead_webhook_error text,

  -- Everything as submitted, so a field added to the form later is still captured
  -- here before anyone gets round to writing the migration for it.
  raw jsonb not null default '{}'::jsonb
);

create table if not exists public.partial_submissions (
  like public.signup_submissions including defaults including constraints
);

-- LIKE copies the column list but not the primary key, so give the partial table its own.
alter table public.partial_submissions
  add constraint partial_submissions_pkey primary key (id);

-- No policies at all, on purpose. RLS with an empty policy set denies every request that
-- carries the anon or publishable key, which is the key shipped in the browser bundle.
-- The service role bypasses RLS, so the server can still write. These rows are customer
-- PII - name, phone, email, consent, and children's names and dates of birth - and must
-- never be reachable from the client the way public.shareable_routes deliberately is.
alter table public.signup_submissions enable row level security;
alter table public.partial_submissions enable row level security;

alter table public.signup_submissions force row level security;
alter table public.partial_submissions force row level security;

revoke all on public.signup_submissions from anon, authenticated;
revoke all on public.partial_submissions from anon, authenticated;

create index if not exists signup_submissions_created_at_idx
  on public.signup_submissions (created_at desc);
create index if not exists signup_submissions_email_idx
  on public.signup_submissions (lower(email));
create index if not exists signup_submissions_phone_idx
  on public.signup_submissions (phone_e164);
create index if not exists signup_submissions_member_id_idx
  on public.signup_submissions (member_id);
-- Partial rows that never reached the webhook are the ones worth chasing.
create index if not exists signup_submissions_webhook_failed_idx
  on public.signup_submissions (created_at desc)
  where lead_webhook_ok is not true;

create index if not exists partial_submissions_created_at_idx
  on public.partial_submissions (created_at desc);
create index if not exists partial_submissions_email_idx
  on public.partial_submissions (lower(email));
create index if not exists partial_submissions_phone_idx
  on public.partial_submissions (phone_e164);
create index if not exists partial_submissions_webhook_failed_idx
  on public.partial_submissions (created_at desc)
  where lead_webhook_ok is not true;
