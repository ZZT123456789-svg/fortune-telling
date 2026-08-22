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

test('应用页首页导航返回真实欢迎首页', () => {
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
  assert.match(home, /class="dao-brand" href="\/" onclick="window\.DaoWenUI\.goHome\(event\)"/);
  assert.match(home, /class="active" href="\/" onclick="window\.DaoWenUI\.goHome\(event\)">首页<\/a>/);
  assert.doesNotMatch(home, /href="#daoHero">首页<\/a>/);
  assert.match(app, /goHome\(event\)[\s\S]*window\.location\.assign\('\/'\)/);
});

test('欢迎首页不再显示底部滚动提示图标', () => {
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  assert.doesNotMatch(home, /dao-scroll-cue/);
  assert.doesNotMatch(css, /dao-scroll-cue|@keyframes\s+dwScroll/);
});

test('八字 AI 解读只发送一次服务端扣费请求', () => {
  const bazi = fs.readFileSync(path.join(ROOT, 'js', 'bazi.js'), 'utf8');
  assert.equal((bazi.match(/_callAIReading\(/g) || []).length, 1);
  assert.doesNotMatch(bazi, /Paywall\.deduct\(\)/);
  assert.match(bazi, /data\.balance != null[\s\S]*Paywall\._setBalance/);
});

test('八字录入采用分步确认，高级校正折叠且结果有七段阅读路径', () => {
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const bazi = fs.readFileSync(path.join(ROOT, 'js', 'bazi.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'ui-polish.css'), 'utf8');
  assert.match(home, /class="bazi-entry-progress"/);
  assert.match(home, /<details class="bazi-advanced-settings">/);
  assert.match(home, /id="baziInputSummary1"/);
  assert.match(home, /开启推演/);
  assert.match(bazi, /_updateEntrySummary:\s*function/);
  assert.match(bazi, /class="bazi-reading-route"/);
  assert.equal((bazi.match(/BaziModule\.openResultSection/g) || []).length, 7);
  assert.match(bazi, /<span>AI 解读<\/span>/);
  assert.match(css, /\.bazi-reading-route/);
});

test('AI 数据契约锁定四柱并携带编号证据与古籍来源', () => {
  const front = fs.readFileSync(path.join(ROOT, 'js', 'bazi.js'), 'utf8');
  const api = fs.readFileSync(path.join(ROOT, 'api', 'ai-reading.js'), 'utf8');
  assert.match(front, /schemaVersion:\s*'daowen-bazi-reading\/v1'/);
  assert.match(front, /calculationAuthority:\s*'DaoCalendar \/ lunar-javascript'/);
  assert.match(front, /evidencePacket:/);
  assert.match(front, /pillarsLocked:\s*true/);
  assert.match(api, /每个主要结论至少引用一个证据包编号/);
  assert.match(api, /古籍内容只能引用证据包中已经提供的原文与释义/);
});

test('八字十三类格局均有黑金视觉图并支持特殊格局追加展示', () => {
  const bazi = fs.readFileSync(path.join(ROOT, 'js', 'bazi.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8');
  const imageDir = path.join(ROOT, 'assets', 'bazi-patterns');
  const imageNames = [
    'zheng-guan', 'qi-sha', 'zheng-yin', 'pian-yin', 'shi-shen',
    'shang-guan', 'zheng-cai', 'pian-cai', 'jian-lu', 'yue-ren',
    'cong-qiang', 'cong-ruo', 'hua-qi'
  ];

  assert.match(bazi, /_buildPatternVisuals:\s*function/);
  assert.match(bazi, /specialKeys\.push\(\{name:'从强格',key:'cong-qiang',tagline:'顺其旺势，聚力而行'\}\)/);
  assert.match(bazi, /specialKeys\.push\(\{name:'从弱格',key:'cong-ruo',tagline:'借势而成，以柔应变'\}\)/);
  assert.match(bazi, /specialKeys\.push\(\{name:'化气格',key:'hua-qi',tagline:'阴阳交融，化而新生'\}\)/);
  assert.match(bazi, /正官:\{key:'zheng-guan',tagline:'端方守正，秩序有成'\}/);
  assert.match(bazi, /bazi-pattern-title/);
  assert.match(css, /\.bazi-pattern-gallery\s*\{/);
  assert.match(css, /object-fit:\s*cover/);
  imageNames.forEach((name) => {
    assert.equal(fs.existsSync(path.join(imageDir, `${name}.webp`)), true, `${name}.webp should exist`);
  });
});
