-- 关闭 AI 调用失败后的积分退款通道。
-- 在 Supabase SQL Editor 中执行一次；不影响支付到账、余额查询或正常扣费。
begin;
drop function if exists public.api_refund_credits(uuid, integer, text, text);
commit;
