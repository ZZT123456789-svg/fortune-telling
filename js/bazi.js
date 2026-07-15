/**
 * 八字排盘 — 真太阳时、单人/双人模式、多维度分析
 */
var BaziModule = {
  currentMode: 'single',
  _lastResult: null, // 缓存最后计算结果，用于兑换后刷新

  tianGan: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  diZhi: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  shengXiao: ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'],
  wuXingMap: {
    '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
    '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
  },
  naYin: [
    '海中金','炉中火','大林木','路旁土','剑锋金','山头火',
    '涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土',
    '霹雳火','松柏木','流年水','砂石金','山下火','平地木',
    '壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金',
    '桑柘木','柘榴木','大海水','石榴木','大海水',''
  ],

  cityLongitudes: {
    '北京':116.4,'上海':121.5,'天津':117.2,'重庆':106.5,
    '哈尔滨':126.6,'长春':125.3,'沈阳':123.4,'呼和浩特':111.7,
    '石家庄':114.5,'太原':112.5,'济南':117.0,'南京':118.8,
    '杭州':120.2,'合肥':117.3,'南昌':115.9,'福州':119.3,
    '郑州':113.7,'武汉':114.3,'长沙':113.0,'广州':113.3,
    '南宁':108.3,'海口':110.3,'成都':104.1,'贵阳':106.7,
    '昆明':102.7,'拉萨':91.1,'西安':108.9,'兰州':103.8,
    '西宁':101.8,'银川':106.3,'乌鲁木齐':87.6,
    '香港':114.2,'澳门':113.5,'台北':121.5
  },

  open: function() {
    document.getElementById('baziOverlay').classList.add('active');
    this.currentMode = 'single';
    this._updateModeUI();
    this._initAddressCascades();
  },

  close: function() {
    document.getElementById('baziOverlay').classList.remove('active');
    document.getElementById('baziResult').style.display = 'none';
  },

  switchMode: function(mode) {
    this.currentMode = mode;
    this._updateModeUI();
  },

  _updateModeUI: function() {
    var btns = document.querySelectorAll('.bazi-mode-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    if (this.currentMode === 'single') {
      btns[0].classList.add('active');
      document.getElementById('baziSinglePanel').style.display = 'block';
      document.getElementById('baziDualPanel').style.display = 'none';
    } else {
      btns[1].classList.add('active');
      document.getElementById('baziSinglePanel').style.display = 'none';
      document.getElementById('baziDualPanel').style.display = 'block';
    }
    document.getElementById('baziResult').style.display = 'none';
  },

  _initAddressCascades: function() {
    var prefixes = ['1', 'A', 'B'];
    var self = this;
    prefixes.forEach(function(p) {
      var prov = document.getElementById('baziProvince' + p);
      if (!prov || prov.options.length > 1) return;
      var provinces = Object.keys(CHINA_ADDRESS);
      provinces.forEach(function(name) {
        var opt = document.createElement('option');
        opt.value = name; opt.textContent = name;
        prov.appendChild(opt);
      });
      prov.addEventListener('change', function() { self._onProvinceChange(p); });
      var city = document.getElementById('baziCity' + p);
      if (city) city.addEventListener('change', function() { self._onCityChange(p); });
    });
  },

  _onProvinceChange: function(prefix) {
    var prov = document.getElementById('baziProvince' + prefix).value;
    var citySel = document.getElementById('baziCity' + prefix);
    var distSel = document.getElementById('baziDistrict' + prefix);
    citySel.innerHTML = '<option value="">市/区</option>';
    distSel.innerHTML = '<option value="">县/区</option>';
    if (prov && CHINA_ADDRESS[prov]) {
      Object.keys(CHINA_ADDRESS[prov]).forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        citySel.appendChild(opt);
      });
    }
    this._updateTrueSolar(prefix);
  },

  _onCityChange: function(prefix) {
    var prov = document.getElementById('baziProvince' + prefix).value;
    var city = document.getElementById('baziCity' + prefix).value;
    var distSel = document.getElementById('baziDistrict' + prefix);
    distSel.innerHTML = '<option value="">县/区</option>';
    if (prov && city && CHINA_ADDRESS[prov] && CHINA_ADDRESS[prov][city]) {
      CHINA_ADDRESS[prov][city].forEach(function(d) {
        var opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        distSel.appendChild(opt);
      });
    }
    this._updateTrueSolar(prefix);
  },

  _getLongitude: function(prefix) {
    var prov = document.getElementById('baziProvince' + prefix).value;
    var city = document.getElementById('baziCity' + prefix).value;
    var coord = null;
    if (city) coord = BaziDB.getCityCoord(city);
    if (!coord && prov) coord = BaziDB.getProvCoord(prov);
    return coord ? coord.lng : 116;
  },

  /** 真太阳时计算 */
  _calcTrueSolar: function(year, month, day, hour, minute, prefix) {
    var longitude = this._getLongitude(prefix);
    var timeZoneMeridian = 120;
    var lngCorrection = (longitude - timeZoneMeridian) * 4;

    var d = new Date(year, month - 1, day);
    var dayOfYear = Math.floor((d - new Date(year, 0, 0)) / 86400000);
    var B = (360 / 365) * (dayOfYear - 81);
    var B_rad = B * Math.PI / 180;
    var eot = 9.87 * Math.sin(2 * B_rad) - 7.53 * Math.cos(B_rad) - 1.5 * Math.sin(B_rad);

    var totalMinutes = hour * 60 + minute + lngCorrection + eot;
    totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;

    var trueHour = Math.floor(totalMinutes / 60);
    var trueMinute = Math.round(totalMinutes % 60);
    if (trueMinute >= 60) { trueHour++; trueMinute -= 60; }
    if (trueHour >= 24) trueHour -= 24;

    return {hour: trueHour, minute: trueMinute, lngCorrection: Math.round(lngCorrection), eot: Math.round(eot)};
  },

  _updateTrueSolar: function(prefix) {
    var display = document.getElementById('trueSolar' + prefix);
    if (!display) return;
    var year = parseInt(document.getElementById('baziYear' + prefix).value);
    var month = parseInt(document.getElementById('baziMonth' + prefix).value);
    var day = parseInt(document.getElementById('baziDay' + prefix).value);
    var hour = parseInt(document.getElementById('baziHour' + prefix).value);
    var minute = parseInt(document.getElementById('baziMinute' + prefix).value) || 0;
    if (isNaN(hour)) return;
    if (!year || !month || !day) { year = 1990; month = 1; day = 1; }
    var ts = this._calcTrueSolar(year, month, day, hour, minute, prefix);
    display.style.display = 'block';
    document.getElementById('trueSolarTime' + prefix).textContent =
      String(ts.hour).padStart(2,'0') + ':' + String(ts.minute).padStart(2,'0') +
      '（经度' + (ts.lngCorrection >= 0 ? '+' : '') + ts.lngCorrection + '分 + 均时差' +
      (ts.eot >= 0 ? '+' : '') + ts.eot + '分）';
  },

  /** 节气日期表 (1900-2100近似，每月两个节气，我们只需要"节") */
  _jieqiMonth: function(year) {
    // 返回12个"节"的日期 [立春,惊蛰,清明,立夏,芒种,小暑,立秋,白露,寒露,立冬,大雪,小寒]
    // 每年前后1-2天浮动，取近似值
    var jieqi = [
      {m:2,d:4},{m:3,d:6},{m:4,d:5},{m:5,d:6},{m:6,d:6},
      {m:7,d:7},{m:8,d:8},{m:9,d:8},{m:10,d:8},{m:11,d:8},
      {m:12,d:7},{m:1,d:6}
    ];
    return jieqi;
  },

  /** 年柱 — 以立春精确时间为界 */
  _getYearPillar: function(year, month, day, hour) {
    if (BaziDB.isBeforeLichun(year, month, day, hour || 12)) {
      year = year - 1;
    }
    var ganIdx = ((year - 4) % 10 + 10) % 10;
    var zhiIdx = ((year - 4) % 12 + 12) % 12;
    return {gan: this.tianGan[ganIdx], zhi: this.diZhi[zhiIdx], ganIdx: ganIdx, zhiIdx: zhiIdx, actualYear: year};
  },

  /** 月柱 — 使用BaziDB精确节气数据（含立春小时判断） */
  _getMonthPillar: function(yearGanIdx, month, day, hour, calcYear) {
    var bm = BaziDB.getBaziMonth(calcYear, month, day, hour || 12);
    var monthStartGan = [2, 4, 6, 8, 0];
    var ganIdx = (monthStartGan[yearGanIdx % 5] + bm) % 10;
    var zhiIdx = (2 + bm) % 12;
    return {gan: this.tianGan[ganIdx], zhi: this.diZhi[zhiIdx], ganIdx: ganIdx, zhiIdx: zhiIdx};
  },

  /** 日柱 — 使用BaziDB精确基准表 */
  _getDayPillar: function(year, month, day) {
    var dp = BaziDB.getDayPillar(year, month, day);
    return {gan: dp.gan, zhi: dp.zhi, ganIdx: dp.ganIdx, zhiIdx: dp.zhiIdx};
  },

  /** 时柱 — 不换日，22-23=亥时，0-1=子时 */
  _getHourPillar: function(dayGanIdx, hour) {
    var hourStartGan = [0, 2, 4, 6, 8];
    var zhiIdx = Math.floor(hour / 2) % 12; // 22→11(亥) 23→11(亥) 0→0(子)
    var ganIdx = (hourStartGan[dayGanIdx % 5] + zhiIdx) % 10;
    return {gan: this.tianGan[ganIdx], zhi: this.diZhi[zhiIdx], ganIdx: ganIdx, zhiIdx: zhiIdx};
  },

  _getShiShen: function(dayGan, otherGan) {
    // 天干五行+阴阳: yang=1, yin=0
    var gi = {
      '甲':{e:'木',y:1},'乙':{e:'木',y:0},'丙':{e:'火',y:1},'丁':{e:'火',y:0},
      '戊':{e:'土',y:1},'己':{e:'土',y:0},'庚':{e:'金',y:1},'辛':{e:'金',y:0},
      '壬':{e:'水',y:1},'癸':{e:'水',y:0}
    };
    var s = {木:'火',火:'土',土:'金',金:'水',水:'木'}; // 相生
    var k = {木:'土',土:'水',水:'火',火:'金',金:'木'}; // 相克
    var d = gi[dayGan], o = gi[otherGan];
    if (!d || !o) return '';
    if (d.e === o.e) return d.y === o.y ? '比肩' : '劫财';           // 同我
    if (s[d.e] === o.e) return d.y === o.y ? '食神' : '伤官';       // 我生
    if (k[d.e] === o.e) return d.y === o.y ? '偏财' : '正财';       // 我克
    if (s[o.e] === d.e) return d.y === o.y ? '偏印' : '正印';       // 生我
    if (k[o.e] === d.e) return d.y === o.y ? '七杀' : '正官';       // 克我
    return '';
  },

  _getDaYun: function(yearP, monthP, gender) {
    var isYangGan = yearP.ganIdx % 2 === 0;
    var isMale = gender === '男';
    var forward = (isYangGan && isMale) || (!isYangGan && !isMale);
    var sg = monthP.ganIdx, sz = monthP.zhiIdx;
    var daYun = [];
    for (var i = 1; i <= 8; i++) {
      if (forward) { sg = (sg + 1) % 10; sz = (sz + 1) % 12; }
      else { sg = (sg - 1 + 10) % 10; sz = (sz - 1 + 12) % 12; }
      daYun.push({gan: this.tianGan[sg], zhi: this.diZhi[sz], age: i * 10});
    }
    return daYun;
  },

  _analyzeSingle: function(name, gender, year, month, day, hour, minute, prefix) {
    // 先算真太阳时
    var ts = this._calcTrueSolar(year, month, day, hour, minute, prefix);
    var trueHour = ts.hour;

    // 日柱不换日（以0点为界），22-23均为亥时
    var yearP = this._getYearPillar(year, month, day, trueHour);
    var monthP = this._getMonthPillar(yearP.ganIdx, month, day, trueHour, year);
    var dayP = this._getDayPillar(year, month, day);
    var hourP = this._getHourPillar(dayP.ganIdx, trueHour);

    var dayMaster = dayP.gan;
    var dmElement = this.wuXingMap[dayMaster];

    var wxCount = {金:0,木:0,水:0,火:0,土:0};
    var pillars = [yearP, monthP, dayP, hourP];
    var self = this;
    pillars.forEach(function(p) {
      wxCount[self.wuXingMap[p.gan]] = (wxCount[self.wuXingMap[p.gan]] || 0) + 1;
      wxCount[self.wuXingMap[p.zhi]] = (wxCount[self.wuXingMap[p.zhi]] || 0) + 1;
    });

    var naYinIdx = (yearP.ganIdx * 6 + yearP.zhiIdx) % 30;
    var naYinName = this.naYin[naYinIdx] || '未知';

    var shiShen = pillars.map(function(p) {
      return {ganSS: self._getShiShen(dayMaster, p.gan)};
    });

    var daYun = this._getDaYun(yearP, monthP, gender);

    return {
      name: name, gender: gender,
      yearP: yearP, monthP: monthP, dayP: dayP, hourP: hourP,
      dayMaster: dayMaster, dmElement: dmElement,
      wxCount: wxCount, naYin: naYinName,
      shiShen: shiShen, daYun: daYun,
      trueSolar: ts
    };
  },

  _analyzeDual: function(a, b) {
    var sheng={木:'火',火:'土',土:'金',金:'水',水:'木'};
    var ke={木:'土',土:'水',水:'火',火:'金',金:'木'};
    var aElem=a.dmElement, bElem=b.dmElement;
    var relation='', score=0;

    // 五行生克
    if(sheng[aElem]===bElem){relation=a.name+'的'+aElem+'生助'+b.name+'的'+bElem+'，付出方为'+a.name+'，关系偏包容型。';score=75;}
    else if(sheng[bElem]===aElem){relation=b.name+'的'+bElem+'生助'+a.name+'的'+aElem+'，付出方为'+b.name+'，关系偏滋养型。';score=75;}
    else if(ke[aElem]===bElem){relation=a.name+'的'+aElem+'克制'+b.name+'的'+bElem+'，'+a.name+'在关系中较强势，需注意平衡。';score=55;}
    else if(ke[bElem]===aElem){relation=b.name+'的'+bElem+'克制'+a.name+'的'+aElem+'，'+b.name+'在关系中较强势，需注意平衡。';score=55;}
    else if(aElem===bElem){relation='两人同属'+aElem+'，性格相似有共鸣，但长期也需各自空间避免竞争。';score=70;}
    else{relation='五行无直接生克，相处自然不拘束，但也需主动经营。';score=65;}

    // 生肖
    var sxA=this.shengXiao[a.yearP.zhiIdx],sxB=this.shengXiao[b.yearP.zhiIdx];
    var compat={鼠:['牛','龙','猴'],牛:['鼠','蛇','鸡'],虎:['马','狗','猪'],兔:['羊','狗','猪'],龙:['鼠','猴','鸡'],蛇:['牛','鸡','猴'],马:['虎','羊','狗'],羊:['兔','马','猪'],猴:['鼠','龙','蛇'],鸡:['牛','龙','蛇'],狗:['虎','兔','马'],猪:['虎','兔','羊']};
    var clashCheck=(a.yearP.zhiIdx+6)%12===b.yearP.zhiIdx;
    if(compat[sxA]&&compat[sxA].indexOf(sxB)>=0){relation+=' ✅ 生肖相合（三合/六合），缘分基础好。';score+=10;}
    else if(clashCheck){relation+=' ⚠️ 生肖六冲，需要更多包容和理解。';score-=15;}
    else{score+=5;}

    // 日支(夫妻宫)关系
    if(a.dayP.zhiIdx===b.dayP.zhiIdx){score-=5;relation+=' 日支相同（夫妻宫伏吟），缘分深但容易互相消耗。';}
    if((a.dayP.zhiIdx+6)%12===b.dayP.zhiIdx){score-=5;relation+=' 日支六冲，感情波动较大需磨合。';}

    // 纳音
    if(a.naYin===b.naYin){score+=5;relation+=' 纳音相同，气场共振。';}

    return{relation:relation, score:Math.max(0,Math.min(100,score))};
  },

  calculate: function() {
    try {
        if (this.currentMode === 'single') {
      var name = document.getElementById('baziName1').value || '未命名';
      var gender = document.getElementById('baziGender1').value;
      var year = parseInt(document.getElementById('baziYear1').value);
      var month = parseInt(document.getElementById('baziMonth1').value);
      var day = parseInt(document.getElementById('baziDay1').value);
      var hour = parseInt(document.getElementById('baziHour1').value);
      var minute = parseInt(document.getElementById('baziMinute1').value) || 0;
      if (!year || !month || !day || isNaN(hour)) { alert('请填写完整的出生日期和时间'); return; }

      // 农历→阳历转换（近似）
      var calType = document.getElementById('baziCalType1').value;
      if (calType === 'lunar') {
        var solar = this._lunarToSolar(year, month, day);
        year = solar.year; month = solar.month; day = solar.day;
      }

      var result = this._analyzeSingle(name, gender, year, month, day, hour, minute, '1');
      this._lastResult = result;
        this._renderSingle(result);
    } else {
      var a = this._getDualPerson('A');
      var b = this._getDualPerson('B');
      if (!a || !b) { alert('请填写两人的完整信息'); return; }
      var compat = this._analyzeDual(a, b);
      this._renderDual(a, b, compat);
    }
    } catch(e) {
      alert('排盘出错: ' + e.message + '\n请截图发客服微信: ZZT-2004-12');
    }
  },

  _getDualPerson: function(suffix) {
    var name = document.getElementById('baziName' + suffix).value || '未命名';
    var gender = document.getElementById('baziGender' + suffix).value;
    var year = parseInt(document.getElementById('baziYear' + suffix).value);
    var month = parseInt(document.getElementById('baziMonth' + suffix).value);
    var day = parseInt(document.getElementById('baziDay' + suffix).value);
    var hour = parseInt(document.getElementById('baziHour' + suffix).value);
    var minute = parseInt(document.getElementById('baziMinute' + suffix).value) || 0;
    if (!year || !month || !day || isNaN(hour)) return null;
    return this._analyzeSingle(name, gender, year, month, day, hour, minute, suffix);
  },

  _buildPillarHtml: function(label, p) {
    return '<tr><td class="pillar-col">' + label + '</td>' +
      '<td class="gan-char">' + p.gan + '</td>' +
      '<td class="zhi-char">' + p.zhi + '</td>' +
      '<td style="font-size:0.78rem;color:var(--text-secondary);">' + this.wuXingMap[p.gan] + '</td></tr>';
  },

  _renderSingle: function(r) {
    try {
    var self = this;
    var ctn = document.getElementById('baziResult');
    if (!ctn) { alert('排盘显示区域未找到，请刷新页面后重试'); return; }
    ctn.style.display = 'block';

    // 安全获取所有分析数据（任何一个出错都不影响排盘显示）
    var bodyStrength, favorableElements, careerAnalysis, bestDir, industries;
    var lifeTraj, nameAnalysis, detailedDaYun, pattern, healthAnalysis, cautions;
    try { bodyStrength = BaziClassics.judgeStrength(r); } catch(e) { bodyStrength = {level:'—',total:0,desc:'',advice:''}; }
    try { favorableElements = this._getFavorableElements(r, bodyStrength); } catch(e) { favorableElements = {favorable:[],unfavorable:[]}; }
    try { careerAnalysis = this._getCareerAnalysis(r, bodyStrength); } catch(e) { careerAnalysis = ''; }
    try { bestDir = this._getBestDirection(r, favorableElements); } catch(e) { bestDir = ''; }
    try { industries = this._getSuitableIndustries(r, favorableElements); } catch(e) { industries = ''; }
    try { lifeTraj = this._getLifeTrajectory(r, r.daYun, bodyStrength); } catch(e) { lifeTraj = ''; }
    try { nameAnalysis = this._getNameBaziRelation(r.name, r, bodyStrength, favorableElements); } catch(e) { nameAnalysis = ''; }
    try { detailedDaYun = this._getDetailedDaYun(r, r.daYun, bodyStrength); } catch(e) { detailedDaYun = ''; }
    try { pattern = this._getPattern(r, bodyStrength); } catch(e) { pattern = {patterns:[],level:'',levelDesc:''}; }
    try { healthAnalysis = this._getHealthAnalysis(r, bodyStrength, r.wxCount); } catch(e) { healthAnalysis = ''; }
    try { cautions = this._getCautions(r, bodyStrength, r.wxCount); } catch(e) { cautions = ''; }

    // 十神表
    var labels = ['年柱','月柱','日柱','时柱'];
    var ganNames = [r.yearP.gan, r.monthP.gan, r.dayP.gan, r.hourP.gan];
    var ssHtml = '';
    for (var si=0;si<4;si++) {
      var ss = (r.shiShen[si] && r.shiShen[si].ganSS) || '—';
      if (si === 2) ss = '日主（本人）';
      ssHtml += '<tr><td style=\"padding:4px 8px;border:1px solid var(--border-subtle);\">'+labels[si]+'</td><td style=\"padding:4px 8px;border:1px solid var(--border-subtle);font-weight:bold;\">'+ganNames[si]+'</td><td style=\"padding:4px 8px;border:1px solid var(--border-subtle);\">'+ss+'</td></tr>';
    }

    // 基本信息
    var infoHtml = '<div style=\"padding:0.5rem;background:var(--bg-card);border-radius:8px;margin-bottom:0.5rem;\">' +
      '<p><b>八字：</b>' + r.yearP.gan+r.yearP.zhi + ' ' + r.monthP.gan+r.monthP.zhi + ' ' + r.dayP.gan+r.dayP.zhi + ' ' + r.hourP.gan+r.hourP.zhi + '</p>' +
      '<p><b>日主：</b>' + r.dayMaster + '（' + r.dmElement + '）&nbsp;<b>性别：</b>' + r.gender + '&nbsp;<b>生肖：</b>' + (self.shengXiao[r.yearP.zhiIdx]||'') + '&nbsp;<b>纳音：</b>' + (r.naYin||'') + '</p></div>';

    // 五行条形图
    var wxBars = '', wxColors = {金:'#e8c040',木:'#4a9',水:'#59c',火:'#e55',土:'#da5'};
    var wxMax = Math.max(1, r.wxCount['金']||0, r.wxCount['木']||0, r.wxCount['水']||0, r.wxCount['火']||0, r.wxCount['土']||0);
    ['金','木','水','火','土'].forEach(function(k) { var pct=Math.round((r.wxCount[k]||0)/wxMax*100);
      wxBars += '<div class=\"wx-bar-row\"><span class=\"wx-label\">'+k+'</span><div class=\"wx-bar-track\"><div class=\"wx-bar-fill\" style=\"width:'+pct+'%;background:'+wxColors[k]+';\"></div></div><span class=\"wx-count\">'+(r.wxCount[k]||0)+'</span></div>'; });

    // 大运走势
    var daYunHtml = '';
    for (var dyi=0;dyi<r.daYun.length;dyi++) { var dy=r.daYun[dyi]; daYunHtml += '<span style=\"padding:0 4px;\">'+dy.age+'岁:<b>'+dy.gan+dy.zhi+'</b></span>'; }
    var patternDesc = (pattern.patterns||[]).map(function(p) { return '<p style=\"line-height:1.7;\">' + p + '</p>'; }).join('');

    // 穷通宝鉴调候
    var tiaoHou = BaziClassics.getTiaoHou(r.dayMaster, r.monthP.zhiIdx >= 2 ? ((r.monthP.zhiIdx-1)%12+1) : (r.monthP.zhiIdx+11));
    // 滴天髓体性
    var dts = BaziClassics.diTianSui[r.dayMaster]||'';
    var dtsBH = BaziClassics.diTianSuiBaiHua[r.dayMaster]||'';

    // 判断全局寒暖(滴天髓调候总纲)
    var seasonIdx = r.monthP.zhiIdx; // 0子1丑2寅...11亥
    var isWinter = (seasonIdx===0||seasonIdx===1||seasonIdx===10||seasonIdx===11); // 亥子丑冬
    var isSummer = (seasonIdx===4||seasonIdx===5||seasonIdx===6); // 巳午未夏
    var hasFire = r.wxCount['火']>=2, hasWater = r.wxCount['水']>=2;
    var diTianHou = '';
    if (isWinter && !hasFire) diTianHou = '全局冬月寒湿，' + r.dmElement + '无火调候，按《滴天髓》寒暖总纲——寒则无生机，急需丙火太阳暖局为第一急务。';
    else if (isSummer && !hasWater) diTianHou = '全局夏月燥热，' + r.dmElement + '无水润局，按《滴天髓》燥则物病，急需癸水雨露润局为第一急务。';
    else if (isWinter && hasFire) diTianHou = '全局冬月有火调候，寒暖得宜，五行有生发之机。';
    else if (isSummer && hasWater) diTianHou = '全局夏月有水润燥，寒热平衡，五行流通有度。';
    else diTianHou = '全局气候平和，不寒不燥，调候非急务，以格局旺衰为主。';

    var freeHtml = '<div class=\"result-header\">☯️ ' + r.name + ' 八字命理全盘</div>' + infoHtml +
      '<div class=\"analysis-card\" style=\"border-left:3px solid #e80;\"><h4>🔥 《滴天髓》调候总纲（第一优先级）</h4>' +
        '<p style=\"line-height:1.8;\">' + diTianHou + '</p>' +
        '<p style=\"font-size:0.85rem;color:var(--text-secondary);\">《滴天髓》云："天道有寒暖，发育万物。地道有燥湿，生成品汇。" 寒暖燥湿为生死线，调候先于格局。</p></div>' +
      '<div class=\"analysis-card\"><h4>📜 《滴天髓》' + r.dayMaster + '体性</h4>' +
        '<p style=\"font-family:KaiTi,serif;font-size:1.05rem;color:var(--gold-pale);line-height:1.8;\">' + dts + '</p>' +
        '<p>' + dtsBH + '</p></div>' +
      '<div class=\"analysis-card\"><h4>🌡️ 《穷通宝鉴》' + r.dayMaster + '调候用神</h4>' +
        '<p>日主' + tiaoHou.desc + '生于' + tiaoHou.season + '季，用神：<b>' + (tiaoHou.yongShen||'全局配合') + '</b></p></div>';

    // === 深度解读(每个八字完全不一样) ===
    var deep = this._buildDeepAnalysis(r, bodyStrength, tiaoHou, pattern, ssHtml, daYunHtml, detailedDaYun, careerAnalysis, bestDir, industries, healthAnalysis, cautions, lifeTraj, nameAnalysis);

    var paidHtml = deep;

    // 结尾赠言
    paidHtml +=
      '<div style="text-align:center;padding:1.2rem 0.8rem;margin-top:0.5rem;background:rgba(201,169,110,0.06);border-radius:var(--radius-md);border:1px solid var(--border-subtle);">' +
        '<p style="font-family:KaiTi,STKaiti,serif;font-size:1.2rem;color:var(--gold);letter-spacing:0.15em;">天行健，君子以自强不息</p>' +
        '<p style="font-size:0.82rem;color:var(--text-secondary);">地势坤，君子以厚德载物</p>' +
      '</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.74rem;margin-top:0.5rem;">⚠ 以上推算基于传统命理规则，仅供娱乐参考。日柱建议查万年历校准。</p>' +
      '<button class="btn-secondary" onclick="BaziModule.close()">🔙 返回</button>';

    // 滚动到结果
    setTimeout(function(){ ctn.scrollIntoView({behavior:'smooth',block:'start'}); }, 100);

    // 排盘免费 + 解析付费
    if (Paywall.hasBalance()) {
      Paywall.deduct();
      ctn.innerHTML = freeHtml + paidHtml;
    } else {
      ctn.innerHTML = freeHtml +
        '<div style="text-align:center;padding:1rem;margin:0.5rem 0;background:rgba(0,0,0,0.04);border-radius:8px;border:1px dashed var(--border-subtle);">' +
          '<p style="font-size:2rem;margin:0;">🔒</p>' +
          '<p style="color:var(--text-secondary);font-weight:bold;margin:0.3rem 0;">完整命理解析</p>' +
          '<p style="font-size:0.8rem;color:var(--text-muted);">旺衰判定 · 调候用神 · 十神布局 · 格局层次 · 大运走势 · 事业财运婚姻健康</p>' +
          '<button class="btn-primary" onclick="Paywall.openShop()" style="width:auto;padding:0.5rem 2rem;margin-top:0.3rem;">🎫 购买解读次数</button>' +
          '<p style="font-size:0.74rem;color:var(--text-muted);margin-top:0.3rem;">已有兑换码？<a href=\"javascript:Paywall.openRedeem()\" style=\"color:var(--gold);\">点此兑换</a></p>' +
        '</div>';
    }
    } catch(e) { ctn.innerHTML = '<div class="result-header">⚠️ 渲染出错</div><p style="color:var(--red);">错误: ' + e.message + '</p><p style="font-size:0.8rem;">请截图联系客服: 微信 ZZT-2004-12</p>'; }
  },
  _renderDual: function(a, b, compat) {
    var ctn = document.getElementById('baziResult');
    ctn.style.display = 'block';
    var sheng={木:'火',火:'土',土:'金',金:'水',水:'木'};
    var ke={木:'土',土:'水',水:'火',火:'金',金:'木'};
    var self=this;

    // 五行互补分析
    var comp='';
    if(sheng[a.dmElement]===b.dmElement)comp=a.name+'的'+a.dmElement+'生助'+b.name+'的'+b.dmElement+'，'+a.name+'在关系中付出较多，乐于照顾对方。';
    else if(sheng[b.dmElement]===a.dmElement)comp=b.name+'的'+b.dmElement+'生助'+a.name+'的'+a.dmElement+'，'+b.name+'在关系中更主动付出。';
    else if(ke[a.dmElement]===b.dmElement)comp=a.name+'的'+a.dmElement+'克制'+b.name+'的'+b.dmElement+'，关系中'+a.name+'可能比较强势，需要注意沟通方式。';
    else if(ke[b.dmElement]===a.dmElement)comp=b.name+'的'+b.dmElement+'克制'+a.name+'的'+a.dmElement+'，关系中'+b.name+'可能比较强势。';
    else if(a.dmElement===b.dmElement)comp='两人日主同为'+a.dmElement+'，性格相似有默契，但也容易产生竞争。';
    else comp='两人五行没有直接生克关系，相处比较自然随和。';

    // 生肖三合六合
    var sxA=this.shengXiao[a.yearP.zhiIdx],sxB=this.shengXiao[b.yearP.zhiIdx];
    var sxComp={鼠:['牛','龙','猴'],牛:['鼠','蛇','鸡'],虎:['马','狗','猪'],兔:['羊','狗','猪'],龙:['鼠','猴','鸡'],蛇:['牛','鸡','猴'],马:['虎','羊','狗'],羊:['兔','马','猪'],猴:['鼠','龙','蛇'],鸡:['牛','龙','蛇'],狗:['虎','兔','马'],猪:['虎','兔','羊']};
    var sxMatch=(sxComp[sxA]||[]).indexOf(sxB)>=0;
    var sxClash=[0,1,2,3,4,5,6,7,8,9,10,11];var clashZhi=(a.yearP.zhiIdx+6)%12===b.yearP.zhiIdx;

    // 日柱地支关系
    var dzRel='';
    if(a.dayP.zhiIdx===b.dayP.zhiIdx)dzRel='两人日支相同（夫妻宫伏吟），缘分深但易互相消耗。';
    else if((a.dayP.zhiIdx+6)%12===b.dayP.zhiIdx)dzRel='两人日支六冲，感情容易波动，需要更多包容。';
    else if(([0,4,8].indexOf(a.dayP.zhiIdx)>=0&&[0,4,8].indexOf(b.dayP.zhiIdx)>=0)||([1,5,9].indexOf(a.dayP.zhiIdx)>=0&&[1,5,9].indexOf(b.dayP.zhiIdx)>=0))dzRel='两人日支三合，志趣相投，缘分较好。';
    else dzRel='两人日支无冲无合，感情基础需日常经营。';

    ctn.innerHTML =
      '<div class="result-header">👫 ' + a.name + ' & ' + b.name + ' 双人合盘</div>' +
      // 两人信息卡片
      '<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:0.5rem;">' +
        '<div style="flex:1;min-width:200px;padding:0.8rem;background:var(--bg-card);border-radius:var(--radius-sm);border-left:3px solid var(--gold);">' +
          '<b>' + a.name + '</b> ' + a.gender + ' · 日主' + a.dayMaster + '(' + a.dmElement + ')<br/>' +
          '<span style="font-size:0.82rem;">八字：' + a.yearP.gan+a.yearP.zhi+' '+a.monthP.gan+a.monthP.zhi+' '+a.dayP.gan+a.dayP.zhi+' '+a.hourP.gan+a.hourP.zhi+'</span><br/>' +
          '<span style="font-size:0.78rem;color:var(--text-muted);">生肖：'+sxA+' · 纳音：'+a.naYin+'</span>' +
        '</div>' +
        '<div style="flex:1;min-width:200px;padding:0.8rem;background:var(--bg-card);border-radius:var(--radius-sm);border-left:3px solid #c9a040;">' +
          '<b>' + b.name + '</b> ' + b.gender + ' · 日主' + b.dayMaster + '(' + b.dmElement + ')<br/>' +
          '<span style="font-size:0.82rem;">八字：' + b.yearP.gan+b.yearP.zhi+' '+b.monthP.gan+b.monthP.zhi+' '+b.dayP.gan+b.dayP.zhi+' '+b.hourP.gan+b.hourP.zhi+'</span><br/>' +
          '<span style="font-size:0.78rem;color:var(--text-muted);">生肖：'+sxB+' · 纳音：'+b.naYin+'</span>' +
        '</div>' +
      '</div>' +
      // 五行互补
      '<div class="analysis-card"><h4>🌿 五行互补</h4><p>'+comp+'</p></div>' +
      // 生肖配对
      '<div class="analysis-card"><h4>🐾 生肖配对</h4><p>' +
        (sxMatch?'✅ 生肖相合（三合/六合），缘分基础不错。':'⚠️ 生肖无合，但也不冲，正常缘分。') +
        (clashZhi?' ⚠️ 但生肖六冲，需注意沟通方式，多包容。':'') +
      '</p></div>' +
      // 日柱夫妻宫
      '<div class="analysis-card"><h4>💑 日柱（夫妻宫）关系</h4><p>'+dzRel+'</p></div>' +
      // 十神互动
      '<div class="analysis-card"><h4>🔗 十神互动</h4><p>' +
        a.name+'的日主'+a.dayMaster+'与'+b.name+'的日主'+b.dayMaster+'之间：'+comp +
      '</p></div>' +
      // 匹配度
      '<div class="analysis-card"><h4>💞 综合匹配度</h4>' +
        '<p style="text-align:center;font-size:2rem;color:var(--gold);font-weight:bold;">' + compat.score + '%</p>' +
        '<p>' + compat.relation + '</p>' +
        '<p style="font-size:0.82rem;color:var(--text-secondary);">' +
          (compat.score>=75?'两人缘分配对较高，五行互补、生肖相合，适合长期发展。':
           compat.score>=60?'两人有基本的缘分基础，需要多沟通、多包容，感情可稳中求进。':
           '两人缘分有挑战，但感情的核心在于经营，用心处之依然能有好的结果。') +
        '</p>' +
      '</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.74rem;">合盘分析基于传统命理规则，仅供娱乐参考。感情最重要的是两个人的用心经营。</p>' +
      '<button class="btn-secondary" onclick="BaziModule.close()">🔙 返回</button>';
  },

  /** 生成独一无二的深层分析 */
  _buildDeepAnalysis: function(r, bs, th, pt, ssHtml, dyHtml, ddYun, ca, bd, ind, ha, ct, lt, na) {
    var sz=this.diZhi, mx=r.monthP.zhiIdx, allG=[r.yearP.gan,r.monthP.gan,r.dayP.gan,r.hourP.gan];
    var allZ=[r.yearP.zhi,r.monthP.zhi,r.dayP.zhi,r.hourP.zhi];
    var wx=r.wxCount, dm=r.dayMaster, de=r.dmElement;
    var mN=mx>=2&&mx<=4?'春':mx>=5&&mx<=7?'夏':mx>=8&&mx<=10?'秋':'冬';

    // 四柱逐位解读
    var pA='';var pos=['年','月','日','时'],ages=['0-18(少年)','18-35(青年)','35-50(中年)','50+(晚年)'];
    for(var i=0;i<4;i++){
      var ss=r.shiShen[i].ganSS||'—',desc='';
      if(i===2)desc='日主本人，夫妻宫坐'+allZ[i]+'。';
      else if(ss.indexOf('印')>=0)desc='印星护身，'+pos[i]+'柱有长辈/学业助力。';
      else if(ss.indexOf('官')>=0||ss.indexOf('杀')>=0)desc='官杀当权，'+pos[i]+'柱代表'+(ss.indexOf('杀')>=0?'压力和挑战':'规矩和责任')+'。';
      else if(ss.indexOf('财')>=0)desc='财星显现，'+pos[i]+'柱与钱财/异性缘分相关。';
      else if(ss.indexOf('食')>=0||ss.indexOf('伤')>=0)desc='食伤泄秀，'+pos[i]+'柱代表才华发挥和创造力。';
      else desc='比劫帮扶，'+pos[i]+'柱代表同辈力量。';
      pA+='<p><b>'+pos[i]+'柱 '+allG[i]+allZ[i]+'：</b>'+desc+'（十神：'+ss+'，'+ages[i]+'）</p>';
    }

    // 地支冲合
    var zR='';
    for(var zi=0;zi<4;zi++)for(var zj=zi+1;zj<4;zj++){
      if(allZ[zi]===allZ[zj])zR+=pos[zi]+pos[zj]+'同为<b>'+allZ[zi]+'</b>（伏吟），';
      if((this.wuXingMap[allZ[zi]]||'')===(this.wuXingMap[allZ[zj]]||'')&&allZ[zi]!==allZ[zj])zR+=pos[zi]+pos[zj]+'五行相同，';
    }
    var cc={'子午':1,'丑未':1,'寅申':1,'卯酉':1,'辰戌':1,'巳亥':1};
    for(var ci=0;ci<4;ci++)for(var cj=ci+1;cj<4;cj++){
      var k1=allZ[ci]+allZ[cj],k2=allZ[cj]+allZ[ci];if(cc[k1]||cc[k2])zR+=pos[ci]+pos[cj]+'<b>相冲</b>（'+allZ[ci]+allZ[cj]+'冲），';
    }
    if(!zR)zR='四柱地支无冲无合，运势平稳。';

    // 十神互动
    var y2d=this._getShiShen(dm,allG[0]),m2d=this._getShiShen(dm,allG[1]),h2d=this._getShiShen(dm,allG[3]);
    var iA='';
    if(y2d)iA+='年干'+allG[0]+'为<b>'+y2d+'</b>——祖辈/早年影响。';
    if(m2d)iA+='月干'+allG[1]+'为<b>'+m2d+'</b>——父母/事业环境。';
    if(h2d)iA+='时干'+allG[3]+'为<b>'+h2d+'</b>——子女/晚年运势。';

    // 财运特判
    var caT='';
    if(bs.level.indexOf('强')>=0)caT='身强能任财星，有独立获取财富的能力。';
    else caT='身弱不胜财，需借印比帮身运得财，平时宜守。';
    if(wx['金']>=2||wx['水']>=2)caT+='命局财星有根，财运来源稳定。';
    if(wx[de]>=3)caT+='比劫较旺，注意合伙风险，防止利润被分走。';

    // 婚姻特判
    var maT='';
    var dzChar={子:'聪慧善变',丑:'踏实稳重',寅:'独立自主',卯:'温和细腻',辰:'包容大气',巳:'热情积极',午:'开朗大方',未:'温厚善良',申:'果敢利落',酉:'精致有品',戌:'忠诚可靠',亥:'灵活聪颖'};
    maT='日支'+r.dayP.zhi+'为夫妻宫，配偶特质：'+dzChar[r.dayP.zhi]+'。';
    if(r.gender==='男')maT+='男命以财为妻，';
    else maT+='女命以官杀为夫，';
    if(wx[de]>=3)maT+='比劫旺需防感情竞争。';

    var h='';
    h+='<div class=\"analysis-card\" style=\"border-left:3px solid var(--gold);\"><h4>📋 四柱逐位解读</h4>'+pA+'<p style=\"font-size:0.85rem;color:var(--text-secondary);\">'+zR+'</p></div>';
    h+='<div class=\"analysis-card\"><h4>📊 旺衰判定</h4><p>日主<b>'+dm+'('+de+')</b>，生于<b>'+sz[mx]+'月</b>（'+mN+'季）。同元素'+bs.same+'个，生扶'+bs.sheng+'个。判定：<b style=\"color:var(--gold);font-size:1.2rem;\">'+bs.level+'</b></p><p>'+bs.desc+'</p></div>';
    h+='<div class=\"analysis-card\"><h4>🔗 十神布局</h4><table style=\"width:100%;font-size:0.85rem;\"><tr><th>柱</th><th>天干</th><th>十神</th></tr>'+ssHtml+'</table><p style=\"margin-top:0.4rem;\">'+iA+'</p></div>';
    h+='<div class=\"analysis-card\"><h4>⚖️ 调候与用神</h4><p>日主'+dm+'生于'+sz[mx]+'月，调候：<b>'+th.yongShen+'</b>。喜用神：'+bs.level.indexOf('强')>=0?'克泄耗为主。':'生扶为主。'+'</p></div>';
    h+='<div class=\"analysis-card\"><h4>🏛️ 格局</h4><p>月令格局分析，层次：<b style=\"color:var(--gold);\">'+pt.level+'</b></p><p>'+pt.levelDesc+'</p></div>';
    h+='<div class=\"analysis-card\"><h4>💼 事业</h4><p>'+ca+'</p><p style=\"font-size:0.85rem;\">🧭 方位：'+bd+' | 🏭 行业：'+ind+'</p></div>';
    h+='<div class=\"analysis-card\"><h4>💰 财运</h4><p>'+caT+'</p></div>';
    h+='<div class=\"analysis-card\"><h4>💕 婚姻</h4><p>'+maT+'</p></div>';
    h+='<div class=\"analysis-card\"><h4>🏥 健康</h4>'+ha+'</div>';
    h+='<div class=\"analysis-card\"><h4>⚠️ 注意事项</h4>'+ct+'</div>';
    h+='<div class=\"analysis-card\"><h4>📅 大运走势</h4>'+dyHtml+'</div>';
    h+='<div class=\"analysis-card\"><h4>📅 每步大运详解</h4>'+ddYun+'</div>';
    h+='<div class=\"analysis-card\"><h4>📈 人生起伏</h4><p style=\"line-height:1.8;\">'+lt+'</p></div>';
    h+='<div class=\"analysis-card\"><h4>📛 名字与八字</h4>'+na+'</div>';

    return h;
  },

  /** 农历→阳历近似转换（简化，农历比阳历晚约20-50天） */
  _lunarToSolar: function(ly, lm, ld) {
    // 简易：农历日期 + 约30天 = 阳历日期
    var d = new Date(ly, lm - 1, ld + 28);
    // 如果超过当月天数则进位
    return {year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate()};
  },

  // ==== 身强弱判断 ====
  _judgeBodyStrength: function(r) {
    // Count supporting elements: 印星(生我) + 比劫(同我)
    // Count controlling: 官杀(克我) + 财星(我克) + 食伤(我生)
    var sameMap = {甲:'甲',乙:'乙',丙:'丙',丁:'丁',戊:'戊',己:'己',庚:'庚',辛:'辛',壬:'壬',癸:'癸'};
    var shengWoMap = {甲:'癸',乙:'壬',丙:'甲',丁:'乙',戊:'丙',己:'丁',庚:'戊',辛:'己',壬:'庚',癸:'辛'};
    var keWoMap = {甲:'庚',乙:'辛',丙:'壬',丁:'癸',戊:'甲',己:'乙',庚:'丙',辛:'丁',壬:'戊',癸:'己'};

    var support = 0, control = 0;
    var pillars = [r.yearP, r.monthP, r.dayP, r.hourP];

    // Month branch weight is higher
    var monthZhi = r.monthP.zhi;
    var monthElem = this.wuXingMap[monthZhi];
    if (monthElem === r.dmElement) support += 2;
    else if (shengWoMap[r.dayMaster] && this.wuXingMap[shengWoMap[r.dayMaster]] === monthElem) support += 1.5;
    else control += 1;

    pillars.forEach(function(p) {
      var gElem = this.wuXingMap[p.gan];
      if (gElem === r.dmElement) support += 1;
      else if (shengWoMap[r.dayMaster] && this.wuXingMap[shengWoMap[r.dayMaster]] === gElem) support += 1;
      else if (keWoMap[r.dayMaster] && this.wuXingMap[keWoMap[r.dayMaster]] === gElem) control += 1;
      else control += 0.5;
    }.bind(this));

    var level, desc, advice;
    if (support >= control + 2) {
      level = '身强';
      desc = '命主身强，精力充沛，有较强的主见和行动力。适合担当重任，但也需注意过于强势可能影响人际关系。';
      advice = '宜用克泄耗：适合从事需要发挥才能的行业，多社交多表达，适当收敛锋芒。喜用财星和官星来平衡。';
    } else if (support >= control) {
      level = '身中等偏强';
      desc = '命主身量适中偏强，既有足够的能量支撑事业，又不会过于强势。是比较平衡的命局。';
      advice = '宜顺势而为，不强求不退缩。保持目前的节奏，稳中求进。';
    } else if (support >= control - 1) {
      level = '身中等偏弱';
      desc = '命主身量适中偏弱，需要借助外界力量来补充能量。性格较温和，善与人合作。';
      advice = '宜补充印星和比劫的力量：多学习充电，结交志同道合的朋友，寻求贵人帮助。';
    } else {
      level = '身弱';
      desc = '命主身弱，能量有限，需要注意精力管理。性格敏感细腻，适合配合型工作而非独立扛大旗。';
      advice = '宜帮扶：需要补充印星（学习、贵人）和比劫（合作、伙伴）。不宜过度劳累和独立承担大项目。';
    }
    return {level: level, support: support, control: control, desc: desc, advice: advice};
  },

  // ==== 喜用神判断 ====
  _getFavorableElements: function(r, bodyStrength) {
    var shengMap = {木:'水',火:'木',土:'火',金:'土',水:'金'};
    var keMap = {木:'金',火:'水',土:'木',金:'火',水:'土'};

    var favorable = [], unfavorable = [];
    var dm = r.dmElement;

    if (bodyStrength.level.indexOf('强') !== -1) {
      // 身强喜克泄耗: 官杀(克我), 食伤(我生), 财星(我克)
      favorable.push(keMap[dm]); // 官杀
      var shengOut = {木:'火',火:'土',土:'金',金:'水',水:'木'};
      favorable.push(shengOut[dm]); // 食伤
      var keOut = {木:'土',火:'金',土:'水',金:'木',水:'火'};
      favorable.push(keOut[dm]); // 财星
    } else {
      // 身弱喜生扶: 印星(生我), 比劫(同我)
      favorable.push(shengMap[dm]); // 印星
      favorable.push(dm); // 比劫
    }

    return {favorable: favorable, unfavorable: unfavorable};
  },

  // ==== 动态事业分析（基于实际十神+五行+旺衰） ====
  _getCareerAnalysis: function(r, bodyStrength) {
    var dm = r.dmElement, parts = [];
    var ps = [r.yearP, r.monthP, r.dayP, r.hourP];
    var allGan = ps.map(function(p){return p.gan;}).join('');

    // 官杀分析
    var hasZhengGuan = false, hasQiSha = false, hasCaiXing = false, hasShiShang = false, hasYinXing = false;
    for (var i=0;i<ps.length;i++){
      var ss = r.shiShen[i].ganSS || '';
      if (ss.indexOf('正官')!==-1||ss.indexOf('七杀')!==-1){if(ss.indexOf('正官')!==-1)hasZhengGuan=true;if(ss.indexOf('七杀')!==-1)hasQiSha=true;}
      if (ss.indexOf('正财')!==-1||ss.indexOf('偏财')!==-1) hasCaiXing=true;
      if (ss.indexOf('食神')!==-1||ss.indexOf('伤官')!==-1) hasShiShang=true;
      if (ss.indexOf('正印')!==-1||ss.indexOf('偏印')!==-1) hasYinXing=true;
    }

    if (hasZhengGuan && hasQiSha) parts.push('命局官杀混杂，事业上压力与机遇并存，适合在竞争激烈、需要抗压能力的领域发展。需要学会在约束中寻找突破。');
    else if (hasZhengGuan && !hasQiSha) parts.push('命局正官为用，适合体制内、大企业、教育、法律等稳定且需要规则的行业。正官入命主贵气，做事有条理。');
    else if (!hasZhengGuan && hasQiSha) parts.push('命局七杀当权，适合创业、军警、技术攻坚等高挑战领域。七杀为将星，有魄力有执行力，但需注意劳逸结合。');
    else parts.push('原局官杀不显，事业上更适合自由职业、技术路线或专业服务型工作，不受过多体制约束。');

    if (hasCaiXing && hasShiShang) parts.push('食伤生财之局，才华能转化为收益。适合技术变现、内容创作、设计、销售等能将创意直接转化为收入的方向。');
    else if (hasCaiXing && !hasShiShang) parts.push('命局财星有根但食伤不足，适合稳扎稳打的理财方式和稳定收入来源，不宜激进投资。');
    else if (!hasCaiXing && hasShiShang) parts.push('食伤旺而财星弱，创意多但变现能力需加强。建议先积累口碑和专业壁垒，再考虑商业化。');

    if (hasYinXing) parts.push('印星护身，适合教育、科研、文化传媒等需要知识积累和沉淀的领域。学历和证书对你的事业有加持作用。');
    if (r.wxCount[dm]>=3) parts.push('比劫较旺，适合团队协作型工作，但合伙创业需谨慎选择伙伴，避免利益纠纷。');

    if (bodyStrength.level.indexOf('强')!==-1) parts.push('身强能任财官，独立扛事能力强，适合做核心决策者。');
    else if (bodyStrength.level.indexOf('弱')!==-1) parts.push('身弱适合借势发展，在成熟平台或大型组织中依托体系成功。');

    // 日主特殊提示
    var dmTips={甲:'格局开阔，有统御之才。',乙:'柔韧善变，适合协调型角色。',丙:'热情外放，适合台前工作。',丁:'心思细腻，适合精研型工作。',戊:'厚重踏实，适合需要稳定性的岗位。',己:'包容力强，适合服务和支持型角色。',庚:'刚毅果断，适合技术和执行力要求高的领域。',辛:'精致审美，适合品质和细节导向的工作。',壬:'灵活开阔，适合跨国、跨界和流动性强的工作。',癸:'直觉敏锐，适合创意和灵性相关领域。'};
    parts.push(dmTips[r.dmElement]||'');

    return parts.join('');
  },

  // ==== 适合方位 ====
  _getBestDirection: function(r, favorableElements) {
    var dirMap = {
      '木':['东方','东南方'],'火':['南方'],'土':['中部','西南方','东北方'],
      '金':['西方','西北方'],'水':['北方']
    };
    var dirs = [];
    favorableElements.favorable.forEach(function(e) {
      var d = dirMap[e] || [];
      d.forEach(function(dd) { if (dirs.indexOf(dd) === -1) dirs.push(dd); });
    });
    return dirs.length > 0 ? dirs.join('、') : '中部';
  },

  // ==== 适合行业 ====
  _getSuitableIndustries: function(r, favorableElements) {
    var industryMap = {
      '木':['教育','出版','文化传媒','园林设计','医药健康','环保能源','服装纺织','农林牧渔'],
      '火':['互联网','影视娱乐','餐饮美食','能源化工','航空航天','美容美发','心理咨询','广告营销'],
      '土':['房地产','建筑工程','矿业资源','农业种植','仓储物流','酒店管理','保险金融','城市规划'],
      '金':['金融证券','法律咨询','机械制造','汽车工业','珠宝首饰','外科医疗','军警安保','精密仪器'],
      '水':['航运物流','国际贸易','旅游观光','渔业水产','饮料食品','清洁能源','数据科学','新闻传媒']
    };

    var industries = [];
    favorableElements.favorable.forEach(function(e) {
      var inds = industryMap[e] || [];
      inds.forEach(function(ind) { if (industries.indexOf(ind) === -1) industries.push(ind); });
    });

    // Pick top 8
    var result = industries.slice(0, 8);
    return result.length > 0 ? result.join('、') : '综合多元化发展';
  },

  // ==== 人生起伏分析 ====
  _getLifeTrajectory: function(r, daYun, bodyStrength) {
    var shengMap={木:'水',火:'木',土:'火',金:'土',水:'金'};
    var self=this;
    function score(period){var s=0;period.forEach(function(p){var e=self.wuXingMap[p.gan];if(bodyStrength.level.indexOf('强')!==-1){if(e!==r.dmElement&&shengMap[r.dmElement]!==e)s++;}else{if(e===r.dmElement||shengMap[r.dmElement]===e)s++;}});return s;}

    var y=score(daYun.slice(0,3)), p=score(daYun.slice(3,6)), l=score(daYun.slice(6,8));
    var traj='';

    var youthPhrases={2:'早年运势顺畅，家庭和师长助力明显，学业有成，基础扎实。',1:'青年时期需自我奋斗，多尝试多积累，30岁前打好职业方向。',0:'早年多磨砺，但历经风雨方见彩虹。30岁后运势逐步上行。'};
    var primePhrases={2:'壮年是人生黄金期，事业财运双丰收，应把握时机大展宏图。',1:'中年稳步上升，家庭事业两手抓，保持进取的同时也要注意平衡。',0:'壮年宜稳守，精打细算，以守为攻。不贪大不求快，步步为营。'};
    var laterPhrases={2:'晚年福气深厚，子女有靠，可从事公益和兴趣爱好，安享天伦。',1:'晚年生活安稳，保持健康作息和乐观心态，知足常乐。',0:'晚年提前规划养老和健康，家庭和睦是最大的财富。'};

    traj+='<b>👦 青年(0-30)：</b>'+youthPhrases[y]||youthPhrases[1];
    traj+='<br/><b>🏢 壮年(30-60)：</b>'+primePhrases[p]||primePhrases[1];
    traj+='<br/><b>🧘 晚年(60+)：</b>'+laterPhrases[l]||laterPhrases[1];

    // 大运趋势描述
    var allScore=y+p+l;
    if (allScore>=5) traj+='<br/><b>总体：</b>一生运势呈上升趋势，中晚年优于早年，属于厚积薄发型。';
    else if (allScore>=3) traj+='<br/><b>总体：</b>运势波动正常，关键节点的选择比努力更重要。';
    else traj+='<br/><b>总体：</b>需借运而行，选对行业和方向事半功倍。大运来时抓紧，大运去时守成。';

    return traj;
  },

  // ==== 姓名与八字关系 ====
  _getNameBaziRelation: function(name, r, bodyStrength, favorableElements) {
    if (!name || name === '未命名') return '<p style="color:var(--text-muted);">请输入姓名以获取姓名与八字的关联分析</p>';

    var nameWuxing = {金:0,木:0,水:0,火:0,土:0};
    var self = this;

    // Analyze each character's element
    var wuXingChars = {
      '木':'林森林桐柏树杨李柳桂梁梅朴','火':'明辉星晨昊景晶照炎炜',
      '土':'山岚岩峰田地城圣坚','金':'鑫铭钰钧锐锋剑铁银',
      '水':'海涛洋波澜渊江汉浩浩'
    };

    var charAnalysis = '';
    for (var i = 0; i < name.length; i++) {
      var ch = name[i];
      var elem = '土';
      for (var key in wuXingChars) {
        if (wuXingChars[key].indexOf(ch) !== -1) { elem = key; break; }
      }
      nameWuxing[elem] = (nameWuxing[elem] || 0) + 1;
      var elemDesc = {木:'生发向上',火:'热情光明',土:'厚重稳定',金:'坚毅果断',水:'灵动智慧'};
      charAnalysis += '<div style="padding:0.25rem 0;"><b>' + ch + '</b>：五行属' + elem + '，' + (elemDesc[elem] || '') + '。</div>';
    }

    // Check if name elements help the Bazi
    var nameHelps = false;
    var helpfulChars = [];
    favorableElements.favorable.forEach(function(fe) {
      if (nameWuxing[fe] > 0) { nameHelps = true; helpfulChars.push(fe); }
    });

    var nameScore = 0;
    var nameAdvice = '';
    if (nameHelps) {
      nameScore = 75 + helpfulChars.length * 10;
      nameAdvice = '✅ 名字中的' + helpfulChars.join('、') + '元素对八字有利，能够补充命局所需。名字与八字配合较好。';
    } else {
      nameScore = 50;
      nameAdvice = '名字中的五行元素与八字所需不完全匹配。如果能增加' + favorableElements.favorable.join('或') + '元素的字，会更加有利。';
    }

    return '<div style="line-height:1.7;">' +
      '<p><b>名字五行组成：</b></p>' + charAnalysis +
      '<p style="margin-top:0.4rem;"><b>八字匹配度：</b><span style="color:var(--gold);font-size:1.1rem;">' + nameScore + '%</span></p>' +
      '<p>' + nameAdvice + '</p>' +
      '<p style="font-size:0.8rem;color:var(--text-muted);">姓名学与八字结合分析，旨在提供参考。好名字的核心是好听、好记、有意义。</p>' +
      '</div>';
  },

  // ==== 详细大运分析 ====
  _getDetailedDaYun: function(r, daYun, bodyStrength) {
    var self=this,s={木:'火',火:'土',土:'金',金:'水',水:'木'},k={木:'土',火:'金',土:'水',金:'木',水:'火'};
    var dm=r.dmElement,html='';
    var allZ=[r.yearP.zhi,r.monthP.zhi,r.dayP.zhi,r.hourP.zhi];

    daYun.forEach(function(dy, idx) {
      var elem=self.wuXingMap[dy.gan], isFav=false;
      if (bodyStrength.level.indexOf('强')!==-1){if(elem!==dm&&s[dm]!==elem)isFav=true;}
      else{if(elem===dm||s[dm]===elem)isFav=true;}

      // 五行互动+具体影响
      var inter='';
      if(s[dm]===elem)inter='印星'+dy.gan+dy.zhi+'生扶日主'+dm+'('+r.dmElement+')，此运得长辈和贵人助力，适合学习进修和巩固根基。';
      else if(elem===dm)inter='比劫'+dy.gan+dy.zhi+'与日主同五行，此运同辈助力强，适合合作拓展。但需防竞争破财和合伙纠纷。';
      else if(k[dm]===elem)inter='财星'+dy.gan+dy.zhi+'受日主'+dm+'克制，财运上升期，适合投资经营扩大收入。';
      else if(s[elem]===dm)inter='食伤'+dy.gan+dy.zhi+'泄日主'+dm+'之气，才华展现期，适合创新表达技术提升。注意言行避免口舌。';
      else if(k[elem]===dm)inter='官杀'+dy.gan+dy.zhi+'克制日主'+dm+'，事业压力与机遇并存，适合竞争晋升。注意劳逸结合。';
      else inter=dy.gan+dy.zhi+'（'+elem+'）大运，需全局配合论断。';

      // 大运与原局冲合
      var clash='',cc={'子午':1,'丑未':1,'寅申':1,'卯酉':1,'辰戌':1,'巳亥':1};
      for(var zi=0;zi<4;zi++){
        var k1=allZ[zi]+dy.zhi,k2=dy.zhi+allZ[zi];
        if(cc[k1]||cc[k2])clash+=['年','月','日','时'][zi]+'支'+allZ[zi]+'与运支'+dy.zhi+'相冲 ';
        if(allZ[zi]===dy.zhi)clash+=['年','月','日','时'][zi]+'支与运支同为'+dy.zhi+'（伏吟） ';
      }

      var age=dy.age,label=isFav?'✅':'⚠️';
      var advice=isFav?'此十年运势向好，建议积极进取。':'此十年宜稳守，积累实力等待时机。';
      if(clash)advice+=' 注意：'+clash.trim()+',此期间相关宫位事务有变动。';

      html+='<div style="padding:0.4rem 0;border-bottom:1px solid var(--border-subtle);">'+
        '<b>'+label+' '+age+'岁 '+dy.gan+dy.zhi+'（'+elem+'）</b>'+
        '<br/><span style="font-size:0.82rem;color:var(--gold-pale);">'+inter+'</span>'+
        (clash?'<br/><span style="font-size:0.8rem;color:var(--red);">⚡'+clash+'</span>':'')+
        '<br/><span style="font-size:0.82rem;color:var(--text);">💡 '+advice+'</span>'+
        '</div>';
    });
    return html;
  },

  // ==== 六部古籍深度解析 ====
  _getClassicsAnalysis: function(r, bodyStrength, favorableElements) {
    var dm = r.dayMaster, element = r.dmElement;
    var favElem = favorableElements.favorable.join('、');
    var month = parseInt(document.getElementById('baziMonth1') ? document.getElementById('baziMonth1').value : '1');
    if (isNaN(month)) month = 1;

    var seasonMap = {12:'冬',1:'冬',2:'冬',3:'春',4:'春',5:'春',6:'夏',7:'夏',8:'夏',9:'秋',10:'秋',11:'秋'};
    var season = seasonMap[month] || '四季';

    // 日主在不同季节的调候参考
    var tiaoHouMap = {
      '甲':{春:'木旺，宜金修剪，配土培根。',夏:'火炎，急需水润，辅以金发水源。',秋:'金旺克木，需火制金护木，水润其根。',冬:'水冷木寒，急需火暖局，土培根。'},
      '乙':{春:'藤萝繁茂，喜癸水滋润，丙火照暖。',夏:'火旺，急需水润，忌烈火焚木。',秋:'金锐克木，丙火制金，癸水润根。',冬:'寒木向阳，丙火为尊，土培根基。'},
      '丙':{春:'回春之火，壬水辅映，光辉灿烂。',夏:'火炎土燥，急需壬水解炎，庚金发源。',秋:'金多火晦，需甲木生火，忌土重晦光。',冬:'水旺火微，急需甲木生扶，戊土制水。'},
      '丁':{春:'灯烛之火，庚甲引丁，甲木为薪。',夏:'火旺需调节，壬癸水解炎燥。',秋:'金多火弱，甲木为救，忌土晦光。',冬:'水旺火熄，甲木为尊，庚金劈甲引丁。'},
      '戊':{春:'土虚，丙火暖局，甲木疏土。',夏:'火炎土燥，急需壬癸水润局。',秋:'金多土虚，丙火生土，忌水泛滥。',冬:'水冷土冻，丙火暖局为急。'},
      '己':{春:'田园之土，丙火暖之，甲木疏之。',夏:'火炎土燥，急需癸水润泽。',秋:'金多土泄，丙火生扶，忌水湿重。',冬:'冻土难耕，丙火为先，甲木次之。'},
      '庚':{春:'金在木乡，需戊土生金，甲木引丁。',夏:'火旺金熔，急需壬癸水淬炼。',秋:'金正当令，丁火锻炼，甲木引丁。',冬:'水冷金寒，丙火暖局，戊土制水。'},
      '辛':{春:'珠玉之金，壬水淘洗，甲木生火暖局。',夏:'火旺熔金，急需壬癸水护之。',秋:'金得令旺，壬水洗之，丙火温之。',冬:'金寒水冷，丙火暖局为先。'},
      '壬':{春:'春水滔天，戊土堤防，庚金发源。',夏:'水涸，急需庚金发源，癸水助之。',秋:'金生水旺，戊土堤防，甲木泄水。',冬:'水旺极寒，丙火暖局，戊土制水。'},
      '癸':{春:'雨露之水，庚金发源，辛金助之。',夏:'水涸，急需庚辛金发源。',秋:'金多水浊，丙火调节，甲木泄之。',冬:'水冷，丙火暖局，戊土制水。'}
    };

    // 滴天髓风格
    var diTianSui = '';
    var diTianMap = {
      '甲':'甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水宕骑虎。地润天和，植立千古。',
      '乙':'乙木虽柔，刲羊解牛。怀丁抱丙，跨凤乘猴。虚湿之地，骑马亦忧。藤萝系甲，可春可秋。',
      '丙':'丙火猛烈，欺霜侮雪。能煅庚金，逢辛反怯。土众成慈，水猖显节。虎马犬乡，甲来焚灭。',
      '丁':'丁火柔中，内性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不穷。如有嫡母，可秋可冬。',
      '戊':'戊土固重，既中且正。静翕动辟，万物司命。水润物生，火燥物病。若在艮坤，怕冲宜静。',
      '己':'己土卑湿，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜帮。',
      '庚':'庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输于乙妹。',
      '辛':'辛金软弱，温润而清。畏土之多，乐水之盈。能扶社稷，能救生灵。热则喜母，寒则喜丁。',
      '壬':'壬水通河，能泄金气。刚中之德，周流不滞。通根透癸，冲天奔地。化则有情，从则相济。',
      '癸':'癸水至弱，达于天津。得龙而运，功化斯神。不愁火土，不论庚辛。合戊见火，化象斯真。'
    };
    diTianSui = diTianMap[dm] || '';
    diTianSui += ' 调候要诀：' + (tiaoHouMap[dm] ? tiaoHouMap[dm][season] : '') + ' 喜用神为' + favElem + '。';

    // 子平真诠风格
    var ziPing = '';
    var shengWoMap = {甲:'癸',乙:'壬',丙:'甲',丁:'乙',戊:'丙',己:'丁',庚:'戊',辛:'己',壬:'庚',癸:'辛'};
    var sameMap = {甲:'甲',乙:'乙',丙:'丙',丁:'丁',戊:'戊',己:'己',庚:'庚',辛:'辛',壬:'壬',癸:'癸'};

    ziPing += '以日主' + dm + '立极，月令为纲。';
    if (bodyStrength.level.indexOf('强') !== -1) {
      ziPing += '身强则需克泄耗以求平衡，喜财官食伤。格局以' + element + '为体，需制化得宜方成佳格。';
    } else {
      ziPing += '身弱则需印比帮扶，喜印绶比劫。格局以' + element + '为体，需生扶得力方能任事。';
    }
    ziPing += ' 十神配合：日主' + dm + '，印星' + (shengWoMap[dm]||'') + '为扶身之本，比劫' + (sameMap[dm]||'') + '为助身之力。凡看命先看月令提纲，次看日主盛衰，再看财官印食之配合。';

    // 穷通宝鉴风格
    var qiongTong = '';
    qiongTong = '《穷通宝鉴》以调候为第一要义。日主' + dm + '生于' + season + '季，' + (tiaoHouMap[dm] ? tiaoHouMap[dm][season] : '需结合全局判断。') + ' ';
    qiongTong += season === '夏' ? '夏日炎炎，调候以水为尊，金为水源。' : '';
    qiongTong += season === '冬' ? '冬月天寒地冻，调候以火为先，木为火源。' : '';
    qiongTong += season === '春' ? '春月木旺，调候看是否需要金来修剪或水来滋润。' : '';
    qiongTong += season === '秋' ? '秋月金旺，调候看是否需要火来暖局或水来泄金。' : '';
    qiongTong += ' 取用之法：先观月令气候，次察日主强弱，再看五行流通。调候为急，格局次之。';

    // 三命通会风格
    var sanMing = '';
    var naYinIdx = (r.yearP.ganIdx * 6 + r.yearP.zhiIdx) % 30;
    var naYin = this.naYin[naYinIdx] || '';
    sanMing += '纳音' + naYin + '之命。' + r.yearP.gan + r.yearP.zhi + '年生人，年柱为根，月柱为苗，日柱为花，时柱为果。';
    sanMing += ' 日主' + dm + '坐' + r.dayP.zhi + '，' + (r.dayP.zhi === '子' || r.dayP.zhi === '午' || r.dayP.zhi === '卯' || r.dayP.zhi === '酉' ? '日坐桃花/将星，' : '');
    if (bodyStrength.level.indexOf('强') !== -1) {
      sanMing += '身强能任财官，格局有成。终身看大运流年配合，吉凶互见。';
    } else {
      sanMing += '身弱需借运而行，运好则发，运过则收。一生起伏与行运密切相关。';
    }

    // 巾箱秘术风格
    var jinXiang = '';
    var jinXiangTips = {
      '甲':'甲逢庚克貌如花，乙见辛伤志气佳。甲木为青龙之象，逢春得令，贵气自生。',
      '乙':'乙木花草性柔嘉，丙癸相随福禄加。乙木见丙为花开，见癸为雨露滋润。',
      '丙':'丙火太阳照万家，壬水辅映最堪夸。丙火需壬水为反光之镜，方显灿烂。',
      '丁':'丁火灯烛夜生花，甲木为薪焰不斜。丁火需甲木为燃料，火不灭则福不熄。',
      '戊':'戊土厚重载山河，甲疏丙暖万物和。戊土需甲木疏松，丙火暖局。',
      '己':'己土田园细作多，丙暖癸润岁丰颇。己土细腻，丙火为阳光，癸水为雨露。',
      '庚':'庚金刚健带煞多，丁火锻炼剑新磨。庚金需丁火锻炼，方成利器。',
      '辛':'辛金珠玉光华多，壬水洗之耀星河。辛金需壬水淘洗，光芒四射。',
      '壬':'壬水江河万里波，戊土堤防不可过。壬水需戊土为堤，有约束方成江河。',
      '癸':'癸水至柔润万物，丙火照之春意度。癸水需丙火温暖，阴阳调和万物生。'
    };
    jinXiang = (jinXiangTips[dm] || '') + ' 秘术口诀：看命先看日主根气，次看财官向背，再看大运顺逆。' + element + '命之人，以' + favElem + '为命钥。';

    // 盲派断命金口诀风格
    var mangPai = '';
    var mangPaiKouJue = {
      '甲':'甲木生人最正直，心高气傲有担当。少年多动少安静，中年之后福禄长。',
      '乙':'乙木生人性格柔，多情多义善交游。一生安逸多福气，只是心软被人谋。',
      '丙':'丙火生人性气高，光明磊落领风骚。一生热闹不寂寞，只怕水多把火消。',
      '丁':'丁火生人心眼明，细处看穿不说清。与人为善多忍耐，老来福报自然成。',
      '戊':'戊土生人重信诚，埋头苦干不贪名。早年辛苦多劳碌，大器晚成享太平。',
      '己':'己土生人和气多，善解人意好商磋。一生平稳少风浪，知足常乐乐呵呵。',
      '庚':'庚金生人最刚强，是非分明不隐藏。大刀阔斧向前闯，莫因直率把人伤。',
      '辛':'辛金生人自清高，眼光挑剔品位高。一生追求完美事，只是知己世间少。',
      '壬':'壬水生人最聪明，脑筋灵活百事通。见风使舵本领大，只是有时难定性。',
      '癸':'癸水生人性情深，外表平静内乾坤。直觉灵敏悟性好，心灵手巧妙入神。'
    };

    mangPai = (mangPaiKouJue[dm] || '') + ' 盲派铁口：' + r.yearP.gan + r.yearP.zhi + '年' + this.shengXiao[r.yearP.zhiIdx] + '生，';
    mangPai += bodyStrength.level.indexOf('强') !== -1 ? '命中带强根，出门在外贵人扶。' : '命中根气稍弱，宜寻大树好乘凉。';
    mangPai += ' 喜' + favElem + '，忌反背。早中晚年看大运，三步运程定乾坤。';

    return {
      diTianSui: diTianSui,
      ziPing: ziPing,
      qiongTong: qiongTong,
      sanMing: sanMing,
      jinXiang: jinXiang,
      mangPai: mangPai
    };
  },

  // ==== 八字格局分析 ====
  _getPattern: function(r, bodyStrength) {
    var patterns = [];
    var dayMaster = r.dayMaster;
    var monthZhi = r.monthP.zhi;

    // 正格分析
    var zhengGeMap = {
      '甲':'建禄格/比肩格，甲木得寅卯月之气，自坐禄位。格局清正，有独立自主之性。',
      '乙':'建禄格/比肩格，乙木柔韧，得月令之气。灵活的适应力是最大优势。',
      '丙':'建禄格/比肩格，丙火炎上，得旺气。热情外放，适合领导型工作。',
      '丁':'建禄格/比肩格，丁火虽柔但持久，细心专注。适合研究型工作。',
      '戊':'建禄格/比肩格，戊土厚重，得令为旺。稳重可靠，大器晚成型。',
      '己':'建禄格/比肩格，己土细腻，包容力强。适合服务和支持型角色。',
      '庚':'建禄格/比肩格，庚金刚锐，得令有威。执行力一流，适合技术和管理。',
      '辛':'建禄格/比肩格，辛金精巧，得时有光。审美和品味出众，适合精致行业。',
      '壬':'建禄格/比肩格，壬水通源，得令气势大。格局开阔，适合大平台发展。',
      '癸':'建禄格/比肩格，癸水至柔，得时内秀。内敛有深度，适合思考和创作。'
    };

    // 特殊格局检测
    var hasSpecial = false;

    // Check if 从格 (following pattern)
    var shengWoMap = {甲:'癸',乙:'壬',丙:'甲',丁:'乙',戊:'丙',己:'丁',庚:'戊',辛:'己',壬:'庚',癸:'辛'};
    var sameMap = {甲:'甲',乙:'乙',丙:'丙',丁:'丁',戊:'戊',己:'己',庚:'庚',辛:'辛',壬:'壬',癸:'癸'};

    var supportCount = 0;
    var pillars = [r.yearP, r.monthP, r.dayP, r.hourP];
    pillars.forEach(function(p) {
      var elem = this.wuXingMap[p.gan];
      if (elem === r.dmElement) supportCount++;
      else if (shengWoMap[dayMaster] && this.wuXingMap[shengWoMap[dayMaster]] === elem) supportCount++;
    }.bind(this));

    // 从强格: 几乎全是帮扶
    if (supportCount >= 3 && bodyStrength.level.indexOf('强') !== -1) {
      patterns.push('命局有<b>从强格</b>倾向：日主极旺，顺势而为，不畏克泄。这种格局的人往往在某一领域有超常天赋。');
      hasSpecial = true;
    }
    // 从弱格: 几乎没有帮扶
    else if (supportCount <= 1 && bodyStrength.level.indexOf('弱') !== -1) {
      patterns.push('命局有<b>从弱格</b>倾向：日主极弱而从，宜顺势配合他人，借助外力成功。这种格局的人往往善于借力和合作。');
      hasSpecial = true;
    }

    // 化格检测 (simplified: check if day master and month stem form a combination)
    var huaMap = {甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
    if (huaMap[dayMaster] === r.monthP.gan) {
      patterns.push('日主与月干<b>天干五合</b>，有化气之象。若得时得地，可成化气格。人际关系和合作运较强。');
    }

    // 月令格局
    var monthPattern = zhengGeMap[dayMaster] || '';
    patterns.push('月令格局：' + monthPattern);

    // 格局层次判断
    var level, levelDesc;
    if (hasSpecial || supportCount >= 3) { level = '上等'; levelDesc = '命局有特殊格局之象，人生上限较高，适合在自己擅长的领域深耕。'; }
    else if (supportCount >= 2) { level = '中等'; levelDesc = '命局结构正常，人生发展靠后天努力，稳扎稳打可获不错的成就。'; }
    else { level = '需调和'; levelDesc = '命局偏颇较大，需要注意五行平衡。但偏颇之中也有独特之处，找到适合的方向可化劣势为优势。'; }

    return {patterns: patterns, level: level, levelDesc: levelDesc};
  },

  // ==== 动态健康分析 ====
  _getHealthAnalysis: function(r, bodyStrength, wxCount) {
    var h = [];
    var map={木:{o:'肝胆',t:'避免熬夜和过量饮酒。多吃绿色蔬菜，春季需格外关注。'},火:{o:'心脏、血液循环',t:'保持情绪稳定，避免过度激动。多吃红色食物，夏季注意防暑。'},土:{o:'脾胃消化',t:'饮食规律，避免暴饮暴食。黄色食物（小米、南瓜）养胃。'},金:{o:'肺和呼吸道',t:'避免吸烟和空气污染。白色食物（银耳、百合）润肺，秋季防燥。'},水:{o:'肾脏和泌尿系统',t:'保持充足饮水，黑色食物（黑豆、芝麻）补肾。冬季保暖。'}};
    h.push('<p><b>先天关注：</b>日主'+r.dmElement+'，'+map[r.dmElement].o+'系统是先天需要重点关注的。'+map[r.dmElement].t+'</p>');

    var over=[], miss=[];
    Object.keys(wxCount).forEach(function(k){if(wxCount[k]>=3)over.push(k);if(wxCount[k]===0)miss.push(k);});
    if (over.length) h.push('<p><b>⚠ 过旺风险：</b>'+over.map(function(e){return e+'过旺→'+map[e].o+'负担较重。';}).join('')+'</p>');
    if (miss.length) h.push('<p><b>💡 缺失提醒：</b>'+miss.map(function(e){return '缺'+e+'→需关注'+map[e].o+'功能，可通过饮食和环境补益。';}).join('')+'</p>');

    // 地支冲克健康提示
    var clashTips={子午:'心肾不交，注意失眠和血压',卯酉:'肝胆和呼吸道需注意',寅申:'筋骨和神经系统',巳亥:'内分泌和代谢',辰戌:'消化系统',丑未:'脾胃湿气'};
    var zhis=[r.yearP.zhi,r.monthP.zhi,r.dayP.zhi,r.hourP.zhi];
    for (var i=0;i<zhis.length;i++) for (var j=i+1;j<zhis.length;j++){
      var key=[zhis[i],zhis[j]].sort().join(''); var key2=[zhis[j],zhis[i]].sort().join('');
      if (clashTips[key]) h.push('<p><b>🔺 地支相冲：</b>'+zhis[i]+zhis[j]+'相冲 — '+clashTips[key]+'。</p>');
    }

    h.push('<p style="font-size:0.78rem;color:var(--text-muted);">以上为五行健康参考，如有不适请及时就医。</p>');
    return h.join('');
  },

  // ==== 注意事项 ====
  _getCautions: function(r, bodyStrength, wxCount) {
    var cautions = [];

    // 身强身弱注意事项
    if (bodyStrength.level.indexOf('强') !== -1) {
      cautions.push('身强之人需注意控制脾气和强势倾向，多听取他人意见，避免独断专行。');
      cautions.push('职场中学会授权和团队合作，不必事事亲力亲为。');
    } else if (bodyStrength.level.indexOf('弱') !== -1) {
      cautions.push('身弱之人需注意精力管理，避免同时做太多事情，聚焦最重要的一两件事即可。');
      cautions.push('学会借助贵人和平台的力量，不要独自承担过重的责任。');
    }

    // 五行失衡提醒
    var overElements = [];
    Object.keys(wxCount).forEach(function(k) {
      if (wxCount[k] >= 3) overElements.push(k);
    });

    var overCautionMap = {
      '木':'木过旺需注意情绪波动和肝火旺盛，适当练习静坐或瑜伽平衡身心。',
      '火':'火过旺需注意焦虑和急躁情绪，多接触大自然和水景来降火。',
      '土':'土过旺需注意思维固执和行动迟缓，多尝试新事物保持灵活性。',
      '金':'金过旺需注意锋芒太露和人际摩擦，学会柔和的沟通方式。',
      '水':'水过旺需注意优柔寡断和精力分散，建立明确的目标和执行计划。'
    };

    overElements.forEach(function(e) {
      if (overCautionMap[e]) cautions.push(overCautionMap[e]);
    });

    // 生肖注意事项
    var clashMonths = {
      '鼠':'农历五月注意口舌是非。','牛':'农历六月注意健康波动。','虎':'农历七月注意出行安全。',
      '兔':'农历八月注意人际关系。','龙':'农历九月注意财务规划。','蛇':'农历十月注意情绪管理。',
      '马':'农历十一月注意家庭关系。','羊':'农历十二月注意休息充电。','猴':'农历正月注意计划执行。',
      '鸡':'农历二月注意沟通表达。','狗':'农历三月注意变动调整。','猪':'农历四月注意投资谨慎。'
    };
    var sxName = this.shengXiao[r.yearP.zhiIdx];
    if (clashMonths[sxName]) cautions.push('生肖' + sxName + '：' + clashMonths[sxName]);

    // 大运流年提醒
    cautions.push('人生选择大于努力，关键节点（择业、婚姻、投资）请三思而后行，结合实际情况做出最适合自己的决定。');

    var html = '';
    cautions.forEach(function(c, i) {
      html += '<p style="padding:0.25rem 0;">' + (i + 1) + '. ' + c + '</p>';
    });

    return html;
  },

  _getDayMasterAnalysis: function(r) {
    var dm=r.dayMaster,elem=r.dmElement;
    var ps=[r.yearP,r.monthP,r.dayP,r.hourP];
    var dts=BaziClassics.diTianSui[dm]||'';
    var dtsBH=BaziClassics.diTianSuiBaiHua[dm]||'';

    // 日主根气分析
    var rootCount=0;ps.forEach(function(p){if((p.zhi==='寅'||p.zhi==='卯')&&elem==='木')rootCount++;if((p.zhi==='巳'||p.zhi==='午')&&elem==='火')rootCount++;if((p.zhi==='申'||p.zhi==='酉')&&elem==='金')rootCount++;if((p.zhi==='亥'||p.zhi==='子')&&elem==='水')rootCount++;if((p.zhi==='辰'||p.zhi==='戌'||p.zhi==='丑'||p.zhi==='未')&&elem==='土')rootCount++;});
    var rootDesc=rootCount>=3?'日主根气深厚，意志坚定不易动摇。':(rootCount>=1?'日主有根气，有一定主见和定力。':'日主无根，性格灵活多变，适应力强。');

    // 日支夫妻宫分析
    var dayZhi=r.dayP.zhi, dayZhiElem=this.wuXingMap[dayZhi];
    var zhiDesc='日坐'+dayZhi+'（夫妻宫），';
    var zhiMap={子:'配偶聪明灵活但情绪波动大',丑:'配偶踏实稳重，家庭观念强',寅:'配偶独立有个性，事业心强',卯:'配偶温和细腻，有艺术气质',辰:'配偶包容力强，有管理才能',巳:'配偶热情积极，社交能力强',午:'配偶开朗大方，有领导气质',未:'配偶温和善良，重视家庭',申:'配偶聪明果敢，执行力强',酉:'配偶精致注重细节，有品味',戌:'配偶忠诚可靠，有责任心',亥:'配偶聪慧灵活，善解人意'};
    zhiDesc+=zhiMap[dayZhi]||'配偶特质需结合全局看';

    // 五行缺失影响
    var wx=r.wxCount, weak=[],strong=[];
    Object.keys(wx).forEach(function(k){if(wx[k]===0)weak.push(k);if(wx[k]>=3)strong.push(k);});
    var wuDesc='';
    if(weak.length)wuDesc=' 五行缺'+weak.join('、')+'，在生活中可多接触相关元素补益。';
    if(strong.length)wuDesc+=' '+strong.join('、')+'元素偏旺，需留意对应脏腑和运势。';

    // 十天干特殊
    var special='';
    if(dm==='甲'&&r.wxCount['火']>=2)special='甲木见火为发荣，才华有展现的舞台。';
    if(dm==='丙'&&r.wxCount['水']>=2)special='丙火得水既济，刚柔并济为贵。';
    if(dm==='庚'&&r.wxCount['火']>=1)special='庚金得火锻炼，可成利器。';
    if(dm==='壬'&&r.wxCount['木']>=2)special='壬水得木泄秀，才华横溢。';

    return dtsBH+' '+rootDesc+' '+zhiDesc+wuDesc+' '+special;
  }
};

// 地址变化时更新真太阳时
document.addEventListener('change', function(e) {
  if (e.target && e.target.id && e.target.id.indexOf('bazi') === 0 &&
      (e.target.id.indexOf('Province') > -1 || e.target.id.indexOf('City') > -1 ||
       e.target.id.indexOf('Hour') > -1 || e.target.id.indexOf('Minute') > -1)) {
    var prefix = e.target.id.replace('bazi','').replace(/[^0-9AB]/g,'');
    if (BaziModule._updateTrueSolar) BaziModule._updateTrueSolar(prefix);
  }
});
