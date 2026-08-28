const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('首页、书库和支付页加载统一 UI 精修层', () => {
  for (const file of ['index.html', 'library.html', 'payment.html']) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.match(html, /css\/ui-polish\.css\?v=20260823-1/);
    assert.match(html, /js\/ui-polish\.js\?v=20260823-1/);
  }
});

test('精修层覆盖核心页面、弹窗和插件，并保留手机双列卡片', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'ui-polish.css'), 'utf8');
  for (const selector of ['.dao-nav', '.dao-hero', '.tool-card', '.tool-modal', '.dw-contact-panel', '.ai-chat-window', '.dw-payment-shell', '.book-card']) {
    assert.match(css, new RegExp(selector.replace('.', '\\.')));
  }
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*grid-template-columns: repeat\(2,/);
  assert.match(css, /prefers-reduced-motion/);
});

test('功能卡片具有可访问名称与指针光效，交互增强不触碰业务模块', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'ui-polish.js'), 'utf8');
  assert.match(source, /setAttribute\('role', 'button'\)/);
  assert.match(source, /setAttribute\('aria-label'/);
  assert.match(source, /pointermove/);
  assert.doesNotMatch(source, /addEventListener\('keydown'/);
  assert.doesNotMatch(source, /Paywall|BaziModule|ZiweiModule|fetch\(/);
});

test('八字核心界面使用黑金字印，不显示彩色系统 Emoji', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /dao-inline-mark/);
  assert.doesNotMatch(html, /🧑|👫|🌞/);
});

test('首页动态场景、入局揭幕和弹窗转场均提供减少动态降级', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');

  for (const layer of ['dao-motion-scene', 'dao-scene-bg', 'dao-vortex-outer', 'dao-mystic-wheel', 'dao-mystic-script', 'dao-mist-left', 'dao-gold-dust', 'dao-app-motion', 'dao-app-bagua']) {
    assert.match(html, new RegExp(layer));
  }
  assert.match(app, /function initHeroMotion\(\)/);
  assert.match(app, /appHome\.classList\.add\('dao-arriving'\)/);
  assert.match(css, /@keyframes daoSceneBreathe/);
  assert.match(css, /@keyframes daoModalArrive/);
  assert.match(css, /@keyframes daoAppOrbit/);
  assert.match(css, /@keyframes daoAppFog/);
  assert.match(css, /@keyframes daoEnergySweep/);
  assert.match(css, /@keyframes daoMysticWheel/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*dao-scene-bg/);
});
