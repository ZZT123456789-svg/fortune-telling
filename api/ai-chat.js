/**
 * AI命理助手 — Claude对话接口
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
    var messages = body.messages;
    if (!messages || !messages.length) return res.status(400).json({ error: '缺少消息' });

    var result = await callClaude(apiKey, messages);
    res.json({ success: true, content: result });
  } catch (e) {
    console.error('AI chat error:', e.message);
    res.status(500).json({ error: 'AI服务暂不可用' });
  }
};

function callClaude(apiKey, messages) {
  return new Promise(function(resolve, reject) {
    var data = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: '你是道问网站的AI命理助手，精通八字、紫微斗数、六爻、塔罗等东方命理。回答简洁专业，用口语化中文。如果用户发来了命盘数据，请基于数据回答问题。不要编造数据中没有的信息。',
      messages: messages
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
