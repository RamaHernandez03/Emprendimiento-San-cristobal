update public.sellers
set whatsapp = '5491151457318'
where id = '00545423-5088-47c8-ab68-91dd313581ad'
  and whatsapp = '54541151457318';

alter table public.sellers drop constraint if exists sellers_whatsapp_check;
alter table public.sellers
  add constraint sellers_whatsapp_check check (whatsapp ~ '^549[0-9]{10}$');
