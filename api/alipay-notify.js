const {
  noStore,
  serviceRpc,
  moneyToCents,
  safeEqualHex,
  zpaySign,
  parseFormLike
} = require('./_lib');

function collectParams(req) {
  const query = parseFormLike(req.query || {});
  const body = parseFormLike(req.body || {});
  return Object.assign({}, query, body);
}

module.exports = async function handler(req, res) {
  noStore(res);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).send('fail');

  try {
    const p = collectParams(req);
    const zkey = String(process.env.ZPAY_KEY || '').trim();
    const zpid = String(process.env.ZPAY_PID || '').trim();
    if (!zkey || !zpid) return res.status(500).send('fail');

    if (String(p.pid || '') !== zpid) return res.status(400).send('fail');
    if (String(p.trade_status || '') !== 'TRADE_SUCCESS') return res.status(400).send('fail');
    if (p.sign_type && String(p.sign_type).toUpperCase() !== 'MD5') return res.status(400).send('fail');
    if (!p.sign) return res.status(400).send('fail');

    const expected = zpaySign(p, zkey);
    if (!safeEqualHex(expected, p.sign)) return res.status(400).send('fail');

    const orderNo = String(p.out_trade_no || '').trim();
    const tradeNo = String(p.trade_no || '').trim();
    const moneyCents = moneyToCents(p.money);
    if (!/^\d{10,32}$/.test(orderNo) || !Number.isFinite(moneyCents)) {
      return res.status(400).send('fail');
    }

    const result = await serviceRpc('api_complete_payment', {
      p_order_no: orderNo,
      p_trade_no: tradeNo,
      p_money_cents: moneyCents
    });

    if (!result || result.success !== true) {
      console.error('[alipay-notify] rejected order:', orderNo, result && result.code);
      return res.status(400).send('fail');
    }

    // 不记录完整回调，避免把支付者信息写入日志。
    console.log('[alipay-notify] credited:', orderNo, result.code);
    return res.status(200).send('success');
  } catch (e) {
    console.error('[alipay-notify] error:', e.message);
    return res.status(500).send('fail');
  }
};
