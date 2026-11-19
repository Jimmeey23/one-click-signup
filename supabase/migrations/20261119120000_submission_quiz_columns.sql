-- /find-your-57 quiz: record the respond.io lead source and the quiz answers that
-- produced the class match, on both the completed and the partial tables.
alter table public.signup_submissions
  add column if not exists lead_source text,
  add column if not exists quiz_answers jsonb;

alter table public.partial_submissions
  add column if not exists lead_source text,
  add column if not exists quiz_answers jsonb;
