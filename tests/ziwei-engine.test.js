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
});

test('紫微引擎固定文件与许可证随网站部署', () => {
  const ziweiSource = fs.readFileSync(path.join(ROOT, 'js', 'ziwei.js'), 'utf8');
  assert.match(ziweiSource, /ENGINE_URL:\s*'\/js\/vendor\/iztro-2\.6\.0\.min\.js'/);
  assert.ok(fs.statSync(path.join(ROOT, 'js', 'vendor', 'iztro-2.6.0.min.js')).size > 700000);
  assert.ok(fs.statSync(path.join(ROOT, 'js', 'vendor', 'iztro-LICENSE.txt')).size > 500);
});
