const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('首页核心界面使用统一东方字印，不再使用彩色系统图标', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');

  assert.doesNotMatch(html, /🔮|📖|⚠️|🔒|🎫|🤖|☯️|🪙|🌙|📚/u);
  assert.match(html, /class="dao-heading-mark">卜</);
  assert.match(html, /class="tc-icon">命</);
  assert.match(html, /class="dao-title-mark">星</);
  assert.match(html, /class="dao-notice-mark"[^>]*>私</);
  assert.match(html, /class="dao-brand-mark" aria-hidden="true"><\/span>/);
  assert.match(css, /统一东方字印图标/);
  assert.match(css, /\.dao-heading-mark/);
  assert.match(css, /\.dao-title-mark/);
  assert.match(css, /\.tc-icon\s*\{[\s\S]*?width:\s*52px;[\s\S]*?height:\s*52px;/);
  assert.match(css, /font:\s*800 20px\/1/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.tc-icon\s*\{[\s\S]*?width:\s*42px !important;[\s\S]*?height:\s*42px !important;/);
});

test('书库与支付页使用同一套无 Emoji 品牌标记', () => {
  const library = fs.readFileSync(path.join(ROOT, 'library.html'), 'utf8');
  const payment = fs.readFileSync(path.join(ROOT, 'payment.html'), 'utf8');
  const libraryCss = fs.readFileSync(path.join(ROOT, 'css', 'library.css'), 'utf8');

  assert.match(library, /class="lib-brand-mark" aria-hidden="true"><\/span>/);
  assert.match(payment, /class="dao-brand-mark" aria-hidden="true"><\/span>/);
  assert.doesNotMatch(library + payment, /☯️|🔮|📖|🔒/u);
  assert.match(libraryCss, /\.lib-brand-mark/);
});
