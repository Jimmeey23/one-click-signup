-- Named signup routes built in the Route Builder.
--
-- The encoded /signup/<token> links stay valid; this table is what lets the same route
-- also be reached at a readable path such as /battle-school. The slug is the primary key
-- because it is the URL.
create table if not exists public.shareable_routes (
  slug text primary key,
  payload jsonb not null,
  event_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shareable_routes enable row level security;

-- Anyone opening a shared link must be able to read the route they were sent.
drop policy if exists "shareable_routes are publicly readable" on public.shareable_routes;
create policy "shareable_routes are publicly readable"
  on public.shareable_routes
  for select
  using (true);

-- No insert/update/delete policy on purpose. Writes go through the server function using
-- the service role key, which bypasses RLS. Without this, anyone could publish a page on
-- the studio's own domain with a headline and hero image of their choosing.

create index if not exists shareable_routes_created_at_idx
  on public.shareable_routes (created_at desc);
