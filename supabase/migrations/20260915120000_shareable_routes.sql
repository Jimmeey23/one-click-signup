-- Named signup routes built in the Route Builder.
--
-- Without this table a route has to carry its whole configuration inside the URL, which is
-- why the encoded links run past 900 characters. A row here is what lets the same route be
-- reached at /the-ballet-school instead.
create table if not exists public.shareable_routes (
  slug text primary key,
  payload jsonb not null,
  event_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.shareable_routes enable row level security;

-- Anyone opening a shared link must be able to read the route they were sent.
drop policy if exists "shareable_routes are publicly readable" on public.shareable_routes;
create policy "shareable_routes are publicly readable"
  on public.shareable_routes
  for select
  using (true);

-- The Route Builder publishes with the publishable key, so inserts are open. This is the
-- same exposure the encoded /signup/<token> links already carry: the builder is a public
-- page and those links already accept any payload.
drop policy if exists "anyone can publish a route" on public.shareable_routes;
create policy "anyone can publish a route"
  on public.shareable_routes
  for insert
  with check (
    length(slug) between 2 and 60
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and length(event_name) <= 200
    and pg_column_size(payload) <= 16384
  );

-- No update or delete policy on purpose: a published link keeps pointing at what it
-- pointed at when it was shared, and nobody can repoint somebody else's route.

create index if not exists shareable_routes_created_at_idx
  on public.shareable_routes (created_at desc);
