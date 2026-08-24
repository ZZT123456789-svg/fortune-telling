const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function loadEngine() {
  const context = { console, setTimeout, clearTimeout };
  context.window = context;
  context.self = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, 'js', 'vendor', 'iztro-2.6.0.min.js'), 'utf8'),
    context,
    { filename: 'iztro-2.6.0.min.js' }
  );
  return context.iztro;
}

const iztro = loadEngine();

test('本地紫微引擎完整生成十四主星及癸年四化', () => {
  const chart = iztro.astro.bySolar('2023-03-06', 4, '女', true, 'zh-CN');
  const actual = JSON.parse(JSON.stringify(chart.palaces.map(p => p.majorStars.map(s => s.name + (s.mutagen || '')))));
  assert.deepEqual(actual, [
    ['七杀'], ['天同'], ['武曲'], ['太阳'], ['破军禄'], ['天机'],
    ['紫微', '天府'], ['太阴科'], ['贪狼忌'], ['巨门权'],
    ['廉贞', '天相'], ['天梁']
  ]);

  const names = chart.palaces.flatMap(p => p.majorStars.map(s => s.name));
  assert.equal(names.length, 14);
  assert.equal(new Set(names).size, 14);
  assert.equal(chart.earthlyBranchOfSoulPalace, '亥');
  assert.equal(chart.earthlyBranchOfBodyPalace, '未');
  assert.equal(chart.fiveElementsClass, '水二局');
});

test('闰月命例的命宫、身宫、五行局与紫微宫位符合官方固定结果', () => {
  const chart = iztro.astro.byLunar('2023-2-20', 4, '女', true, true, 'zh-CN');
  assert.equal(chart.earthlyBranchOfSoulPalace, '子');
  assert.equal(chart.earthlyBranchOfBodyPalace, '申');
  assert.equal(chart.fiveElementsClass, '金四局');
  assert.equal(chart.star('紫微').palace().name, '迁移');
});

test('网站展示层不会遗漏十四主星和四化标记', () => {
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), context, { filename: 'js/ziwei.js' });
  const chart = iztro.astro.bySolar('2023-03-06', 4, '女', true, 'zh-CN');
  const html = chart.palaces.map(p => context.ZiweiModule._renderPalace(p, 'test')).join('');
  const names = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
  for (const name of names) assert.match(html, new RegExp('>' + name + '<'));
  for (const mutagen of ['禄','权','科','忌']) assert.match(html, new RegExp('zw-mutagen[^>]*>' + mutagen + '<'));
});

test('网站展示层完整显示全部杂曜并输出三方四正连线', () => {
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), context, { filename: 'js/ziwei.js' });
  const chart = iztro.astro.bySolar('2023-03-06', 4, '女', true, 'zh-CN');
  const module = context.ZiweiModule;
  const adjectiveNames = chart.palaces.flatMap(p => p.adjectiveStars.filter(s => s && s.name).map(s => s.name));
  const html = chart.palaces.map(p => module._renderPalace(p, 'test')).join('');
  for (const name of adjectiveNames) assert.match(html, new RegExp('(?:^|[> ·])' + name + '(?:[< ·]|$)'));

  const lines = module._renderSanFangLines(chart);
  assert.equal((lines.match(/<line /g) || []).length, 3);
  assert.match(lines, /data-origin-branch="亥"/);
  for (const branch of ['卯', '未', '巳']) assert.match(lines, new RegExp('data-target-branch="' + branch + '"'));
  assert.equal((lines.match(/data-relation="三合"/g) || []).length, 2);
  assert.equal((lines.match(/data-relation="对宫"/g) || []).length, 1);
});

test('命盘完整性校验覆盖十二宫、十四主星、生年四化与命身宫', () => {
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), context, { filename: 'js/ziwei.js' });
  const module = context.ZiweiModule;
  const chart = iztro.astro.bySolar('2000-08-16', 2, '女', true, 'zh-CN');
  assert.equal(module._assertChartIntegrity(chart), true);

  const broken = iztro.astro.bySolar('2000-08-16', 2, '女', true, 'zh-CN');
  const palaceWithMajor = broken.palaces.find(p => p.majorStars.length);
  palaceWithMajor.majorStars.pop();
  assert.throws(() => module._assertChartIntegrity(broken), /十四主星/);
});

test('当前小限、大限、流年、流月、流日、流时完整返回', () => {
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), context, { filename: 'js/ziwei.js' });
  const module = context.ZiweiModule;
  const chart = iztro.astro.bySolar('2023-03-06', 4, '女', true, 'zh-CN');
  const flow = module._getHoroscope(chart, '2026-8-24');
  assert.equal(flow.decadal.heavenlyStem + flow.decadal.earthlyBranch, '癸亥');
  assert.equal(flow.yearly.heavenlyStem + flow.yearly.earthlyBranch, '丙午');
  assert.equal(flow.monthly.heavenlyStem + flow.monthly.earthlyBranch, '丙申');
  assert.equal(flow.daily.heavenlyStem + flow.daily.earthlyBranch, '庚午');
  assert.equal(flow.hourly.heavenlyStem + flow.hourly.earthlyBranch, '丙子');
  assert.equal(flow.age.nominalAge, 4);
  const chenFlow = module._getHoroscope(chart, '2026-8-24', 4);
  assert.equal(chenFlow.hourly.heavenlyStem + chenFlow.hourly.earthlyBranch, '庚辰');
  assert.equal(chenFlow.hourly.index, 4);
  const center = module._renderCenter(chart, { name:'测试', hour:8, minute:0 }, flow);
  assert.match(center, /虚岁4/);
  assert.match(center, /大限 癸亥 · 流年 丙午 · 流月 丙申/);
  assert.match(center, /流日 庚午 · 流时 丙子/);
  assert.doesNotMatch(center, /\[object Object\]/);
});

test('完整大限列表连续且与当前大限、流年交叉一致', () => {
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), context, { filename: 'js/ziwei.js' });
  const module = context.ZiweiModule;
  const chart = iztro.astro.bySolar('2000-08-16', 2, '女', true, 'zh-CN');
  const flow = module._getHoroscope(chart, '2026-8-24');
  assert.equal(module._assertCycleIntegrity(chart, flow, new Date(2026, 7, 24)), true);

  const original = chart.decadalList;
  chart.decadalList = () => original.call(chart).map((item, index) => index === 1
    ? { ...item, ageRange:[item.ageRange[0] + 1, item.ageRange[1] + 1] }
    : item);
  assert.throws(() => module._assertCycleIntegrity(chart, flow, new Date(2026, 7, 24)), /大限区间不连续/);
});

test('专业命盘输出大限、流年、流月、流日、流时五层表格', () => {
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), context, { filename: 'js/ziwei.js' });
  const module = context.ZiweiModule;
  const chart = iztro.astro.bySolar('2000-08-16', 2, '女', true, 'zh-CN');
  const flow = module._getHoroscope(chart, '2026-8-24', 4);
  const html = module._renderFlowTables(chart, flow, new Date(2026, 7, 24, 8));
  for (const label of ['大限','流年','流月','流日','流时']) assert.match(html, new RegExp('>' + label + '<'));
  assert.match(html, /23～32/);
  assert.match(html, /2026年/);
  assert.match(html, /辰时/);
  assert.ok((html.match(/is-active/g) || []).length >= 4);
});

test('十四主星使用五行色，四化使用禄权科忌独立色块', () => {
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), context, { filename: 'js/ziwei.js' });
  const module = context.ZiweiModule;
  assert.match(module._renderStar({name:'天机',brightness:'庙',mutagen:'科'}, true), /element-wood/);
  assert.match(module._renderStar({name:'太阳',brightness:'旺',mutagen:'禄'}, true), /element-fire/);
  assert.match(module._renderStar({name:'武曲',mutagen:'权'}, true), /element-metal/);
  assert.match(module._renderStar({name:'破军',mutagen:'忌'}, true), /element-water/);
  for (const cls of ['is-lu','is-quan','is-ke','is-ji']) {
    assert.match(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), new RegExp('zw-mutagen\\.' + cls));
  }
});

test('宫位使用真实 decadal 字段并显示小限与四套十二神', () => {
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), context, { filename: 'js/ziwei.js' });
  const module = context.ZiweiModule;
  const chart = iztro.astro.bySolar('2023-03-06', 4, '女', true, 'zh-CN');
  const flow = module._getHoroscope(chart, '2026-8-24');
  const palace = chart.palaces[flow.yearly.index];
  const html = module._renderPalace(palace, 'test', flow);
  assert.match(html, new RegExp('大限 ' + palace.decadal.range[0] + '～' + palace.decadal.range[1] + ' 岁'));
  assert.match(html, /小限/);
  for (const god of [palace.changsheng12, palace.boshi12, palace.jiangqian12, palace.suiqian12]) {
    assert.match(html, new RegExp(god));
  }
  assert.match(html, /流年/);
});

test('阳历与对应农历入口生成完全一致的核心命盘', () => {
  for (const solar of ['2000-08-16', '2023-03-06', '2023-03-22']) {
    const fromSolar = iztro.astro.bySolar(solar, 4, '女', true, 'zh-CN');
    const lunar = fromSolar.rawDates.lunarDate;
    const lunarText = lunar.lunarYear + '-' + lunar.lunarMonth + '-' + lunar.lunarDay;
    const fromLunar = iztro.astro.byLunar(lunarText, 4, '女', lunar.isLeap, true, 'zh-CN');
    const signature = chart => ({
      soul: chart.earthlyBranchOfSoulPalace,
      body: chart.earthlyBranchOfBodyPalace,
      five: chart.fiveElementsClass,
      palaces: chart.palaces.map(p => [p.name, p.earthlyBranch, p.majorStars.map(s => s.name + (s.mutagen || ''))])
    });
    assert.deepEqual(JSON.parse(JSON.stringify(signature(fromLunar))), JSON.parse(JSON.stringify(signature(fromSolar))));
  }
});

test('跨年代、性别与早晚子时命盘均满足完整性约束', () => {
  const context = { console, setTimeout, clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8'), context, { filename: 'js/ziwei.js' });
  const module = context.ZiweiModule;
  const samples = [
    ['1901-02-19',0,'男'], ['1950-06-01',12,'女'], ['2000-08-16',2,'女'],
    ['2023-03-22',4,'男'], ['2099-12-30',11,'女']
  ];
  for (const [date,time,gender] of samples) {
    assert.equal(module._assertChartIntegrity(iztro.astro.bySolar(date,time,gender,true,'zh-CN')), true);
  }
});

test('紫微引擎固定文件与许可证随网站部署', () => {
  const ziweiSource = fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8');
  assert.match(ziweiSource, /ENGINE_URL:\s*'\/js\/vendor\/iztro-2\.6\.0\.min\.js'/);
  assert.ok(fs.statSync(path.join(ROOT, 'js', 'vendor', 'iztro-2.6.0.min.js')).size > 700000);
  assert.ok(fs.statSync(path.join(ROOT, 'js', 'vendor', 'iztro-LICENSE.txt')).size > 500);
});

test('紫微基础命盘不被付费遮罩覆盖，付费仅由 AI 解读入口处理', () => {
  const ziweiSource = fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8');
  assert.doesNotMatch(ziweiSource, /Paywall\.blockAll\(['"]ziweiResult['"]\)/);
  assert.match(ziweiSource, /AIChat\.openWithContext/);
  assert.match(ziweiSource, /ziweiResult/);
});
