/**
 * 八字专业命盘结构化分析层。
 * 四柱、十神、十二长生、空亡和起运来自 lunar-javascript；
 * 藏干显示权重与旺衰分值属于本站透明的解释模型，不冒充唯一流派标准。
 */
var BaziProfessional = (function() {
  'use strict';

  var POSITIONS = ['年柱', '月柱', '日柱', '时柱'];
  var STEM_ELEMENT = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  var HIDDEN_WEIGHTS = {
    子:[100], 丑:[60,30,10], 寅:[60,30,10], 卯:[100], 辰:[60,30,10], 巳:[60,30,10],
    午:[70,30], 未:[60,30,10], 申:[60,30,10], 酉:[100], 戌:[60,30,10], 亥:[70,30]
  };
  var LAYERS = ['本气', '中气', '余气'];
  var BRANCH_TOTALS = [12, 22, 16, 12];
  var GROUPS = ['比劫', '食伤', '财星', '官杀', '印星'];
  var TEN_GOD_TEXT = {
    比肩:'同类、自主与执行；过旺时需留意竞争和固执。', 劫财:'协作、行动与资源争夺；有制时可化为开拓力。',
    食神:'表达、创造与稳定输出；重在持续积累。', 伤官:'突破、判断与批判意识；需兼顾规则和沟通。',
    正财:'稳定经营、责任与可持续收益。', 偏财:'机会、流动资源与外部连接。',
    正官:'秩序、责任和长期信誉。', 七杀:'压力、挑战与快速决断；需要制化。',
    正印:'学习、支持与系统吸收。', 偏印:'洞察、专门技能与非标准路径。',
    日主:'命主自身，不作为外部十神单独解读。'
  };

  function groupOf(tenGod) {
    if (tenGod === '比肩' || tenGod === '劫财' || tenGod === '日主') return '比劫';
    if (tenGod === '食神' || tenGod === '伤官') return '食伤';
    if (tenGod === '正财' || tenGod === '偏财') return '财星';
    if (tenGod === '正官' || tenGod === '七杀') return '官杀';
    if (tenGod === '正印' || tenGod === '偏印') return '印星';
    return '';
  }

  function pairKey(a, b) { return a < b ? a + b : b + a; }
  function includesAll(values, chars) { return chars.split('').every(function(c) { return values.indexOf(c) >= 0; }); }
  function confidence(score) {
    var gap = Math.abs(score - 50);
    return gap >= 18 ? '较高' : gap >= 9 ? '中等' : '需结合大运';
  }

  function buildRelations(branches, stems) {
    var relations = [];
    var pairRules = {
      六合:{'丑子':'土','亥寅':'木','卯戌':'火','辰酉':'金','巳申':'水','午未':'土'},
      六冲:{'午子':'','丑未':'','寅申':'','卯酉':'','戌辰':'','亥巳':''},
      六害:{'子未':'','丑午':'','寅巳':'','卯辰':'','亥申':'','戌酉':''},
      六破:{'子酉':'','丑辰':'','寅亥':'','卯午':'','巳申':'','戌未':''}
    };
    Object.keys(pairRules).forEach(function(type) {
      for (var i = 0; i < branches.length; i++) for (var j = i + 1; j < branches.length; j++) {
        var key = pairKey(branches[i], branches[j]);
        if (Object.prototype.hasOwnProperty.call(pairRules[type], key)) {
          var transform = pairRules[type][key];
          relations.push({type:type, positions:POSITIONS[i]+'·'+POSITIONS[j], value:branches[i]+branches[j]+type+(transform?'（化'+transform+'倾向）':'')});
        }
      }
    });
    var triples = {
      三合:{'申子辰':'水','亥卯未':'木','寅午戌':'火','巳酉丑':'金'},
      三会:{'亥子丑':'水','寅卯辰':'木','巳午未':'火','申酉戌':'金'}
    };
    Object.keys(triples).forEach(function(type) {
      Object.keys(triples[type]).forEach(function(chars) {
        if (includesAll(branches, chars)) relations.push({type:type, positions:'原局', value:chars+type+'（'+triples[type][chars]+'局）'});
      });
    });
    if (includesAll(branches, '寅巳申')) relations.push({type:'三刑',positions:'原局',value:'寅巳申恃势之刑'});
    if (includesAll(branches, '丑未戌')) relations.push({type:'三刑',positions:'原局',value:'丑未戌无恩之刑'});
    if (includesAll(branches, '子卯')) relations.push({type:'相刑',positions:'原局',value:'子卯无礼之刑'});
    ['辰','午','酉','亥'].forEach(function(zhi) {
      if (branches.filter(function(v){return v===zhi;}).length > 1) relations.push({type:'自刑',positions:'原局',value:zhi+zhi+'自刑'});
    });
    var stemCombines = {'甲己':'土','乙庚':'金','丙辛':'水','丁壬':'木','戊癸':'火'};
    for (var a = 0; a < stems.length; a++) for (var b = a + 1; b < stems.length; b++) {
      var stemKey = stems[a] + stems[b];
      var reverseKey = stems[b] + stems[a];
      var element = stemCombines[stemKey] || stemCombines[reverseKey];
      if (element) relations.push({type:'天干五合',positions:POSITIONS[a]+'·'+POSITIONS[b],value:stems[a]+stems[b]+'合'+element+'（是否化气需看月令与全局）'});
    }
    return relations;
  }

  function buildShenSha(dayStem, yearBranch, dayBranch, branches) {
    var result = [];
    var noble = {甲:'丑未',戊:'丑未',庚:'丑未',乙:'子申',己:'子申',丙:'亥酉',丁:'亥酉',壬:'卯巳',癸:'卯巳',辛:'午寅'};
    var wenChang = {甲:'巳',乙:'午',丙:'申',丁:'酉',戊:'申',己:'酉',庚:'亥',辛:'子',壬:'寅',癸:'卯'};
    function groupStar(base, map) {
      var groups = ['申子辰','寅午戌','亥卯未','巳酉丑'];
      for (var i=0;i<groups.length;i++) if (groups[i].indexOf(base)>=0) return map[i];
      return '';
    }
    var peach = groupStar(yearBranch, ['酉','卯','子','午']);
    var horse = groupStar(yearBranch, ['寅','申','巳','亥']);
    var canopy = groupStar(yearBranch, ['辰','戌','未','丑']);
    branches.forEach(function(zhi, index) {
      if ((noble[dayStem]||'').indexOf(zhi)>=0) result.push({name:'天乙贵人',position:POSITIONS[index],basis:'日干'+dayStem+'见'+zhi});
      if (wenChang[dayStem]===zhi) result.push({name:'文昌',position:POSITIONS[index],basis:'日干'+dayStem+'见'+zhi});
      if (peach===zhi) result.push({name:'桃花',position:POSITIONS[index],basis:'年支'+yearBranch+'所属三合局取'+zhi});
      if (horse===zhi) result.push({name:'驿马',position:POSITIONS[index],basis:'年支'+yearBranch+'所属三合局取'+zhi});
      if (canopy===zhi) result.push({name:'华盖',position:POSITIONS[index],basis:'年支'+yearBranch+'所属三合局取'+zhi});
    });
    return result;
  }

  function build(r) {
    var details = r.engineDetails;
    var pillars = [r.yearP, r.monthP, r.dayP, r.hourP];
    var visibleStems = pillars.map(function(p){return p.gan;});
    var branches = pillars.map(function(p){return p.zhi;});
    var groupWeights = {比劫:0,食伤:0,财星:0,官杀:0,印星:0};
    var tenGodLocations = {};
    var hidden = details.hiddenStems.map(function(item, pillarIndex) {
      var weights = HIDDEN_WEIGHTS[branches[pillarIndex]] || item.stems.map(function(){return Math.round(100/item.stems.length);});
      return item.stems.map(function(stem, index) {
        var tenGod = item.tenGods[index] || '';
        var layer = LAYERS[index] || '余气';
        var weight = weights[index] || 0;
        var isExposed = visibleStems.indexOf(stem) >= 0;
        var entry = {stem:stem, element:STEM_ELEMENT[stem], tenGod:tenGod, layer:layer, weight:weight, exposed:isExposed};
        var group = groupOf(tenGod);
        groupWeights[group] += BRANCH_TOTALS[pillarIndex] * weight / 100;
        if (!tenGodLocations[tenGod]) tenGodLocations[tenGod] = [];
        tenGodLocations[tenGod].push(POSITIONS[pillarIndex]+'藏干'+stem+'（'+layer+(isExposed?'、透干':'')+'）');
        return entry;
      });
    });
    details.stemTenGods.forEach(function(tenGod, index) {
      var normalized = tenGod === '日主' ? '比肩' : tenGod;
      var group = groupOf(normalized);
      groupWeights[group] += 10;
      if (!tenGodLocations[normalized]) tenGodLocations[normalized] = [];
      tenGodLocations[normalized].push(POSITIONS[index]+'天干'+visibleStems[index]+(index===2?'（日主）':'（透干）'));
    });
    var totalWeight = GROUPS.reduce(function(sum,key){return sum+groupWeights[key];},0) || 1;
    var distribution = GROUPS.map(function(key){return {name:key, weight:groupWeights[key], percent:Math.round(groupWeights[key]/totalWeight*100)};});

    var resource = {木:'水',火:'木',土:'火',金:'土',水:'金'}[r.dmElement];
    var output = {木:'火',火:'土',土:'金',金:'水',水:'木'}[r.dmElement];
    var wealth = {木:'土',火:'金',土:'水',金:'木',水:'火'}[r.dmElement];
    var officer = {木:'金',火:'水',土:'木',金:'火',水:'土'}[r.dmElement];
    var monthMain = hidden[1][0];
    var supportElements = [r.dmElement, resource];
    var orderSupport = supportElements.indexOf(monthMain.element)>=0;
    var rootPlaces = [];
    hidden.forEach(function(items,index){if(items.some(function(x){return x.element===r.dmElement;}))rootPlaces.push(POSITIONS[index]);});
    var terrainPlaces = [];
    hidden.forEach(function(items,index){if(items[0]&&supportElements.indexOf(items[0].element)>=0)terrainPlaces.push(POSITIONS[index]);});
    var momentumPlaces = [];
    visibleStems.forEach(function(stem,index){if(index!==2&&supportElements.indexOf(STEM_ELEMENT[stem])>=0)momentumPlaces.push(POSITIONS[index]);});
    var supportPercent = Math.round(((groupWeights.比劫||0)+(groupWeights.印星||0))/totalWeight*100);
    var strengthScore = Math.max(0, Math.min(100, supportPercent + (orderSupport?8:-5) + Math.min(6,rootPlaces.length*2) + Math.min(4,momentumPlaces.length)));
    var strengthLevel = strengthScore>=62?'身强':strengthScore>=53?'身偏强':strengthScore>=44?'中和':strengthScore>=35?'身偏弱':'身弱';
    var evidence = [
      '月令'+branches[1]+'本气为'+monthMain.stem+'（'+monthMain.tenGod+'），'+(orderSupport?'生扶日主，得令':'不直接生扶日主，失令或泄耗受制'),
      rootPlaces.length?'日主在'+rootPlaces.join('、')+'藏干见同类，通根':'四支藏干未见日主同类，通根不足',
      terrainPlaces.length?'生扶本气落在'+terrainPlaces.join('、')+'，得地程度可见':'地支本气少见印比，得地不足',
      momentumPlaces.length?'年/月/时干有'+momentumPlaces.join('、')+'生扶，得势':'年/月/时干少见印比，外援偏少',
      '透明权重模型中印比约占'+supportPercent+'%，最终旺衰分'+strengthScore+'/100'
    ];
    var counterEvidence = [];
    if (groupWeights.食伤>15) counterEvidence.push('食伤占比'+Math.round(groupWeights.食伤/totalWeight*100)+'%，形成泄身力量');
    if (groupWeights.财星>15) counterEvidence.push('财星占比'+Math.round(groupWeights.财星/totalWeight*100)+'%，形成耗身力量');
    if (groupWeights.官杀>15) counterEvidence.push('官杀占比'+Math.round(groupWeights.官杀/totalWeight*100)+'%，形成制身力量');
    if (!counterEvidence.length) counterEvidence.push('原局克泄耗力量未形成明显集中，仍需结合调候与大运验证');

    var favorable = strengthScore>=53 ? [output, wealth, officer] : strengthScore<44 ? [resource, r.dmElement] : [output, resource];
    var unfavorable = strengthScore>=53 ? [r.dmElement, resource] : strengthScore<44 ? [wealth, officer] : [];
    var monthGod = monthMain.tenGod;
    var patternNames = {正官:'正官格',七杀:'七杀格',正印:'正印格',偏印:'偏印格',食神:'食神格',伤官:'伤官格',正财:'正财格',偏财:'偏财格',比肩:'建禄格',劫财:'月刃格'};
    var pattern = {
      name:patternNames[monthGod]||('月令'+monthGod+'格'),
      basis:'以月支'+branches[1]+'本气'+monthMain.stem+'所对应的'+monthGod+'立格',
      supports:['月令本气权重'+monthMain.weight+'%','月支在四柱中采用最高基础权重'],
      counters: visibleStems.indexOf(monthMain.stem)>=0?['月令本气已透干，格局信号更明确']:['月令本气未透干，格局纯度需要结合中余气及大运']
    };
    var relations = buildRelations(branches, visibleStems);
    var shenSha = buildShenSha(r.dayMaster, r.yearP.zhi, r.dayP.zhi, branches);
    var pillarsData = pillars.map(function(p,index){return {label:POSITIONS[index],gan:p.gan,zhi:p.zhi,tenGod:details.stemTenGods[index],hidden:hidden[index],diShi:details.diShi[index],xunKong:details.xunKong[index]};});
    return {
      pillars:pillarsData,
      distribution:distribution,
      tenGodLocations:tenGodLocations,
      tenGodText:TEN_GOD_TEXT,
      strength:{level:strengthLevel,score:strengthScore,confidence:confidence(strengthScore),evidence:evidence,counterEvidence:counterEvidence,order:orderSupport,rootPlaces:rootPlaces,terrainPlaces:terrainPlaces,momentumPlaces:momentumPlaces},
      relations:relations,
      shenSha:shenSha,
      pattern:pattern,
      useful:{favorable:favorable,unfavorable:unfavorable,basis:(strengthScore>=53?'日主偏强，以克、泄、耗取得平衡':strengthScore<44?'日主偏弱，以印、比生扶为主':'日主接近中和，兼顾调候与流通'),confidence:confidence(strengthScore)},
      yun:r.yun,
      weightNote:'显示权重采用天干显性权重与地支本气/中气/余气分层模型；它用于解释相对强弱，不代表所有命理流派的唯一分值。'
    };
  }

  function escapeHtml(value) { return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function list(items, empty) { return items.length?'<ol>'+items.map(function(x){return '<li>'+escapeHtml(x)+'</li>';}).join('')+'</ol>':'<p>'+escapeHtml(empty||'无')+'</p>'; }

  function renderSummary(data) {
    return '<section class="bazi-evidence-summary">'+
      '<div class="bazi-conclusion"><span>结论</span><strong>'+data.strength.level+'</strong><em>可信度：'+data.strength.confidence+'</em></div>'+
      '<div class="bazi-evidence-columns"><div><h4>支持依据</h4>'+list(data.strength.evidence)+'</div><div><h4>反向条件</h4>'+list(data.strength.counterEvidence)+'</div></div>'+
      '<p class="bazi-basis-line"><b>格局：</b>'+escapeHtml(data.pattern.name)+'；'+escapeHtml(data.pattern.basis)+'</p>'+
      '<p class="bazi-basis-line"><b>喜用方向：</b>'+data.useful.favorable.join('、')+'；<b>慎用：</b>'+(data.useful.unfavorable.join('、')||'结合岁运')+'。'+escapeHtml(data.useful.basis)+'</p>'+
    '</section>';
  }

  function renderProfessional(data) {
    var chart = '<div class="bazi-pro-chart">'+data.pillars.map(function(p){return '<article class="bazi-pillar-card">'+
      '<header><span>'+p.label+'</span><b>'+p.tenGod+'</b></header><div class="bazi-gan">'+p.gan+'</div><div class="bazi-zhi">'+p.zhi+'</div>'+
      '<div class="bazi-hidden-list">'+p.hidden.map(function(h){return '<span title="'+escapeHtml(h.tenGod)+' · '+h.layer+' · 显示权重'+h.weight+'%">'+h.stem+'<small>'+h.tenGod+' · '+h.layer+' '+h.weight+'%'+(h.exposed?' · 透干':'')+'</small></span>';}).join('')+'</div>'+
      '<footer><span>长生 '+p.diShi+'</span><span>空亡 '+p.xunKong+'</span></footer></article>';}).join('')+'</div>';
    var bars = '<div class="ten-god-bars">'+data.distribution.map(function(item){var details=[];Object.keys(data.tenGodLocations).forEach(function(god){if(groupOf(god)===item.name)details=details.concat(data.tenGodLocations[god].map(function(pos){return god+'：'+pos;}));});return '<button class="ten-god-bar" type="button" onclick="BaziModule.toggleTenGod(this)" aria-expanded="false"><span><b>'+item.name+'</b><em>'+item.percent+'%</em></span><i><u style="width:'+item.percent+'%"></u></i><small>'+escapeHtml(details.join('；')||'原局未见')+'</small></button>';}).join('')+'</div>';
    var relations = data.relations.length?data.relations.map(function(x){return '<span class="bazi-relation"><b>'+x.type+'</b>'+escapeHtml(x.value)+'<small>'+x.positions+'</small></span>';}).join(''):'<p>原局未形成明显的合冲刑害破、三合或三会组合。</p>';
    var stars = data.shenSha.length?data.shenSha.map(function(x){return '<span class="bazi-star"><b>'+x.name+'</b>'+x.position+'<small>'+x.basis+'</small></span>';}).join(''):'<p>当前核心神煞规则未检出明显标记。</p>';
    var yun = data.yun;
    var yunHtml = '<p class="bazi-yun-start"><b>'+(yun.forward?'顺排':'逆排')+'大运</b>，出生后约 '+yun.start.year+'年'+yun.start.month+'月'+yun.start.day+'天'+(yun.start.hour?' '+yun.start.hour+'小时':'')+' 起运；交运时间 '+yun.startSolar.year+'-'+yun.startSolar.month+'-'+yun.startSolar.day+'。</p>'+
      '<div class="bazi-yun-grid">'+yun.daYun.map(function(d){return '<details><summary><b>'+d.ganZhi+'</b><span>'+d.startAge+'–'+d.endAge+'岁</span><small>'+d.startYear+'–'+d.endYear+'</small></summary><div>'+d.years.map(function(y){return '<span>'+y.year+' '+y.ganZhi+'<small>'+y.age+'岁</small></span>';}).join('')+'</div></details>';}).join('')+'</div>';
    return chart+
      '<section class="analysis-card bazi-pro-section"><h4>十神力量分布</h4>'+bars+'<p class="bazi-method-note">'+escapeHtml(data.weightNote)+'</p></section>'+
      '<section class="analysis-card bazi-pro-section"><h4>旺衰评分依据</h4>'+renderSummary(data)+'</section>'+
      '<section class="analysis-card bazi-pro-section"><h4>透干 · 通根 · 得令 · 得地 · 得势</h4><div class="bazi-status-grid">'+
        '<span><b>得令</b>'+(data.strength.order?'是':'否')+'</span><span><b>通根</b>'+(data.strength.rootPlaces.join('、')||'不足')+'</span><span><b>得地</b>'+(data.strength.terrainPlaces.join('、')||'不足')+'</span><span><b>得势</b>'+(data.strength.momentumPlaces.join('、')||'不足')+'</span></div></section>'+
      '<section class="analysis-card bazi-pro-section"><h4>合冲刑害破 · 三合三会</h4><div class="bazi-relation-grid">'+relations+'</div></section>'+
      '<section class="analysis-card bazi-pro-section"><h4>格局与用神证据</h4><p><b>'+data.pattern.name+'</b>：'+escapeHtml(data.pattern.basis)+'</p><p><b>支持：</b>'+escapeHtml(data.pattern.supports.join('；'))+'</p><p><b>限制：</b>'+escapeHtml(data.pattern.counters.join('；'))+'</p><p><b>喜用方向：</b>'+data.useful.favorable.join('、')+'；依据：'+escapeHtml(data.useful.basis)+'；可信度：'+data.useful.confidence+'</p></section>'+
      '<section class="analysis-card bazi-pro-section"><h4>核心神煞</h4><div class="bazi-star-grid">'+stars+'</div><p class="bazi-method-note">神煞仅作辅助，不能替代月令、旺衰、格局与岁运判断。</p></section>'+
      '<section class="analysis-card bazi-pro-section"><h4>大运与流年 · 真实起运</h4>'+yunHtml+'</section>';
  }

  return {build:build, renderSummary:renderSummary, renderProfessional:renderProfessional, groupOf:groupOf};
})();
