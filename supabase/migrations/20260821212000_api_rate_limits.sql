create table public.api_rate_limits (
  key_hash text not null check (char_length(key_hash) = 64),
  action text not null check (action in ('registerSeller', 'track')),
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (key_hash, action, window_start)
);

create index api_rate_limits_window_start_idx
  on public.api_rate_limits (window_start);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_key_hash text,
  p_action text,
  p_window_start timestamptz,
  p_limit integer
)
returns table (allowed boolean, current_count integer)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if char_length(p_key_hash) <> 64
    or p_action not in ('registerSeller', 'track')
    or p_limit < 1
    or p_limit > 10000 then
    raise exception 'invalid rate limit parameters';
  end if;

  insert into public.api_rate_limits as limits (key_hash, action, window_start, request_count)
  values (p_key_hash, p_action, p_window_start, 1)
  on conflict (key_hash, action, window_start)
  do update set
    request_count = limits.request_count + 1,
    updated_at = now()
  returning request_count <= p_limit, request_count
    into allowed, current_count;

  delete from public.api_rate_limits
  where window_start < now() - interval '48 hours';

  return next;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, timestamptz, integer)
  to service_role;
