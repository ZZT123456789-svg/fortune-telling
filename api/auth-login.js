const { noStore, readJson, dataRpc } = require('./_lib');
const { readGuest, setAccountCookie, recoveryCode, supabaseAuth } = require('./_auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!EMAIL_RE.test(email) || !password) return res.status(400).json({ success: false, error: '请输入邮箱和密码' });

    const { url, serviceKey, anonKey } = supabaseAuth();
    const apiKey = anonKey || serviceKey;
    if (!url || !apiKey) return res.status(500).json({ success: false, error: '服务端密钥未配置' });

    const resp = await fetch(url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.user || !data.user.id) {
      const msg = String(data.msg || data.error_description || data.error || '登录失败');
      if (resp.status === 400 || /invalid login credentials|invalid_grant|invalid grant|email not confirmed/i.test(msg)) {
        return res.status(401).json({ success: false, error: '邮箱或密码错误' });
      }
      return res.status(resp.status || 500).json({ success: false, error: msg });
    }

    const accountId = String(data.user.id);
    const accountEmail = String(data.user.email || email).toLowerCase();
    const guestId = readGuest(req);
    if (guestId && guestId !== accountId) {
      await dataRpc('api_merge_guest_identity', { p_guest: guestId, p_account: accountId }).catch(() => {});
    }

    setAccountCookie(req, res, accountId, accountEmail);
    return res.status(200).json({
      success: true,
      user: { id: accountId, email: accountEmail, isGuest: false },
      recoveryCode: recoveryCode(accountId)
    });
  } catch (e) {
    console.error('[auth-login]', e.message);
    return res.status(500).json({ success: false, error: '登录服务暂不可用' });
  }
};
