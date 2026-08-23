const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('生产包不暴露数据库迁移 API，也不依赖直连 PostgreSQL 驱动', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'api', 'migrate.js')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'api', 'debug-env.js')), false);
  assert.equal(fs.existsSync(path.join(ROOT, 'api', 'debug-rpc.js')), false);
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(Boolean(pkg.dependencies && pkg.dependencies.pg), false);
});

test('环境变量模板包含匿名身份、数据服务和支付必需配置', () => {
  const env = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
  for (const name of [
    'DATA_API_URL', 'DATA_SERVICE_KEY', 'VISITOR_SIGNING_KEY',
    'ZPAY_PID', 'ZPAY_KEY', 'APP_URL', 'DEEPSEEK_API_KEY'
  ]) {
    assert.match(env, new RegExp('^' + name + '=', 'm'), name + ' missing');
  }
});

test('Vercel 使用零配置部署静态页面与 API，不生成空输出目录', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const builders = new Map(config.builds.map((item) => [item.src, item.use]));
  assert.equal(builders.get('api/router.js'), '@vercel/node');
  assert.equal(builders.get('*.html'), '@vercel/static');
  assert.equal(builders.get('assets/**'), '@vercel/static');
  assert.equal(builders.get('css/**'), '@vercel/static');
  assert.equal(builders.get('data/**'), '@vercel/static');
  assert.equal(builders.get('js/**'), '@vercel/static');
  assert.equal(config.rewrites.some((route) => (
    route.source === '/api/:route*' && route.destination === '/api/router.js?route=:route*'
  )), true);
  assert.equal(config.rewrites.some((route) => route.source === '/app'), true);
});

test('Vercel Hobby 部署通过单一网关保留全部业务 API', () => {
  const source = fs.readFileSync(path.join(ROOT, 'api', 'router.js'), 'utf8');
  for (const route of [
    'ai-chat', 'ai-reading', 'ai-dual-reading', 'alipay', 'alipay-notify', 'auth-login',
    'auth-logout', 'auth-recover', 'auth-signup', 'balance', 'check-order',
    'consume-credit', 'redeem', 'session', 'user-data'
  ]) {
    assert.match(source, new RegExp(`['\"]${route}['\"]\\s*:`), route + ' missing');
  }
});
