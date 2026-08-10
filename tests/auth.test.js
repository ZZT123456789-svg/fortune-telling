const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const authSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'supabase-auth.js'), 'utf8');

function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    clone() { return this; },
    json: async () => data || {}
  };
}

function createHarness(fetchMock) {
  const storage = new Map();
  const listeners = {};
  let storageWrites = 0;
  let replacedUrl = '';

  const context = {
    console,
    Promise,
    Date,
    Object,
    Array,
    Number,
    String,
    Math,
    JSON,
    RegExp,
    URL,
    URLSearchParams,
    Headers,
    Request,
    AbortController,
    CustomEvent: function(type, options) { this.type = type; this.detail = options && options.detail; },
    encodeURIComponent,
    decodeURIComponent,
    escape,
    atob,
    setTimeout,
    clearTimeout,
    setInterval: () => 1,
    clearInterval: () => {},
    fetch: fetchMock,
    location: {
      href: 'https://daowenai.icu/',
      origin: 'https://daowenai.icu',
      pathname: '/',
      search: '',
      hash: ''
    },
    history: {
      replaceState: (_state, _title, url) => { replacedUrl = url; }
    },
    localStorage: {
      getItem: (key) => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => { storageWrites += 1; storage.set(key, String(value)); },
      removeItem: (key) => storage.delete(key)
    },
    document: {
      title: '道问',
      hidden: false,
      body: { appendChild: () => {} },
      addEventListener: (name, handler) => { listeners['document:' + name] = handler; },
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({
        className: '', id: '', dataset: {}, style: {},
        setAttribute: () => {},
        querySelector: () => null,
        addEventListener: () => {}
      })
    },
    addEventListener: (name, handler) => { listeners['window:' + name] = handler; },
    dispatchEvent: () => true,
    Paywall: undefined
  };
  context.window = context;

  vm.createContext(context);
  vm.runInContext(authSource, context, { filename: 'supabase-auth.js' });
  return {
    auth: context.DaoWenAuth,
    context,
    storage,
    listeners,
    getStorageWrites: () => storageWrites,
    getReplacedUrl: () => replacedUrl
  };
}

test('识别 users_email_partial_key 冲突并引导已有账号登录', async () => {
  const harness = createHarness(async (url) => {
    if (String(url).includes('/auth/v1/signup')) {
      return jsonResponse(500, {
        code: 'unexpected_failure',
        message: 'duplicate key value violates unique constraint "users_email_partial_key"'
      });
    }
    return jsonResponse(404, {});
  });
  const result = await harness.auth.signUp('USER@EXAMPLE.COM', 'password1');
  assert.equal(result.success, true);
  assert.equal(result.pending, true);
  assert.equal(result.existing, true);
  assert.match(result.msg, /已经注册过/);
});

test('邮箱待验证时不会伪装成已登录', async () => {
  const harness = createHarness(async () => jsonResponse(200, {
    user: { id: 'pending-user', email: 'pending@example.com', identities: [{ id: 'identity-1' }] }
  }));
  const result = await harness.auth.signUp('pending@example.com', 'password1');
  assert.equal(result.success, true);
  assert.equal(result.pending, true);
  assert.equal(result.needsVerification, true);
  assert.equal(harness.auth.session, null);
  assert.equal(harness.auth.user, null);
});

test('密码登录保存完整 access/refresh 会话', async () => {
  const harness = createHarness(async (url) => {
    if (String(url).includes('grant_type=password')) {
      return jsonResponse(200, {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        expires_in: 3600,
        user: { id: 'user-1', email: 'login@example.com' }
      });
    }
    return jsonResponse(404, {});
  });
  const result = await harness.auth.signIn('LOGIN@EXAMPLE.COM', 'password1');
  assert.equal(result.success, true);
  assert.equal(harness.auth.user.id, 'user-1');
  assert.equal(harness.auth.session.refresh_token, 'refresh-1');
  const saved = JSON.parse(harness.storage.get(harness.auth.STORAGE_KEY));
  assert.equal(saved.user.email, 'login@example.com');
});

test('登录后用户校验断网时不会留下半登录会话', async () => {
  const harness = createHarness(async (url) => {
    if (String(url).includes('grant_type=password')) {
      return jsonResponse(200, {
        access_token: 'access-partial',
        refresh_token: 'refresh-partial',
        expires_in: 3600
      });
    }
    if (String(url).endsWith('/auth/v1/user')) throw new Error('network down');
    return jsonResponse(404, {});
  });
  const result = await harness.auth.signIn('partial@example.com', 'password1');
  assert.equal(result.success, false);
  assert.equal(harness.auth.session, null);
  assert.equal(harness.auth.user, null);
});

test('跨标签验证不会再次写会话并形成 storage 事件循环', async () => {
  const harness = createHarness(async (url) => {
    if (String(url).endsWith('/auth/v1/user')) {
      return jsonResponse(200, { id: 'user-2', email: 'tabs@example.com' });
    }
    return jsonResponse(404, {});
  });
  harness.auth.session = {
    access_token: 'access-tabs',
    refresh_token: 'refresh-tabs',
    expires_at: Math.floor(Date.now() / 1000) + 3600
  };
  harness.auth.user = { id: 'user-2', email: 'tabs@example.com' };
  const before = harness.getStorageWrites();
  const valid = await harness.auth._ensureSession(true, false);
  assert.equal(valid, true);
  assert.equal(harness.getStorageWrites(), before);
});

test('刷新会话后释放跨标签锁', async () => {
  const harness = createHarness(async (url) => {
    if (String(url).includes('grant_type=refresh_token')) {
      return jsonResponse(200, {
        access_token: 'access-new',
        refresh_token: 'refresh-new',
        expires_in: 3600
      });
    }
    if (String(url).endsWith('/auth/v1/user')) {
      return jsonResponse(200, { id: 'user-3', email: 'refresh@example.com' });
    }
    return jsonResponse(404, {});
  });
  harness.auth.session = {
    access_token: 'access-old',
    refresh_token: 'refresh-old',
    expires_at: Math.floor(Date.now() / 1000) + 20
  };
  harness.auth.user = { id: 'user-3', email: 'refresh@example.com' };
  const refreshed = await harness.auth._refreshSession();
  assert.equal(refreshed, true);
  assert.equal(harness.auth.session.access_token, 'access-new');
  assert.equal(harness.storage.has(harness.auth.REFRESH_LOCK_KEY), false);
});

test('刷新令牌后用户校验失败不会覆盖原会话', async () => {
  const harness = createHarness(async (url) => {
    if (String(url).includes('grant_type=refresh_token')) {
      return jsonResponse(200, {
        access_token: 'access-unverified',
        refresh_token: 'refresh-unverified',
        expires_in: 3600
      });
    }
    if (String(url).endsWith('/auth/v1/user')) return jsonResponse(401, { message: 'invalid token' });
    return jsonResponse(404, {});
  });
  harness.auth.session = {
    access_token: 'access-before-refresh',
    refresh_token: 'refresh-before-refresh',
    expires_at: Math.floor(Date.now() / 1000) + 20
  };
  harness.auth.user = { id: 'user-before-refresh', email: 'before@example.com' };
  const refreshed = await harness.auth._refreshSession();
  assert.equal(refreshed, false);
  assert.equal(harness.auth.session.access_token, 'access-before-refresh');
  assert.equal(harness.auth.user.id, 'user-before-refresh');
  assert.equal(harness.storage.has(harness.auth.REFRESH_LOCK_KEY), false);
});

test('短暂网络异常不会清除已有有效用户状态', async () => {
  const harness = createHarness(async () => { throw new Error('temporary network failure'); });
  harness.auth.session = {
    access_token: 'access-offline',
    refresh_token: 'refresh-offline',
    expires_at: Math.floor(Date.now() / 1000) + 20
  };
  harness.auth.user = { id: 'user-4', email: 'offline@example.com' };
  const valid = await harness.auth._ensureSession(false);
  assert.equal(valid, true);
  assert.equal(harness.auth.user.id, 'user-4');
  assert.equal(harness.auth.session.access_token, 'access-offline');
});

test('失效的邮箱链接会清理地址并给出可见提示流程', async () => {
  const harness = createHarness(async () => jsonResponse(404, {}));
  harness.context.location.hash = '#error=access_denied&error_description=expired';
  const consumed = await harness.auth._consumeAuthCallback();
  assert.equal(consumed, true);
  assert.equal(harness.getReplacedUrl(), '/');
});
