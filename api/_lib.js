const crypto = require('crypto');

// The data service is still used for Postgres tables/RPCs, but browser auth and
// Supabase Auth are deliberately not part of this module anymore.
const DATA_API_URL = String(process.env.DATA_API_URL || process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const DATA_SERVICE_KEY = String(process.env.DATA_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

async function readJson(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body); } catch (_) { return {}; }
}

function requireDataConfig() {
  if (!DATA_API_URL) throw new Error('DATA_API_URL (or SUPABASE_URL) missing');
  if (!DATA_SERVICE_KEY) throw new Error('DATA_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) missing');
}

async function dataRequest(path, options) {
  requireDataConfig();
  const request = Object.assign({}, options || {});
  request.headers = Object.assign({
    apikey: DATA_SERVICE_KEY,
    Authorization: 'Bearer ' + DATA_SERVICE_KEY,
    Accept: 'application/json'
  }, request.headers || {});
  if (request.body && !request.headers['Content-Type']) request.headers['Content-Type'] = 'application/json';

  const resp = await fetch(DATA_API_URL + path, request);
  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!resp.ok) {
    const err = new Error('Data service request failed');
    err.status = resp.status;
    err.details = data;
    throw err;
  }
  return data;
}

async function dataRpc(name, payload) {
  return dataRequest('/rest/v1/rpc/' + encodeURIComponent(name), {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload || {})
  });
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
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
  DATA_API_URL,
  noStore,
  readJson,
  dataRpc,
  dataRequest,
  // Compatibility names for business-only call sites. Neither performs auth.
  serviceRpc: dataRpc,
  serviceRequest: dataRequest,
  sha256Hex,
  randomRequestId,
  moneyToCents,
  safeEqualHex,
  zpaySign,
  parseFormLike
};
