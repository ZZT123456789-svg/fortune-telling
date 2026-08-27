const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadContext(elements) {
  const context = vm.createContext({
    console,
    Math,
    Date,
    document: {
      getElementById(id) {
        return elements[id] || null;
      }
    },
    requestAnimationFrame(callback) { callback(); },
    Paywall: { blockAll() { return true; } }
  });

  ['js/bazi-db.js', 'js/liuyao-db.js', 'js/liuyao.js'].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  });
  return context;
}

test('六十四卦编码完整且每一卦都能生成六爻纳甲', () => {
  const context = loadContext({});
  const db = context.LiuYaoDB;
  const keys = Object.keys(db.hexagrams);

  assert.equal(keys.length, 64);
  assert.equal(new Set(keys).size, 64);
  assert.equal(new Set(keys.map((key) => db.hexagrams[key].name)).size, 64);

  for (let value = 0; value < 64; value += 1) {
    const key = value.toString(2).padStart(6, '0');
    const chart = db.getNaJia(key, '甲', '寅', '子');
    assert.ok(chart, `${key} 应能排盘`);
    assert.equal(chart.lines.length, 6);
    assert.equal(chart.lines.filter((line) => line.role === '世').length, 1);
    assert.equal(chart.lines.filter((line) => line.role === '应').length, 1);
  }

  assert.equal(db.hexagrams['111111'].name, '乾为天');
  assert.equal(db.hexagrams['000000'].name, '坤为地');
  assert.equal(db.hexagrams['111000'].name, '天地否');
  assert.equal(db.hexagrams['000111'].name, '地天泰');
});

test('第六次摇卦后结果容器立即显示并滚动到结果', () => {
  let scrolled = false;
  const elements = {
    liuyaoShaking: { style: {} },
    liuyaoResult: {
      style: { display: 'none' },
      innerHTML: '',
      scrollIntoView() { scrolled = true; }
    },
    liuyaoQuestion: { value: '事业发展' }
  };
  const context = loadContext(elements);
  context.LiuyaoModule.yaoLines = Array.from({ length: 6 }, () => ({ type: 'young_yang' }));

  context.LiuyaoModule._showResult();

  assert.equal(elements.liuyaoShaking.style.display, 'none');
  assert.equal(elements.liuyaoResult.style.display, 'block');
  assert.match(elements.liuyaoResult.innerHTML, /六爻纳甲 — 乾为天/);
  assert.equal(scrolled, true);
});
