const { noStore, readJson, verifyUser, serviceRpc, randomRequestId } = require('./_lib');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ success: false, error: '请先登录' });
    const body = await readJson(req);
    const amount = Math.max(1, Math.min(20, parseInt(body.amount, 10) || 1));
    const reason = String(body.reason || 'premium').replace(/[^a-zA-Z0-9:_\-.\u4e00-\u9fff]/g, '').slice(0, 80) || 'premium';
    const requestId = String(body.requestId || randomRequestId('web')).slice(0, 120);

    const result = await serviceRpc('api_consume_credits', {
      p_user_id: user.id,
      p_amount: amount,
      p_reason: reason,
      p_request_id: requestId
    });

    if (!result || result.success !== true) {
      const status = result && result.code === 'INSUFFICIENT' ? 402 : 400;
      return res.status(status).json({
        success: false,
        error: (result && result.msg) || '扣减失败',
        code: result && result.code,
        balance: result && Number(result.balance || 0)
      });
    }
    return res.status(200).json(result);
  } catch (e) {
    console.error('[consume-credit]', e.message);
    return res.status(500).json({ success: false, error: '积分服务暂不可用' });
  }
};
