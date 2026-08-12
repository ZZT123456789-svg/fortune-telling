-- 删除全部登录/账号依赖，保留匿名 UUID 对积分、订单和数据的绑定。
-- 在线上数据库执行一次，然后再执行 secure-credits.sql 更新 RPC 与权限。

begin;

-- 删除所有业务表指向 auth.users 或 app_users 的外键，保留已有记录与 UUID。
do $$
declare
  target_table text;
  fk record;
begin
  foreach target_table in array array[
    'user_balances', 'redeem_redemptions', 'redeem_attempts',
    'credit_ledger', 'payment_orders', 'user_data'
  ] loop
    if to_regclass('public.' || target_table) is not null then
      for fk in
        select conname
        from pg_constraint
        where contype = 'f' and conrelid = to_regclass('public.' || target_table)
          and exists (
            select 1 from unnest(conkey) key(attnum)
            join pg_attribute a on a.attrelid = conrelid and a.attnum = key.attnum
            where a.attname = 'user_id'
          )
      loop
        execute format('alter table public.%I drop constraint %I', target_table, fk.conname);
      end loop;
    end if;
  end loop;
end $$;

-- 删除自有登录系统的函数和表；不删除旧 auth.users，避免影响托管平台内部结构。
drop function if exists public.api_merge_guest_identity(uuid, uuid);
drop table if exists public.app_login_attempts;
drop table if exists public.app_password_resets;
drop table if exists public.app_sessions;
drop table if exists public.app_users;
drop table if exists public.trusted_reset_attempts;
drop table if exists public.trusted_recovery_devices;

commit;
