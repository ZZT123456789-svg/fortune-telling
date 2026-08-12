const crypto = require('crypto');

const COOKIE_NAME = 'daowen_visitor';
const ACCOUNT_COOKIE_NAME = 'daowen_account';
const COOKIE_DAYS = 365;

function parseCookies(req) {
  const raw = String((req.headers && req.headers.cookie) || '');
  const out = {};
  raw.split(';').forEach(part => {
    const at = part.indexOf('=');
    if (at < 1) return;
    try { out[part.slice(0, at).trim()] = decodeURIComponent(part.slice(at + 1).trim()); } catch (_) {}
  });
  return out;
}

function signingKey() {
  const key = String(
    process.env.VISITOR_SIGNING_KEY ||
    process.env.DATA_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ZPAY_KEY || ''
  ).trim();
  if (key.length < 16) throw new Error('VISITOR_SIGNING_KEY missing');
  return key;
}

function signature(value) {
  return crypto.createHmac('sha256', signingKey()).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && aa.length > 0 && crypto.timingSafeEqual(aa, bb);
}

function encodeVisitor(id, expires) {
  const payload = id + '.' + expires;
  return payload + '.' + signature(payload);
}

function decodeVisitor(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3 || !/^[0-9a-f-]{36}$/i.test(parts[0]) || !/^\d+$/.test(parts[1])) return null;
  const payload = parts[0] + '.' + parts[1];
  if (!safeEqual(signature(payload), parts[2])) return null;
  if (Number(parts[1]) <= Math.floor(Date.now() / 1000)) return null;
  return { id: parts[0], isGuest: true };
}

// 账号 Cookie：uuid.emailBase64url.expiry.signature（email 用 base64url 编码，避免含 "."）
function encodeAccount(id, email, expires) {
  const emailB64 = Buffer.from(String(email || ''), 'utf8').toString('base64url');
  const payload = id + '.' + emailB64 + '.' + expires;
  return payload + '.' + signature(payload);
}

function decodeAccount(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 4 || !/^[0-9a-f-]{36}$/i.test(parts[0]) || !/^\d+$/.test(parts[2])) return null;
  const payload = parts[0] + '.' + parts[1] + '.' + parts[2];
  if (!safeEqual(signature(payload), parts[3])) return null;
  if (Number(parts[2]) <= Math.floor(Date.now() / 1000)) return null;
  let email = '';
  try { email = Buffer.from(parts[1], 'base64url').toString('utf8'); } catch (_) { email = ''; }
  return { id: parts[0], email: email, isGuest: false };
}

function isSecure(req) {
  const proto = String((req.headers && req.headers['x-forwarded-proto']) || '').split(',')[0].trim();
  return proto === 'https' || !!process.env.VERCEL;
}

function setVisitorCookie(req, res, token) {
  const maxAge = COOKIE_DAYS * 86400;
  const bits = [COOKIE_NAME + '=' + encodeURIComponent(token), 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=' + maxAge];
  if (isSecure(req)) bits.push('Secure');
  res.setHeader('Set-Cookie', bits.join('; '));
}

function setAccountCookie(req, res, id, email) {
  const expires = Math.floor(Date.now() / 1000) + COOKIE_DAYS * 86400;
  const maxAge = COOKIE_DAYS * 86400;
  const bits = [ACCOUNT_COOKIE_NAME + '=' + encodeURIComponent(encodeAccount(id, email, expires)), 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=' + maxAge];
  if (isSecure(req)) bits.push('Secure');
  res.setHeader('Set-Cookie', bits.join('; '));
}

function clearAccountCookie(res) {
  res.setHeader('Set-Cookie', ACCOUNT_COOKIE_NAME + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

// 只读取现有游客身份，不新发 Cookie（供登录/注册时拿到待合并的 guest id）。
function readGuest(req) {
  const guest = decodeVisitor(parseCookies(req)[COOKIE_NAME]);
  return guest ? guest.id : null;
}

async function ensureUser(req, res) {
  const account = decodeAccount(parseCookies(req)[ACCOUNT_COOKIE_NAME]);
  if (account) return account;
  const existing = decodeVisitor(parseCookies(req)[COOKIE_NAME]);
  if (existing) return existing;
  const id = crypto.randomUUID();
  const expires = Math.floor(Date.now() / 1000) + COOKIE_DAYS * 86400;
  setVisitorCookie(req, res, encodeVisitor(id, expires));
  return { id, isGuest: true };
}

// 信任留存码：由密钥 + 账号 UUID 派生，不存库、随时可重算。
// 格式 DW-XXXXX-XXXXX-XXXXX-XXXXX（前 20 位十六进制 = 80 bit 熵）。
function recoveryCode(uuid) {
  const hex = crypto.createHmac('sha256', signingKey())
    .update('recover:' + String(uuid || ''))
    .digest('hex').slice(0, 20).toUpperCase();
  return 'DW-' + hex.slice(0, 5) + '-' + hex.slice(5, 10) + '-' + hex.slice(10, 15) + '-' + hex.slice(15, 20);
}

function verifyRecoveryCode(uuid, code) {
  return safeEqual(recoveryCode(uuid), String(code || '').trim().toUpperCase());
}

// Supabase Auth 配置（注册用 service_role；登录用 anon key 走密码 grant）。
function supabaseAuth() {
  const url = String(process.env.SUPABASE_URL || process.env.DATA_API_URL || '').trim().replace(/\/$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DATA_SERVICE_KEY || '').trim();
  const anonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();
  return { url, serviceKey, anonKey };
}

module.exports = {
  COOKIE_NAME,
  ACCOUNT_COOKIE_NAME,
  ensureUser,
  requireUser: ensureUser,
  publicUser: user => (user && user.id ? { id: String(user.id), email: user.email || null, isGuest: !!user.isGuest } : null),
  readGuest,
  setAccountCookie,
  clearAccountCookie,
  recoveryCode,
  verifyRecoveryCode,
  supabaseAuth,
  _test: { encodeVisitor, decodeVisitor, encodeAccount, decodeAccount, parseCookies }
};
