const { noStore, readJson, verifyUser, serviceRpc } = require('./_lib');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ success: false, error: '请先登录后兑换' });
    const body = await readJson(req);
    const code = String(body.code || '').trim().toUpperCase();
    if (code.length < 8 || code.length > 80) {
      return res.status(400).json({ success: false, error: '无效的兑换码' });
    }

    const result = await serviceRpc('api_redeem_code', { p_user_id: user.id, p_code: code });
    if (!result || result.success !== true) {
      const http = result && result.code === 'RATE_LIMIT' ? 429 : 400;
      return res.status(http).json({
        success: false,
        error: (result && result.msg) || '兑换失败',
        code: result && result.code
      });
    }
    return res.status(200).json(result);
  } catch (e) {
    console.error('[redeem]', e.message);
    return res.status(500).json({ success: false, error: '兑换服务暂不可用' });
  }
};
