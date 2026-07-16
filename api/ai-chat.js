/**
 * AI命理助手 — DeepSeek对话接口
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
  if (!apiKey) return res.status(500).json({ error: 'AI服务未配置，请在Vercel设置DEEPSEEK_API_KEY' });

  try {
    var body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    var messages = body.messages;
    if (!messages || !messages.length) return res.status(400).json({ error: '缺少消息' });

    // 注入系统提示
    var fullMessages = [
      { role: 'system', content: '你是道问网站的AI命理助手，精通八字、紫微斗数、六爻、塔罗等东方命理。回答简洁专业，用口语化中文。基于用户提供的命盘数据回答问题，不要编造数据中没有的信息。' },
      { role: 'system', content: '你是一个热情但专业的玄学AI，帮助用户深度理解他们的命盘、运势、事业发展、感情婚姻等。每次回答结尾可以根据情况给一个温暖的鼓励。' }
    ].concat(messages.slice(-10));

    var result = await callDeepSeek(apiKey, fullMessages);
    res.json({ success: true, content: result });
  } catch (e) {
    console.error('AI error:', e.message);
    res.status(500).json({ error: 'AI服务暂不可用: ' + e.message });
  }
};

function callDeepSeek(apiKey, messages) {
  return new Promise(function(resolve, reject) {
    var data = JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 1000,
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
