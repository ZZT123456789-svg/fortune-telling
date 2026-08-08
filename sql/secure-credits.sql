-- 道问：兑换码 / 积分 / 支付安全化
-- 在 Supabase SQL Editor 中执行一次。
-- 设计原则：浏览器不直接写余额、不读取兑换码、不写支付订单；所有敏感写操作仅 service_role 可调用。

create extension if not exists pgcrypto;

-- 1) 用户余额：兼容现有 user_balances 表
create table if not exists public.user_balances (
  id bigserial primary key,
  user_id uuid unique not null references auth.users(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_balances add column if not exists updated_at timestamptz not null default now();
update public.user_balances set balance = 0 where balance is null or balance < 0;
alter table public.user_balances alter column balance set default 0;
alter table public.user_balances alter column balance set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_balances'::regclass
      and conname = 'user_balances_balance_nonnegative'
  ) then
    alter table public.user_balances
      add constraint user_balances_balance_nonnegative check (balance >= 0);
  end if;
end $$;

-- 2) 新兑换码：只存哈希，不存明文
create table if not exists public.redeem_codes (
  code_hash text primary key,
  credits integer not null check (credits > 0 and credits <= 10000),
  max_uses integer not null default 1 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  check (uses <= max_uses)
);

create table if not exists public.redeem_redemptions (
  id bigserial primary key,
  code_hash text not null references public.redeem_codes(code_hash) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  credits integer not null check (credits > 0),
  redeemed_at timestamptz not null default now(),
  unique (code_hash, user_id)
);

create table if not exists public.redeem_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  success boolean not null default false
);
create index if not exists redeem_attempts_user_time_idx
  on public.redeem_attempts(user_id, attempted_at desc);

-- 3) 余额流水：便于审计、幂等与退款
create table if not exists public.credit_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null check (delta <> 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null,
  request_id text,
  ref_type text,
  ref_id text,
  created_at timestamptz not null default now()
);
create unique index if not exists credit_ledger_user_request_uidx
  on public.credit_ledger(user_id, request_id)
  where request_id is not null;
create index if not exists credit_ledger_user_created_idx
  on public.credit_ledger(user_id, created_at desc);

-- 4) 支付订单：订单必须绑定登录用户
create table if not exists public.payment_orders (
  order_no text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tier text not null,
  amount_cents integer not null check (amount_cents > 0),
  credits integer not null check (credits > 0),
  status text not null default 'pending' check (status in ('pending','paid','cancelled','refunded')),
  provider_trade_no text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);
create unique index if not exists payment_orders_provider_trade_uidx
  on public.payment_orders(provider_trade_no)
  where provider_trade_no is not null;
create index if not exists payment_orders_user_created_idx
  on public.payment_orders(user_id, created_at desc);

-- 5) 所有敏感表启用 RLS，并撤销浏览器角色的直接权限
alter table public.user_balances enable row level security;
alter table public.redeem_codes enable row level security;
alter table public.redeem_redemptions enable row level security;
alter table public.redeem_attempts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.payment_orders enable row level security;

revoke all on table public.user_balances from anon, authenticated;
revoke all on table public.redeem_codes from anon, authenticated;
revoke all on table public.redeem_redemptions from anon, authenticated;
revoke all on table public.redeem_attempts from anon, authenticated;
revoke all on table public.credit_ledger from anon, authenticated;
revoke all on table public.payment_orders from anon, authenticated;

grant select, insert, update, delete on table public.user_balances to service_role;
grant select, insert, update, delete on table public.redeem_codes to service_role;
grant select, insert, update, delete on table public.redeem_redemptions to service_role;
grant select, insert, update, delete on table public.redeem_attempts to service_role;
grant select, insert, update, delete on table public.credit_ledger to service_role;
grant select, insert, update, delete on table public.payment_orders to service_role;

do $$
declare s text;
begin
  foreach s in array array[
    'user_balances_id_seq',
    'redeem_redemptions_id_seq',
    'redeem_attempts_id_seq',
    'credit_ledger_id_seq'
  ] loop
    if to_regclass('public.' || s) is not null then
      execute format('grant usage, select on sequence public.%I to service_role', s);
    end if;
  end loop;
end $$;

-- 6) 仅服务端可调用：读取余额
create or replace function public.api_get_balance(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare v_balance integer;
begin
  if p_user_id is null then raise exception 'missing_user'; end if;
  insert into public.user_balances(user_id, balance)
    values (p_user_id, 0)
    on conflict (user_id) do nothing;
  select balance into v_balance
    from public.user_balances
    where user_id = p_user_id;
  return coalesce(v_balance, 0);
end;
$$;

-- 7) 仅服务端可调用：安全兑换。每个账号 10 分钟最多 10 次尝试。
create or replace function public.api_redeem_code(p_user_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_norm text;
  v_hash text;
  v_code public.redeem_codes%rowtype;
  v_balance integer;
  v_recent integer;
begin
  if p_user_id is null then return jsonb_build_object('success', false, 'code', 'AUTH_REQUIRED'); end if;
  v_norm := upper(btrim(coalesce(p_code, '')));
  if length(v_norm) < 8 or length(v_norm) > 80 then
    return jsonb_build_object('success', false, 'code', 'INVALID_CODE', 'msg', '无效的兑换码');
  end if;

  select count(*) into v_recent
    from public.redeem_attempts
    where user_id = p_user_id
      and attempted_at > now() - interval '10 minutes';
  if v_recent >= 10 then
    return jsonb_build_object('success', false, 'code', 'RATE_LIMIT', 'msg', '尝试过于频繁，请稍后再试');
  end if;

  v_hash := encode(extensions.digest(convert_to(v_norm, 'UTF8'), 'sha256'), 'hex');

  select * into v_code
    from public.redeem_codes
    where code_hash = v_hash
    for update;

  if not found
     or not v_code.active
     or v_code.uses >= v_code.max_uses
     or (v_code.expires_at is not null and v_code.expires_at <= now()) then
    insert into public.redeem_attempts(user_id, success) values (p_user_id, false);
    return jsonb_build_object('success', false, 'code', 'INVALID_CODE', 'msg', '兑换码无效、已失效或已被使用');
  end if;

  if exists (
    select 1 from public.redeem_redemptions
    where code_hash = v_hash and user_id = p_user_id
  ) then
    insert into public.redeem_attempts(user_id, success) values (p_user_id, false);
    return jsonb_build_object('success', false, 'code', 'ALREADY_REDEEMED', 'msg', '该兑换码已在此账号使用');
  end if;

  insert into public.user_balances(user_id, balance)
    values (p_user_id, 0)
    on conflict (user_id) do nothing;

  update public.redeem_codes
    set uses = uses + 1
    where code_hash = v_hash;

  update public.user_balances
    set balance = balance + v_code.credits,
        updated_at = now()
    where user_id = p_user_id
    returning balance into v_balance;

  insert into public.redeem_redemptions(code_hash, user_id, credits)
    values (v_hash, p_user_id, v_code.credits);
  insert into public.redeem_attempts(user_id, success) values (p_user_id, true);
  insert into public.credit_ledger(user_id, delta, balance_after, reason, ref_type, ref_id)
    values (p_user_id, v_code.credits, v_balance, 'redeem', 'redeem_code', v_hash);

  return jsonb_build_object(
    'success', true,
    'code', 'OK',
    'amount', v_code.credits,
    'balance', v_balance,
    'msg', format('兑换成功，获得 %s 次解读', v_code.credits)
  );
end;
$$;

-- 8) 仅服务端可调用：原子扣减，带 request_id 幂等
create or replace function public.api_consume_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_request_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_existing public.credit_ledger%rowtype;
begin
  if p_user_id is null then return jsonb_build_object('success', false, 'code', 'AUTH_REQUIRED'); end if;
  if p_amount is null or p_amount < 1 or p_amount > 20 then
    return jsonb_build_object('success', false, 'code', 'BAD_AMOUNT');
  end if;
  if p_request_id is null or length(p_request_id) < 8 or length(p_request_id) > 120 then
    return jsonb_build_object('success', false, 'code', 'BAD_REQUEST_ID');
  end if;

  insert into public.user_balances(user_id, balance)
    values (p_user_id, 0)
    on conflict (user_id) do nothing;

  select balance into v_balance
    from public.user_balances
    where user_id = p_user_id
    for update;

  select * into v_existing
    from public.credit_ledger
    where user_id = p_user_id and request_id = p_request_id
    limit 1;
  if found then
    if v_existing.delta = -p_amount then
      return jsonb_build_object('success', true, 'code', 'IDEMPOTENT', 'balance', v_existing.balance_after);
    end if;
    return jsonb_build_object('success', false, 'code', 'REQUEST_ID_CONFLICT');
  end if;

  if v_balance < p_amount then
    return jsonb_build_object('success', false, 'code', 'INSUFFICIENT', 'balance', v_balance, 'msg', '解读次数不足');
  end if;

  update public.user_balances
    set balance = balance - p_amount,
        updated_at = now()
    where user_id = p_user_id
    returning balance into v_balance;

  insert into public.credit_ledger(user_id, delta, balance_after, reason, request_id, ref_type, ref_id)
    values (p_user_id, -p_amount, v_balance, left(coalesce(p_reason, 'use'), 80), p_request_id, 'usage', p_request_id);

  return jsonb_build_object('success', true, 'code', 'OK', 'balance', v_balance, 'amount', p_amount);
end;
$$;

-- 9) AI 调用失败时退款；只允许 service_role 使用
create or replace function public.api_refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_request_id text,
  p_reason text default 'service_failure'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_refund_id text := 'refund:' || coalesce(p_request_id, '');
begin
  if p_user_id is null or p_amount is null or p_amount < 1 then
    return jsonb_build_object('success', false, 'code', 'BAD_REQUEST');
  end if;

  if not exists (
    select 1 from public.credit_ledger
    where user_id = p_user_id and request_id = p_request_id and delta = -p_amount
  ) then
    return jsonb_build_object('success', false, 'code', 'NO_DEBIT');
  end if;

  if exists (
    select 1 from public.credit_ledger
    where user_id = p_user_id and request_id = v_refund_id
  ) then
    select balance into v_balance from public.user_balances where user_id = p_user_id;
    return jsonb_build_object('success', true, 'code', 'IDEMPOTENT', 'balance', coalesce(v_balance, 0));
  end if;

  select balance into v_balance
    from public.user_balances
    where user_id = p_user_id
    for update;

  update public.user_balances
    set balance = balance + p_amount,
        updated_at = now()
    where user_id = p_user_id
    returning balance into v_balance;

  insert into public.credit_ledger(user_id, delta, balance_after, reason, request_id, ref_type, ref_id)
    values (p_user_id, p_amount, v_balance, left(coalesce(p_reason, 'service_failure'), 80), v_refund_id, 'refund', p_request_id);

  return jsonb_build_object('success', true, 'code', 'OK', 'balance', v_balance);
end;
$$;

-- 10) 创建支付订单
create or replace function public.api_create_payment_order(
  p_order_no text,
  p_user_id uuid,
  p_tier text,
  p_amount_cents integer,
  p_credits integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  if p_user_id is null or p_order_no is null then
    return jsonb_build_object('success', false, 'code', 'BAD_ORDER');
  end if;
  select count(*) into v_recent
    from public.payment_orders
    where user_id = p_user_id and created_at > now() - interval '10 minutes';
  if v_recent >= 10 then
    return jsonb_build_object('success', false, 'code', 'RATE_LIMIT');
  end if;
  insert into public.payment_orders(order_no, user_id, tier, amount_cents, credits)
    values (p_order_no, p_user_id, p_tier, p_amount_cents, p_credits);
  return jsonb_build_object('success', true, 'order_no', p_order_no);
exception when unique_violation then
  return jsonb_build_object('success', false, 'code', 'DUPLICATE_ORDER');
end;
$$;

-- 11) 支付到账：金额校验 + 行锁 + 幂等，只入账一次
create or replace function public.api_complete_payment(
  p_order_no text,
  p_trade_no text,
  p_money_cents integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.payment_orders%rowtype;
  v_balance integer;
  v_request_id text;
begin
  select * into v_order
    from public.payment_orders
    where order_no = p_order_no
    for update;

  if not found then
    return jsonb_build_object('success', false, 'code', 'ORDER_NOT_FOUND');
  end if;

  if v_order.amount_cents <> p_money_cents then
    return jsonb_build_object('success', false, 'code', 'AMOUNT_MISMATCH');
  end if;

  if v_order.status = 'paid' then
    select balance into v_balance from public.user_balances where user_id = v_order.user_id;
    return jsonb_build_object('success', true, 'code', 'IDEMPOTENT', 'balance', coalesce(v_balance, 0), 'credits', v_order.credits);
  end if;

  if v_order.status <> 'pending' then
    return jsonb_build_object('success', false, 'code', 'ORDER_NOT_PAYABLE');
  end if;

  if p_trade_no is not null and exists (
    select 1 from public.payment_orders
    where provider_trade_no = p_trade_no and order_no <> p_order_no
  ) then
    return jsonb_build_object('success', false, 'code', 'TRADE_NO_CONFLICT');
  end if;

  update public.payment_orders
    set status = 'paid', provider_trade_no = nullif(p_trade_no, ''), paid_at = now(), updated_at = now()
    where order_no = p_order_no;

  insert into public.user_balances(user_id, balance)
    values (v_order.user_id, 0)
    on conflict (user_id) do nothing;

  select balance into v_balance
    from public.user_balances
    where user_id = v_order.user_id
    for update;

  update public.user_balances
    set balance = balance + v_order.credits,
        updated_at = now()
    where user_id = v_order.user_id
    returning balance into v_balance;

  v_request_id := 'payment:' || p_order_no;
  insert into public.credit_ledger(user_id, delta, balance_after, reason, request_id, ref_type, ref_id)
    values (v_order.user_id, v_order.credits, v_balance, 'payment', v_request_id, 'payment_order', p_order_no)
    on conflict (user_id, request_id) where request_id is not null do nothing;

  return jsonb_build_object('success', true, 'code', 'OK', 'balance', v_balance, 'credits', v_order.credits, 'user_id', v_order.user_id);
end;
$$;

-- 12) 查询本人订单状态
create or replace function public.api_payment_status(p_user_id uuid, p_order_no text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'found', true,
        'status', status,
        'paid', status = 'paid',
        'amount_cents', amount_cents,
        'credits', credits,
        'provider_trade_no', provider_trade_no
      )
      from public.payment_orders
      where user_id = p_user_id and order_no = p_order_no
    ),
    jsonb_build_object('found', false, 'paid', false)
  );
$$;

-- 13) 敏感 RPC 只允许 service_role 执行
revoke all on function public.api_get_balance(uuid) from public, anon, authenticated;
revoke all on function public.api_redeem_code(uuid, text) from public, anon, authenticated;
revoke all on function public.api_consume_credits(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.api_refund_credits(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.api_create_payment_order(text, uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.api_complete_payment(text, text, integer) from public, anon, authenticated;
revoke all on function public.api_payment_status(uuid, text) from public, anon, authenticated;

grant execute on function public.api_get_balance(uuid) to service_role;
grant execute on function public.api_redeem_code(uuid, text) to service_role;
grant execute on function public.api_consume_credits(uuid, integer, text, text) to service_role;
grant execute on function public.api_refund_credits(uuid, integer, text, text) to service_role;
grant execute on function public.api_create_payment_order(text, uuid, text, integer, integer) to service_role;
grant execute on function public.api_complete_payment(text, text, integer) to service_role;
grant execute on function public.api_payment_status(uuid, text) to service_role;

-- 14) 管理员生成新兑换码：只在 SQL Editor 执行，明文只返回一次。
create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

create or replace function private.issue_redeem_code(
  p_credits integer,
  p_max_uses integer default 1,
  p_expires_at timestamptz default null,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raw text;
  v_code text;
  v_hash text;
begin
  if p_credits < 1 or p_credits > 10000 then raise exception 'bad credits'; end if;
  if p_max_uses < 1 or p_max_uses > 10000 then raise exception 'bad max_uses'; end if;

  loop
    v_raw := upper(encode(extensions.gen_random_bytes(10), 'hex'));
    v_code := 'DW-' || substr(v_raw,1,5) || '-' || substr(v_raw,6,5) || '-' || substr(v_raw,11,5) || '-' || substr(v_raw,16,5);
    v_hash := encode(extensions.digest(convert_to(v_code, 'UTF8'), 'sha256'), 'hex');
    begin
      insert into public.redeem_codes(code_hash, credits, max_uses, expires_at, note)
      values (v_hash, p_credits, p_max_uses, p_expires_at, p_note);
      exit;
    exception when unique_violation then
      -- 极低概率碰撞，重新生成
    end;
  end loop;
  return v_code;
end;
$$;

revoke all on function private.issue_redeem_code(integer, integer, timestamptz, text) from public, anon, authenticated, service_role;

-- 使用示例（请在 SQL Editor 手动运行，不要把返回的明文码提交到 GitHub）：
-- select private.issue_redeem_code(3, 1, null, '客服发放');
-- select private.issue_redeem_code(10, 1, now() + interval '30 days', '活动码');
-- select private.issue_redeem_code(20, 5, null, '最多5人可用的活动码');

-- 15) 客服 / 旧客户迁移：管理员手工调整余额并留下审计流水。
-- 仅在 Supabase SQL Editor 由管理员执行，不暴露给 service_role API。
create or replace function private.admin_adjust_credits(
  p_user_id uuid,
  p_delta integer,
  p_note text default 'manual adjustment'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_request_id text;
begin
  if p_user_id is null then raise exception 'missing user'; end if;
  if p_delta = 0 or abs(p_delta) > 100000 then raise exception 'bad delta'; end if;
  if not exists (select 1 from auth.users where id = p_user_id) then raise exception 'user not found'; end if;

  insert into public.user_balances(user_id, balance)
    values (p_user_id, 0)
    on conflict (user_id) do nothing;

  select balance into v_balance
    from public.user_balances
    where user_id = p_user_id
    for update;

  if v_balance + p_delta < 0 then raise exception 'insufficient balance'; end if;

  update public.user_balances
    set balance = balance + p_delta,
        updated_at = now()
    where user_id = p_user_id
    returning balance into v_balance;

  v_request_id := 'admin:' || encode(extensions.gen_random_bytes(12), 'hex');
  insert into public.credit_ledger(user_id, delta, balance_after, reason, request_id, ref_type)
    values (p_user_id, p_delta, v_balance, left(coalesce(p_note, 'manual adjustment'), 200), v_request_id, 'admin');

  return jsonb_build_object('success', true, 'user_id', p_user_id, 'balance', v_balance, 'delta', p_delta);
end;
$$;

revoke all on function private.admin_adjust_credits(uuid, integer, text) from public, anon, authenticated, service_role;

-- 示例：确认旧客户真实付款记录后，人工迁移 10 次（不要自动迁移 localStorage）
-- select private.admin_adjust_credits('00000000-0000-0000-0000-000000000000'::uuid, 10, '旧客户付款记录核对后迁移');

