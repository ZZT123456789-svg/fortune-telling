const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');

function loadHandler(relative, stubs) {
  const filename=path.join(ROOT,relative),source=fs.readFileSync(filename,'utf8'),module={exports:{}};
  const wrapped=vm.runInThisContext('(function(require,module,exports,__filename,__dirname){'+source+'\n})',{filename});
  wrapped(name=>Object.prototype.hasOwnProperty.call(stubs,name)?stubs[name]:require(name),module,module.exports,filename,path.dirname(filename));
  return module.exports;
}
function response(){return {statusCode:200,headers:{},body:null,setHeader(n,v){this.headers[n]=v;},status(c){this.statusCode=c;return this;},json(v){this.body=v;return this;}};}
async function invoke(handler,req){const res=response();await handler(Object.assign({headers:{},query:{}},req),res);return res;}

test('流月使用历法引擎的真实节气日期',()=>{
  const context={console,Date,Math};context.window=context;context.self=context;context.globalThis=context;vm.createContext(context);
  for(const file of ['js/vendor/lunar-javascript-1.7.7.js','js/lunar.js']){
    vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),context,{filename:file});
  }
  const dates=JSON.parse(JSON.stringify(context.DaoCalendar.jieQiDates(2026)));
  assert.equal(dates.length,12);
  assert.deepEqual(dates.slice(0,3).map(x=>[x.name,x.year,x.month,x.day]),[
    ['立春',2026,2,4],['惊蛰',2026,3,5],['清明',2026,4,5]
  ]);
  assert.deepEqual([dates[11].name,dates[11].year,dates[11].month,dates[11].day],['小寒',2027,1,5]);
});

test('神煞扩展表覆盖参考图核心项目并按柱定位',()=>{
  const context={console};context.window=context;context.globalThis=context;vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'js/bazi-shensha.js'),'utf8'),context);
  const pillars=[{gan:'甲',zhi:'寅'},{gan:'丁',zhi:'卯'},{gan:'甲',zhi:'子'},{gan:'辛',zhi:'亥'}];
  const hits=JSON.parse(JSON.stringify(context.BaziShenSha.detect('甲','寅','卯',pillars)));
  assert.ok(hits.some(x=>x.name==='禄神'&&x.position==='年柱'));
  assert.ok(hits.some(x=>x.name==='羊刃'&&x.position==='月柱'));
  assert.ok(hits.some(x=>x.name==='暗禄'&&x.position==='时柱'));
  assert.ok(hits.some(x=>x.name==='太极贵人'&&x.position==='日柱'));
});

test('单人与双人结果采用白底七列命盘，手机端不横向滚动',()=>{
  const home=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const view=fs.readFileSync(path.join(ROOT,'js/bazi-result-view.js'),'utf8');
  const bazi=fs.readFileSync(path.join(ROOT,'js/bazi.js'),'utf8');
  const css=fs.readFileSync(path.join(ROOT,'css/bazi-result-sheet.css'),'utf8');
  assert.match(home,/bazi-result-sheet\.css/);
  assert.match(home,/bazi-shensha\.js[\s\S]*bazi-result-view\.js/);
  assert.match(view,/日期[\s\S]*流年[\s\S]*大运[\s\S]*年柱[\s\S]*月柱[\s\S]*日柱[\s\S]*时柱/);
  assert.match(view,/大运[\s\S]*流年[\s\S]*流月/);
  assert.match(bazi,/甲方完整单人命盘与规则解读/);
  assert.match(bazi,/乙方完整单人命盘与规则解读/);
  assert.match(bazi,/双方综合合盘解读/);
  assert.match(css,/grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(css,/overflow-x\s*:\s*auto/);
});

test('双人 AI 首次扣4次、同盘缓存不重复扣费、失败精确退回',async()=>{
  const identity={id:'00000000-0000-0000-0000-000000000041',isGuest:true};
  const state={balance:8,debits:0,refunds:0,cache:new Map(),fail:false};
  const lib={
    noStore(){},async readJson(req){return req.body||{};},sha256Hex(){return state.fail?'b'.repeat(64):'a'.repeat(64);},randomRequestId(){return 'ai-dual:'+state.debits;},
    async dataRequest(url,opt){
      if(opt&&opt.method==='POST'){const row=JSON.parse(opt.body);state.cache.set(row.chart_hash,row.content);return null;}
      const hash=url.includes('b'.repeat(64))?'b'.repeat(64):'a'.repeat(64);return state.cache.has(hash)?[{content:state.cache.get(hash)}]:[];
    },
    async serviceRpc(name,payload){
      if(name==='api_get_balance')return state.balance;
      if(name==='api_consume_credits'){state.debits++;if(state.balance<payload.p_amount)return {success:false,code:'INSUFFICIENT',balance:state.balance};state.balance-=payload.p_amount;return {success:true,balance:state.balance};}
      if(name==='api_refund_ai_usage'){state.refunds++;state.balance+=payload.p_amount;return {success:true,balance:state.balance};}
      throw new Error('unexpected '+name);
    }
  };
  const good=loadHandler('api/ai-dual-reading.js',{'./_lib':lib,'./_auth':{requireUser:async()=>identity},'./_deepseek':{callDeepSeek:async()=> '完整双人合盘'}});
  const body={a:{year:'甲子'},b:{year:'乙丑'},compat:{score:80}};
  const first=await invoke(good,{method:'POST',body});assert.equal(first.statusCode,200);assert.equal(first.body.cost,4);assert.equal(state.balance,4);assert.equal(state.debits,1);
  const cached=await invoke(good,{method:'POST',body});assert.equal(cached.body.cached,true);assert.equal(cached.body.cost,0);assert.equal(state.debits,1);
  state.fail=true;
  const bad=loadHandler('api/ai-dual-reading.js',{'./_lib':lib,'./_auth':{requireUser:async()=>identity},'./_deepseek':{callDeepSeek:async()=>{throw new Error('offline');}}});
  const failed=await invoke(bad,{method:'POST',body:{a:{year:'丙寅'},b:{year:'丁卯'}}});
  assert.equal(failed.statusCode,503);assert.equal(failed.body.refunded,true);assert.equal(state.refunds,1);assert.equal(state.balance,4);
});

test('双人 AI SQL 缓存与失败冲正均限制为 service_role',()=>{
  const sql=fs.readFileSync(path.join(ROOT,'sql/secure-credits.sql'),'utf8');
  assert.match(sql,/create table if not exists public\.ai_dual_readings/i);
  assert.match(sql,/reason='ai-dual-reading' and delta=-4/);
  assert.match(sql,/revoke all on function public\.api_refund_ai_usage[\s\S]*grant execute on function public\.api_refund_ai_usage[^\n]*service_role/i);
});
