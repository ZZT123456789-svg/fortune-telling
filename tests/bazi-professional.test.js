const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function loadContext() {
  const document = { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } };
  const context = { console, setTimeout, clearTimeout, Date, Math, document };
  context.window = context; context.self = context; context.globalThis = context;
  vm.createContext(context);
  for (const file of ['js/vendor/lunar-javascript-1.7.7.js','js/lunar.js','js/bazi-db.js','js/bazi-classics.js','js/bazi-professional.js','js/bazi.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename:file });
  }
  return context;
}

test('专业命盘完整输出天干十神、藏干层级、长生与空亡', () => {
  const context = loadContext();
  const result = context.BaziModule._analyzeSingle('固定命例', '男', 2003, 2, 20, 20, 0, '1');
  const pro = JSON.parse(JSON.stringify(result.professional));
  assert.deepEqual(pro.pillars.map(p => p.tenGod), ['正印','比肩','日主','比肩']);
  assert.deepEqual(pro.pillars[0].hidden, [
    {stem:'己',element:'土',tenGod:'正财',layer:'本气',weight:60,exposed:false},
    {stem:'丁',element:'火',tenGod:'伤官',layer:'中气',weight:30,exposed:false},
    {stem:'乙',element:'木',tenGod:'劫财',layer:'余气',weight:10,exposed:false}
  ]);
  assert.deepEqual(pro.pillars.map(p => p.diShi), ['墓','临官','沐浴','养']);
  assert.deepEqual(pro.pillars.map(p => p.xunKong), ['申酉','子丑','戌亥','申酉']);
  assert.equal(pro.distribution.reduce((sum,item) => sum + item.percent, 0), 100);
});

test('旺衰、格局和喜用均给出依据与反向条件', () => {
  const context = loadContext();
  const result = context.BaziModule._analyzeSingle('固定命例', '男', 2003, 2, 20, 20, 0, '1');
  const pro = result.professional;
  assert.equal(pro.strength.level, '身强');
  assert.equal(pro.strength.order, true);
  assert.ok(pro.strength.evidence.length >= 5);
  assert.ok(pro.strength.counterEvidence.length >= 1);
  assert.equal(pro.pattern.name, '建禄格');
  assert.match(pro.pattern.basis, /月支寅本气甲/);
  assert.deepEqual(JSON.parse(JSON.stringify(pro.useful.favorable)), ['火','土','金']);
  assert.equal(pro.useful.confidence, '较高');
});

test('真实起运、大运和流年由成熟引擎生成，不再固定十岁起运', () => {
  const context = loadContext();
  const result = context.BaziModule._analyzeSingle('固定命例', '男', 2003, 2, 20, 20, 0, '1');
  const yun = JSON.parse(JSON.stringify(result.yun));
  assert.equal(yun.forward, false);
  assert.deepEqual(yun.start, {year:5,month:4,day:29,hour:14});
  assert.deepEqual(yun.startSolar, {year:2008,month:7,day:20,hour:10,minute:0});
  assert.deepEqual(yun.daYun.slice(0,2).map(x => [x.ganZhi,x.startAge,x.endAge,x.startYear,x.endYear]), [
    ['癸丑',6,15,2008,2017], ['壬子',16,25,2018,2027]
  ]);
  assert.deepEqual(yun.daYun[0].years.slice(0,2).map(x => [x.year,x.age,x.ganZhi]), [[2008,6,'戊子'],[2009,7,'己丑']]);
});

test('专业模式包含关系、核心神煞、十神展开和手机横向命盘', () => {
  const context = loadContext();
  const result = context.BaziModule._analyzeSingle('固定命例', '男', 2003, 2, 20, 20, 0, '1');
  const pro = result.professional;
  assert.ok(pro.relations.some(x => x.type === '六害' && x.value === '未子六害'));
  assert.ok(pro.relations.some(x => x.type === '六破' && x.value === '未戌六破'));
  assert.ok(pro.shenSha.some(x => x.name === '天乙贵人'));
  assert.doesNotMatch(context.BaziProfessional.renderSummary(pro), /可信度/);
  assert.doesNotMatch(context.BaziProfessional.renderProfessional(pro), /可信度/);
  const source = fs.readFileSync(path.join(ROOT, 'js/bazi.js'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT, 'css/ui-polish.css'), 'utf8');
  assert.match(source, /简明解读/);
  assert.match(source, /专业命盘/);
  assert.match(source, /toggleTenGod/);
  assert.match(css, /\.bazi-pro-chart/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.bazi-pro-chart[\s\S]*overflow-x:auto/);
});

test('AI 深度解读只读取结构化专业命盘，不自行重算四柱', () => {
  const front = fs.readFileSync(path.join(ROOT, 'js/bazi.js'), 'utf8');
  const api = fs.readFileSync(path.join(ROOT, 'api/ai-reading.js'), 'utf8');
  assert.match(front, /professional:\s*r\.professional/);
  assert.match(api, /不得重新计算或改写四柱/);
  assert.match(api, /结论、依据、反向条件/);
  assert.match(api, /不要输出“可信度”字样/);
  assert.doesNotMatch(front, /<em>可信度/);
});
