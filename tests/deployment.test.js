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
