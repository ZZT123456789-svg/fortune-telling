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

test('紫微引擎固定使用通行派官方默认口径', () => {
  let active = {
    mutagens:{}, brightness:{}, yearDivide:'exact', horoscopeDivide:'exact',
    ageDivide:'birthday', dayDivide:'current', algorithm:'zhongzhou'
  };
  const engine = { astro: {
    config(options) { active = { ...active, ...options }; },
    getConfig() { return active; }
  } };
  const result = ZiweiModule._configureEngine(engine);
  assert.equal(result.yearDivide, 'normal');
  assert.equal(result.horoscopeDivide, 'normal');
  assert.equal(result.ageDivide, 'normal');
  assert.equal(result.dayDivide, 'forward');
  assert.equal(result.algorithm, 'default');
});

test('紫微引擎拒绝未声明的四化覆盖，防止流派配置静默污染', () => {
  const engine = { astro: {
    config() {},
    getConfig() {
      return { ...ZiweiModule.STANDARD_CONFIG, mutagens:{ gengHeavenly:['taiyangMaj'] }, brightness:{} };
    }
  } };
  assert.throws(() => ZiweiModule._configureEngine(engine), /未声明的四化/);
});

test('拒绝越界时辰索引、未知性别和未知日历类型', () => {
  const engine = { astro: { bySolar() { return {}; }, byLunar() { return {}; } } };
  assert.throws(() => ZiweiModule._createChart(engine, {
    dateText:'2000-1-1', timeIndex:13, gender:'男', calType:'solar'
  }), /时辰索引/);
  assert.throws(() => ZiweiModule._createChart(engine, {
    dateText:'2000-1-1', timeIndex:1, gender:'未知', calType:'solar'
  }), /性别参数/);
  assert.equal(ZiweiModule._validateInput(2000,1,1,12,0,'other','男'), '日历类型填写有误');
});

test('三方四正按命宫连接两个三合宫和对宫', () => {
  assert.deepEqual(
    Array.from(ZiweiModule._getSanFangBranches('子')),
    ['辰', '申', '午']
  );
  assert.deepEqual(
    Array.from(ZiweiModule._getSanFangBranches('亥')),
    ['卯', '未', '巳']
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(ZiweiModule._getSanFangRelations('亥'))),
    [{branch:'卯',type:'三合'},{branch:'未',type:'三合'},{branch:'巳',type:'对宫'}]
  );
});

test('十二宫支持点击切换三方四正并兼容键盘操作', () => {
  const palaceHtml = ZiweiModule._renderPalace({
    index:0, name:'财帛宫', earthlyBranch:'辰', heavenlyStem:'甲',
    majorStars:[], minorStars:[], adjectiveStars:[], ages:[]
  }, 'g5', null);
  assert.match(palaceHtml, /role="button"/);
  assert.match(palaceHtml, /tabindex="0"/);
  assert.match(palaceHtml, /data-palace-name="财帛宫"/);
  assert.match(source, /_bindPalaceInteractions/);
  assert.match(source, /_activatePalace/);
  assert.match(source, /event\.key === 'Enter'/);
  assert.match(source, /classList\.toggle\('is-selected'/);
  assert.doesNotMatch(source, /#ziweiResult \.zw-sanfang-lines\{display:none\}/);
});
