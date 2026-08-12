const { noStore } = require('./_lib');
const { clearAccountCookie } = require('./_auth');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    clearAccountCookie(res);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('[auth-logout]', e.message);
    return res.status(500).json({ success: false, error: '退出失败，请稍后重试' });
  }
};
