-- Real-database RLS test for public.tracker_items.
-- Run in the Supabase SQL editor (or any superuser session). It creates two users, acts as each one
-- through the `authenticated` role with their JWT claims, checks SELECT / INSERT / UPDATE / DELETE
-- isolation, and ROLLS BACK so nothing is left behind. Any failed check raises an exception.
begin;

create function pg_temp.check_that(ok boolean, what text) returns text language plpgsql as $$
begin
  if ok is not true then raise exception 'RLS CHECK FAILED: %', what; end if;
  return 'PASS  ' || what;
end $$;

-- Runs a statement and returns 'ok' or the SQLSTATE it failed with (42501 = blocked by RLS).
create function pg_temp.try_sql(q text) returns text language plpgsql as $$
begin
  execute q;
  return 'ok';
exception when others then
  return sqlstate;
end $$;

create function pg_temp.act_as(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end $$;

create temp table results (n serial, line text);
grant all on results to authenticated, anon;
grant all on results_n_seq to authenticated, anon;

insert into auth.users (id, instance_id, aud, role, phone, created_at, updated_at) values
  ('a0000000-0000-4000-8000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '910000000001', now(), now()),
  ('b0000000-0000-4000-8000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '910000000002', now(), now());

-- User A writes a worker.
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
insert into results(line) select pg_temp.check_that(auth.uid() = 'a0000000-0000-4000-8000-00000000000a', 'acting as user A');
insert into results(line) select pg_temp.check_that(pg_temp.try_sql($q$insert into public.tracker_items (user_id, collection, id, data) values ('a0000000-0000-4000-8000-00000000000a', 'workers', 'rls-a1', '{"name":"Worker A"}')$q$) = 'ok', 'A can INSERT own row');

-- User B tries everything against A's row.
reset role;
select pg_temp.act_as('b0000000-0000-4000-8000-00000000000b');
insert into results(line) select pg_temp.check_that((select count(*) from public.tracker_items) = 0, 'B SELECT sees none of A''s rows');
insert into results(line) select pg_temp.check_that(pg_temp.try_sql($q$insert into public.tracker_items (user_id, collection, id, data) values ('a0000000-0000-4000-8000-00000000000a', 'workers', 'rls-evil', '{}')$q$) = '42501', 'B cannot INSERT a row owned by A');
with u as (update public.tracker_items set data = '{"name":"hacked"}' where id = 'rls-a1' returning 1)
insert into results(line) select pg_temp.check_that((select count(*) from u) = 0, 'B UPDATE of A''s row changes nothing');
with d as (delete from public.tracker_items where id = 'rls-a1' returning 1)
insert into results(line) select pg_temp.check_that((select count(*) from d) = 0, 'B DELETE of A''s row removes nothing');
insert into results(line) select pg_temp.check_that(pg_temp.try_sql($q$insert into public.tracker_items (user_id, collection, id, data) values ('b0000000-0000-4000-8000-00000000000b', 'workers', 'rls-b1', '{"name":"Worker B"}')$q$) = 'ok', 'B can INSERT own row');
insert into results(line) select pg_temp.check_that(pg_temp.try_sql($q$update public.tracker_items set user_id = 'a0000000-0000-4000-8000-00000000000a' where id = 'rls-b1'$q$) = '42501', 'B cannot UPDATE own row to belong to A');

-- User A checks their row survived and cannot touch B's.
reset role;
select pg_temp.act_as('a0000000-0000-4000-8000-00000000000a');
insert into results(line) select pg_temp.check_that((select string_agg(data->>'name', ',') from public.tracker_items) = 'Worker A', 'A sees only own row, unchanged');
with u as (update public.tracker_items set data = '{"name":"hacked"}' where id = 'rls-b1' returning 1)
insert into results(line) select pg_temp.check_that((select count(*) from u) = 0, 'A UPDATE of B''s row changes nothing');
with d as (delete from public.tracker_items where id = 'rls-b1' returning 1)
insert into results(line) select pg_temp.check_that((select count(*) from d) = 0, 'A DELETE of B''s row removes nothing');
with u as (update public.tracker_items set updated_at = '2000-01-01' where id = 'rls-a1' returning updated_at)
insert into results(line) select pg_temp.check_that((select updated_at > '2020-01-01' from u), 'server sets updated_at (client value ignored)');
with d as (delete from public.tracker_items where id = 'rls-a1' returning 1)
insert into results(line) select pg_temp.check_that((select count(*) from d) = 1, 'A can DELETE own row');

-- Signed-out visitors see nothing.
reset role;
set local role anon;
insert into results(line) select pg_temp.check_that((select count(*) from public.tracker_items) = 0, 'anon SELECT sees no rows');

reset role;
select line from results order by n;
rollback;
