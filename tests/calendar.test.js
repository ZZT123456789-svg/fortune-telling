const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

function loadContext() {
  const document = {
    addEventListener() {},
    getElementById() { return null; },
    querySelectorAll() { return []; }
  };
  const context = { console, setTimeout, clearTimeout, Date, Math, document };
  context.window = context;
  context.self = context;
  context.globalThis = context;
  vm.createContext(context);
  for (const file of ['js/vendor/iztro-2.6.0.min.js', 'js/vendor/lunar-javascript-1.7.7.js', 'js/lunar.js', 'js/bazi-db.js', 'js/bazi.js', 'js/almanac.js', 'js/ziwei.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename:file });
  }
  return context;
}

const context = loadContext();

test('农历与公历双向转换覆盖普通月、春节和闰月', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(context.DaoCalendar.engine)), { name: 'lunar-javascript', version: '1.7.7' });
  assert.deepEqual(JSON.parse(JSON.stringify(context.DaoCalendar.lunarToSolar(2003, 1, 20, false))), {year:2003,month:2,day:20});
  assert.deepEqual(JSON.parse(JSON.stringify(context.DaoCalendar.lunarToSolar(2003, 2, 20, false))), {year:2003,month:3,day:22});
  assert.deepEqual(JSON.parse(JSON.stringify(context.DaoCalendar.solarToLunar(2024, 2, 10))), {year:2024,month:1,day:1,isLeap:false});
  assert.deepEqual(JSON.parse(JSON.stringify(context.DaoCalendar.solarToLunar(2023, 3, 22))), {year:2023,month:2,day:1,isLeap:true});
});

test('不存在的日期和错误闰月不会被静默接受', () => {
  assert.throws(() => context.DaoCalendar.lunarToSolar(2003, 2, 20, true), /没有这个闰月/);
  assert.throws(() => context.DaoCalendar.lunarToSolar(2024, 1, 30, false), /不存在|天数不足/);
  assert.equal(context.DaoCalendar.validSolarDate(2024, 2, 29), true);
  assert.equal(context.DaoCalendar.validSolarDate(2023, 2, 29), false);
});

test('八字农历入口不再固定加二十八天', () => {
  const solar = context.BaziModule._lunarToSolar(2003, 1, 20, false);
  assert.deepEqual(JSON.parse(JSON.stringify(solar)), {year:2003,month:2,day:20});
  const year = context.BaziModule._getYearPillar(2003, 2, 20, 20);
  const month = context.BaziModule._getMonthPillar(year.ganIdx, 2, 20, 20, 2003);
  const day = context.BaziModule._getDayPillar(2003, 2, 20);
  const hour = context.BaziModule._getHourPillar(day.ganIdx, 20);
  assert.equal([year,month,day,hour].map(p => p.gan + p.zhi).join(' '), '癸未 甲寅 甲子 甲戌');
});

test('黄历读取真实农历日期及节气月柱', () => {
  const value = context.AlmanacModule._calendarForSolar(2003, 2, 20);
  assert.deepEqual(JSON.parse(JSON.stringify(value.details.lunar)), {year:2003,month:1,day:20,isLeap:false});
  assert.equal(value.year.gan + value.year.zhi, '癸未');
  assert.equal(value.month.gan + value.month.zhi, '甲寅');
  assert.equal(value.day.gan + value.day.zhi, '甲子');
});

test('紫微拒绝与输入不一致的闰月结果', () => {
  const chart = context.iztro.astro.byLunar('2003-2-20', 10, '男', true, true, 'zh-CN');
  assert.throws(() => context.ZiweiModule._assertCalendarMatch(chart, {
    year:2003,month:2,day:20,calType:'lunar',isLeapMonth:true
  }), /没有这个闰月/);
});

test('页面先加载固定排盘与历法引擎，并提供八字闰月选择', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.indexOf('js/vendor/iztro-2.6.0.min.js') < html.indexOf('js/lunar.js'));
  assert.ok(html.indexOf('js/vendor/lunar-javascript-1.7.7.js') < html.indexOf('js/lunar.js'));
  assert.ok(fs.statSync(path.join(ROOT, 'js', 'vendor', 'lunar-javascript-1.7.7.js')).size > 400000);
  assert.ok(fs.statSync(path.join(ROOT, 'js', 'vendor', 'lunar-javascript-LICENSE.txt')).size > 500);
  assert.match(html, /id="baziLeapMonth1"/);
  assert.match(html, /<select id="baziMonth1">/);
  assert.match(fs.readFileSync(path.join(ROOT, 'js/bazi.js'), 'utf8'), /'正月'.*'腊月'/);
});

test('成熟历法引擎输出固定八字案例，并与现有八字日柱口径一致', () => {
  const result = context.calculateBazi(2003, 2, 20, 20, '男');
  assert.equal(result.yearPillar, '癸未');
  assert.equal(result.monthPillar, '甲寅');
  assert.equal(result.dayPillar, '甲子');
  assert.equal(result.hourPillar, '甲戌');
  assert.equal(result.dayPillar, context.BaziModule._getDayPillar(2003, 2, 20).gan + context.BaziModule._getDayPillar(2003, 2, 20).zhi);

  const ziweiCalendar = context.iztro.astro.bySolar('2003-2-20', 10, '男', true, 'zh-CN').rawDates.chineseDate;
  assert.equal(result.yearPillar, ziweiCalendar.yearly.join(''));
  assert.equal(result.monthPillar, ziweiCalendar.monthly.join(''));
  assert.equal(result.dayPillar, ziweiCalendar.daily.join(''));
  assert.equal(result.hourPillar, ziweiCalendar.hourly.join(''));
});
