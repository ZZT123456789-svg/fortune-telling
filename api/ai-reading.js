/**
 * AI深度解读 API — Claude 生成独一无二的八字命理分析
 * 环境变量: ANTHROPIC_API_KEY
 */
const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'AI服务未配置' });

  try {
    var body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    var chart = body.chart;
    if (!chart) return res.status(400).json({ error: '缺少八字数据' });

    // 构建prompt
    var prompt = buildPrompt(chart);

    // 调用 Claude API
    var result = await callClaude(apiKey, prompt);

    res.json({ success: true, content: result });

  } catch (e) {
    console.error('AI error:', e.message);
    res.status(500).json({ error: 'AI服务暂不可用，请稍后重试' });
  }
};

function buildPrompt(c) {
  return `你是一位精通《滴天髓》《穷通宝鉴》《子平真诠》的命理师。请为以下八字写出个性化、有深度的命理分析。

八字：${c.year} ${c.month} ${c.day} ${c.hour}
日主：${c.dm}（五行${c.de}）
性别：${c.gender} 生肖：${c.sx}
五行分布：${JSON.stringify(c.wx)}
十神：${JSON.stringify(c.ss)}
身强弱：${c.strength}
调候用神：${c.tiaoHou}
格局：${c.pattern}
大运：${JSON.stringify(c.dayun)}

请按以下结构输出（每段150-300字，用口语化中文，不要AI味太重）：

## 命格总览
用通俗的话概括这个八字的格局和人生基调。提到具体的干支组合。

## 事业财运
具体分析事业方向和财运走势。结合十神配置说明为什么适合某些行业。

## 感情婚姻
根据日支夫妻宫和十神分析感情特点。

## 健康提示
根据五行偏旺偏弱给出健康建议。

## 人生建议
给命主2-3条切实可行的建议。

要求：
- 必须引用具体的干支（如"年柱甲申"、"月支子水"）
- 不要泛泛而谈，每条结论都要有命理依据
- 风格平实易懂，像老师傅在说话`;
}

function callClaude(apiKey, prompt) {
  return new Promise(function(resolve, reject) {
    var data = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    var req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(data)
      }
    }, function(response) {
      var body = '';
      response.on('data', function(chunk) { body += chunk; });
      response.on('end', function() {
        try {
          var json = JSON.parse(body);
          if (json.error) reject(new Error(json.error.message));
          else resolve(json.content[0].text);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
