/**
 * ZPay 支付 API
 */
const crypto = require('crypto');

const PRICE_MAP = {
  '3':  { money: '4.90',  name: '道问-3次解读',  count: 3 },
  '10': { money: '9.90',  name: '道问-10次解读', count: 10 },
  '20': { money: '19.90', name: '道问-20次解读', count: 20 }
};

// 与前端 paywall.js _codeDB 一致的备用码（在线购买专用）
var ONLINE_CODES = [
  'DW-A1K3',3,'DW-B2M9',3,'DW-C5N8',3,'DW-D1P6',3,'DW-E4Q2',3,
  'DW-F8R1',3,'DW-G3S5',3,'DW-H7T9',3,'DW-J2U4',3,'DW-K6V8',3,
  'DW-R3B9',10,'DW-S7C4',10,'DW-T2D8',10,'DW-U6E1',10,'DW-V1F5',10,
  'DW-B5M4',20,'DW-C8N9',20,'DW-D2P3',20,'DW-E6Q7',20,'DW-F1R2',20
];
// 轮换返回对应tier的码（避免每次购买都用同一个）
var _tierIdx = {3:0,10:0,20:0};
function genCode(tier) {
  var count = tier==='3'?3:tier==='10'?10:20;
  var pool = [];
  for (var i=0;i<ONLINE_CODES.length;i+=2) {
    if (ONLINE_CODES[i+1]===count) pool.push(ONLINE_CODES[i]);
  }
  if (!pool.length) return 'DW-A1K3';
  // 时间戳伪随机选取
  var idx = (Date.now() % 100) % pool.length;
  return pool[idx];
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if (req.method==='OPTIONS') return res.status(200).end();
  if (req.method!=='POST') return res.status(405).json({error:'Method not allowed'});

  try {
    var body = typeof req.body==='string' ? JSON.parse(req.body) : (req.body||{});
    var tier = String(body.tier||'3');
    var plan = PRICE_MAP[tier];
    if (!plan) return res.status(400).json({error:'无效套餐'});

    var zkey = (process.env.ZPAY_KEY||'').trim();
    var zpid = (process.env.ZPAY_PID||'').trim();
    if (!zkey||!zpid) return res.status(500).json({error:'支付配置未完成'});

    var out = 'DW'+Date.now()+Math.random().toString(36).substr(2,6);
    var rcode = genCode(tier);

    // 简化return_url（不含&参数，防止破坏签名）
    var returnUrl = 'https://daowenai.icu/#paid-'+rcode;

    // 构建参数（只用于签名，不包含敏感信息）
    var p = {
      pid: zpid, type: 'alipay', out_trade_no: out,
      notify_url: 'https://daowenai.icu/api/alipay-notify',
      return_url: returnUrl, name: plan.name, money: plan.money
    };

    var keys = Object.keys(p).sort();
    var signStr = keys.map(function(k){return k+'='+p[k];}).join('&')+zkey;
    p.sign = crypto.createHash('md5').update(signStr,'utf8').digest('hex').toLowerCase();

    // 构建支付URL（参数需要encode）
    var qs = keys.map(function(k){return k+'='+encodeURIComponent(p[k]);}).join('&');
    qs += '&sign='+encodeURIComponent(p.sign);
    var payUrl = 'https://api.z-pay.cn/submit.php?'+qs;

    res.json({success:true,payUrl:payUrl,outTradeNo:out,amount:plan.money,code:rcode,count:plan.count});
  } catch(e) {
    console.error('ZPay:',e);
    res.status(500).json({error:'支付创建失败'});
  }
};
