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
    if (!EMAIL_RE.test(email)) return res.status(400).json({ success: false, error: '请输入有效的邮箱地址' });
    if (password.length < 6 || password.length > 72) return res.status(400).json({ success: false, error: '密码需为 6-72 位' });

    const { url, serviceKey } = supabaseAuth();
    if (!url || !serviceKey) return res.status(500).json({ success: false, error: '服务端密钥未配置' });

    // email_confirm:true —— 直接视为已验证，不发任何确认邮件。
    const resp = await fetch(url + '/auth/v1/admin/users', {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.id) {
      if (resp.status === 422 || /already registered|already been registered|exists|already exists/i.test(String(data.msg || data.error_description || data.message || ''))) {
        return res.status(409).json({ success: false, error: '该邮箱已注册，请直接登录' });
      }
      return res.status(resp.status || 500).json({ success: false, error: data.msg || data.error_description || data.message || '注册失败，请稍后重试' });
    }

    const accountId = String(data.id);
    const guestId = readGuest(req);
    if (guestId && guestId !== accountId) {
      await dataRpc('api_merge_guest_identity', { p_guest: guestId, p_account: accountId }).catch(() => {});
    }

    setAccountCookie(req, res, accountId, email);
    return res.status(200).json({
      success: true,
      user: { id: accountId, email, isGuest: false },
      recoveryCode: recoveryCode(accountId)
    });
  } catch (e) {
    console.error('[auth-signup]', e.message);
    return res.status(500).json({ success: false, error: '注册服务暂不可用' });
  }
};
