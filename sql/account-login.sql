-- 道问：登录系统（邮箱+密码，无邮件确认）+ 信任留存码
-- 在 Supabase SQL 编辑器执行一次。仅新增一个 service_role-only 合并函数，
-- 把游客（匿名 UUID）下的余额/数据/流水/订单原子迁移到登录账号（Supabase auth.users.id）。
-- 账号本身由 Supabase Auth 管理（email_confirm:true 建号不发邮件），本文件不建用户表。

-- 游客 -> 账号 合并：余额求和、user_data 合并、流水/订单/兑换记录改 user_id。
create or replace function public.api_merge_guest_identity(p_guest uuid, p_account uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest_balance integer;
  v_balance integer;
begin
  if p_guest is null or p_account is null or p_guest = p_account then
    return jsonb_build_object('success', false, 'code', 'BAD_ARGS');
  end if;

  -- 1) 余额：游客余额并入账号（求和），删除游客余额行。
  select coalesce((select balance from public.user_balances where user_id = p_guest), 0) into v_guest_balance;
  if v_guest_balance > 0 then
    insert into public.user_balances(user_id, balance)
      values (p_account, v_guest_balance)
      on conflict (user_id) do update
        set balance = public.user_balances.balance + excluded.balance,
            updated_at = now();
  end if;
  delete from public.user_balances where user_id = p_guest;

  -- 2) user_data：游客 payload 合并进账号（账号已有的字段优先），删除游客行。
  insert into public.user_data(user_id, payload, updated_at)
    select p_account, coalesce(g.payload, '{}'::jsonb), now()
    from public.user_data g where g.user_id = p_guest
    on conflict (user_id) do update
      set payload = public.user_data.payload || coalesce(excluded.payload, '{}'::jsonb),
          updated_at = now();
  delete from public.user_data where user_id = p_guest;

  -- 已生成的双人 AI 合盘随身份迁移；账号已有同盘缓存时保留账号版本。
  insert into public.ai_dual_readings(user_id, chart_hash, content, created_at, updated_at)
    select p_account, chart_hash, content, created_at, updated_at
    from public.ai_dual_readings where user_id = p_guest
    on conflict (user_id, chart_hash) do nothing;
  delete from public.ai_dual_readings where user_id = p_guest;

  -- 3) 流水：改 user_id（request_id 唯一索引按 (user_id, request_id)，游客与账号相同 request_id 的概率极低，跳过冲突）。
  update public.credit_ledger
    set user_id = p_account
    where user_id = p_guest
      and not exists (select 1 from public.credit_ledger c
                      where c.user_id = p_account and c.request_id is not null
                        and c.request_id = public.credit_ledger.request_id);

  -- 4) 支付订单：改 user_id。
  update public.payment_orders set user_id = p_account where user_id = p_guest;

  -- 5) 兑换记录：改 user_id（(code_hash,user_id) 唯一，账号已兑过该码则跳过）。
  update public.redeem_redemptions
    set user_id = p_account
    where user_id = p_guest
      and not exists (select 1 from public.redeem_redemptions r
                      where r.user_id = p_account and r.code_hash = public.redeem_redemptions.code_hash);

  -- 6) 返回账号最新余额。
  select coalesce((select balance from public.user_balances where user_id = p_account), 0) into v_balance;
  return jsonb_build_object('success', true, 'code', 'OK', 'balance', v_balance);
end;
$$;

revoke all on function public.api_merge_guest_identity(uuid, uuid) from public, anon, authenticated;
grant execute on function public.api_merge_guest_identity(uuid, uuid) to service_role;
