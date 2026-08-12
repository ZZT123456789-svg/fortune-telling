const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('八字付费提示独立显示并自动滚入弹窗视野', () => {
  const bazi = fs.readFileSync(path.join(ROOT, 'js', 'bazi.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  assert.match(bazi, /_focusResult:\s*function/);
  assert.match(bazi, /class="bazi-paywall-prompt"/);
  assert.doesNotMatch(bazi, /position:absolute;top:0;left:0;right:0;bottom:0;background:#000/);
  assert.match(css, /\.bazi-paywall-prompt\s*\{/);
});
