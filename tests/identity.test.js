const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return data || {}; }
  };
}

function element(extra) {
  return Object.assign({
    value: '', textContent: '', className: '', style: {}, disabled: false,
    classList: { add() {}, remove() {}, toggle() {} },
    focus() {}, setAttribute() {}, closest() { return null; }
  }, extra || {});
}

function clientHarness(fetchMock) {
  const listeners = {};
  const events = [];
  const elements = {
    loginBtn: element(), loginOverlay: element(), loginTitle: element(), loginDesc: element(),
    loginEmail: element({ value: 'me@example.com' }), loginPassword: element({ value: 'password-123' }),
    accountCredentials: element(), loginNormalActions: element(), loginForgotWrap: element(),
    loginResetRequestActions: element(), loginResetCompleteActions: element(), loginStatus: element(),
    accountPrimaryBtn: element(), accountSecondaryBtn: element(), loginResetEmail: element(),
    loginResetTargetEmail: element(), loginNewPassword: element(), loginConfirmPassword: element()
  };
  const context = {
    console, Promise, Date, Object, Array, Number, String, Math, JSON, URL, URLSearchParams,
    CustomEvent: function(type, options) { this.type = type; this.detail = options && options.detail; },
    setTimeout: fn => { fn(); return 1; }, clearTimeout() {}, alert() {},
    fetch: fetchMock,
    location: { href: 'https://daowen.test/', search: '', hash: '' },
    history: { replaceState() {} },
    document: {
      readyState: 'loading', title: '道问', body: { appendChild() {} },
      addEventListener(name, fn) { listeners[name] = fn; },
      getElementById(id) { return elements[id] || null; },
      querySelector() { return null; }, querySelectorAll() { return []; },
      createElement() { return element({ innerHTML: '', id: '' }); }
    },
    addEventListener(name, fn) { listeners['window:' + name] = fn; },
    dispatchEvent(event) { events.push(event); return true; },
    DaoWenUserData: { flushCalls: 0, hydrateCalls: 0, async flush() { this.flushCalls += 1; return true; }, async hydrate() { this.hydrateCalls += 1; } },
    Paywall: undefined
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'user-system.js'), 'utf8'), context, { filename: 'user-system.js' });
  return { identity: context.DaoWenIdentity, context, elements, events };
}

test('游客自动创建后可直接使用，保存账号不更换用户 ID', async () => {
  const calls = [];
  const harness = clientHarness(async (url, options) => {
    calls.push({ url: String(url), options: options || {} });
    if (url === '/api/session') return jsonResponse(200, { success: true, user: { id: 'guest-1', email: '', isGuest: true } });
    if (url === '/api/account') {
      const body = JSON.parse(options.body);
      assert.equal(body.action, 'save');
      assert.equal(body.email, 'me@example.com');
      return jsonResponse(200, { success: true, user: { id: 'guest-1', email: 'me@example.com', isGuest: false }, message: '数据已保存到账号' });
    }
    throw new Error('unexpected request ' + url);
  });

  await harness.identity.init();
  assert.deepEqual(JSON.parse(JSON.stringify(harness.identity.user)), { id: 'guest-1', email: '', isGuest: true });
  await harness.identity.doAccount('save');
  assert.equal(harness.identity.user.id, 'guest-1');
  assert.equal(harness.identity.user.isGuest, false);
  assert.equal(harness.context.DaoWenUserData.flushCalls, 1);
  assert.equal(harness.context.DaoWenUserData.hydrateCalls, 1);
  assert.equal(calls.some(call => call.url.includes('/auth/')), false);
});

test('已有账号恢复与邮箱密码找回走本站账号接口，不使用验证码', async () => {
  const actions = [];
  const harness = clientHarness(async (url, options) => {
    if (url === '/api/session') return jsonResponse(200, { success: true, user: { id: 'guest-2', email: '', isGuest: true } });
    const body = JSON.parse(options.body);
    actions.push(body.action);
    if (body.action === 'login') return jsonResponse(200, { success: true, user: { id: 'account-1', email: body.email, isGuest: false } });
    if (body.action === 'request-reset') return jsonResponse(200, { success: true, message: '已发送' });
    if (body.action === 'reset') return jsonResponse(200, { success: true, user: { id: 'account-1', email: body.email, isGuest: false } });
    throw new Error('unexpected action');
  });

  await harness.identity.init();
  await harness.identity.doAccount('login');
  harness.elements.loginResetEmail.value = 'me@example.com';
  await harness.identity.requestReset();
  harness.identity._resetToken = 'one-time-link-token';
  harness.elements.loginResetTargetEmail.value = 'me@example.com';
  harness.elements.loginNewPassword.value = 'new-password-123';
  harness.elements.loginConfirmPassword.value = 'new-password-123';
  await harness.identity.completeReset();
  assert.deepEqual(actions, ['login', 'request-reset', 'reset']);
});

test('密码使用 scrypt 哈希，可验证正确密码且不保存明文', async () => {
  const auth = require('../api/_auth');
  const encoded = await auth.hashPassword('a-secure-password');
  assert.match(encoded, /^scrypt\$/);
  assert.equal(encoded.includes('a-secure-password'), false);
  assert.equal(await auth.verifyPassword('a-secure-password', encoded), true);
  assert.equal(await auth.verifyPassword('wrong-password', encoded), false);
});

test('前端和运行时服务端不再包含旧认证客户端或 access token 流程', () => {
  const files = [
    'index.html', 'js/user-system.js', 'js/user-data.js', 'js/paywall.js', 'js/ai-chat.js',
    'api/_lib.js', 'api/_auth.js', 'api/account.js', 'api/session.js', 'api/balance.js',
    'api/consume-credit.js', 'api/redeem.js', 'api/alipay.js', 'api/check-order.js',
    'api/ai-chat.js', 'api/ai-reading.js'
  ];
  const forbidden = /DaoWenAuth|\/auth\/v1|SUPABASE_ANON_KEY|access_token|refresh_token|verifyUser\s*\(/i;
  for (const file of files) {
    assert.doesNotMatch(fs.readFileSync(path.join(ROOT, file), 'utf8'), forbidden, file);
  }
  assert.equal(fs.existsSync(path.join(ROOT, 'js', 'supabase-auth.js')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'api', 'auth-config.js')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'api', 'trusted-password-reset.js')), false);
});

test('数据库脚本把余额、支付、保存数据绑定到 app_users，并包含游客合并事务', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'sql', 'secure-credits.sql'), 'utf8');
  assert.match(sql, /create table if not exists public\.app_users/i);
  assert.match(sql, /create table if not exists public\.user_data/i);
  assert.match(sql, /api_merge_guest_identity/i);
  assert.match(sql, /payment_orders[\s\S]*references public\.app_users/i);
  assert.doesNotMatch(sql, /references\s+auth\.users/i);
});
