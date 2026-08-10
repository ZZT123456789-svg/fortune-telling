const crypto = require('crypto');
const { noStore, verifyUser, serviceRpc, sha256Hex } = require('./_lib');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const user = await verifyUser(req);
    if (!user) return res.status(401).json({ success: false, error: '请先登录账号' });

    const token = crypto.randomBytes(32).toString('base64url');
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    await serviceRpc('api_register_trusted_device', {
      p_user_id: user.id,
      p_token_hash: sha256Hex(token),
      p_code_hash: sha256Hex(code),
      p_label: String((req.body && req.body.label) || '浏览器设备').slice(0, 80)
    });

    return res.status(200).json({
      success: true,
      credential: { token, code, email: String(user.email || '').toLowerCase() }
    });
  } catch (e) {
    console.error('[register-trusted-device]', e.message);
    return res.status(500).json({ success: false, error: '可信设备登记失败' });
  }
};
