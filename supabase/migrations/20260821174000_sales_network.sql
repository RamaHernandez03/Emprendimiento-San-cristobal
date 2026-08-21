-- Esquema aplicado al proyecto ahgvuzeldnhxztbhcurt.
-- Fuente de verdad versionada para vendedores, tracking y panel administrador.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 100),
  email text not null check (char_length(email) between 5 and 254),
  whatsapp text not null check (whatsapp ~ '^549[0-9]{10}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index sellers_email_lower_uidx on public.sellers (lower(email));
create index sellers_active_slug_idx on public.sellers (slug) where is_active;

create table public.events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view','seller_link_view','unit_view','whatsapp_click')),
  seller_id uuid references public.sellers(id) on delete set null,
  unit_id smallint check (unit_id between 1 and 3),
  source text not null default 'direct' check (char_length(source) between 1 and 80),
  session_id uuid not null,
  page_path text not null default '/' check (char_length(page_path) between 1 and 300),
  created_at timestamptz not null default now()
);

create index events_created_at_idx on public.events (created_at desc);
create index events_type_created_idx on public.events (event_type, created_at desc);
create index events_seller_created_idx on public.events (seller_id, created_at desc) where seller_id is not null;
create index events_unit_created_idx on public.events (unit_id, created_at desc) where unit_id is not null;

create or replace function private.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = p_user_id
  );
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sellers_set_updated_at
before update on public.sellers
for each row execute function private.set_updated_at();

alter table public.admins enable row level security;
alter table public.sellers enable row level security;
alter table public.events enable row level security;

create policy admins_select_self on public.admins
for select to authenticated
using (user_id = (select auth.uid()));

create policy sellers_admin_select on public.sellers
for select to authenticated
using (private.is_admin((select auth.uid())));

create policy sellers_admin_update on public.sellers
for update to authenticated
using (private.is_admin((select auth.uid())))
with check (private.is_admin((select auth.uid())));

create policy events_admin_select on public.events
for select to authenticated
using (private.is_admin((select auth.uid())));

create view public.admin_overview
with (security_invoker = true)
as
select
  count(*) filter (where event_type = 'page_view') as total_page_views,
  count(distinct session_id) filter (where event_type = 'page_view') as unique_sessions,
  count(*) filter (where event_type = 'unit_view') as total_unit_views,
  count(*) filter (where event_type = 'whatsapp_click') as total_whatsapp_clicks,
  count(*) filter (where event_type = 'seller_link_view') as seller_link_views,
  (select count(*) from public.sellers s where s.is_active) as active_sellers
from public.events e;

create view public.admin_daily_metrics
with (security_invoker = true)
as
select
  date_trunc('day', created_at)::date as day,
  count(*) filter (where event_type = 'page_view') as page_views,
  count(distinct session_id) filter (where event_type = 'page_view') as unique_sessions,
  count(*) filter (where event_type = 'unit_view') as unit_views,
  count(*) filter (where event_type = 'whatsapp_click') as whatsapp_clicks
from public.events
where created_at >= now() - interval '30 days'
group by date_trunc('day', created_at)::date
order by day;

create view public.admin_seller_stats
with (security_invoker = true)
as
select
  s.id, s.name, s.email, s.whatsapp, s.slug, s.is_active, s.created_at,
  count(e.id) filter (where e.event_type = 'seller_link_view') as link_views,
  count(e.id) filter (where e.event_type = 'unit_view') as unit_views,
  count(e.id) filter (where e.event_type = 'whatsapp_click') as whatsapp_clicks,
  max(e.created_at) as last_activity
from public.sellers s
left join public.events e on e.seller_id = s.id
group by s.id;

create view public.admin_unit_stats
with (security_invoker = true)
as
select
  unit_id,
  count(*) filter (where event_type = 'unit_view') as detail_views,
  count(*) filter (where event_type = 'whatsapp_click') as whatsapp_clicks
from public.events
where unit_id is not null
group by unit_id
order by unit_id;

revoke all on public.admins, public.sellers, public.events from anon, authenticated;
grant select on public.admins to authenticated;
grant select, update on public.sellers to authenticated;
grant select on public.events to authenticated;
grant select on public.admin_overview, public.admin_daily_metrics,
  public.admin_seller_stats, public.admin_unit_stats to authenticated;

revoke all on function private.is_admin(uuid) from public, anon;
grant execute on function private.is_admin(uuid) to authenticated;
