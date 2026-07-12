/**
 * ZPay 支付 — Vercel Serverless
 * 改为构造支付URL，前端直接跳转（绕过服务端UA问题）
 */
const crypto = require('crypto');
// 前端直接跳转ZPay支付页面，无需服务端请求

const PRICE_MAP = {
  '3':  { money: '4.90',  name: '道问-3次解读' },
  '10': { money: '9.90',  name: '道问-10次解读' },
  '20': { money: '19.90', name: '道问-20次解读' }
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tier } = req.body || {};
    const plan = PRICE_MAP[tier];
    if (!plan) return res.status(400).json({ error: '无效套餐' });

    var zpayKey = (process.env.ZPAY_KEY || '').trim();
    var zpayPid = (process.env.ZPAY_PID || '').trim();
    if (!zpayKey || !zpayPid) return res.status(500).json({ error: '支付配置未完成' });

    const outTradeNo = 'DW' + Date.now() + Math.random().toString(36).substr(2, 6);

    // 构建参数并签名
    var params = {
      pid: zpayPid,
      type: 'alipay',
      out_trade_no: outTradeNo,
      notify_url: 'https://daowenai.icu/api/alipay-notify',
      return_url: 'https://daowenai.icu',
      name: plan.name,
      money: plan.money
    };

    var sortedKeys = Object.keys(params).sort();
    var signStr = sortedKeys.map(function(k) { return k + '=' + params[k]; }).join('&') + zpayKey;
    params.sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toLowerCase();

    // 构造完整支付URL，前端直接跳转
    var queryStr = Object.keys(params).map(function(k) {
      return k + '=' + encodeURIComponent(params[k]);
    }).join('&');
    var payUrl = 'https://api.z-pay.cn/submit.php?' + queryStr;

    res.json({ success: true, payUrl: payUrl, outTradeNo: outTradeNo, amount: plan.money });

  } catch (err) {
    console.error('ZPay error:', err);
    res.status(500).json({ error: '支付创建失败' });
  }
};
