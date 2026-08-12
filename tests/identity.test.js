const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function response() {
  return {
    headers: {}, statusCode: 200, body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('首次访问直接生成签名匿名身份，不访问数据库', async () => {
  const old = process.env.VISITOR_SIGNING_KEY;
  process.env.VISITOR_SIGNING_KEY = 'test-visitor-signing-key-32-bytes';
  try {
    delete require.cache[require.resolve('../api/_auth')];
    const auth = require('../api/_auth');
    const res = response();
    const user = await auth.ensureUser({ headers: { 'x-forwarded-proto': 'https' } }, res);
    assert.match(user.id, /^[0-9a-f-]{36}$/i);
    assert.equal(user.isGuest, true);
    assert.match(res.headers['Set-Cookie'], /HttpOnly/);
    assert.match(res.headers['Set-Cookie'], /SameSite=Lax/);

    const cookie = String(res.headers['Set-Cookie']).split(';')[0];
    const restored = await auth.ensureUser({ headers: { cookie } }, response());
    assert.equal(restored.id, user.id);
  } finally {
    if (old == null) delete process.env.VISITOR_SIGNING_KEY; else process.env.VISITOR_SIGNING_KEY = old;
  }
});

test('篡改匿名 Cookie 后自动换新身份', async () => {
  const old = process.env.VISITOR_SIGNING_KEY;
  process.env.VISITOR_SIGNING_KEY = 'test-visitor-signing-key-32-bytes';
  try {
    delete require.cache[require.resolve('../api/_auth')];
    const auth = require('../api/_auth');
    const res = response();
    const user = await auth.ensureUser({ headers: { cookie: 'daowen_visitor=00000000-0000-4000-8000-000000000000.9999999999.invalid' } }, res);
    assert.notEqual(user.id, '00000000-0000-4000-8000-000000000000');
    assert.ok(res.headers['Set-Cookie']);
  } finally {
    if (old == null) delete process.env.VISITOR_SIGNING_KEY; else process.env.VISITOR_SIGNING_KEY = old;
  }
});

test('页面和运行时不存在登录、注册、邮箱密码或找回接口', () => {
  const files = ['index.html', 'js/visitor-identity.js', 'js/paywall.js', 'api/_auth.js', 'api/session.js'];
  const forbidden = /loginOverlay|loginBtn|\/api\/account|password|resetPassword|\bsignIn\b|\bsignUp\b|邮箱地址|注册账号/i;
  for (const file of files) assert.doesNotMatch(fs.readFileSync(path.join(ROOT, file), 'utf8'), forbidden, file);
  assert.equal(fs.existsSync(path.join(ROOT, 'api', 'account.js')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'js', 'user-system.js')), false);
});

test('数据库业务表直接绑定匿名 UUID，不依赖用户表', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'sql', 'secure-credits.sql'), 'utf8');
  assert.doesNotMatch(sql, /app_users|app_sessions|app_password|auth\.users|references\s+public\.app/i);
  assert.match(sql, /create table if not exists public\.payment_orders[\s\S]*user_id uuid not null/i);
  assert.match(sql, /create table if not exists public\.user_balances[\s\S]*user_id uuid unique not null/i);
});

test('黑金首页使用真实控件，购买入口统一进入独立支付页', () => {
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const payment = fs.readFileSync(path.join(ROOT, 'payment.html'), 'utf8');
  const paywall = fs.readFileSync(path.join(ROOT, 'js', 'paywall.js'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  const paymentPage = fs.readFileSync(path.join(ROOT, 'js', 'payment-page.js'), 'utf8');
  const vercel = fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  assert.match(home, /class="dao-nav"/);
  assert.match(home, /class="dao-enter-btn"/);
  assert.match(home, /onclick="DailyModule\.openModule\(\)"/);
  assert.match(css, /assets\/daowen-hero-bg\.png/);
  assert.match(payment, /id="paymentPlans"/);
  assert.match(payment, /取消并返回原功能/);
  assert.match(paywall, /window\.location\.href = 'payment\.html'/);
  assert.match(app, /window\.location\.href = '\/app'/);
  assert.match(paymentPage, /window\.location\.href = '\/app\?restore=1'/);
  assert.match(vercel, /"source": "\/app", "destination": "\/index\.html"/);
  assert.match(home, /class="dao-account-actions"/);
  assert.match(home, /class="dao-balance" aria-label="当前积分余额"/);
  assert.match(home, /class="dao-recharge"/);
  assert.equal(fs.existsSync(path.join(ROOT, 'assets', 'daowen-hero-bg.png')), true);
});
