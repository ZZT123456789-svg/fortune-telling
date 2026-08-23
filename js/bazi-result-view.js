/** 参考传统排盘应用的信息顺序绘制可交互命盘；不参与四柱计算。 */
var BaziResultView = (function() {
  'use strict';
  var states={};
  var ELEMENT={甲:'wood',乙:'wood',寅:'wood',卯:'wood',丙:'fire',丁:'fire',巳:'fire',午:'fire',戊:'earth',己:'earth',辰:'earth',戌:'earth',丑:'earth',未:'earth',庚:'metal',辛:'metal',申:'metal',酉:'metal',壬:'water',癸:'water',子:'water',亥:'water'};
  var JIE=['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'];
  var NAYIN60=['海中金','海中金','炉中火','炉中火','大林木','大林木','路旁土','路旁土','剑锋金','剑锋金','山头火','山头火','涧下水','涧下水','城头土','城头土','白蜡金','白蜡金','杨柳木','杨柳木','泉中水','泉中水','屋上土','屋上土','霹雳火','霹雳火','松柏木','松柏木','长流水','长流水','砂中金','砂中金','山下火','山下火','平地木','平地木','壁上土','壁上土','金箔金','金箔金','覆灯火','覆灯火','天河水','天河水','大驿土','大驿土','钗钏金','钗钏金','桑柘木','桑柘木','大溪水','大溪水','沙中土','沙中土','天上火','天上火','石榴木','石榴木','大海水','大海水'];
  var GAN='甲乙丙丁戊己庚辛壬癸', ZHI='子丑寅卯辰巳午未申酉戌亥';
  var STAGES=['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
  var STAGE_START={甲:'亥',乙:'午',丙:'寅',丁:'酉',戊:'寅',己:'酉',庚:'巳',辛:'子',壬:'申',癸:'卯'};

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function cls(c){return 'wx-'+(ELEMENT[c]||'neutral');}
  function gz(p){return p&&p.gan&&p.zhi?p.gan+p.zhi:'—';}
  function nayin(p){var gi=GAN.indexOf(p.gan),zi=ZHI.indexOf(p.zhi);if(gi<0||zi<0)return '—';for(var i=0;i<60;i++)if(i%10===gi&&i%12===zi)return NAYIN60[i];return '—';}
  function stage(gan,zhi){var start=ZHI.indexOf(STAGE_START[gan]),at=ZHI.indexOf(zhi);if(start<0||at<0)return '—';var forward='甲丙戊庚壬'.indexOf(gan)>=0;var index=forward?(at-start+12)%12:(start-at+12)%12;return STAGES[index];}
  function hidden(r,zhi){var list=(typeof BaziClassics!=='undefined'&&BaziClassics._zhiHidden)?BaziClassics._zhiHidden(zhi):[];return list.map(function(g,i){return {gan:g,god:BaziModule._getShiShen(r.dayMaster,g),layer:['本气','中气','余气'][i]||'余气'};});}
  function pillar(ganzhi){return {gan:String(ganzhi||'').charAt(0),zhi:String(ganzhi||'').charAt(1)};}
  function detailsAt(y,m,d){try{var v=DaoCalendar.baziDetails(y,m,d,12,0,'late-zi');return {day:pillar(v.dayPillar.ganZhi),month:pillar(v.monthPillar.ganZhi)};}catch(_){return {day:{},month:{}};}}
  function months(year){
    var exact=(DaoCalendar.jieQiDates&&DaoCalendar.jieQiDates(year))||[];
    return exact.map(function(item,i){
      var info=detailsAt(item.year,item.month,item.day);
      return {name:JIE[i]||item.name,date:item.month+'/'+item.day,ganZhi:gz(info.month),gan:info.month.gan,zhi:info.month.zhi};
    });
  }
  function currentIndex(items,key,value){for(var i=0;i<items.length;i++)if(items[i][key]===value)return i;return 0;}
  function init(r,scope){
    var now=new Date(),year=now.getFullYear(),dayunIndex=0;
    for(var i=0;i<r.yun.daYun.length;i++)if(year>=r.yun.daYun[i].startYear&&year<=r.yun.daYun[i].endYear){dayunIndex=i;break;}
    var years=r.yun.daYun[dayunIndex].years||[];
    var yearIndex=currentIndex(years,'year',year);
    var monthIndex=now.getMonth()===0?11:Math.max(0,Math.min(10,now.getMonth()-1));
    states[scope]={r:r,scope:scope,dayunIndex:dayunIndex,yearIndex:yearIndex,monthIndex:monthIndex};
    return states[scope];
  }
  function flow(state){
    var dy=state.r.yun.daYun[state.dayunIndex]||state.r.yun.daYun[0];
    var years=dy.years||[];
    if(state.yearIndex>=years.length)state.yearIndex=0;
    var ly=years[state.yearIndex]||{year:new Date().getFullYear(),ganZhi:''};
    var ms=months(ly.year),lm=ms[state.monthIndex]||ms[0];
    var now=new Date(),today=detailsAt(now.getFullYear(),now.getMonth()+1,now.getDate()).day;
    return {dy:dy,years:years,ly:ly,months:ms,lm:lm,today:today};
  }
  function god(r,p,isDay){return isDay?'元'+(r.gender==='男'?'男':'女'):(p&&p.gan?BaziModule._getShiShen(r.dayMaster,p.gan):'—');}
  function stars(r,p,label){if(typeof BaziShenSha==='undefined')return [];return BaziShenSha.transit(r,p,label).map(function(x){return x.name;});}
  function ref(type,term,label){return typeof BaziClassicLink!=='undefined'?BaziClassicLink.trigger(type,term,label):esc(label||term);}
  function starCell(names){return names.length?names.map(function(x){return '<span>'+ref('shensha',x)+'</span>';}).join(''):'<span>—</span>';}
  function column(r,p,label,opt){
    opt=opt||{};var hs=hidden(r,p.zhi),ss=opt.stars||stars(r,p,label);
    var mainGod=god(r,p,opt.dayMaster);
    return '<div class="classic-col"><div class="classic-col-title">'+esc(label)+'</div><div class="classic-god">'+(opt.dayMaster?esc(mainGod):ref('ten-god',mainGod))+'</div><div class="classic-gan '+cls(p.gan)+'">'+esc(p.gan||'—')+'</div><div class="classic-zhi '+cls(p.zhi)+'">'+esc(p.zhi||'—')+'</div><div class="classic-hidden">'+(hs.length?hs.map(function(h){return '<span class="'+cls(h.gan)+'">'+h.gan+'<small>'+ref('ten-god',h.god)+'</small></span>';}).join(''):'—')+'</div><div class="classic-minor">'+esc(opt.diShi||stage(r.dayMaster,p.zhi))+'</div><div class="classic-minor">'+esc(opt.selfSit||stage(p.gan,p.zhi))+'</div><div class="classic-minor">'+esc(opt.xunKong||'—')+'</div><div class="classic-minor">'+esc(opt.naYin||nayin(p))+'</div><div class="classic-stars">'+starCell(ss)+'</div></div>';
  }
  function interaction(r,prefix,p){
    if(!p||!p.gan)return '无';var stems=[r.yearP.gan,r.monthP.gan,r.dayP.gan,r.hourP.gan],branches=[r.yearP.zhi,r.monthP.zhi,r.dayP.zhi,r.hourP.zhi],out=[];
    var combine={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'},clash={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'},six={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'},harm={子:'未',未:'子',丑:'午',午:'丑',寅:'巳',巳:'寅',卯:'辰',辰:'卯',申:'亥',亥:'申',酉:'戌',戌:'酉'};
    stems.forEach(function(g){if(combine[p.gan]===g)out.push(prefix+'天干：'+p.gan+g+'相合');});
    branches.forEach(function(z){if(clash[p.zhi]===z)out.push(prefix+'地支：'+p.zhi+z+'相冲');if(six[p.zhi]===z)out.push(prefix+'地支：'+p.zhi+z+'六合');if(harm[p.zhi]===z)out.push(prefix+'地支：'+p.zhi+z+'相害');});
    return out.length?out.join('｜'):'无明显合冲刑害';
  }
  function starSection(title,p,items){return '<section class="classic-section"><h3>'+title+'</h3><div class="classic-star-line"><b>'+esc(gz(p))+'</b>'+starCell(items)+'</div></section>';}
  function timeline(scope,type,items,selected,renderer){return '<div class="classic-timeline '+type+'">'+items.map(function(item,i){return '<button type="button" class="'+(i===selected?'selected':'')+'" onclick="BaziResultView.select(\''+scope+'\',\''+type+'\','+i+')">'+renderer(item,i)+'</button>';}).join('')+'</div>';}

  function sheet(state){
    var r=state.r,f=flow(state),p=r.professional,base=[r.yearP,r.monthP,r.dayP,r.hourP],today=f.today,ly=pillar(f.ly.ganZhi),dy=pillar(f.dy.ganZhi);
    var originalStars=(typeof BaziShenSha!=='undefined'?BaziShenSha.detect(r.dayMaster,r.yearP.zhi,r.monthP.zhi,base):[]);
    var byPos={年柱:[],月柱:[],日柱:[],时柱:[]};originalStars.forEach(function(x){(byPos[x.position]||(byPos[x.position]=[])).push(x.name);});
    var dateLabel=(new Date()).toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'});
    var cols=[
      column(r,today,'日期',{stars:stars(r,today,'日期'),naYin:nayin(today)}),
      column(r,ly,'流年',{stars:stars(r,ly,'流年'),xunKong:f.ly.xunKong}),
      column(r,dy,'大运',{stars:stars(r,dy,'大运'),xunKong:f.dy.xunKong}),
      column(r,base[0],'年柱',{stars:byPos.年柱,diShi:p.pillars[0].diShi,xunKong:p.pillars[0].xunKong,naYin:r.engineDetails.naYin&&r.engineDetails.naYin[0]}),
      column(r,base[1],'月柱',{stars:byPos.月柱,diShi:p.pillars[1].diShi,xunKong:p.pillars[1].xunKong,naYin:r.engineDetails.naYin&&r.engineDetails.naYin[1]}),
      column(r,base[2],'日柱',{dayMaster:true,stars:byPos.日柱,diShi:p.pillars[2].diShi,xunKong:p.pillars[2].xunKong,naYin:r.engineDetails.naYin&&r.engineDetails.naYin[2]}),
      column(r,base[3],'时柱',{stars:byPos.时柱,diShi:p.pillars[3].diShi,xunKong:p.pillars[3].xunKong,naYin:r.engineDetails.naYin&&r.engineDetails.naYin[3]})
    ].join('');
    var labels='<div class="classic-row-labels"><span></span><span>主星</span><span>天干</span><span>地支</span><span>藏干</span><span>星运</span><span>自坐</span><span>空亡</span><span>纳音</span><span>神煞</span></div>';
    var dyItems=r.yun.daYun, dyLine=timeline(state.scope,'dayun',dyItems,state.dayunIndex,function(x){return '<small>'+x.startYear+'</small><b>'+x.startAge+'岁</b><strong>'+x.gan+'<em>'+BaziModule._getShiShen(r.dayMaster,x.gan)+'</em><br>'+x.zhi+'</strong>';});
    var yearLine=timeline(state.scope,'year',f.years,state.yearIndex,function(x){var pp=pillar(x.ganZhi);return '<small>'+x.year+'</small><strong>'+pp.gan+'<em>'+BaziModule._getShiShen(r.dayMaster,pp.gan)+'</em><br>'+pp.zhi+'</strong>';});
    var monthLine=timeline(state.scope,'month',f.months,state.monthIndex,function(x){return '<small>'+x.name+'<br>'+x.date+'</small><strong>'+x.gan+'<em>'+BaziModule._getShiShen(r.dayMaster,x.gan)+'</em><br>'+x.zhi+'</strong>';});
    var originalRows=base.map(function(pp,i){var names=originalStars.filter(function(x){return x.position===['年柱','月柱','日柱','时柱'][i];}).map(function(x){return x.name;});return '<div class="classic-star-line"><b>'+gz(pp)+'</b>'+starCell(names)+'</div>';}).join('');
    var dyStars=stars(r,dy,'大运'),yearStars=stars(r,ly,'流年');
    return '<article class="classic-bazi-sheet" id="'+state.scope+'">'+
      '<header class="classic-sheet-head"><div><h2>'+esc(r.name)+' · 完整命盘</h2><p>'+esc(r.gender)+'　公历 '+r.solarDate.year+'-'+r.solarDate.month+'-'+r.solarDate.day+'　'+String(r.solarDate.hour).padStart(2,'0')+':'+String(r.solarDate.minute).padStart(2,'0')+'</p></div><span>当前 '+dateLabel+'</span></header>'+
      '<div class="classic-chart">'+labels+'<div class="classic-columns">'+cols+'</div></div>'+
      '<div class="classic-yun-start"><p><b>起运：</b>出生后'+r.yun.start.year+'年'+r.yun.start.month+'月'+r.yun.start.day+'天'+r.yun.start.hour+'小时起运</p><p><b>交运：</b>'+r.yun.startSolar.year+'年'+r.yun.startSolar.month+'月'+r.yun.startSolar.day+'日　'+(r.yun.forward?'顺排':'逆排')+'</p></div>'+
      '<section class="classic-section"><h3>大运</h3>'+dyLine+'</section><section class="classic-section"><h3>流年</h3>'+yearLine+'</section><section class="classic-section"><h3>流月</h3>'+monthLine+'</section>'+
      '<section class="classic-section classic-interactions"><h3>岁运与原局作用</h3><p><b>岁运天干：</b>'+esc(interaction(r,'岁运',ly))+'</p><p><b>大运作用：</b>'+esc(interaction(r,'大运',dy))+'</p><p><b>原局关系：</b>'+esc((p.relations||[]).map(function(x){return x.value;}).join('｜')||'无明显合冲刑害')+'</p></section>'+
      '<section class="classic-section"><h3>四柱神煞</h3>'+originalRows+'</section>'+starSection('大运神煞',dy,dyStars)+starSection('流年神煞',ly,yearStars)+
      '<section class="classic-section classic-structure"><h3>旺衰 · 格局 · 调候 · 喜用</h3>'+BaziProfessional.renderSummary(p)+'</section>'+
      (typeof BaziClassicLink!=='undefined'?BaziClassicLink.panel():'')+
    '</article>';
  }
  function render(r,scope){var state=init(r,scope);return sheet(state);}
  function select(scope,type,index){var state=states[scope];if(!state)return;if(type==='dayun'){state.dayunIndex=index;state.yearIndex=0;}else if(type==='year')state.yearIndex=index;else state.monthIndex=index;var node=document.getElementById(scope);if(node)node.outerHTML=sheet(state);}
  function chartPayload(r){return {name:r.name,gender:r.gender,year:gz(r.yearP),month:gz(r.monthP),day:gz(r.dayP),hour:gz(r.hourP),dayMaster:r.dayMaster,element:r.dmElement,professional:r.professional,solarDate:r.solarDate};}
  return {render:render,select:select,chartPayload:chartPayload,_states:states};
})();
