const { noStore, readJson, dataRpc } = require('./_lib');
const { readGuest, setAccountCookie, verifyRecoveryCode, supabaseAuth } = require('./_auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 按邮箱查账号（优先 PostgREST 风格 filter，失败则分页匹配）。
async function findAccountByEmail(url, serviceKey, email) {
  const target = email.toLowerCase();
  try {
    const r = await fetch(url + '/auth/v1/admin/users?filter=' + encodeURIComponent('email=eq.' + target), {
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
    });
    if (r.ok) {
      const data = await r.json();
      const users = Array.isArray(data) ? data : (data && data.users) || [];
      const hit = users.find(u => (u.email || '').toLowerCase() === target);
      if (hit) return hit;
    }
  } catch (_) {}
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(url + '/auth/v1/admin/users?page=' + page + '&per_page=1000', {
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey }
    });
    if (!r.ok) return null;
    const data = await r.json();
    const users = (data && data.users) || [];
    const hit = users.find(u => (u.email || '').toLowerCase() === target);
    if (hit) return hit;
    if (users.length < 1000) return null;
  }
  return null;
}

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const body = await readJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim().toUpperCase();
    if (!EMAIL_RE.test(email) || !code) return res.status(400).json({ success: false, error: '请输入邮箱和留存码' });

    const { url, serviceKey } = supabaseAuth();
    if (!url || !serviceKey) return res.status(500).json({ success: false, error: '服务端密钥未配置' });

    const account = await findAccountByEmail(url, serviceKey, email);
    if (!account || !account.id) return res.status(404).json({ success: false, error: '未找到该邮箱对应的账号' });

    const accountId = String(account.id);
    if (!verifyRecoveryCode(accountId, code)) {
      return res.status(401).json({ success: false, error: '留存码不正确' });
    }

    const guestId = readGuest(req);
    if (guestId && guestId !== accountId) {
      await dataRpc('api_merge_guest_identity', { p_guest: guestId, p_account: accountId }).catch(() => {});
    }

    const accountEmail = String(account.email || email).toLowerCase();
    setAccountCookie(req, res, accountId, accountEmail);
    return res.status(200).json({ success: true, user: { id: accountId, email: accountEmail, isGuest: false } });
  } catch (e) {
    console.error('[auth-recover]', e.message);
    return res.status(500).json({ success: false, error: '找回服务暂不可用' });
  }
};
