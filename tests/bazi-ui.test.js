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
