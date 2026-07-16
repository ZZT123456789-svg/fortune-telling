/**
 * AI深度解读 — DeepSeek生成八字命理分析
 * 环境变量: DEEPSEEK_API_KEY
 */
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI服务未配置' });

  try {
    var body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    var chart = body.chart;
    if (!chart) return res.status(400).json({ error: '缺少八字数据' });

    var prompt = buildPrompt(chart);
    var result = await callDeepSeek(apiKey, prompt);
    res.json({ success: true, content: result });
  } catch (e) {
    console.error('AI error:', e.message);
    res.status(500).json({ error: 'AI服务暂不可用' });
  }
};

function buildPrompt(c) {
  return '你是一位精通《滴天髓》《穷通宝鉴》《子平真诠》的命理师。请为以下八字写出个性化、有深度的命理分析。\n\n' +
    '八字：' + c.year + ' ' + c.month + ' ' + c.day + ' ' + c.hour + '\n' +
    '日主：' + c.dm + '（五行' + c.de + '）\n' +
    '性别：' + c.gender + ' 生肖：' + c.sx + '\n' +
    '五行分布：' + JSON.stringify(c.wx) + '\n' +
    '十神：' + JSON.stringify(c.ss) + '\n' +
    '身强弱：' + c.strength + '\n' +
    '调候用神：' + c.tiaoHou + '\n' +
    '格局：' + c.pattern + '\n' +
    '大运：' + JSON.stringify(c.dayun) + '\n\n' +
    '请按以下结构输出（每段150-300字，用口语化中文）：\n\n' +
    '## 命格总览\n用通俗的话概括这个八字的格局和人生基调。\n\n' +
    '## 事业财运\n具体分析事业方向和财运走势。\n\n' +
    '## 感情婚姻\n根据日支夫妻宫和十神分析感情特点。\n\n' +
    '## 健康提示\n根据五行偏旺偏弱给出健康建议。\n\n' +
    '## 人生建议\n给命主2-3条切实可行的建议。\n\n' +
    '要求：引用具体干支，每条结论有命理依据，风格平实易懂。';
}

function callDeepSeek(apiKey, prompt) {
  return new Promise(function(resolve, reject) {
    var data = JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7
    });

    var req = https.request({
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(data)
      }
    }, function(response) {
      var body = '';
      response.on('data', function(chunk) { body += chunk; });
      response.on('end', function() {
        try {
          var json = JSON.parse(body);
          if (json.error) reject(new Error(json.error.message));
          else resolve(json.choices[0].message.content);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
