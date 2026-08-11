const {
  noStore,
  serviceRpc,
  moneyToCents
} = require('./_lib');
const { requireUser } = require('./_auth');

async function queryZPay(orderNo) {
  const zpid = String(process.env.ZPAY_PID || '').trim();
  const zkey = String(process.env.ZPAY_KEY || '').trim();
  if (!zpid || !zkey) throw new Error('ZPay not configured');

  const url = 'https://zpayz.cn/api.php?act=order&pid=' + encodeURIComponent(zpid) +
    '&key=' + encodeURIComponent(zkey) + '&out_trade_no=' + encodeURIComponent(orderNo);
  const resp = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'DaoWen/2.0' } });
  if (!resp.ok) throw new Error('ZPay query HTTP ' + resp.status);
  const data = await resp.json();
  return data || {};
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await requireUser(req, res);

    const orderNo = String((req.query && req.query.order) || '').trim();
    if (!/^\d{10,32}$/.test(orderNo)) {
      return res.status(400).json({ success: false, paid: false, error: '订单号无效' });
    }

    let local = await serviceRpc('api_payment_status', { p_user_id: user.id, p_order_no: orderNo });
    if (!local || local.found !== true) {
      return res.status(404).json({ success: false, paid: false, error: '未找到该订单' });
    }
    if (local.paid === true) {
      return res.status(200).json({ success: true, paid: true, credits: Number(local.credits || 0) });
    }

    // 回调可能丢失：按 ZPay 官方订单查询接口进行服务端补查。
    const provider = await queryZPay(orderNo);
    const providerPaid = Number(provider.code) === 1 && Number(provider.status) === 1;
    if (!providerPaid) {
      return res.status(200).json({ success: true, paid: false, msg: '暂未检测到支付成功' });
    }

    if (String(provider.out_trade_no || '') !== orderNo) {
      return res.status(400).json({ success: false, paid: false, error: '支付订单校验失败' });
    }
    if (provider.pid != null && String(provider.pid) !== String(process.env.ZPAY_PID || '').trim()) {
      return res.status(400).json({ success: false, paid: false, error: '商户信息校验失败' });
    }

    const paidCents = moneyToCents(provider.money);
    if (!Number.isFinite(paidCents) || paidCents !== Number(local.amount_cents)) {
      return res.status(400).json({ success: false, paid: false, error: '支付金额校验失败' });
    }

    const completed = await serviceRpc('api_complete_payment', {
      p_order_no: orderNo,
      p_trade_no: String(provider.trade_no || ''),
      p_money_cents: paidCents
    });
    if (!completed || completed.success !== true) {
      return res.status(500).json({ success: false, paid: false, error: '到账处理失败' });
    }

    return res.status(200).json({
      success: true,
      paid: true,
      credits: Number(completed.credits || local.credits || 0),
      balance: Number(completed.balance || 0)
    });
  } catch (e) {
    console.error('[check-order]', e.message);
    return res.status(503).json({ success: false, paid: false, error: '支付验证暂不可用，请稍后重试' });
  }
};
