const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'js', 'advanced-divination.js'), 'utf8');
const apiSource = fs.readFileSync(path.join(ROOT, 'api', 'divination-chart.js'), 'utf8');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const packageJson = require(path.join(ROOT, 'package.json'));
const chartApi = require(path.join(ROOT, 'api', 'divination-chart.js'));

test('首页和更多菜单均接入奇门、风水、独立星盘和太乙', () => {
  for (const name of ['奇门遁甲', '玄空风水', '独立出生星盘', '太乙神数']) {
    assert.match(index, new RegExp(name));
  }
  assert.match(index, /advanced-divination\.js/);
});

test('四个工具由统一服务端接口固定扣1次并返回开源引擎结果', () => {
  assert.equal(packageJson.dependencies['mingyu-core'], '^0.1.32');
  assert.match(source, /fetch\('\/api\/divination-chart'/);
  assert.doesNotMatch(source, /consumeCredit\(/);
  assert.match(apiSource, /p_amount:\s*1/);
  assert.match(apiSource, /name:\s*'mingyu-core'/);
  for (const reason of ['qimen-chart', 'fengshui-chart', 'astro-chart', 'taiyi-chart']) {
    assert.match(apiSource, new RegExp(reason));
  }
});

test('奇门改用 mingyu-core 完整转盘，输出天地人神四盘和值符值使', async () => {
  const chart = await chartApi._test.generateChart('qimen', { date:'2026-08-27', time:'14:30', timezone:8 });
  assert.equal(chart.method, 'zhuanpan');
  assert.equal(chart.scope, 'hour');
  assert.equal(chart.juMethod, 'chaibu');
  assert.ok(chart.juShu >= 1 && chart.juShu <= 9);
  assert.match(chart.zhiFu, /^天/);
  assert.match(chart.zhiShi, /门$/);
  assert.equal(chart.jiuGongGe.length, 9);
  const outerPalaces = chart.jiuGongGe.filter(palace => palace.gong !== 5);
  for (const palace of outerPalaces) {
    assert.ok(palace.tianPan.star || palace.tianPan.companionStar);
    assert.ok(palace.tianPan.stem || palace.tianPan.companionStem);
    assert.ok(palace.diPan.stem);
    assert.ok(palace.renPan.door);
    assert.ok(palace.shenPan.god);
  }
});

test('玄空改用开源二十四山引擎，输出运盘、山盘、向盘与流年盘', async () => {
  const chart = await chartApi._test.generateChart('fengshui', { buildYear:2024, facingDegree:180, analysisYear:2026 });
  assert.equal(chart.period.yun, 9);
  assert.equal(chart.engine.name, '@soul-atelier/xuankong');
  assert.equal(chart.palaces.length, 9);
  assert.equal(chart.plates.yun.length, 9);
  assert.equal(chart.plates.shan.length, 9);
  assert.equal(chart.plates.xiang.length, 9);
  assert.equal(chart.annualCenter, 1);
  assert.equal(chart.annualPlate.length, 9);
});

test('星盘改用 Celestine 与 Astronomy Engine，输出十大星体、四轴、宫头及相位', async () => {
  const chart = await chartApi._test.generateChart('astrology', { date:'2000-08-16', time:'12:00', timezone:8, longitude:116.4, latitude:39.9 });
  assert.ok(chart.planets.length >= 10);
  assert.ok(chart.angles.length >= 4);
  assert.equal(chart.houses.length, 12);
  assert.ok(Array.isArray(chart.aspects));
  for (const point of chart.planets.concat(chart.angles)) {
    assert.ok(Number.isFinite(point.longitude));
    assert.ok(point.longitude >= 0 && point.longitude < 360);
  }
  for (const point of chart.planets) assert.ok(point.house >= 1 && point.house <= 12);
});

test('太乙改用 mingyu-core 四计引擎，输出七十二局、主客定算和十六神', async () => {
  const chart = await chartApi._test.generateChart('taiyi', { date:'2026-08-27', time:'14:30', timezone:8, scope:'hour' });
  assert.equal(chart.scope, 'hour');
  assert.ok(chart.bureau >= 1 && chart.bureau <= 72);
  assert.ok(Number.isFinite(chart.lordCount));
  assert.ok(Number.isFinite(chart.guestCount));
  assert.equal(chart.sixteenGods.length, 16);
  assert.ok(chart.model && chart.model.name);
});

test('手机端九宫盘改为纵向双列且中宫通栏', () => {
  assert.match(source, /@media\(max-width:760px\)/);
  assert.match(source, /adt-nine-grid\{grid-template-columns:repeat\(2/);
  assert.match(source, /adt-palace\.p5\{grid-column:1\/-1\}/);
});
