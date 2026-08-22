create table public.lead_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique
    check (char_length(email) between 5 and 254)
    check (email = lower(email))
    check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  source text not null default 'site'
    check (char_length(source) between 1 and 80),
  seller_id uuid references public.sellers(id) on delete set null,
  consent_version text not null
    check (char_length(consent_version) between 1 and 30),
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_subscribers_created_at_idx
  on public.lead_subscribers (created_at desc);
create index lead_subscribers_seller_created_idx
  on public.lead_subscribers (seller_id, created_at desc)
  where seller_id is not null;

alter table public.lead_subscribers enable row level security;
revoke all on public.lead_subscribers from public, anon, authenticated;
grant select, insert, update, delete on public.lead_subscribers to service_role;

alter table public.api_rate_limits
  drop constraint if exists api_rate_limits_action_check;
alter table public.api_rate_limits
  add constraint api_rate_limits_action_check
  check (action in ('registerSeller', 'track', 'subscribeLead'));

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
    or p_action not in ('registerSeller', 'track', 'subscribeLead')
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
