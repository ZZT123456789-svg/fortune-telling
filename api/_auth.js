const crypto = require('crypto');

const COOKIE_NAME = 'daowen_visitor';
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

async function ensureUser(req, res) {
  const existing = decodeVisitor(parseCookies(req)[COOKIE_NAME]);
  if (existing) return existing;
  const id = crypto.randomUUID();
  const expires = Math.floor(Date.now() / 1000) + COOKIE_DAYS * 86400;
  setVisitorCookie(req, res, encodeVisitor(id, expires));
  return { id, isGuest: true };
}

module.exports = {
  COOKIE_NAME,
  ensureUser,
  requireUser: ensureUser,
  publicUser: user => user && user.id ? { id: String(user.id), isGuest: true } : null,
  _test: { encodeVisitor, decodeVisitor, parseCookies }
};
