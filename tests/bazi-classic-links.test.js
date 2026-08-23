const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function text(file){return fs.readFileSync(path.join(root,file),'utf8');}
function api(){const context={};vm.createContext(context);vm.runInContext(text('js/bazi-classic-links.js'),context);return context.BaziClassicLink;}

test('格局、十神、神煞均返回原文、白话和适用条件',()=>{
  const link=api();
  for(const item of [['pattern','正官格'],['ten-god','食神'],['shensha','桃花'],['shensha','天乙贵人']]){
    const data=link.lookup(item[0],item[1]);
    assert.equal(data.term,item[1]);
    assert.ok(data.source.length>4);
    assert.ok(data.quote.includes('“'));
    assert.ok(data.explain.length>12);
    assert.ok(data.condition.length>12);
  }
});

test('命盘术语入口和行内面板已接入，未创建嵌套弹窗',()=>{
  const view=text('js/bazi-result-view.js');
  const professional=text('js/bazi-professional.js');
  const css=text('css/bazi-result-sheet.css');
  const html=text('index.html');
  assert.match(view,/ref\('ten-god'/);
  assert.match(view,/ref\('shensha'/);
  assert.match(professional,/BaziClassicLink\.trigger\('pattern'/);
  assert.match(view,/BaziClassicLink\.panel/);
  assert.match(css,/\.classic-reference-panel/);
  assert.doesNotMatch(css,/\.classic-reference-panel\{[^}]*position\s*:\s*fixed/);
  assert.ok(html.indexOf('bazi-classic-links.js')<html.indexOf('bazi-professional.js'));
});
