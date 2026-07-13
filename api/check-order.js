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

  // ZPay 订单查询参数
  var params = { pid:zpid, out_trade_no:outTradeNo };
  var keys = Object.keys(params).sort();
  var signStr = keys.map(function(k){return k+'='+params[k];}).join('&')+zkey;
  params.sign = crypto.createHash('md5').update(signStr,'utf8').digest('hex').toLowerCase();
  params.key = zkey;

  var qs = keys.map(function(k){return k+'='+encodeURIComponent(params[k]);}).join('&');
  qs += '&sign='+encodeURIComponent(params.sign)+'&key='+encodeURIComponent(zkey);

  var result = await new Promise(function(resolve,reject){
    var rq = https.request({
      hostname:'api.z-pay.cn',path:'/query.php?'+qs,method:'GET',
      headers:{'User-Agent':'DaoWen/1.0'}
    },function(rp){
      var body='';rp.on('data',function(c){body+=c;});
      rp.on('end',function(){resolve(body);});
    });
    rq.on('error',reject);rq.end();
  });

  // ZPay query returns JSON-like string. If paid, contains trade_status info
  var paid = (result.indexOf('TRADE_SUCCESS')!==-1 || result.indexOf('success')!==-1 || result.indexOf('SUCCESS')!==-1);
  res.json({paid:paid,raw:result.substring(0,200)});
};
