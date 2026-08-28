const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('八字免费区只展示基础四柱，解释和完整命盘位于付费内容', () => {
  const bazi = fs.readFileSync(path.join(ROOT, 'js', 'bazi.js'), 'utf8');
  const resultView = fs.readFileSync(path.join(ROOT, 'js', 'bazi-result-view.js'), 'utf8');
  assert.match(resultView, /function renderBasic\(r,scope\)/);
  assert.match(resultView, /基础命盘已生成。格局、旺衰、喜用神、大运流年及 AI 深度解读属于解锁内容/);
  assert.match(bazi, /var freeHtml = [^;]+\+ infoHtml \+ basicChart;/);
  assert.match(bazi, /paidHtml = interpretationHtml \+ patternVisualHtml/);
  assert.doesNotMatch(bazi, /var freeHtml = [^;]+referenceChart/);
});

test('所有功能弹窗电脑端接近全屏且手机端保持全屏，支付入口不嵌套放大', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  assert.match(css, /\.tool-overlay:not\(\[id\^="paywall"\]\) > \.tool-modal \{[^}]*width: calc\(100vw - 24px\)[^}]*max-width: 1600px[^}]*height: calc\(100dvh - 24px\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.tool-modal \{[^}]*width: 100vw[^}]*height: 100dvh/);
});

test('双人合盘与单人使用相同付费边界，余额不足只显示双方基础四柱', () => {
  const bazi = fs.readFileSync(path.join(ROOT, 'js', 'bazi.js'), 'utf8');
  assert.match(bazi, /var lockedHtml=[\s\S]*甲方基础八字[\s\S]*renderBasic\(a,'bazi-dual-basic-a'\)/);
  assert.match(bazi, /乙方基础八字[\s\S]*renderBasic\(b,'bazi-dual-basic-b'\)/);
  assert.match(bazi, /需要 4 次解读余额。解锁甲方完整解读、乙方完整解读、双方综合合盘及双人 AI 深度解读/);
  assert.match(bazi, /ctn\.innerHTML=canAI\?unlockedHtml:lockedHtml/);
  assert.match(bazi, /if \(canAI\) this\._callDualAI\(a,b,compat\)/);
});
