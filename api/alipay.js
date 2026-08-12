const crypto = require('crypto');
const { noStore, readJson, serviceRpc, zpaySign } = require('./_lib');
const { requireUser } = require('./_auth');

const PRICE_MAP = {
  '3':  { money: '4.90',  cents: 490,  name: '道问-3次解读',  count: 3 },
  '10': { money: '9.90',  cents: 990,  name: '道问-10次解读', count: 10 },
  '20': { money: '19.90', cents: 1990, name: '道问-20次解读', count: 20 }
};

function numericOrderNo() {
  const suffix = crypto.randomInt(100000000, 999999999).toString();
  return Date.now().toString() + suffix; // <= 22 位，符合 ZPay 商户订单号长度限制
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await requireUser(req, res);

    const body = await readJson(req);
    const tier = String(body.tier || '');
    const plan = PRICE_MAP[tier];
    if (!plan) return res.status(400).json({ success: false, error: '无效套餐' });

    const zkey = String(process.env.ZPAY_KEY || '').trim();
    const zpid = String(process.env.ZPAY_PID || '').trim();
    if (!zkey || !zpid) return res.status(500).json({ success: false, error: '支付配置未完成' });

    const orderNo = numericOrderNo();
    const created = await serviceRpc('api_create_payment_order', {
      p_order_no: orderNo,
      p_user_id: user.id,
      p_tier: tier,
      p_amount_cents: plan.cents,
      p_credits: plan.count
    });
    if (!created || created.success !== true) {
      return res.status(500).json({ success: false, error: '订单创建失败' });
    }

    const appUrl = String(process.env.APP_URL || 'https://daowenai.icu').replace(/\/$/, '');
    const params = {
      pid: zpid,
      type: 'alipay',
      out_trade_no: orderNo,
      notify_url: appUrl + '/api/alipay-notify',
      // 支付完成后先回独立支付页核验到账，再由用户返回原功能并恢复表单状态。
      return_url: appUrl + '/payment.html?returned=1',
      name: plan.name,
      money: plan.money,
      sign_type: 'MD5'
    };
    params.sign = zpaySign(params, zkey);

    // ZPay 当前文档支持 GET/POST，并推荐 POST。
    // 返回签名后的表单字段，让前端用 POST 跳转，避免把订单参数长期留在浏览器 URL/历史中。
    return res.status(200).json({
      success: true,
      payAction: 'https://zpayz.cn/submit.php',
      payParams: params,
      outTradeNo: orderNo,
      amount: plan.money,
      count: plan.count
    });
  } catch (e) {
    console.error('[alipay] create order failed:', e.message);
    return res.status(500).json({ success: false, error: '支付创建失败，请稍后重试' });
  }
};
