-- Creating a very first wedding was impossible, and this fixes it.
--
-- The policies are right, but they chase their own tail on the first insert:
--
--   * "members read wedding" needs a wedding_members row, so `insert ...
--     returning *` came back empty and the app saw no wedding.
--   * "hosts manage memberships" needs the caller to already be a host, so the
--     wedding_members row that would make them one could never be written.
--
-- Nothing had ever run this path — there were no screens — so it went unnoticed.
--
-- Rather than loosening either policy, both inserts move into one function that
-- runs as its owner. It takes no user id: it reads auth.uid() itself, so a
-- caller can only ever create a wedding owned by themselves.

create or replace function create_wedding(
  p_name         text,
  p_wedding_date date default null
)
returns weddings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_wedding weddings;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'A wedding needs a name' using errcode = '22023';
  end if;

  insert into weddings (name, wedding_date, created_by)
  values (btrim(p_name), p_wedding_date, v_user)
  returning * into v_wedding;

  insert into wedding_members (wedding_id, user_id, role)
  values (v_wedding.id, v_user, 'owner');

  return v_wedding;
end;
$$;

revoke all on function create_wedding(text, date) from public;
grant execute on function create_wedding(text, date) to authenticated;
