const { noStore, readJson, serviceRpc, serviceRequest, sha256Hex } = require('./_lib');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const token = String(body.token || '').trim();
    const code = String(body.code || '').trim();
    const password = String(body.password || '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !token || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, error: '可信设备凭证无效' });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ success: false, error: '新密码需要 8–72 位' });
    }

    const userId = await serviceRpc('api_consume_trusted_reset', {
      p_email_hash: sha256Hex(email),
      p_token_hash: sha256Hex(token),
      p_code_hash: sha256Hex(code)
    });
    if (!userId) {
      return res.status(400).json({ success: false, error: '当前设备未受信任、凭证已过期或已经使用' });
    }

    await serviceRequest('/auth/v1/admin/users/' + encodeURIComponent(String(userId)), {
      method: 'PUT',
      body: JSON.stringify({ password })
    });

    return res.status(200).json({ success: true, message: '密码已更新' });
  } catch (e) {
    console.error('[trusted-password-reset]', e.message);
    return res.status(500).json({ success: false, error: '密码重置失败，请稍后重试' });
  }
};
