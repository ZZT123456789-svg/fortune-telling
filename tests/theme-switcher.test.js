const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

test('主站顶部提供白天、中午、夜晚三个单色图标', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.equal((html.match(/data-dw-theme-choice=/g) || []).length, 3);
  assert.match(html, /data-dw-theme-choice="day"[\s\S]*data-dw-theme-choice="noon"[\s\S]*data-dw-theme-choice="night"/);
  assert.match(html, /class="dw-theme-switcher" role="group"/);
  assert.equal((html.match(/<svg viewBox="0 0 24 24"/g) || []).length, 3);
  assert.doesNotMatch(html, /data-dw-theme-choice[^>]*>\s*[🌅☀️🌙]/);
});

test('首次默认夜晚并记住用户最后一次选择', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'js', 'theme-switcher.js'), 'utf8');
  assert.match(html, /localStorage\.getItem\('daowen-color-theme'\) \|\| 'night'/);
  assert.match(js, /localStorage\.setItem\(STORAGE_KEY, theme\)/);
  assert.match(js, /document\.documentElement\.setAttribute\('data-dw-theme', theme\)/);
  assert.match(js, /aria-pressed/);
  assert.doesNotMatch(js, /location\.(?:reload|assign|replace)|innerHTML/);
});

test('点击切换只更新主题属性，不清空现有表单状态', () => {
  const listeners = {};
  const buttons = ['day', 'noon', 'night'].map((theme) => ({
    theme,
    attrs: { 'data-dw-theme-choice': theme },
    setAttribute(name, value) { this.attrs[name] = value; },
    getAttribute(name) { return this.attrs[name]; },
    addEventListener(name, handler) { this.handler = handler; }
  }));
  const root = {
    attrs: { 'data-dw-theme': 'night' },
    classList: { add() {}, remove() {} },
    setAttribute(name, value) { this.attrs[name] = value; },
    getAttribute(name) { return this.attrs[name]; }
  };
  const form = { value: '已经填写的出生资料' };
  const storage = {};
  const document = {
    readyState: 'complete', documentElement: root,
    querySelectorAll(selector) { return selector === '[data-dw-theme-choice]' ? buttons : []; },
    addEventListener(name, handler) { listeners[name] = handler; },
    dispatchEvent() {}
  };
  const context = {
    document, localStorage: { setItem(key, value) { storage[key] = value; } },
    CustomEvent: function CustomEvent() {}, setTimeout, clearTimeout, form
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'theme-switcher.js'), 'utf8'), context);
  buttons[1].handler();
  assert.equal(root.attrs['data-dw-theme'], 'noon');
  assert.equal(storage['daowen-color-theme'], 'noon');
  assert.equal(buttons[1].attrs['aria-pressed'], 'true');
  assert.equal(form.value, '已经填写的出生资料');
});

test('配色层只由主站加载，书库与支付页保持黑金', () => {
  const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const library = fs.readFileSync(path.join(ROOT, 'library.html'), 'utf8');
  const payment = fs.readFileSync(path.join(ROOT, 'payment.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'theme-switcher.css'), 'utf8');
  assert.match(index, /css\/theme-switcher\.css/);
  assert.match(index, /js\/theme-switcher\.js/);
  assert.doesNotMatch(library, /theme-switcher/);
  assert.doesNotMatch(payment, /theme-switcher/);
  assert.doesNotMatch(css, /\.lib-|\.dw-payment/);
});

test('三种主题覆盖主站弹窗结果与AI并强化文字对比度', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'theme-switcher.css'), 'utf8');
  assert.match(css, /data-dw-theme="day"/);
  assert.match(css, /data-dw-theme="noon"/);
  assert.match(css, /data-dw-theme="night"/);
  assert.match(css, /\.tool-modal/);
  assert.match(css, /#aiReadingContainer/);
  assert.match(css, /\.ai-chat-window/);
  assert.match(css, /font-weight:\s*500/);
  assert.match(css, /font-weight:\s*700\s*!important/);
  assert.match(css, /transition:[^;]*\.5s/);
});

test('手机端三个图标保持紧凑并排', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css', 'theme-switcher.css'), 'utf8');
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.dao-account-actions[\s\S]*flex:\s*0 0 211px/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.dw-theme-switcher button\s*\{\s*width:\s*20px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.dw-theme-switcher button\s*\{\s*width:\s*19px/);
});
