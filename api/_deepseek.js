async function callDeepSeek(messages, options) {
  options = options || {};
  const apiKey = String(process.env.DEEPSEEK_API_KEY || '').trim();
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY missing');
  const model = String(process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash').trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || 45000));
  try {
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: Number(options.maxTokens || 1200),
        temperature: Number(options.temperature == null ? 0.7 : options.temperature),
        thinking: { type: options.thinking === true ? 'enabled' : 'disabled' }
      })
    });
    const text = await resp.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = {}; }
    if (!resp.ok || data.error) {
      const msg = data && data.error && data.error.message ? data.error.message : ('DeepSeek HTTP ' + resp.status);
      throw new Error(msg);
    }
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('DeepSeek returned empty content');
    return String(content);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { callDeepSeek };
