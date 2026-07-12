/**
 * ZPay 支付接口 — Vercel Serverless Function
 * ZPay 会员中心: https://member.z-pay.cn/
 * 环境变量（Vercel 后台设置）：
 *   ZPAY_PID — 商户ID
 *   ZPAY_KEY — 商户密钥
 */

const https = require('https');
const querystring = require('querystring');
const crypto = require('crypto');

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
    const { tier } = req.body;
    const plan = PRICE_MAP[tier];
    if (!plan) return res.status(400).json({ error: '无效套餐' });

    var zpayKey = process.env.ZPAY_KEY;
    if (!zpayKey) return res.status(500).json({ error: '商户密钥未配置，请在 Vercel 环境变量中设置 ZPAY_KEY' });

    const outTradeNo = 'DW' + Date.now() + Math.random().toString(36).substr(2, 6);

    // ZPay: 构建参数 + 签名 + 发送
    var zpayParams = {
      pid: process.env.ZPAY_PID,
      type: 'alipay',
      out_trade_no: outTradeNo,
      notify_url: 'https://daowenai.icu/api/alipay-notify',
      return_url: 'https://daowenai.icu',
      name: plan.name,
      money: plan.money
    };
    // 签名字符串：参数按键排序，值不编码，key=value&拼接，末尾加商户KEY
    var sortedKeys = Object.keys(zpayParams).sort();
    var signStr = sortedKeys.map(function(k) {
      return k + '=' + zpayParams[k];
    }).join('&') + zpayKey;
    zpayParams.sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toLowerCase();

    const postData = querystring.stringify(zpayParams);
    const result = await new Promise(function(resolve, reject) {
      var req2 = https.request({
        hostname: 'api.z-pay.cn',
        path: '/submit.php',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, function(response) {
        var body = '';
        response.on('data', function(chunk) { body += chunk; });
        response.on('end', function() { resolve(body); });
      });
      req2.on('error', reject);
      req2.write(postData);
      req2.end();
    });

    // ZPay 返回支付跳转URL
    res.json({ success: true, payUrl: result, outTradeNo: outTradeNo, tier: tier, amount: plan.money });

  } catch (err) {
    console.error('ZPay error:', err);
    res.status(500).json({ error: '支付创建失败，请稍后重试' });
  }
};
