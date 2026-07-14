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
    var sheng = {木:'火',火:'土',土:'金',金:'水',水:'木'};
    var ke = {木:'土',土:'水',水:'火',火:'金',金:'木'};
    var aElem = a.dmElement, bElem = b.dmElement;

    var relation = '', score = 0;
    if (sheng[aElem] === bElem) { relation = a.name + '生助' + b.name + '，' + a.name + '付出较多。'; score = 75; }
    else if (sheng[bElem] === aElem) { relation = b.name + '生助' + a.name + '，' + b.name + '付出较多。'; score = 75; }
    else if (ke[aElem] === bElem) { relation = a.name + '克制' + b.name + '，关系中需注意张力。'; score = 55; }
    else if (ke[bElem] === aElem) { relation = b.name + '克制' + a.name + '，关系中需注意张力。'; score = 55; }
    else if (aElem === bElem) { relation = '五行相同，性格相似，互相理解但也可能竞争。'; score = 70; }
    else { relation = '没有直接生克关系，关系平和。'; score = 65; }

    var aSx = a.yearP.zhiIdx, bSx = b.yearP.zhiIdx;
    var clashPairs = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
    var isClash = false;
    clashPairs.forEach(function(pair) {
      if ((aSx === pair[0] && bSx === pair[1]) || (aSx === pair[1] && bSx === pair[0])) isClash = true;
    });
    if (isClash) { relation += ' ⚠ 生肖相冲，需更多包容。'; score -= 15; }

    var shengxiaoCompat = {
      '鼠':['牛','龙','猴'],'牛':['鼠','蛇','鸡'],'虎':['马','狗','猪'],'兔':['羊','狗','猪'],
      '龙':['鼠','猴','鸡'],'蛇':['牛','鸡','猴'],'马':['虎','羊','狗'],'羊':['兔','马','猪'],
      '猴':['鼠','龙','蛇'],'鸡':['牛','龙','蛇'],'狗':['虎','兔','马'],'猪':['虎','兔','羊']
    };
    var aSxName = this.shengXiao[aSx], bSxName = this.shengXiao[bSx];
    var compatList = shengxiaoCompat[aSxName] || [];
    if (compatList.indexOf(bSxName) !== -1) { relation += ' ✅ 生肖相合，缘分不错。'; score += 10; }

    return {relation: relation, score: Math.max(0, Math.min(100, score))};
  },

  calculate: function() {
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
    var self = this;
    var ctn = document.getElementById('baziResult');
    if (!ctn) return;
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

    // 穷通宝鉴调候
    var tiaoHou = BaziClassics.getTiaoHou(r.dayMaster, r.monthP.zhiIdx >= 2 ? ((r.monthP.zhiIdx-1)%12+1) : (r.monthP.zhiIdx+11));
    // 滴天髓体性
    var dts = BaziClassics.diTianSui[r.dayMaster]||'';
    var dtsBH = BaziClassics.diTianSuiBaiHua[r.dayMaster]||'';

    var freeHtml = '<div class=\"result-header\">☯️ ' + r.name + ' 八字排盘</div>' + infoHtml +
      '<div class=\"analysis-card\" style=\"background:linear-gradient(135deg,rgba(201,169,110,0.06),rgba(201,169,110,0.02));border-left:3px solid var(--gold);\"><h4>📜 《滴天髓》论' + r.dayMaster + '</h4>' +
        '<p style=\"font-family:KaiTi,serif;font-size:1.05rem;color:var(--gold-pale);line-height:1.8;\">' + dts + '</p>' +
        '<p style=\"color:var(--text);\">' + dtsBH + '</p></div>' +
      '<div class=\"analysis-card\"><h4>🌡️ 《穷通宝鉴》调候</h4>' +
        '<p>日主' + tiaoHou.desc + '生于' + tiaoHou.season + '季，调候用神：<b style=\"color:var(--gold);\">' + (tiaoHou.yongShen||'需结合全局') + '</b></p>' +
        '<p style=\"font-size:0.85rem;\">《穷通宝鉴》云：先看季节冷暖，再论旺衰。调候为八字第一急务。</p></div>';

    var paidHtml =
      '<div class=\"analysis-card\"><h4>📊 第一步：判定旺衰</h4>' +
        '<p><b>日主' + r.dayMaster + '（五行' + r.dmElement + '）</b>，生于<b>' + self.diZhi[r.monthP.zhiIdx] + '月</b>。</p>' +
        '<p><b>五行统计：</b></p>' + wxBars +
        '<p style="margin-top:0.5rem;"><b>判定依据：</b>' +
          '月令' + self.diZhi[r.monthP.zhiIdx] + '月' +
          (bodyStrength.total >= 4 ? '生扶日主有力（得令），' :
           bodyStrength.total >= 2.5 ? '对日主有一定帮扶，' :
           '不帮日主（失令），') +
          '同元素' + bodyStrength.same + '个，生扶元素' + bodyStrength.sheng + '个。' +
        '</p>' +
        '<p style="text-align:center;font-size:1.3rem;font-weight:bold;color:var(--gold);">结论：<b>' + bodyStrength.level + '</b></p>' +
        '<p>' + bodyStrength.desc + '</p>' +
        '<p style="font-size:0.85rem;color:var(--text-secondary);">💡 用神方向：' + bodyStrength.advice + '</p>' +
      '</div>' +

      // ====== 第2步：定调候用神 ======
      '<div class="analysis-card"><h4>🌡️ 第二步：定调候用神（优先级最高）</h4>' +
        '<p>《穷通宝鉴》云：先看季节冷暖，再论旺衰。调候为八字第一急务。</p>' +
        '<p><b>日主' + r.dayMaster + '生于' +
          (r.monthP.zhiIdx >= 2 && r.monthP.zhiIdx <= 4 ? '春季（木旺），' :
           r.monthP.zhiIdx >= 5 && r.monthP.zhiIdx <= 7 ? '夏季（火旺），需优先用水润局、金发水源。' :
           r.monthP.zhiIdx >= 8 && r.monthP.zhiIdx <= 10 ? '秋季（金旺），需优先用火暖局、木生火。' :
           '冬季（水旺），需优先用火暖局、木生火。') +
        '</b></p>' +
        '<p><b>喜用神：</b>' + favorableElements.favorable.join('、') + '。' +
        (favorableElements.favorable.length > 0 ?
          '生活中多接触' + favorableElements.favorable.join('、') + '五行相关的事物可补益运势。' :
          '需结合具体大运流年取用。') +
        '</p>' +
      '</div>' +

      // ====== 第3步：排布十神 ======
      '<div class="analysis-card"><h4>🔗 第三步：排布十神（以日主' + r.dayMaster + '为中心）</h4>' +
        '<p style="font-size:0.85rem;color:var(--text-secondary);">十神口诀：生我者印星，我生者食伤，克我者官杀，我克者财星，同我者比劫。</p>' +
        '<table style="width:100%;font-size:0.85rem;margin-top:0.4rem;">' +
          '<tr><th>柱位</th><th>天干</th><th>十神</th></tr>' + ssHtml +
        '</table>' +
        '<p style="margin-top:0.4rem;font-size:0.85rem;">💡 所有人生事项全部由十神组合判断：<b>官杀=事业压力贵人、财星=钱财异性、食伤=才华口才、印星=学业长辈、比劫=朋友竞争</b>。</p>' +
      '</div>' +

      // ====== 第4步：定格局 ======
      '<div class="analysis-card"><h4>🏛️ 第四步：定格局，看人生层次</h4>' +
        '<p style="text-align:center;font-size:1.1rem;color:var(--gold);font-weight:bold;">格局层次：' + pattern.level + '</p>' +
        '<p>' + pattern.levelDesc + '</p>' +
        patternDesc +
      '</div>' +

      // ====== 第5步：大运流年 ======
      '<div class="analysis-card"><h4>📅 第五步：大运走势（每步10年）</h4>' +
        '<p style="font-size:0.85rem;color:var(--text-secondary);">大运干支与原局产生生克冲合刑害，决定十年整体吉凶。</p>' +
        daYunHtml +
        '<p style="font-size:0.82rem;color:var(--text-muted);">流年干支每年一变，与大运、原局互动，断当年具体事件。</p>' +
      '</div>' +

      // 大运详细分析
      '<div class="analysis-card"><h4>📅 每步大运详解</h4>' + detailedDaYun + '</div>' +

      // ====== 第6步：专项断事 ======
      '<div class="analysis-card"><h4>🎯 第六步：专项断事</h4></div>' +

      // 事业
      '<div class="analysis-card"><h5>💼 事业分析</h5><p>' + careerAnalysis + '</p>' +
        '<p style="font-size:0.85rem;"><b>🧭 适合方位：</b>' + bestDir + '</p>' +
        '<p style="font-size:0.85rem;"><b>🏭 适合行业：</b>' + industries + '</p>' +
      '</div>' +

      // 财运
      '<div class="analysis-card"><h5>💰 财运</h5><p>' +
        (bodyStrength.level.indexOf('强') !== -1 ?
          '身强能任财星，财运基础较好，有存钱和投资能力。' :
          '身弱不胜财，需待帮身大运方能得财。平时宜守不宜攻，理财以稳健为主。') +
        (r.wxCount['金'] >= 2 || r.wxCount['水'] >= 2 ? ' 命局财星有根，中年走财运时收入明显提升。' : '') +
        (r.wxCount[r.dmElement] >= 3 ? ' 比劫较旺，注意合伙投资风险，防止朋友借钱不还或利润被分走。' : '') +
      '</p></div>' +

      // 婚姻
      '<div class="analysis-card"><h5>💕 婚姻</h5><p>' +
        (r.gender === '男' ?
          '男命以财星为妻，' + (r.wxCount['金'] >= 1 || r.wxCount['水'] >= 1 || r.wxCount['火'] >= 1 ? '命局有财星，正缘不缺席。' : '财星较弱，正缘来得稍晚，35岁前后机会更大。') :
          '女命以官杀为夫，' + (r.wxCount['金'] >= 1 || r.wxCount['火'] >= 1 ? '命局官星有气，夫缘尚可。' : '官星偏弱，适合晚婚，先立业后成家更稳妥。')) +
        (r.wxCount[r.dmElement] >= 3 ? ' 比劫旺感情中易遇竞争，需用心经营、保持信任。' : '') +
      '</p></div>' +

      // 健康
      '<div class="analysis-card"><h5>🏥 健康</h5>' + healthAnalysis + '</div>' +

      // 注意事项
      '<div class="analysis-card"><h5>⚠️ 注意事项与化解</h5>' + cautions + '</div>' +

      // 人生起伏
      '<div class="analysis-card"><h4>📈 人生起伏</h4><p style="line-height:1.8;">' + lifeTraj + '</p></div>' +

      // 名字与八字
      '<div class="analysis-card"><h4>📛 名字与八字</h4>' + nameAnalysis + '</div>' +

      // 结尾赠言
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
  },

  _renderDual: function(a, b, compat) {
    var ctn = document.getElementById('baziResult');
    ctn.style.display = 'block';
    ctn.innerHTML =
      '<div class="result-header">👫 双人合盘</div>' +
      '<div style="display:flex;gap:1rem;flex-wrap:wrap;">' +
        '<div style="flex:1;min-width:200px;padding:0.5rem;background:var(--bg-card);border-radius:var(--radius-sm);">' +
          '<b>' + a.name + '</b> ' + a.gender + '<br/>日主：' + a.dayMaster + '（' + a.dmElement + '）<br/>' +
          '八字：' + a.yearP.gan + a.yearP.zhi + ' ' + a.monthP.gan + a.monthP.zhi + ' ' + a.dayP.gan + a.dayP.zhi + ' ' + a.hourP.gan + a.hourP.zhi +
        '</div>' +
        '<div style="flex:1;min-width:200px;padding:0.5rem;background:var(--bg-card);border-radius:var(--radius-sm);">' +
          '<b>' + b.name + '</b> ' + b.gender + '<br/>日主：' + b.dayMaster + '（' + b.dmElement + '）<br/>' +
          '八字：' + b.yearP.gan + b.yearP.zhi + ' ' + b.monthP.gan + b.monthP.zhi + ' ' + b.dayP.gan + b.dayP.zhi + ' ' + b.hourP.gan + b.hourP.zhi +
        '</div>' +
      '</div>' +
      '<div class="analysis-card"><h4>💞 合盘分析</h4>' +
        '<p>' + compat.relation + '</p>' +
        '<p style="text-align:center;font-size:1.5rem;">匹配度：<b style="color:var(--gold);">' + compat.score + '%</b></p>' +
      '</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.74rem;">合盘分析仅供参考，感情更需用心经营</p>' +
      '<button class="btn-secondary" onclick="BaziModule.close()">🔙 返回</button>';
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
    var self=this, shengMap={木:'水',火:'木',土:'火',金:'土',水:'金'};
    var keMap={木:'土',火:'金',土:'水',金:'木',水:'火'};
    var dm=r.dmElement, html='';

    var stageNames=['童年筑基','少年求学','青年立业','壮年腾飞','中年鼎盛','知命守成','花甲转型','古稀安享'];
    var favorableInd=['教育、文化、医疗','互联网、能源、传媒','地产、建筑、农业','金融、制造、法律','贸易、物流、旅游','科技、设计、咨询','公益、教育、顾问','养生、文化、传承'];

    daYun.forEach(function(dy, idx) {
      var elem=self.wuXingMap[dy.gan], isFav=false;
      if (bodyStrength.level.indexOf('强')!==-1){if(elem!==dm&&shengMap[dm]!==elem)isFav=true;}
      else{if(elem===dm||shengMap[dm]===elem)isFav=true;}

      // 元素互动描述
      var inter='';
      if (shengMap[dm]===elem) inter='印星大运，生扶日主，利学业、贵人、房产和长辈助力。';
      else if (shengMap[dm]&&self.wuXingMap[shengMap[dm]]===elem) inter=''; // 间接
      else if (elem===dm) inter='比劫大运，同辈助力，适合合作、团队和拓展人脉。但需注意竞争和破财。';
      else if (keMap[dm]===elem) inter='财星大运，财运上升期，适合投资、经营和开拓收入来源。';
      else if (shengMap[elem]===dm) inter='食伤大运，才华展现期，适合创新、表达和技术提升。注意口舌是非。';
      else inter='官杀大运，事业压力和机遇并存，适合争取职位晋升。注意健康和工作强度。';

      var icon=isFav?'✅':'⚠️', label=isFav?'吉':'平';
      var advice='';
      if (isFav) advice='此运有利，建议积极把握。适合'+favorableInd[idx]+'方向。';
      else advice='此运需稳扎稳打，不宜冒进。重点在积累和准备，等待下一波好运。';

      html+='<div style="padding:0.4rem 0;border-bottom:1px solid var(--border-subtle);">'+
        '<b>'+icon+' '+dy.age+'岁 '+dy.gan+dy.zhi+'（'+elem+'）'+label+' — '+stageNames[idx]+'</b>'+
        '<br/><span style="font-size:0.82rem;color:var(--gold-pale);">'+inter+'</span>'+
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

  _getDayMasterAnalysis: function(dm, element, wxCount) {
    var analyses = {
      '甲':'日主甲木，如参天大树，正直向上，有领导才能。适合管理岗位。木主仁，为人仁德有担当。',
      '乙':'日主乙木，如藤萝花草，柔韧适应力强。外表柔和内心坚韧，有艺术天赋。',
      '丙':'日主丙火，如烈日当空，热情开朗有感染力。火主礼，注重礼仪形式。需防急躁冲动。',
      '丁':'日主丁火，如灯烛之光，温和内敛持久。心思细腻直觉敏锐，适合细致工作。',
      '戊':'日主戊土，如城墙大地，厚重沉稳有包容力。土主信，重承诺守信义。',
      '己':'日主己土，如田园之土，温和滋养，善于照顾他人。谦逊踏实可靠。',
      '庚':'日主庚金，如刀剑利器，刚毅果敢执行力强。金主义，重义气有原则。',
      '辛':'日主辛金，如珠宝首饰，精致细腻追求完美。外表冷静内心丰富。',
      '壬':'日主壬水，如江河大海，豁达大气思维开阔。水主智，聪明好学善于应变。',
      '癸':'日主癸水，如雨露甘泉，柔美细腻直觉力强。内心丰富善于观察，有灵性。'
    };
    var base = analyses[dm] || '日主' + dm + '，五行属' + element + '。';
    var weakElements = [], strongElements = [];
    Object.keys(wxCount).forEach(function(k) {
      if (wxCount[k] === 0) weakElements.push(k);
      if (wxCount[k] >= 3) strongElements.push(k);
    });
    var extra = '';
    if (weakElements.length > 0) extra += ' 缺少' + weakElements.join('、') + '元素，可多接触相关事物补足。';
    if (strongElements.length > 0) extra += ' ' + strongElements.join('、') + '偏旺，需留意相关运势。';
    return base + extra;
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
