-- One row per worker / work record / transaction, private to the signed-in user.
create table if not exists public.tracker_items (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  collection text        not null check (collection in ('workers', 'workRecords', 'transactions')),
  id         text        not null,
  data       jsonb,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, id)
);

create index if not exists tracker_items_pull_idx on public.tracker_items (user_id, updated_at);

alter table public.tracker_items enable row level security;

create policy "own rows: select" on public.tracker_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows: insert" on public.tracker_items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own rows: update" on public.tracker_items
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows: delete" on public.tracker_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- The server decides updated_at, so clients with wrong clocks cannot hide changes from other devices.
create or replace function public.tracker_items_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger tracker_items_touch
  before insert or update on public.tracker_items
  for each row execute function public.tracker_items_touch();
