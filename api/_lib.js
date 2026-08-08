const crypto = require('crypto');

const FALLBACK_SUPABASE_URL = 'https://ebdnkgfilnvfkkdvqrzu.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImViZG5rZ2ZpbG52ZmtrZHZxcnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTAxODEsImV4cCI6MjA5OTc4NjE4MX0.l3saO79tS6KOjI1w78QWWrkamO0OY8IGh38i1Yjy2Ro';
const ENV_SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();
const HAS_PUBLIC_SUPABASE_ENV = !!(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY);
const SUPABASE_URL = (HAS_PUBLIC_SUPABASE_ENV ? ENV_SUPABASE_URL : FALLBACK_SUPABASE_URL).replace(/\/$/, '');
const SUPABASE_ANON_KEY = HAS_PUBLIC_SUPABASE_ENV ? ENV_SUPABASE_ANON_KEY : FALLBACK_SUPABASE_ANON_KEY;
const SUPABASE_CONFIG_SOURCE = HAS_PUBLIC_SUPABASE_ENV ? 'vercel-env' : 'repo-fallback';
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function getBearer(req) {
  const value = String((req.headers && req.headers.authorization) || '');
  const m = value.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : '';
}

async function readJson(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch (_) { return {}; }
}

function requireServerConfig() {
  if (!SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY missing');
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');
}

async function verifyUser(req) {
  requireServerConfig();
  const token = getBearer(req);
  if (!token) return null;

  const resp = await fetch(SUPABASE_URL + '/auth/v1/user', {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + token
    }
  });
  if (!resp.ok) return null;
  const user = await resp.json().catch(() => null);
  return user && user.id ? user : null;
}

async function serviceRpc(name, payload) {
  requireServerConfig();
  const resp = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + encodeURIComponent(name), {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload || {})
  });
  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!resp.ok) {
    const err = new Error('Supabase RPC failed: ' + name);
    err.status = resp.status;
    err.details = data;
    throw err;
  }
  return data;
}

function randomRequestId(prefix) {
  if (crypto.randomUUID) return (prefix || 'req') + ':' + crypto.randomUUID();
  return (prefix || 'req') + ':' + crypto.randomBytes(18).toString('hex');
}

function moneyToCents(value) {
  if (typeof value === 'number') return Math.round(value * 100);
  const s = String(value == null ? '' : value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(Number(s) * 100);
}

function safeEqualHex(a, b) {
  const aa = Buffer.from(String(a || '').toLowerCase(), 'utf8');
  const bb = Buffer.from(String(b || '').toLowerCase(), 'utf8');
  if (aa.length !== bb.length || aa.length === 0) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function zpaySign(params, key) {
  const keys = Object.keys(params || {})
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '' && params[k] != null)
    .sort();
  const base = keys.map(k => k + '=' + String(params[k])).join('&') + String(key || '');
  return crypto.createHash('md5').update(base, 'utf8').digest('hex').toLowerCase();
}

function parseFormLike(input) {
  if (!input) return {};
  if (typeof input === 'object' && !Buffer.isBuffer(input)) return input;
  const p = new URLSearchParams(String(input));
  const out = {};
  for (const [k, v] of p.entries()) out[k] = v;
  return out;
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_CONFIG_SOURCE,
  noStore,
  getBearer,
  readJson,
  verifyUser,
  serviceRpc,
  randomRequestId,
  moneyToCents,
  safeEqualHex,
  zpaySign,
  parseFormLike
};
