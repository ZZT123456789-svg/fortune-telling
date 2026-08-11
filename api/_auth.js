const crypto = require('crypto');
const { dataRequest, dataRpc, sha256Hex } = require('./_lib');

const COOKIE_NAME = 'daowen_identity';
const SESSION_DAYS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_PASSWORD_HASH = 'scrypt$16384$8$1$00000000000000000000000000000000$5f4dcc3b5aa765d61d8327deb882cf99d37e0b925ecbeab08a64c6b2f5f3cf58';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase().slice(0, 254);
}

function publicUser(row) {
  if (!row || !row.id) return null;
  return {
    id: String(row.id),
    email: row.email ? String(row.email) : '',
    isGuest: row.is_guest !== false
  };
}

function parseCookies(req) {
  const raw = String((req.headers && req.headers.cookie) || '');
  const out = {};
  raw.split(';').forEach(part => {
    const at = part.indexOf('=');
    if (at < 1) return;
    const key = part.slice(0, at).trim();
    try { out[key] = decodeURIComponent(part.slice(at + 1).trim()); } catch (_) {}
  });
  return out;
}

function isSecureRequest(req) {
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || '').split(',')[0].trim();
  return proto === 'https' || !!process.env.VERCEL;
}

function appendSetCookie(res, value) {
  const current = res.getHeader && res.getHeader('Set-Cookie');
  const values = current ? (Array.isArray(current) ? current.concat(value) : [current, value]) : value;
  res.setHeader('Set-Cookie', values);
}

function setSessionCookie(req, res, token, maxAge) {
  const bits = [
    COOKIE_NAME + '=' + encodeURIComponent(token || ''),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + Math.max(0, Number(maxAge || 0))
  ];
  if (isSecureRequest(req)) bits.push('Secure');
  appendSetCookie(res, bits.join('; '));
}

function randomUuid() {
  return crypto.randomUUID ? crypto.randomUUID() : [4, 2, 2, 2, 6].map(n => crypto.randomBytes(n).toString('hex')).join('-');
}

function scrypt(password, salt, options) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 32, options, (err, key) => err ? reject(err) : resolve(key));
  });
}

async function hashPassword(password) {
  const value = String(password || '');
  if (value.length < 8 || value.length > 72) throw new Error('PASSWORD_LENGTH');
  const salt = crypto.randomBytes(16).toString('hex');
  const options = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
  const key = await scrypt(value, salt, options);
  return ['scrypt', options.N, options.r, options.p, salt, key.toString('hex')].join('$');
}

async function verifyPassword(password, encoded) {
  const parts = String(encoded || DUMMY_PASSWORD_HASH).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const options = { N: Number(parts[1]), r: Number(parts[2]), p: Number(parts[3]), maxmem: 64 * 1024 * 1024 };
  if (!Number.isFinite(options.N) || options.N < 1024 || options.N > 1048576) return false;
  try {
    const actual = await scrypt(String(password || ''), parts[4], options);
    const expected = Buffer.from(parts[5], 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch (_) {
    return false;
  }
}

async function findUserById(id) {
  const rows = await dataRequest('/rest/v1/app_users?id=eq.' + encodeURIComponent(id) + '&select=id,email,is_guest,password_hash&limit=1');
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function findUserByEmail(email) {
  const rows = await dataRequest('/rest/v1/app_users?email=eq.' + encodeURIComponent(normalizeEmail(email)) + '&select=id,email,is_guest,password_hash&limit=1');
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function createSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await dataRequest('/rest/v1/app_sessions', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      id: randomUuid(),
      user_id: userId,
      token_hash: sha256Hex(token),
      expires_at: expires
    })
  });
  setSessionCookie(req, res, token, SESSION_DAYS * 86400);
  return token;
}

async function createGuest(req, res) {
  const id = randomUuid();
  await dataRequest('/rest/v1/app_users', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ id, is_guest: true })
  });
  await createSession(req, res, id);
  return { id, email: null, is_guest: true };
}

async function sessionUser(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  const rows = await dataRequest('/rest/v1/app_sessions?token_hash=eq.' + sha256Hex(token) + '&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&select=user_id&limit=1');
  if (!Array.isArray(rows) || !rows[0]) return null;
  return findUserById(rows[0].user_id);
}

async function ensureUser(req, res) {
  const found = await sessionUser(req);
  return found || createGuest(req, res);
}

async function destroyCurrentSession(req, res) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (token) {
    await dataRequest('/rest/v1/app_sessions?token_hash=eq.' + sha256Hex(token), {
      method: 'DELETE', headers: { Prefer: 'return=minimal' }
    });
  }
  setSessionCookie(req, res, '', 0);
}

function clientAddress(req) {
  const forwarded = String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim();
  return forwarded || String((req.socket && req.socket.remoteAddress) || 'unknown');
}

async function loginRateLimited(req, email) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const emailHash = sha256Hex(normalizeEmail(email));
  const ipHash = sha256Hex(clientAddress(req));
  const rows = await dataRequest('/rest/v1/app_login_attempts?success=eq.false&attempted_at=gt.' + encodeURIComponent(since) + '&or=(email_hash.eq.' + emailHash + ',ip_hash.eq.' + ipHash + ')&select=id&limit=10');
  return Array.isArray(rows) && rows.length >= 10;
}

async function recordLoginAttempt(req, email, success) {
  const emailHash = sha256Hex(normalizeEmail(email));
  const ipHash = sha256Hex(clientAddress(req));
  await dataRequest('/rest/v1/app_login_attempts', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ email_hash: emailHash, ip_hash: ipHash, success: !!success })
  });
  if (success) {
    await dataRequest('/rest/v1/app_login_attempts?email_hash=eq.' + emailHash + '&success=eq.false', {
      method: 'DELETE', headers: { Prefer: 'return=minimal' }
    });
  }
}

async function bindGuestAccount(req, res, email, password) {
  email = normalizeEmail(email);
  if (!EMAIL_RE.test(email)) return { success: false, status: 400, code: 'INVALID_EMAIL', error: '请输入有效邮箱' };
  if (String(password || '').length < 8 || String(password || '').length > 72) {
    return { success: false, status: 400, code: 'INVALID_PASSWORD', error: '密码需要 8–72 位' };
  }
  const current = await ensureUser(req, res);
  if (current.is_guest === false) return { success: false, status: 409, code: 'ALREADY_SAVED', error: '当前数据已经绑定账号' };
  const existing = await findUserByEmail(email);
  if (existing && existing.id !== current.id) {
    return { success: false, status: 409, code: 'EMAIL_EXISTS', error: '该邮箱已有保存账号，请使用“恢复数据”' };
  }
  const passwordHash = await hashPassword(password);
  const rows = await dataRequest('/rest/v1/app_users?id=eq.' + encodeURIComponent(current.id), {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ email, password_hash: passwordHash, is_guest: false, password_reset_required: false })
  });
  const user = Array.isArray(rows) && rows[0] ? rows[0] : Object.assign({}, current, { email, is_guest: false });
  // Rotate the session token after elevating a guest identity into a saved account.
  await destroyCurrentSession(req, res);
  await createSession(req, res, current.id);
  return { success: true, user: publicUser(user), message: '数据已保存到账号' };
}

async function signIn(req, res, email, password) {
  email = normalizeEmail(email);
  if (!EMAIL_RE.test(email) || !password) return { success: false, status: 400, code: 'INVALID_CREDENTIALS', error: '邮箱或密码错误' };
  if (await loginRateLimited(req, email)) {
    return { success: false, status: 429, code: 'RATE_LIMIT', error: '尝试次数过多，请 15 分钟后再试' };
  }
  const current = await ensureUser(req, res);
  const account = await findUserByEmail(email);
  const valid = await verifyPassword(password, account && account.password_hash);
  if (!account || account.is_guest !== false || !valid) {
    await recordLoginAttempt(req, email, false);
    return {
      success: false,
      status: 401,
      code: 'INVALID_CREDENTIALS',
      error: '邮箱或密码错误；旧账号请使用“忘记密码”设置本站密码'
    };
  }

  await recordLoginAttempt(req, email, true);

  if (current.id !== account.id && current.is_guest !== false) {
    const merged = await dataRpc('api_merge_guest_identity', { p_guest_user_id: current.id, p_account_user_id: account.id });
    if (!merged || merged.success !== true) {
      const err = new Error('Guest identity merge failed');
      err.code = merged && merged.code;
      throw err;
    }
  } else {
    await destroyCurrentSession(req, res);
  }
  await createSession(req, res, account.id);
  return { success: true, user: publicUser(account), message: '数据已恢复' };
}

async function signOutToGuest(req, res) {
  await destroyCurrentSession(req, res);
  const guest = await createGuest(req, res);
  return { success: true, user: publicUser(guest) };
}

function appBaseUrl(req) {
  const configured = String(process.env.APP_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || 'https').split(',')[0].trim();
  const host = String((req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '').split(',')[0].trim();
  return host ? proto + '://' + host : 'https://daowenai.icu';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function sendResetEmail(to, link) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.MAIL_FROM || '').trim();
  if (!apiKey || !from) throw new Error('Password recovery email is not configured');
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      subject: '道问：重设数据保存密码',
      html: '<p>你正在重设道问的数据保存密码。</p><p><a href="' + escapeHtml(link) + '">点击这里设置新密码</a></p><p>链接 30 分钟内有效且只能使用一次。若非本人操作，请忽略此邮件。</p>'
    })
  });
  if (!resp.ok) throw new Error('Password recovery email failed: ' + resp.status);
}

async function requestPasswordReset(req, email) {
  email = normalizeEmail(email);
  if (!EMAIL_RE.test(email)) return { success: false, status: 400, code: 'INVALID_EMAIL', error: '请输入有效邮箱' };
  if (!String(process.env.RESEND_API_KEY || '').trim() || !String(process.env.MAIL_FROM || '').trim()) {
    return { success: false, status: 503, code: 'MAIL_UNAVAILABLE', error: '密码找回邮件服务尚未配置' };
  }
  const generic = { success: true, message: '如果该邮箱已保存数据，重设链接会发送到邮箱' };
  const user = await findUserByEmail(email);
  if (!user || user.is_guest !== false) return generic;

  const recent = await dataRequest('/rest/v1/app_password_resets?user_id=eq.' + encodeURIComponent(user.id) + '&created_at=gt.' + encodeURIComponent(new Date(Date.now() - 60 * 1000).toISOString()) + '&select=id&limit=1');
  if (Array.isArray(recent) && recent[0]) return generic;

  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  await dataRequest('/rest/v1/app_password_resets?user_id=eq.' + encodeURIComponent(user.id) + '&used_at=is.null', {
    method: 'DELETE', headers: { Prefer: 'return=minimal' }
  });
  await dataRequest('/rest/v1/app_password_resets', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ id: randomUuid(), user_id: user.id, token_hash: sha256Hex(token), expires_at: expires })
  });
  const link = appBaseUrl(req) + '/?reset_token=' + encodeURIComponent(token) + '&reset_email=' + encodeURIComponent(email);
  await sendResetEmail(email, link);
  return generic;
}

async function completePasswordReset(req, res, email, token, password) {
  email = normalizeEmail(email);
  if (!EMAIL_RE.test(email) || !token) return { success: false, status: 400, code: 'INVALID_RESET', error: '重设链接无效' };
  if (String(password || '').length < 8 || String(password || '').length > 72) {
    return { success: false, status: 400, code: 'INVALID_PASSWORD', error: '新密码需要 8–72 位' };
  }
  const user = await findUserByEmail(email);
  if (!user) return { success: false, status: 400, code: 'INVALID_RESET', error: '重设链接无效或已过期' };
  const rows = await dataRequest('/rest/v1/app_password_resets?user_id=eq.' + encodeURIComponent(user.id) + '&token_hash=eq.' + sha256Hex(token) + '&used_at=is.null&expires_at=gt.' + encodeURIComponent(new Date().toISOString()) + '&select=id&limit=1');
  if (!Array.isArray(rows) || !rows[0]) return { success: false, status: 400, code: 'INVALID_RESET', error: '重设链接无效或已过期' };

  const passwordHash = await hashPassword(password);
  await dataRequest('/rest/v1/app_users?id=eq.' + encodeURIComponent(user.id), {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ password_hash: passwordHash, password_reset_required: false, is_guest: false })
  });
  await dataRequest('/rest/v1/app_password_resets?id=eq.' + encodeURIComponent(rows[0].id), {
    method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ used_at: new Date().toISOString() })
  });
  await dataRequest('/rest/v1/app_sessions?user_id=eq.' + encodeURIComponent(user.id), {
    method: 'DELETE', headers: { Prefer: 'return=minimal' }
  });
  await destroyCurrentSession(req, res);
  await createSession(req, res, user.id);
  return { success: true, user: publicUser(Object.assign({}, user, { is_guest: false })), message: '密码已更新，数据已恢复' };
}

module.exports = {
  COOKIE_NAME,
  normalizeEmail,
  publicUser,
  hashPassword,
  verifyPassword,
  ensureUser,
  requireUser: ensureUser,
  bindGuestAccount,
  signIn,
  signOutToGuest,
  requestPasswordReset,
  completePasswordReset,
  _test: { parseCookies, setSessionCookie, findUserByEmail, sessionUser }
};
