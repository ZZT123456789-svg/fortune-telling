/**
 * ZPay 订单状态查询 — 验证用户是否真实支付
 */
const https = require('https');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  if (req.method==='OPTIONS') return res.status(200).end();

  var outTradeNo = (req.query && req.query.order) || '';
  if (!outTradeNo) return res.status(400).json({paid:false,msg:'缺少订单号'});

  var zkey = (process.env.ZPAY_KEY||'').trim();
  var zpid = (process.env.ZPAY_PID||'').trim();
  if (!zkey||!zpid) return res.status(500).json({paid:false,msg:'支付配置未完成'});

  // ZPay 查询参数+签名
  var params = { pid: zpid, out_trade_no: outTradeNo };
  var keys = Object.keys(params).sort();
  var signStr = keys.map(function(k){return k+'='+params[k];}).join('&')+zkey;
  params.sign = crypto.createHash('md5').update(signStr,'utf8').digest('hex').toLowerCase();

  try {
    var result = await new Promise(function(resolve, reject) {
      var qs = keys.map(function(k){return k+'='+encodeURIComponent(params[k]);}).join('&') + '&sign='+encodeURIComponent(params.sign);
      var rq = https.get('https://api.z-pay.cn/query.php?'+qs, { headers:{'User-Agent':'DaoWen/1.0'} }, function(rp) {
        var body='';
        rp.on('data',function(c){body+=c;});
        rp.on('end',function(){resolve(body);});
      });
      rq.on('error', reject);
      rq.setTimeout(8000, function(){ rq.destroy(); reject(new Error('timeout')); });
    });

    // ZPay 返回的文本中包含 status 或 trade_status 表示支付状态
    var paid = false;
    if (result.indexOf('TRADE_SUCCESS')!==-1 || result.indexOf('success')!==-1 ||
        result.indexOf('paid')!==-1 || result.indexOf('SUCCESS')!==-1 ||
        (result.indexOf('status')!==-1 && result.indexOf('1')!==-1)) {
      paid = true;
    }

    // 如果返回太长，截取关键部分
    var shortResult = result.substring(0, 300);
    res.json({ paid: paid, msg: paid?'支付已确认':'暂未检测到支付记录', debug: shortResult });
  } catch(e) {
    // 查询超时或失败，返回未支付
    res.json({ paid: false, msg: '支付验证暂不可用，请稍后重试或联系客服' });
  }
};
