const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'ziwei.js'), 'utf8');
const context = { console };
vm.createContext(context);
vm.runInContext(source, context, { filename: 'js/ziwei.js' });
const ZiweiModule = context.ZiweiModule;

test('紫微阳历参数顺序与 iztro 官方 bySolar 接口一致', () => {
  let received;
  const expected = { palaces: new Array(12) };
  const engine = { astro: { bySolar(...args) { received = args; return expected; } } };
  const chart = ZiweiModule._createChart(engine, {
    dateText: '2000-8-16', timeIndex: 2, gender: '女', calType: 'solar', isLeapMonth: false
  });
  assert.equal(chart, expected);
  assert.deepEqual(received, ['2000-8-16', 2, '女', true, 'zh-CN']);
});

test('紫微农历参数顺序与 iztro 官方 byLunar 接口一致', () => {
  let received;
  const expected = { palaces: new Array(12) };
  const engine = { astro: { byLunar(...args) { received = args; return expected; } } };
  const chart = ZiweiModule._createChart(engine, {
    dateText: '2000-7-17', timeIndex: 12, gender: '男', calType: 'lunar', isLeapMonth: true
  });
  assert.equal(chart, expected);
  assert.deepEqual(received, ['2000-7-17', 12, '男', true, true, 'zh-CN']);
});

test('紫微时辰映射保留早子时与晚子时', () => {
  assert.equal(ZiweiModule._hourToTimeIndex(0), 0);
  assert.equal(ZiweiModule._hourToTimeIndex(1), 1);
  assert.equal(ZiweiModule._hourToTimeIndex(22), 11);
  assert.equal(ZiweiModule._hourToTimeIndex(23), 12);
});
