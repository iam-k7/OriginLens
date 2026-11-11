-- Usage limits for the website's server routes (AI rewrite, URL fetch). Counters live in a schema the
-- public API does not expose, and only the server's secret key (service_role) may call consume_quota.
create schema if not exists private;

create table private.usage_counters (
  key text primary key,
  count integer not null,
  expires_at timestamptz not null
);

-- Counts one use of `p_key` in a window of `p_window_seconds`; true while the count is within `p_limit`.
create function public.consume_quota(p_key text, p_limit integer, p_window_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  used integer;
begin
  insert into private.usage_counters as u (key, count, expires_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    count = case when u.expires_at <= now() then 1 else u.count + 1 end,
    expires_at = case when u.expires_at <= now() then excluded.expires_at else u.expires_at end
  returning count into used;

  -- Occasional cleanup keeps the table to roughly one day of counters.
  if random() < 0.01 then
    delete from private.usage_counters where expires_at < now() - interval '1 day';
  end if;

  return used <= p_limit;
end;
$$;

revoke execute on function public.consume_quota(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_quota(text, integer, integer) to service_role;
