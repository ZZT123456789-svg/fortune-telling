-- 道问可信设备密码恢复。在 Supabase SQL Editor 中执行一次。
create extension if not exists pgcrypto;

create table if not exists public.trusted_recovery_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text unique not null,
  code_hash text not null,
  device_label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists trusted_recovery_devices_user_idx
  on public.trusted_recovery_devices(user_id, created_at desc);

create table if not exists public.trusted_reset_attempts (
  id bigserial primary key,
  email_hash text not null,
  attempted_at timestamptz not null default now(),
  success boolean not null default false
);

create index if not exists trusted_reset_attempts_email_time_idx
  on public.trusted_reset_attempts(email_hash, attempted_at desc);

alter table public.trusted_recovery_devices enable row level security;
alter table public.trusted_reset_attempts enable row level security;
revoke all on table public.trusted_recovery_devices from public, anon, authenticated;
revoke all on table public.trusted_reset_attempts from public, anon, authenticated;
grant all on table public.trusted_recovery_devices to service_role;
grant all on table public.trusted_reset_attempts to service_role;

create or replace function public.api_register_trusted_device(
  p_user_id uuid,
  p_token_hash text,
  p_code_hash text,
  p_label text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user not found';
  end if;

  insert into public.trusted_recovery_devices(user_id, token_hash, code_hash, device_label)
  values (p_user_id, p_token_hash, p_code_hash, left(coalesce(p_label, '浏览器设备'), 80));

  delete from public.trusted_recovery_devices
   where id in (
     select id from public.trusted_recovery_devices
      where user_id = p_user_id
      order by created_at desc
      offset 5
   );
  return true;
end;
$$;

create or replace function public.api_consume_trusted_reset(
  p_email_hash text,
  p_token_hash text,
  p_code_hash text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device_id uuid;
  v_user_id uuid;
begin
  if (
    select count(*) from public.trusted_reset_attempts
     where email_hash = p_email_hash
       and attempted_at > now() - interval '15 minutes'
  ) >= 10 then
    return null;
  end if;

  select d.id, d.user_id into v_device_id, v_user_id
    from public.trusted_recovery_devices d
    join auth.users u on u.id = d.user_id
   where encode(digest(lower(trim(u.email)), 'sha256'), 'hex') = p_email_hash
     and d.token_hash = p_token_hash
     and d.code_hash = p_code_hash
     and d.revoked_at is null
     and d.created_at > now() - interval '180 days'
   for update of d
   limit 1;

  insert into public.trusted_reset_attempts(email_hash, success)
  values (p_email_hash, v_device_id is not null);

  if v_device_id is null then return null; end if;
  update public.trusted_recovery_devices
     set last_used_at = now(), revoked_at = now()
   where id = v_device_id;
  return v_user_id::text;
end;
$$;

revoke all on function public.api_register_trusted_device(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.api_consume_trusted_reset(text, text, text) from public, anon, authenticated;
grant execute on function public.api_register_trusted_device(uuid, text, text, text) to service_role;
grant execute on function public.api_consume_trusted_reset(text, text, text) to service_role;
