/**
 * ZPay 支付 — Vercel Serverless
 * 改为构造支付URL，前端直接跳转（绕过服务端UA问题）
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRICE_MAP = {
  '3':  { money: '4.90',  name: '道问-3次解读',  count: 3 },
  '10': { money: '9.90',  name: '道问-10次解读', count: 10 },
  '20': { money: '19.90', name: '道问-20次解读', count: 20 }
};

// 预生成兑换码池
var CODE_POOL = [];
function initPool() {
  if (CODE_POOL.length > 0) return;
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (var i = 0; i < 200; i++) {
    var code = 'DW-';
    for (var j = 0; j < 4; j++) { code += chars[Math.floor(Math.random() * chars.length)]; }
    code += '-';
    for (var k = 0; k < 4; k++) { code += chars[Math.floor(Math.random() * chars.length)]; }
    CODE_POOL.push(code);
  }
}

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

    // 预生成兑换码
    initPool();
    var redeemCode = CODE_POOL.shift();

    // 存储订单信息（供通知回调验证和前端查询）
    var orders = JSON.parse(process.env.ORDER_STORE || '{}');
    orders[outTradeNo] = { code: redeemCode, count: plan.count, tier: tier, paid: false, time: Date.now() };
    process.env.ORDER_STORE = JSON.stringify(orders);

    // return_url 带上兑换码
    var returnUrl = 'https://daowenai.icu?paid=1&code=' + redeemCode + '&order=' + outTradeNo;

    var params = {
      pid: zpayPid,
      type: 'alipay',
      out_trade_no: outTradeNo,
      notify_url: 'https://daowenai.icu/api/alipay-notify',
      return_url: returnUrl,
      name: plan.name,
      money: plan.money
    };

    var sortedKeys = Object.keys(params).sort();
    var signStr = sortedKeys.map(function(k) { return k + '=' + params[k]; }).join('&') + zpayKey;
    params.sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toLowerCase();

    var queryStr = Object.keys(params).map(function(k) {
      return k + '=' + encodeURIComponent(params[k]);
    }).join('&');
    var payUrl = 'https://api.z-pay.cn/submit.php?' + queryStr;

    res.json({ success: true, payUrl: payUrl, outTradeNo: outTradeNo, amount: plan.money, code: redeemCode, count: plan.count });

  } catch (err) {
    console.error('ZPay error:', err);
    res.status(500).json({ error: '支付创建失败' });
  }
};
