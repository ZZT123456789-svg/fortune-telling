from pathlib import Path

auth_path = Path('js/supabase-auth.js')
lib_path = Path('api/_lib.js')
endpoint_path = Path('api/auth-config.js')

auth = auth_path.read_text(encoding='utf-8')
lib = lib_path.read_text(encoding='utf-8')

# 1) Frontend loads the exact public Supabase config used by Vercel before Auth init.
old_init = "    this._initPromise = (async function() {\n      self._enhanceLoginUI();"
new_init = "    this._initPromise = (async function() {\n      await self._loadRuntimeConfig();\n      self._enhanceLoginUI();"
if old_init not in auth:
    raise SystemExit('auth init anchor not found')
auth = auth.replace(old_init, new_init, 1)

request_anchor = "  _request: async function(path, options) {"
runtime_method = r"""  _loadRuntimeConfig: async function() {
    try {
      var resp = await fetch('/api/auth-config', {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!resp.ok) throw new Error('auth-config HTTP ' + resp.status);
      var data = await resp.json();
      if (!data || !data.url || !data.anonKey) throw new Error('auth-config incomplete');
      this.SUPABASE_URL = String(data.url).replace(/\/$/, '');
      this.SUPABASE_KEY = String(data.anonKey);
      this.CONFIG_SOURCE = data.source || 'vercel';
      this.PROJECT_REF = data.projectRef || '';
      console.info('[DaoWenAuth] Supabase config:', this.PROJECT_REF || 'unknown', this.CONFIG_SOURCE);
      return true;
    } catch (e) {
      console.warn('[DaoWenAuth] 运行时 Supabase 配置读取失败，使用内置兜底配置:', e && e.message ? e.message : e);
      return false;
    }
  },

"""
if request_anchor not in auth:
    raise SystemExit('request anchor not found')
auth = auth.replace(request_anchor, runtime_method + request_anchor, 1)

# 2) Duplicate/ambiguous signup is not presented as a successful new registration.
old_signup_result = """        return {
          success: true,
          pending: true,
          ambiguous: ambiguousExisting,
          msg: ambiguousExisting
            ? '注册请求已处理，但没有建立可立即登录的新会话。若这个邮箱以前注册过，本次输入的密码不会覆盖原密码；请使用原密码登录，或点“忘记密码”重置。若是首次注册，请先检查验证邮件。'
            : '注册成功，当前账号正在等待邮箱验证。注册后不能直接登录，请先打开验证邮件完成确认；验证完成后再登录。'
        };"""
new_signup_result = """        if (ambiguousExisting) {
          return {
            success: false,
            existing: true,
            signupState: true,
            msg: '这个邮箱可能已经注册过。本次输入的新密码不会覆盖旧账号密码；请使用原密码登录，或点“忘记密码”重置。'
          };
        }
        return {
          success: true,
          pending: true,
          ambiguous: false,
          msg: '注册成功，但账号还需要完成邮箱验证。请先打开验证邮件，确认后再登录。'
        };"""
if old_signup_result not in auth:
    raise SystemExit('signup result anchor not found')
auth = auth.replace(old_signup_result, new_signup_result, 1)

# 3) Avoid the misleading bare "email or password wrong" message for uncertain signup states.
old_generic = "return { success: false, msg: this._friendlyError(result.data, '邮箱或密码错误') };"
new_generic = "return { success: false, msg: this._friendlyError(result.data, '无法登录：若刚注册请先完成邮箱验证；若以前注册过，请使用原密码或点“忘记密码”重置。') };"
if old_generic not in auth:
    raise SystemExit('signin fallback anchor not found')
auth = auth.replace(old_generic, new_generic, 1)

old_friendly = "if (code === 'invalid_credentials' || raw.indexOf('invalid login credentials') !== -1) return '邮箱或密码错误';"
new_friendly = "if (code === 'invalid_credentials' || raw.indexOf('invalid login credentials') !== -1) return '无法登录：若刚注册请先完成邮箱验证；若该邮箱以前注册过，请使用原密码或点“忘记密码”重置。';"
if old_friendly not in auth:
    raise SystemExit('friendly error anchor not found')
auth = auth.replace(old_friendly, new_friendly, 1)

# 4) Backend uses a cohesive URL + anon-key pair; env wins only when both are present.
lines = lib.splitlines()
if len(lines) < 6 or lines[0].strip() != "const crypto = require('crypto');":
    raise SystemExit('_lib header unexpected')
if not lines[2].startswith('const SUPABASE_URL ='):
    raise SystemExit('_lib SUPABASE_URL line not found')
if not lines[3].startswith('const SUPABASE_ANON_KEY ='):
    raise SystemExit('_lib SUPABASE_ANON_KEY line not found')
if not lines[4].startswith('const SUPABASE_SERVICE_ROLE_KEY ='):
    raise SystemExit('_lib service role line not found')

fallback_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImViZG5rZ2ZpbG52ZmtrZHZxcnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTAxODEsImV4cCI6MjA5OTc4NjE4MX0.l3saO79tS6KOjI1w78QWWrkamO0OY8IGh38i1Yjy2Ro"
new_header = [
    "const crypto = require('crypto');",
    "",
    "const FALLBACK_SUPABASE_URL = 'https://ebdnkgfilnvfkkdvqrzu.supabase.co';",
    f"const FALLBACK_SUPABASE_ANON_KEY = '{fallback_key}';",
    "const ENV_SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();",
    "const ENV_SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();",
    "const HAS_PUBLIC_SUPABASE_ENV = !!(ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY);",
    "const SUPABASE_URL = (HAS_PUBLIC_SUPABASE_ENV ? ENV_SUPABASE_URL : FALLBACK_SUPABASE_URL).replace(/\\/$/, '');",
    "const SUPABASE_ANON_KEY = HAS_PUBLIC_SUPABASE_ENV ? ENV_SUPABASE_ANON_KEY : FALLBACK_SUPABASE_ANON_KEY;",
    "const SUPABASE_CONFIG_SOURCE = HAS_PUBLIC_SUPABASE_ENV ? 'vercel-env' : 'repo-fallback';",
    lines[4],
    "",
]
lib = "\n".join(new_header + lines[6:]) + "\n"

old_exports = "module.exports = {\n  SUPABASE_URL,"
new_exports = "module.exports = {\n  SUPABASE_URL,\n  SUPABASE_ANON_KEY,\n  SUPABASE_CONFIG_SOURCE,"
if old_exports not in lib:
    raise SystemExit('_lib exports anchor not found')
lib = lib.replace(old_exports, new_exports, 1)

endpoint = """const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_CONFIG_SOURCE, noStore } = require('./_lib');

module.exports = async function handler(req, res) {
  noStore(res);
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  let projectRef = '';
  try {
    projectRef = new URL(SUPABASE_URL).hostname.split('.')[0] || '';
  } catch (_) {}

  // URL and anon/publishable key are public browser config. Service-role credentials are never returned.
  return res.status(200).json({
    success: true,
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    projectRef,
    source: SUPABASE_CONFIG_SOURCE
  });
};
"""

auth_path.write_text(auth, encoding='utf-8')
lib_path.write_text(lib, encoding='utf-8')
endpoint_path.write_text(endpoint, encoding='utf-8')
