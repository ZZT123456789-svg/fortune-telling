const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'js', 'chart-archive.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'chart-archive.css'), 'utf8');

test('命盘档案资源已接入首页', () => {
  assert.match(index, /css\/chart-archive\.css/);
  assert.match(index, /js\/chart-archive\.js/);
  assert.match(index, /DaoWenArchive\.open\(\)/);
});

test('用户指定的九类档案通过八个工具弹窗接入（八字含单人与双人）', () => {
  ['baziOverlay', 'ziweiOverlay', 'meihuaOverlay', 'liuyaoOverlay', 'zhugeOverlay', 'tarotOverlay', 'qimenOverlay', 'astroOverlay'].forEach((id) => {
    assert.ok(source.includes("overlay: '" + id + "'"), id + ' 未接入');
  });
  assert.match(source, /copy\.type = 'bazi-dual'/);
  assert.doesNotMatch(source, /overlay: 'taiyiOverlay'/);
});

test('档案采用 IndexedDB 并支持收藏重命名备注删除', () => {
  assert.match(source, /indexedDB\.open/);
  assert.match(source, /toggleFavorite/);
  assert.match(source, /renameRecord/);
  assert.match(source, /editNote/);
  assert.match(source, /window\.confirm/);
});

test('档案结果为只读快照且重新打开不调用扣费接口', () => {
  assert.match(source, /sanitizeResult/);
  assert.match(source, /suppressCaptureUntil/);
  assert.doesNotMatch(source, /Paywall\.consume|\/api\/consume-credit|fetch\s*\(/);
});

test('手机档案全屏且电脑双列', () => {
  assert.match(css, /grid-template-columns:\s*repeat\(2/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /height:\s*100dvh/);
  assert.match(css, /grid-template-columns:\s*1fr/);
});
