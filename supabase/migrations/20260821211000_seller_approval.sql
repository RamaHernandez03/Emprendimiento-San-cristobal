alter table public.sellers
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id) on delete set null;

alter table public.sellers alter column is_active set default false;

update public.sellers
set is_active = false
where approved_at is null;

create or replace function private.set_seller_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_active and not old.is_active then
    new.approved_at = coalesce(new.approved_at, now());
    new.approved_by = coalesce(new.approved_by, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists sellers_set_approval on public.sellers;
create trigger sellers_set_approval
before update of is_active on public.sellers
for each row execute function private.set_seller_approval();

create or replace view public.admin_seller_stats
with (security_invoker = true)
as
select
  s.id, s.name, s.email, s.whatsapp, s.slug, s.is_active, s.created_at,
  count(e.id) filter (where e.event_type = 'seller_link_view') as link_views,
  count(e.id) filter (where e.event_type = 'unit_view') as unit_views,
  count(e.id) filter (where e.event_type = 'whatsapp_click') as whatsapp_clicks,
  max(e.created_at) as last_activity,
  s.approved_at, s.approved_by
from public.sellers s
left join public.events e on e.seller_id = s.id
group by s.id;

grant select on public.admin_seller_stats to authenticated;
