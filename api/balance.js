const { noStore, verifyUser, serviceRpc } = require('./_lib');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ success: false, error: '请先登录' });
    const balance = await serviceRpc('api_get_balance', { p_user_id: user.id });
    return res.status(200).json({ success: true, balance: Number(balance || 0) });
  } catch (e) {
    console.error('[balance]', e.message);
    return res.status(500).json({ success: false, error: '余额服务暂不可用' });
  }
};
