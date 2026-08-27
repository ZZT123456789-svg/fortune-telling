/**
 * 道问 · 扩展术数工具
 * 奇门遁甲 / 玄空风水 / 独立星盘 / 太乙神数
 *
 * 四个模块的结果均在服务端确认扣除 1 次后生成。传统术数内容仅作文化体验。
 */
(function() {
  'use strict';

  var loShuCells = [4,9,2,3,5,7,8,1,6];
  var palaceNames = {1:'坎一宫',2:'坤二宫',3:'震三宫',4:'巽四宫',5:'中五宫',6:'乾六宫',7:'兑七宫',8:'艮八宫',9:'离九宫'};

  var AdvancedTools = {
    escape: function(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
      });
    },
    mod: function(value, base) { return ((value % base) + base) % base; },
    number: function(id, fallback) {
      var el = document.getElementById(id);
      var n = Number(el && el.value);
      return Number.isFinite(n) ? n : fallback;
    },
    value: function(id) {
      var el = document.getElementById(id);
      return el ? String(el.value || '').trim() : '';
    },
    open: function(id) {
      var overlay = document.getElementById(id);
      if (overlay) overlay.classList.add('active');
    },
    close: function(id) {
      var overlay = document.getElementById(id);
      if (overlay) overlay.classList.remove('active');
    },
    setNow: function(dateId, timeId) {
      var now = new Date();
      var pad = function(n) { return String(n).padStart(2, '0'); };
      var date = document.getElementById(dateId);
      var time = document.getElementById(timeId);
      if (date) date.value = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
      if (time) time.value = pad(now.getHours()) + ':' + pad(now.getMinutes());
    },
    dateParts: function(dateId, timeId) {
      var dateText = this.value(dateId);
      var timeText = this.value(timeId) || '12:00';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) throw new Error('请选择完整日期');
      var dp = dateText.split('-').map(Number);
      var tp = timeText.split(':').map(Number);
      var date = new Date(dp[0], dp[1] - 1, dp[2], tp[0] || 0, tp[1] || 0, 0, 0);
      if (date.getFullYear() !== dp[0] || date.getMonth() !== dp[1] - 1 || date.getDate() !== dp[2]) throw new Error('日期不存在');
      return {year:dp[0],month:dp[1],day:dp[2],hour:tp[0] || 0,minute:tp[1] || 0,date:date,dateText:dateText,timeText:timeText};
    },
    requestChart: async function(system, input, button) {
      var original = button ? button.textContent : '';
      if (button) { button.disabled = true; button.textContent = '正在排盘并确认次数…'; }
      try {
        var requestId = system + ':' + Date.now() + ':' + Math.random().toString(36).slice(2, 10);
        var response = await fetch('/api/divination-chart', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          credentials: 'same-origin',
          body: JSON.stringify({system:system,input:input,requestId:requestId})
        });
        var data = await response.json().catch(function(){ return {}; });
        if (!response.ok || data.success !== true) {
          var error = new Error(data.error || '排盘服务暂不可用');
          error.status = response.status;
          error.data = data;
          throw error;
        }
        if (window.Paywall && typeof Paywall._setBalance === 'function' && data.balance != null) Paywall._setBalance(data.balance);
        return data;
      } catch (err) {
        if (err && (err.status === 402 || (err.data && err.data.code === 'INSUFFICIENT')) && window.Paywall && typeof Paywall.openShop === 'function') Paywall.openShop();
        throw err;
      } finally {
        if (button) { button.disabled = false; button.textContent = original; }
      }
    },
    showError: function(id, err) {
      var el = document.getElementById(id);
      if (!el) return;
      el.style.display = 'block';
      el.innerHTML = '<div class="adt-error">' + this.escape(err && err.message ? err.message : '生成失败，请稍后重试') + '</div>';
    },
    resultActions: function(contextId) {
      return '<div class="adt-actions"><button class="btn-primary" type="button" onclick="AIChat.openWithContext(\'' + contextId + '\')">问 AI 深度解读</button><span>本次排盘已扣 1 次；AI 对话按现有规则另行计费</span></div>';
    },
    palaceGrid: function(items, extraClass) {
      var self = this;
      return '<div class="adt-nine-grid ' + (extraClass || '') + '">' + loShuCells.map(function(n) {
        var item = items[n] || {};
        return '<section class="adt-palace p' + n + '"><header><b>' + self.escape(item.title || palaceNames[n]) + '</b><span>' + self.escape(item.badge || String(n)) + '</span></header>' + (item.html || '') + '</section>';
      }).join('') + '</div>';
    },
    inject: function() {
      if (document.getElementById('advancedDivinationStyles')) return;
      document.body.insertAdjacentHTML('beforeend', this.templates());
      var style = document.createElement('style');
      style.id = 'advancedDivinationStyles';
      style.textContent = this.styles();
      document.head.appendChild(style);
      QimenModule.useNow();
      TaiyiModule.useNow();
      AstroChartModule.useNow();
    },
    templates: function() {
      return [
        '<div class="tool-overlay" id="qimenOverlay"><div class="tool-modal adt-modal"><button class="modal-close" onclick="QimenModule.close()">✕</button><h2 class="modal-title"><span class="dao-title-mark">奇</span>奇门遁甲</h2><p class="modal-desc">自选日期时间起局，展示阴阳遁、局数、九宫、八门、九星、八神及值符值使</p><div class="form-row"><div class="form-group"><label>起局日期</label><input type="date" id="qimenDate"></div><div class="form-group"><label>起局时间</label><input type="time" id="qimenTime"></div><div class="form-group"><label>所问事项</label><input type="text" id="qimenQuestion" placeholder="事业、关系、出行等"></div></div><button class="btn-primary" id="qimenRun" onclick="QimenModule.calculate()">扣 1 次并起局</button><button class="btn-secondary" onclick="QimenModule.useNow()">使用当前时间</button><div class="result-container adt-result" id="qimenResult" style="display:none"></div></div></div>',
        '<div class="tool-overlay" id="fengshuiOverlay"><div class="tool-modal adt-modal"><button class="modal-close" onclick="FengshuiModule.close()">✕</button><h2 class="modal-title"><span class="dao-title-mark">宅</span>玄空风水</h2><p class="modal-desc">以建成年份、房屋朝向和分析年份生成运盘与流年飞星基础盘</p><div class="form-row"><div class="form-group"><label>建成/大修年份</label><input type="number" id="fsBuildYear" min="1864" max="2100" value="2024"></div><div class="form-group"><label>房屋朝向（度）</label><input type="number" id="fsFacing" min="0" max="359.9" step="0.1" value="180"></div><div class="form-group"><label>分析年份</label><input type="number" id="fsYear" min="1900" max="2100" value="2026"></div></div><button class="btn-primary" id="fsRun" onclick="FengshuiModule.calculate()">扣 1 次并排盘</button><div class="result-container adt-result" id="fengshuiResult" style="display:none"></div></div></div>',
        '<div class="tool-overlay" id="astroOverlay"><div class="tool-modal adt-modal"><button class="modal-close" onclick="AstroChartModule.close()">✕</button><h2 class="modal-title"><span class="dao-title-mark">辰</span>独立出生星盘</h2><p class="modal-desc">开源高精度星历与 Placidus 宫位制：十大星体、四轴、十二宫、逆行和主要相位</p><div class="form-row"><div class="form-group"><label>出生日期</label><input type="date" id="astroDate"></div><div class="form-group"><label>出生时间</label><input type="time" id="astroTime"></div><div class="form-group"><label>时区（UTC+）</label><input type="number" id="astroTimezone" min="-12" max="14" step="0.5" value="8"></div></div><div class="form-row"><div class="form-group"><label>出生地经度（东正西负）</label><input type="number" id="astroLon" min="-180" max="180" step="0.01" value="116.40"></div><div class="form-group"><label>出生地纬度（北正南负）</label><input type="number" id="astroLat" min="-66" max="66" step="0.01" value="39.90"></div></div><button class="btn-primary" id="astroRun" onclick="AstroChartModule.calculate()">扣 1 次并生成星盘</button><button class="btn-secondary" onclick="AstroChartModule.useNow()">填入当前时间</button><div class="result-container adt-result" id="astroResult" style="display:none"></div></div></div>',
        '<div class="tool-overlay" id="taiyiOverlay"><div class="tool-modal adt-modal"><button class="modal-close" onclick="TaiyiModule.close()">✕</button><h2 class="modal-title"><span class="dao-title-mark">太</span>太乙神数</h2><p class="modal-desc">开源太乙引擎：年、月、日、时四计七十二局，含十六神与主客定算</p><div class="form-row"><div class="form-group"><label>推演日期</label><input type="date" id="taiyiDate"></div><div class="form-group"><label>推演时间</label><input type="time" id="taiyiTime"></div><div class="form-group"><label>计式</label><select id="taiyiScope"><option value="hour">时计</option><option value="day">日计</option><option value="month">月计</option><option value="year">年计</option></select></div><div class="form-group"><label>所问事项</label><input type="text" id="taiyiQuestion" placeholder="趋势、计划、时机等"></div></div><button class="btn-primary" id="taiyiRun" onclick="TaiyiModule.calculate()">扣 1 次并排局</button><button class="btn-secondary" onclick="TaiyiModule.useNow()">使用当前时间</button><div class="result-container adt-result" id="taiyiResult" style="display:none"></div></div></div>'
      ].join('');
    },
    styles: function() {
      return '.adt-modal{max-width:1060px;width:min(96vw,1060px)}.adt-result{margin-top:1rem}.adt-error{padding:1rem;border:1px solid rgba(181,65,48,.45);border-radius:10px;background:rgba(181,65,48,.1);color:#d99b8c;text-align:center}.adt-summary{display:flex;flex-wrap:wrap;gap:.45rem;margin:.8rem 0}.adt-summary span{padding:.38rem .65rem;border:1px solid rgba(202,167,98,.28);border-radius:999px;background:rgba(202,167,98,.07);color:var(--text-primary);font-size:.78rem}.adt-summary b{color:var(--gold)}.adt-nine-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;padding:1px;background:rgba(202,167,98,.38);border:1px solid rgba(202,167,98,.38);border-radius:12px;overflow:hidden}.adt-palace{min-height:158px;padding:.7rem;background:rgba(12,13,12,.96)}.adt-palace header{display:flex;justify-content:space-between;gap:.4rem;padding-bottom:.35rem;margin-bottom:.45rem;border-bottom:1px solid rgba(202,167,98,.2)}.adt-palace header b{font-family:KaiTi,STKaiti,serif;color:#f1ddb0}.adt-palace header span{color:#bda36b;font-size:.7rem}.adt-palace p{margin:.22rem 0;color:#d9d1c2;font-size:.76rem;line-height:1.45}.adt-palace p b{color:#fff}.adt-palace .adt-star{font-size:1rem;color:#d6b567}.adt-palace .adt-door{color:#85bea7}.adt-palace .adt-god{color:#9fa9dc}.adt-actions{display:flex;align-items:center;justify-content:center;gap:.75rem;flex-wrap:wrap;margin:1rem 0}.adt-actions button{width:auto}.adt-actions span{font-size:.72rem;color:var(--text-muted)}.adt-note{padding:.7rem .8rem;margin:.8rem 0;border-left:3px solid #a88643;background:rgba(168,134,67,.08);color:var(--text-secondary);font-size:.76rem;line-height:1.55}.astro-layout{display:grid;grid-template-columns:minmax(280px,430px) 1fr;gap:1rem;align-items:start}.astro-wheel{position:relative;aspect-ratio:1;border:2px solid #b9954c;border-radius:50%;background:radial-gradient(circle,rgba(18,19,18,.98) 0 34%,rgba(39,34,26,.96) 35% 36%,rgba(10,11,10,.98) 37% 72%,rgba(185,149,76,.22) 73% 74%,rgba(9,10,9,.98) 75%);overflow:hidden}.astro-wheel svg{position:absolute;inset:0;width:100%;height:100%}.astro-wheel line{stroke:rgba(220,191,125,.32);stroke-width:1}.astro-planet{position:absolute;left:50%;top:50%;width:2rem;height:2rem;margin:-1rem;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#16130d;background:#e7c873;border:1px solid #fff1bc;font-weight:800;font-size:.68rem;box-shadow:0 2px 10px rgba(0,0,0,.5)}.astro-asc{background:#9d543f;color:#fff}.astro-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem}.astro-item{padding:.55rem .65rem;border:1px solid rgba(202,167,98,.2);border-radius:9px;background:rgba(202,167,98,.05);font-size:.76rem}.astro-item b{color:#e4c57f}.astro-aspects{margin-top:.7rem}.astro-aspects span{display:inline-block;margin:.2rem;padding:.28rem .45rem;border-radius:6px;background:rgba(115,135,167,.15);color:#c5cede;font-size:.7rem}@media(max-width:760px){.adt-modal{width:100vw;max-width:none}.adt-nine-grid{grid-template-columns:repeat(2,minmax(0,1fr));background:transparent;border:0;gap:.55rem}.adt-palace{min-height:132px;border:1px solid rgba(202,167,98,.25);border-radius:10px}.adt-palace.p5{grid-column:1/-1}.astro-layout{grid-template-columns:1fr}.astro-list{grid-template-columns:1fr}.astro-wheel{max-width:390px;margin:auto}}';
    }
  };

  var QimenModule = window.QimenModule = {
    open: function() { AdvancedTools.open('qimenOverlay'); },
    close: function() { AdvancedTools.close('qimenOverlay'); },
    useNow: function() { AdvancedTools.setNow('qimenDate','qimenTime'); },
    calculate: async function() {
      var result = document.getElementById('qimenResult');
      try {
        var parts = AdvancedTools.dateParts('qimenDate','qimenTime');
        var response = await AdvancedTools.requestChart('qimen', {date:parts.dateText,time:parts.timeText,timezone:8}, document.getElementById('qimenRun'));
        var chart = response.chart;
        var cells = {};
        (chart.jiuGongGe || []).forEach(function(palace) {
          var star = palace.tianPan.star || palace.tianPan.companionStar || '中宫';
          var heavenStem = palace.tianPan.stem || palace.tianPan.companionStem || '—';
          cells[palace.gong] = {
            title: palace.name,
            badge: palace.direction + ' · ' + palace.element,
            html: '<p class="adt-star"><b>' + AdvancedTools.escape(star) + '</b>　天盘 ' + AdvancedTools.escape(heavenStem) + '</p><p>地盘 ' + AdvancedTools.escape(palace.diPan.stem || '—') + '</p><p class="adt-door">' + AdvancedTools.escape(palace.renPan.door || '中门') + '</p><p class="adt-god">' + AdvancedTools.escape(palace.shenPan.god || '中宫') + '</p>'
          };
        });
        var tags = (chart.patternTags || []).slice(0, 12).map(function(tag){ return '<span>' + AdvancedTools.escape(tag) + '</span>'; }).join('');
        var question = AdvancedTools.value('qimenQuestion') || '综合事项';
        result.style.display = 'block';
        result.innerHTML = '<div class="adt-summary"><span><b>' + (chart.isYangDun ? '阳遁' : '阴遁') + chart.juShu + '局</b></span><span>' + AdvancedTools.escape(chart.timeInfo.solarTerm || chart.timeInfo.juTerm || '') + '</span><span>' + AdvancedTools.escape(chart.ganzhi.day) + '日 · ' + AdvancedTools.escape(chart.ganzhi.hour) + '时</span><span>值符 ' + AdvancedTools.escape(chart.zhiFu) + '</span><span>值使 ' + AdvancedTools.escape(chart.zhiShi) + '</span><span>问事：' + AdvancedTools.escape(question) + '</span></div>' + AdvancedTools.palaceGrid(cells,'qimen-grid') + (tags ? '<div class="astro-aspects">' + tags + '</div>' : '') + '<div class="adt-note">算法：mingyu-core 0.1.32（MIT），时家转盘奇门、拆补法；包含天地人神四盘、值符值使、空亡、驿马和格局识别。</div>' + AdvancedTools.resultActions('qimenResult');
      } catch (e) { AdvancedTools.showError('qimenResult', e); }
    }
  };

  var FengshuiModule = window.FengshuiModule = {
    open: function() { AdvancedTools.open('fengshuiOverlay'); },
    close: function() { AdvancedTools.close('fengshuiOverlay'); },
    calculate: async function() {
      var result = document.getElementById('fengshuiResult');
      try {
        var buildYear = Math.floor(AdvancedTools.number('fsBuildYear', NaN));
        var facing = AdvancedTools.number('fsFacing', NaN);
        var year = Math.floor(AdvancedTools.number('fsYear', NaN));
        var response = await AdvancedTools.requestChart('fengshui', {buildYear:buildYear,facingDegree:facing,analysisYear:year}, document.getElementById('fsRun'));
        var chart = response.chart;
        var cells = {};
        (chart.palaces || []).forEach(function(palace) {
          var annual = chart.annualPlate && chart.annualPlate[palace.gong - 1];
          cells[palace.gong] = {title:palace.name || palace.direction,badge:palace.direction,html:'<p class="adt-star"><b>运星 ' + palace.yunStar + '</b>　流年 ' + annual + '</p><p>山星 ' + palace.shanStar + '　向星 ' + palace.xiangStar + '</p>'};
        });
        var warning = chart.measurement && chart.measurement.warnings ? chart.measurement.warnings.join('；') : '';
        result.style.display = 'block';
        result.innerHTML = '<div class="adt-summary"><span><b>' + AdvancedTools.escape(chart.period.label) + '</b></span><span>坐' + AdvancedTools.escape(chart.sitMountain) + '朝' + AdvancedTools.escape(chart.facingMountain) + '</span><span>' + year + '年入中星：' + chart.annualCenter + '</span><span>下卦 · 二十四山</span></div>' + AdvancedTools.palaceGrid(cells,'fengshui-grid') + (warning ? '<div class="adt-error">' + AdvancedTools.escape(warning) + '</div>' : '') + '<div class="adt-note">算法：mingyu-core 0.1.32 + @soul-atelier/xuankong 0.2.1（MIT）。已使用三元九运、二十四山、运盘、山盘和向盘；现场形峦仍需平面图与罗盘实测。</div>' + AdvancedTools.resultActions('fengshuiResult');
      } catch (e) { AdvancedTools.showError('fengshuiResult', e); }
    }
  };

  var AstroChartModule = window.AstroChartModule = {
    glyphs: {太阳:'日',月亮:'月',水星:'水',金星:'金',火星:'火',木星:'木',土星:'土',天王星:'天',海王星:'海',冥王星:'冥',上升点:'升'},
    open: function() { AdvancedTools.open('astroOverlay'); },
    close: function() { AdvancedTools.close('astroOverlay'); },
    useNow: function() { AdvancedTools.setNow('astroDate','astroTime'); },
    rad: function(v) { return v * Math.PI / 180; },
    wheel: function(chart) {
      var asc = (chart.angles || []).find(function(point){ return /上升|Asc/i.test(point.name + point.label); }) || (chart.angles || [])[0] || {longitude:0};
      var lines = '';
      for (var i=0;i<12;i++) { var angle=i*30*Math.PI/180; lines += '<line x1="210" y1="210" x2="' + (210+205*Math.sin(angle)).toFixed(1) + '" y2="' + (210-205*Math.cos(angle)).toFixed(1) + '"></line>'; }
      var points = (chart.planets || []).concat(chart.angles || []);
      var markers = points.map(function(point,index){var relative=AdvancedTools.mod(point.longitude-asc.longitude,360),radius=(chart.angles||[]).indexOf(point)>=0?168:120+(index%3)*19,x=50+radius/4.2*Math.sin(AstroChartModule.rad(relative)),y=50-radius/4.2*Math.cos(AstroChartModule.rad(relative)),name=point.label||point.name;return '<span class="astro-planet '+(/上升|Asc/i.test(name)?'astro-asc':'')+'" title="'+AdvancedTools.escape(name)+'" style="left:'+x+'%;top:'+y+'%">'+AdvancedTools.escape(AstroChartModule.glyphs[name]||name.charAt(0))+'</span>';}).join('');
      return '<div class="astro-wheel"><svg viewBox="0 0 420 420" aria-hidden="true">' + lines + '</svg>' + markers + '</div>';
    },
    calculate: async function() {
      var result = document.getElementById('astroResult');
      try {
        var parts=AdvancedTools.dateParts('astroDate','astroTime'),timezone=AdvancedTools.number('astroTimezone',8),longitude=AdvancedTools.number('astroLon',NaN),latitude=AdvancedTools.number('astroLat',NaN);
        var response=await AdvancedTools.requestChart('astrology',{date:parts.dateText,time:parts.timeText,timezone:timezone,longitude:longitude,latitude:latitude},document.getElementById('astroRun'));
        var chart=response.chart;
        var points=(chart.planets||[]).concat(chart.angles||[]);
        var list=points.map(function(point){var name=point.label||point.name;return '<div class="astro-item"><b>'+AdvancedTools.escape(name)+'</b><br>'+AdvancedTools.escape(point.formatted||((point.sign||'')+' '+point.degree+'° · 第'+point.house+'宫'))+(point.retrograde?' · 逆行':'')+'</div>';}).join('');
        var aspects=(chart.aspects||[]).slice(0,24).map(function(item){return '<span>'+AdvancedTools.escape(item.body1+' '+item.type+' '+item.body2+'（容许度 '+Number(item.orb).toFixed(1)+'°）')+'</span>';}).join('');
        var asc=points.find(function(point){return /上升|Asc/i.test((point.name||'')+(point.label||''));});
        result.style.display='block';
        result.innerHTML='<div class="adt-summary"><span><b>热带黄道 · Placidus</b></span><span>十大星体与四轴</span>'+(asc?'<span>上升 '+AdvancedTools.escape(asc.formatted)+'</span>':'')+'<span>经度 '+longitude.toFixed(2)+'° · 纬度 '+latitude.toFixed(2)+'°</span></div><div class="astro-layout">'+this.wheel(chart)+'<div><div class="astro-list">'+list+'</div><div class="astro-aspects">'+(aspects||'<span>主要相位较少</span>')+'</div></div></div><div class="adt-note">算法：mingyu-core 0.1.32 + Celestine 0.2.1 + Astronomy Engine 2.1.19（MIT），提供星历、宫头、逆行和相位计算。</div>'+AdvancedTools.resultActions('astroResult');
      } catch(e) { AdvancedTools.showError('astroResult',e); }
    }
  };

  var TaiyiModule = window.TaiyiModule = {
    open:function(){AdvancedTools.open('taiyiOverlay');},
    close:function(){AdvancedTools.close('taiyiOverlay');},
    useNow:function(){AdvancedTools.setNow('taiyiDate','taiyiTime');},
    calculate:async function(){
      var result=document.getElementById('taiyiResult');
      try {
        var parts=AdvancedTools.dateParts('taiyiDate','taiyiTime');
        var scope=AdvancedTools.value('taiyiScope')||'hour';
        var response=await AdvancedTools.requestChart('taiyi',{date:parts.dateText,time:parts.timeText,timezone:8,scope:scope},document.getElementById('taiyiRun'));
        var chart=response.chart,question=AdvancedTools.value('taiyiQuestion')||'综合趋势';
        var taiyiNames={1:'乾宫',2:'午宫',3:'艮宫',4:'卯宫',5:'中宫',6:'酉宫',7:'坤宫',8:'子宫',9:'巽宫'},cells={};
        loShuCells.forEach(function(n){var labels=[];if(n===chart.taiyiPalace)labels.push('太乙');if(n===chart.wenChangPalace)labels.push('文昌');if(n===chart.shiJiPalace)labels.push('始击');if(n===chart.jiShenPalace)labels.push('计神');if(n===chart.lordGeneral)labels.push('主大将');if(n===chart.guestGeneral)labels.push('客大将');cells[n]={title:taiyiNames[n]||palaceNames[n],badge:n===chart.taiyiPalace?'太乙':'',html:'<p class="adt-star"><b>'+(labels.join(' · ')||'守宫')+'</b></p><p>'+(n===5?'中宫统摄':'主客定算参看')+'</p>'};});
        var gods=(chart.sixteenGods||[]).map(function(item){return '<span>'+AdvancedTools.escape(item.branch+' · '+item.god)+'</span>';}).join('');
        var judgments=(chart.judgments||[]).map(function(item){return '<p>'+AdvancedTools.escape(item)+'</p>';}).join('');
        result.style.display='block';
        result.innerHTML='<div class="adt-summary"><span><b>'+AdvancedTools.escape(chart.yinYang)+'第'+chart.bureau+'局</b></span><span>'+AdvancedTools.escape(chart.accumulatedLabel)+' '+chart.accumulatedValue+'</span><span>'+AdvancedTools.escape(chart.ganZhi)+'</span><span>太乙 '+AdvancedTools.escape(chart.taiyiPosition)+'</span><span>主算 '+chart.lordCount+' · 客算 '+chart.guestCount+'</span><span>问事：'+AdvancedTools.escape(question)+'</span></div>'+AdvancedTools.palaceGrid(cells,'taiyi-grid')+'<div class="astro-aspects">'+gods+'</div>'+(judgments?'<div class="adt-note">'+judgments+'</div>':'')+'<div class="adt-note">算法：mingyu-core 0.1.32（MIT）。已按所选计式输出七十二局、太乙、文昌、始击、计神、主客定算及十六神。</div>'+AdvancedTools.resultActions('taiyiResult');
      } catch(e) { AdvancedTools.showError('taiyiResult',e); }
    }
  };

  window.AdvancedTools = AdvancedTools;
  document.addEventListener('DOMContentLoaded', function(){ AdvancedTools.inject(); });
})();
