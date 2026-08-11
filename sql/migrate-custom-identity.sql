-- 从旧认证切换到道问自有身份系统（已有线上数据使用）。
-- 先执行本文件，再执行 secure-credits.sql，以更新全部表、RPC 和权限。

begin;

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  password_hash text,
  is_guest boolean not null default true,
  password_reset_required boolean not null default false,
  merged_into uuid references public.app_users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_guest and email is null and password_hash is null) or (not is_guest and email is not null)),
  check (email is null or email = lower(email))
);

-- 保留旧用户 UUID，使余额、兑换记录和支付订单无需改号。
-- 密码哈希不能从旧认证导出；这些账号首次使用时通过邮箱重设本站密码。
do $$
begin
  if to_regclass('auth.users') is not null then
    execute $migration$
      insert into public.app_users(id, email, is_guest, password_reset_required, created_at)
      select id, lower(email), false, true, coalesce(created_at, now())
      from auth.users
      where email is not null
      on conflict (id) do update
        set email = excluded.email,
            is_guest = false,
            password_reset_required = true
    $migration$;
  end if;
end $$;

-- 极少数没有对应旧账号行的业务记录也不会丢失，先转成可继续使用的游客身份。
do $$
declare
  table_name text;
begin
  foreach table_name in array array['user_balances','redeem_redemptions','redeem_attempts','credit_ledger','payment_orders'] loop
    if to_regclass('public.' || table_name) is not null then
      execute format(
        'insert into public.app_users(id, is_guest) select distinct user_id, true from public.%I where user_id is not null on conflict (id) do nothing',
        table_name
      );
    end if;
  end loop;
end $$;

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text unique not null check (length(token_hash) = 64),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists app_sessions_user_idx on public.app_sessions(user_id);
create index if not exists app_sessions_expires_idx on public.app_sessions(expires_at);

create table if not exists public.app_password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text unique not null check (length(token_hash) = 64),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists app_password_resets_user_idx on public.app_password_resets(user_id, created_at desc);

create table if not exists public.app_login_attempts (
  id bigserial primary key,
  email_hash text not null check (length(email_hash) = 64),
  ip_hash text not null check (length(ip_hash) = 64),
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);
create index if not exists app_login_attempts_email_time_idx on public.app_login_attempts(email_hash, attempted_at desc);
create index if not exists app_login_attempts_ip_time_idx on public.app_login_attempts(ip_hash, attempted_at desc);

create table if not exists public.user_data (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 删除所有指向旧用户表的外键，然后把业务表改绑到 app_users。
do $$
declare
  fk record;
  old_users regclass := to_regclass('auth.users');
begin
  if old_users is not null then
    for fk in
      select conrelid::regclass as table_name, conname
      from pg_constraint
      where contype = 'f' and confrelid = old_users
    loop
      execute format('alter table %s drop constraint %I', fk.table_name, fk.conname);
    end loop;
  end if;
end $$;

do $$
declare
  item record;
begin
  for item in select * from (values
    ('user_balances', 'user_balances_app_user_fk'),
    ('redeem_redemptions', 'redeem_redemptions_app_user_fk'),
    ('redeem_attempts', 'redeem_attempts_app_user_fk'),
    ('credit_ledger', 'credit_ledger_app_user_fk'),
    ('payment_orders', 'payment_orders_app_user_fk')
  ) as x(table_name, constraint_name)
  loop
    if to_regclass('public.' || item.table_name) is not null
       and not exists (select 1 from pg_constraint where conname = item.constraint_name) then
      execute format(
        'alter table public.%I add constraint %I foreign key (user_id) references public.app_users(id) on delete cascade',
        item.table_name, item.constraint_name
      );
    end if;
  end loop;
end $$;

-- 旧的“可信设备验证码”方案不再需要。
drop function if exists public.api_register_trusted_device(uuid, text, text, text);
drop function if exists public.api_consume_trusted_reset(text, text, text);
drop table if exists public.trusted_reset_attempts;
drop table if exists public.trusted_recovery_devices;

commit;
