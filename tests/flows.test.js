const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function loadHandler(relative, stubs) {
  const filename = path.join(ROOT, relative);
  const source = fs.readFileSync(filename, 'utf8');
  const module = { exports: {} };
  const wrapped = vm.runInThisContext('(function(require,module,exports,__filename,__dirname){' + source + '\n})', { filename });
  function localRequire(name) {
    if (Object.prototype.hasOwnProperty.call(stubs, name)) return stubs[name];
    return require(name);
  }
  wrapped(localRequire, module, module.exports, filename, path.dirname(filename));
  return module.exports;
}

function response() {
  return {
    statusCode: 200, headers: {}, body: null,
    setHeader(name, value) { this.headers[name] = value; },
    getHeader(name) { return this.headers[name]; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; }
  };
}

async function invoke(handler, req) {
  const res = response();
  await handler(Object.assign({ headers: {}, query: {} }, req), res);
  return res;
}

test('首页游客 → AI 扣积分 → 创建支付 → 回调入账 → 查询订单全程绑定同一身份', async () => {
  const identity = { id: 'guest-flow-1', email: null, is_guest: true };
  const state = { balance: 4, orders: new Map(), lastDebitUser: '', lastOrderUser: '' };
  const authStub = { requireUser: async () => identity };
  const libStub = {
    noStore(res) { res.setHeader('Cache-Control', 'no-store'); },
    async readJson(req) { return req.body || {}; },
    randomRequestId() { return 'ai-chat:request-123'; },
    zpaySign() { return 'valid-signature'; },
    safeEqualHex(a, b) { return a === b; },
    moneyToCents(value) { return Math.round(Number(value) * 100); },
    parseFormLike(value) { return value || {}; },
    async serviceRpc(name, payload) {
      if (name === 'api_get_balance') return state.balance;
      if (name === 'api_consume_credits') {
        state.lastDebitUser = payload.p_user_id;
        if (state.balance < payload.p_amount) return { success: false, code: 'INSUFFICIENT', balance: state.balance };
        state.balance -= payload.p_amount;
        return { success: true, balance: state.balance };
      }
      if (name === 'api_refund_credits') { state.balance += payload.p_amount; return { success: true, balance: state.balance }; }
      if (name === 'api_create_payment_order') {
        state.lastOrderUser = payload.p_user_id;
        state.orders.set(payload.p_order_no, { userId: payload.p_user_id, amount: payload.p_amount_cents, credits: payload.p_credits, paid: false });
        return { success: true };
      }
      if (name === 'api_complete_payment') {
        const order = state.orders.get(payload.p_order_no);
        assert.ok(order);
        assert.equal(payload.p_money_cents, order.amount);
        if (!order.paid) { order.paid = true; state.balance += order.credits; }
        return { success: true, code: 'OK', credits: order.credits, balance: state.balance };
      }
      if (name === 'api_payment_status') {
        const order = state.orders.get(payload.p_order_no);
        assert.equal(order.userId, payload.p_user_id);
        return { found: true, paid: order.paid, amount_cents: order.amount, credits: order.credits };
      }
      throw new Error('unexpected RPC ' + name);
    }
  };

  const balanceHandler = loadHandler('api/balance.js', { './_lib': libStub, './_auth': authStub });
  const aiHandler = loadHandler('api/ai-chat.js', {
    './_lib': libStub, './_auth': authStub,
    './_deepseek': { callDeepSeek: async () => 'AI 测试解读' }
  });
  const payHandler = loadHandler('api/alipay.js', { './_lib': libStub, './_auth': authStub, crypto: require('crypto') });
  const notifyHandler = loadHandler('api/alipay-notify.js', { './_lib': libStub });
  const checkHandler = loadHandler('api/check-order.js', { './_lib': libStub, './_auth': authStub });

  const oldEnv = { ZPAY_PID: process.env.ZPAY_PID, ZPAY_KEY: process.env.ZPAY_KEY, APP_URL: process.env.APP_URL };
  process.env.ZPAY_PID = 'test-pid'; process.env.ZPAY_KEY = 'test-key'; process.env.APP_URL = 'https://daowen.test';
  try {
    const initial = await invoke(balanceHandler, { method: 'GET' });
    assert.equal(initial.body.balance, 4);

    const ai = await invoke(aiHandler, { method: 'POST', body: { messages: [{ role: 'user', content: '解释当前命盘' }] } });
    assert.equal(ai.statusCode, 200);
    assert.equal(ai.body.balance, 2);
    assert.equal(state.lastDebitUser, identity.id);

    const payment = await invoke(payHandler, { method: 'POST', body: { tier: '3' } });
    assert.equal(payment.statusCode, 200);
    assert.equal(state.lastOrderUser, identity.id);
    const orderNo = payment.body.outTradeNo;

    const notified = await invoke(notifyHandler, {
      method: 'POST',
      body: { pid: 'test-pid', trade_status: 'TRADE_SUCCESS', sign_type: 'MD5', sign: 'valid-signature', out_trade_no: orderNo, trade_no: 'provider-1', money: '4.90' }
    });
    assert.equal(notified.statusCode, 200);
    assert.equal(notified.body, 'success');
    assert.equal(state.balance, 5);

    const checked = await invoke(checkHandler, { method: 'GET', query: { order: orderNo } });
    assert.equal(checked.statusCode, 200);
    assert.equal(checked.body.paid, true);
    assert.equal(checked.body.credits, 3);
  } finally {
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('命理输入快照通过 user-data API 绑定当前游客 ID', async () => {
  const saved = new Map();
  const identity = { id: 'guest-data-1', is_guest: true };
  const dataStub = {
    noStore() {},
    async readJson(req) { return req.body; },
    async dataRequest(url, options) {
      if (options && options.method === 'POST') {
        const row = JSON.parse(options.body);
        saved.set(row.user_id, row.payload);
        return null;
      }
      return saved.has(identity.id) ? [{ payload: saved.get(identity.id), updated_at: 'now' }] : [];
    }
  };
  const handler = loadHandler('api/user-data.js', { './_lib': dataStub, './_auth': { requireUser: async () => identity } });
  const payload = { version: 1, fields: { birthDate: { type: 'date', value: '2000-01-02' } } };
  const put = await invoke(handler, { method: 'PUT', body: { data: payload } });
  assert.equal(put.statusCode, 200);
  assert.deepEqual(saved.get(identity.id), payload);
  const get = await invoke(handler, { method: 'GET' });
  assert.deepEqual(get.body.data, payload);
});

test('密码找回生成一次性哈希记录并通过邮件服务发送 30 分钟链接', async () => {
  let resetRow = null;
  let mailRequest = null;
  const libStub = {
    sha256Hex(value) { return require('crypto').createHash('sha256').update(String(value)).digest('hex'); },
    async dataRpc() { throw new Error('unexpected RPC'); },
    async dataRequest(url, options) {
      if (url.startsWith('/rest/v1/app_users?email=')) {
        return [{ id: 'account-reset-1', email: 'reset@example.com', is_guest: false, password_hash: 'unused' }];
      }
      if (url.includes('/app_password_resets?') && url.includes('created_at=gt.')) return [];
      if (url === '/rest/v1/app_password_resets' && options.method === 'POST') {
        resetRow = JSON.parse(options.body); return null;
      }
      if (url.startsWith('/rest/v1/app_password_resets?') && options.method === 'DELETE') return null;
      throw new Error('unexpected data request ' + url);
    }
  };
  const auth = loadHandler('api/_auth.js', { './_lib': libStub });
  const oldFetch = global.fetch;
  const oldEnv = { RESEND_API_KEY: process.env.RESEND_API_KEY, MAIL_FROM: process.env.MAIL_FROM, APP_URL: process.env.APP_URL };
  process.env.RESEND_API_KEY = 'resend-test';
  process.env.MAIL_FROM = 'account@daowen.test';
  process.env.APP_URL = 'https://daowen.test';
  global.fetch = async (url, options) => { mailRequest = { url, options }; return { ok: true, status: 200 }; };
  try {
    const result = await auth.requestPasswordReset({ headers: {} }, 'RESET@example.com');
    assert.equal(result.success, true);
    assert.ok(resetRow);
    assert.equal(resetRow.token_hash.length, 64);
    assert.ok(new Date(resetRow.expires_at).getTime() > Date.now() + 29 * 60 * 1000);
    assert.equal(mailRequest.url, 'https://api.resend.com/emails');
    const mailBody = JSON.parse(mailRequest.options.body);
    assert.match(mailBody.html, /reset_token=/);
    assert.equal(mailBody.html.includes(resetRow.token_hash), false);
  } finally {
    global.fetch = oldFetch;
    for (const [key, value] of Object.entries(oldEnv)) {
      if (value == null) delete process.env[key]; else process.env[key] = value;
    }
  }
});
