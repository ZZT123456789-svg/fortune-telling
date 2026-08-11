const { noStore } = require('./_lib');
const { ensureUser, publicUser } = require('./_auth');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const user = await ensureUser(req, res);
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (e) {
    console.error('[session]', e.message);
    return res.status(503).json({ success: false, error: '用户身份服务暂不可用' });
  }
};
