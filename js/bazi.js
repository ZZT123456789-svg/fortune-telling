/**
 * 八字排盘 — 真太阳时、单人/双人模式、多维度分析
 */
var BaziModule = {
  currentMode: 'single',

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
    if (prov === '北京' || prov === '上海' || prov === '天津' || prov === '重庆') {
      return this.cityLongitudes[prov] || 116;
    }
    if (city && this.cityLongitudes[city]) return this.cityLongitudes[city];
    if (prov && this.cityLongitudes[prov]) return this.cityLongitudes[prov];
    var provLong = {
      '黑龙江':126.6,'吉林':125.3,'辽宁':123.4,'内蒙古':111.7,'河北':114.5,'山西':112.5,
      '山东':117.0,'江苏':118.8,'浙江':120.2,'安徽':117.3,'江西':115.9,'福建':119.3,
      '河南':113.7,'湖北':114.3,'湖南':113.0,'广东':113.3,'广西':108.3,'海南':110.3,
      '四川':104.1,'贵州':106.7,'云南':102.7,'西藏':91.1,'陕西':108.9,'甘肃':103.8,
      '青海':101.8,'宁夏':106.3,'新疆':87.6
    };
    return provLong[prov] || 116;
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

  /** 年柱 */
  _getYearPillar: function(year) {
    var baseYear = 2024, baseGan = 0, baseZhi = 4;
    var diff = year - baseYear;
    var ganIdx = ((baseGan + diff) % 10 + 10) % 10;
    var zhiIdx = ((baseZhi + diff) % 12 + 12) % 12;
    return {gan: this.tianGan[ganIdx], zhi: this.diZhi[zhiIdx], ganIdx: ganIdx, zhiIdx: zhiIdx};
  },

  /** 月柱 */
  _getMonthPillar: function(yearGanIdx, month) {
    var monthStartGan = [2, 4, 6, 8, 0];
    var group = yearGanIdx % 5;
    var startGan = monthStartGan[group];
    var zhiIdx = (month + 1) % 12;
    var ganIdx = (startGan + month - 1) % 10;
    return {gan: this.tianGan[ganIdx], zhi: this.diZhi[zhiIdx], ganIdx: ganIdx, zhiIdx: zhiIdx};
  },

  /** 日柱 */
  _getDayPillar: function(year, month, day) {
    var ref = new Date(2024, 0, 1);
    var target = new Date(year, month - 1, day);
    var diffDays = Math.floor((target - ref) / 86400000);
    var ganIdx = ((diffDays % 10) + 10) % 10;
    var zhiIdx = ((diffDays % 12) + 12) % 12;
    return {gan: this.tianGan[ganIdx], zhi: this.diZhi[zhiIdx], ganIdx: ganIdx, zhiIdx: zhiIdx};
  },

  /** 时柱 */
  _getHourPillar: function(dayGanIdx, hour) {
    var hourStartGan = [0, 2, 4, 6, 8];
    var group = dayGanIdx % 5;
    var startGan = hourStartGan[group];
    var zhiIdx = Math.floor((hour + 1) / 2) % 12;
    var ganIdx = (startGan + zhiIdx) % 10;
    return {gan: this.tianGan[ganIdx], zhi: this.diZhi[zhiIdx], ganIdx: ganIdx, zhiIdx: zhiIdx};
  },

  _getShiShen: function(dayGan, otherGan) {
    var sameMap = {甲:'甲',乙:'乙',丙:'丙',丁:'丁',戊:'戊',己:'己',庚:'庚',辛:'辛',壬:'壬',癸:'癸'};
    var shengMap = {甲:'丙',乙:'丁',丙:'戊',丁:'己',戊:'庚',己:'辛',庚:'壬',辛:'癸',壬:'甲',癸:'乙'};
    var keMap = {甲:'戊',乙:'己',丙:'庚',丁:'辛',戊:'壬',己:'癸',庚:'甲',辛:'乙',壬:'丙',癸:'丁'};
    var shengWoMap = {甲:'癸',乙:'壬',丙:'甲',丁:'乙',戊:'丙',己:'丁',庚:'戊',辛:'己',壬:'庚',癸:'辛'};
    var keWoMap = {甲:'庚',乙:'辛',丙:'壬',丁:'癸',戊:'甲',己:'乙',庚:'丙',辛:'丁',壬:'戊',癸:'己'};

    if (otherGan === shengMap[dayGan]) return '食神/伤官';
    if (otherGan === keMap[dayGan]) return '正财/偏财';
    if (otherGan === shengWoMap[dayGan]) return '正印/偏印';
    if (otherGan === keWoMap[dayGan]) return '正官/七杀';
    if (otherGan === sameMap[dayGan]) return '比肩/劫财';
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
    var ts = this._calcTrueSolar(year, month, day, hour, minute, prefix);
    var trueHour = ts.hour;

    var yearP = this._getYearPillar(year);
    var monthP = this._getMonthPillar(yearP.ganIdx, month);
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
      var result = this._analyzeSingle(name, gender, year, month, day, hour, minute, '1');
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
    ctn.style.display = 'block';

    // 运行全部分析
    var bodyStrength = this._judgeBodyStrength(r);
    var favorableElements = this._getFavorableElements(r, bodyStrength);
    var careerAnalysis = this._getCareerAnalysis(r, bodyStrength);
    var bestDir = this._getBestDirection(r, favorableElements);
    var industries = this._getSuitableIndustries(r, favorableElements);
    var lifeTraj = this._getLifeTrajectory(r, r.daYun, bodyStrength);
    var nameAnalysis = this._getNameBaziRelation(r.name, r, bodyStrength, favorableElements);
    var detailedDaYun = this._getDetailedDaYun(r, r.daYun, bodyStrength);

    // 四柱表
    var tableHtml = '<table class="pillar-table"><thead><tr><th>柱</th><th>天干</th><th>地支</th><th>五行</th></tr></thead><tbody>' +
      this._buildPillarHtml('年柱', r.yearP) +
      this._buildPillarHtml('月柱', r.monthP) +
      '<tr style="background:rgba(201,169,110,0.1);">' +
        '<td class="pillar-col">日柱<span class="day-master-label">(日主)</span></td>' +
        '<td class="gan-char day-master">' + r.dayP.gan + '</td>' +
        '<td class="zhi-char">' + r.dayP.zhi + '</td>' +
        '<td style="font-size:0.78rem;">' + r.dmElement + '</td></tr>' +
      this._buildPillarHtml('时柱', r.hourP) +
      '</tbody></table>';

    // 五行图
    var wxMax = Math.max(1, r.wxCount['金'], r.wxCount['木'], r.wxCount['水'], r.wxCount['火'], r.wxCount['土']);
    var wxBars = '';
    var wxColors = {金:'#e8c040',木:'#4a9',水:'#59c',火:'#e55',土:'#da5'};
    ['金','木','水','火','土'].forEach(function(k) {
      var pct = Math.round(r.wxCount[k] / wxMax * 100);
      wxBars += '<div class="wx-bar-row"><span class="wx-label">' + k + '</span>' +
        '<div class="wx-bar-track"><div class="wx-bar-fill" style="width:' + pct + '%;background:' + wxColors[k] + ';"></div></div>' +
        '<span class="wx-count">' + r.wxCount[k] + '</span></div>';
    });

    // 十神
    var labels = ['年柱','月柱','日柱','时柱'];
    var ssHtml = '';
    labels.forEach(function(l, i) {
      ssHtml += '<span style="padding:0 0.25rem;">' + l + ': <b>' + (r.shiShen[i].ganSS || '日主') + '</b></span>';
    });

    var dmAnalysis = this._getDayMasterAnalysis(r.dayMaster, r.dmElement, r.wxCount);
    var favElemStr = favorableElements.favorable.join('、');

    ctn.innerHTML =
      '<div class="result-header">☯️ ' + r.name + ' 八字排盘</div>' +
      '<div style="text-align:center;padding:0.3rem;color:var(--text-secondary);">' +
        r.gender + ' · ' + r.yearP.gan + r.yearP.zhi + '年（' + self.shengXiao[r.yearP.zhiIdx] + '）· 纳音：' + r.naYin +
      '</div>' +
      '<div style="text-align:center;font-size:0.82rem;color:var(--gold);">' +
        '🌞 真太阳时：' + String(r.trueSolar.hour).padStart(2,'0') + ':' + String(r.trueSolar.minute).padStart(2,'0') +
        '（经度' + (r.trueSolar.lngCorrection >= 0 ? '+' : '') + r.trueSolar.lngCorrection + '分 + 均时差' +
        (r.trueSolar.eot >= 0 ? '+' : '') + r.trueSolar.eot + '分）</div>' +
      tableHtml +

      // 身强弱
      '<div class="analysis-card"><h4>⚖️ 身强弱判断</h4>' +
        '<p style="text-align:center;font-size:1.3rem;font-weight:bold;color:var(--gold);">' + bodyStrength.level + '</p>' +
        '<p>' + bodyStrength.desc + '</p>' +
        '<p style="font-size:0.85rem;color:var(--text-secondary);">💡 ' + bodyStrength.advice + '</p>' +
        '<p style="font-size:0.8rem;color:var(--gold);">喜用神：' + favElemStr + '</p>' +
      '</div>' +

      // 日主分析
      '<div class="analysis-card"><h4>🎯 日主分析</h4><p>' + dmAnalysis + '</p></div>' +

      // 事业分析
      '<div class="analysis-card"><h4>💼 事业分析</h4><p>' + careerAnalysis + '</p>' +
        '<p style="font-size:0.85rem;"><b>🧭 适合发展方位：</b>' + bestDir + '</p>' +
        '<p style="font-size:0.85rem;"><b>🏭 适合行业方向：</b>' + industries + '</p>' +
      '</div>' +

      // 五行分布
      '<div class="analysis-card"><h4>📊 五行分布</h4>' + wxBars + '</div>' +

      // 十神
      '<div class="analysis-card"><h4>🔗 十神关系</h4><p>' + ssHtml + '</p></div>' +

      // 人生起伏
      '<div class="analysis-card"><h4>📈 人生起伏</h4><p style="line-height:1.8;">' + lifeTraj + '</p></div>' +

      // 名字与八字
      '<div class="analysis-card"><h4>📛 名字与八字</h4>' + nameAnalysis + '</div>' +

      // 大运详解
      '<div class="analysis-card"><h4>📅 大运详细分析</h4>' + detailedDaYun + '</div>' +

      '<p style="text-align:center;color:var(--text-muted);font-size:0.74rem;">仅供娱乐参考，八字命理博大精深</p>' +
      '<button class="btn-secondary" onclick="BaziModule.close()">🔙 返回</button>';
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

  // ==== 事业分析 ====
  _getCareerAnalysis: function(r, bodyStrength) {
    var dmChars = {
      '甲':'领导型人才，适合做管理者、企业家、政府官员。优点是格局大、有远见，缺点是容易强势。',
      '乙':'协调型人才，适合做HR、公关、艺术设计、咨询。优点是灵活适应，缺点是容易没原则。',
      '丙':'影响型人才，适合做演讲者、主持人、销售、演员。优点是有感染力，缺点是容易浮躁。',
      '丁':'钻研型人才，适合做研究、数据分析、财务、编程。优点是专注深入，缺点是容易孤僻。',
      '戊':'稳健型人才，适合做房地产、建筑、金融、行政。优点是踏实可靠，缺点是容易保守。',
      '己':'服务型人才，适合做教育、医疗、护理、社工。优点是温和包容，缺点是容易被动。',
      '庚':'执行型人才，适合做法律、军警、工程师、外科医生。优点是果断利落，缺点是容易刚烈。',
      '辛':'精致型人才，适合做珠宝鉴定、手工艺、会计、编辑。优点是精益求精，缺点是容易挑剔。',
      '壬':'开拓型人才，适合做贸易、物流、外交、摄影。优点是灵活多变，缺点是容易散漫。',
      '癸':'创意型人才，适合做文学、音乐、心理学、灵性导师。优点是直觉敏锐，缺点是容易消极。'
    };

    var base = dmChars[r.dmElement] || '';
    var extra = '';
    if (bodyStrength.level.indexOf('强') !== -1) {
      extra = '身强可扛大任，适合独立创业或担任核心领导，事业发展空间大。';
    } else if (bodyStrength.level.indexOf('弱') !== -1) {
      extra = '身弱适合团队合作，在大型组织或平台中获得支持，借力发展更佳。';
    } else {
      extra = '身量适中，既可以独立运作，也可以团队合作，事业灵活度较高。';
    }
    return base + ' ' + extra;
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
    var trajectory = '';
    // Analyze based on body strength and da yun
    var shengMap = {木:'水',火:'木',土:'火',金:'土',水:'金'};

    // Youth (0-30), Prime (30-60), Later (60+)
    var youth = daYun.slice(0, 3);
    var prime = daYun.slice(3, 6);
    var later = daYun.slice(6, 8);

    var self = this;
    function evalPeriod(pillars) {
      var score = 0;
      pillars.forEach(function(p) {
        var elem = self.wuXingMap[p.gan];
        if (bodyStrength.level.indexOf('强') !== -1) {
          // For strong body, favorable are controlling elements
          if (elem !== r.dmElement && shengMap[r.dmElement] !== elem) score += 1;
        } else {
          // For weak body, favorable are supporting elements
          if (elem === r.dmElement || shengMap[r.dmElement] === elem) score += 1;
        }
      });
      return score;
    }

    var yScore = evalPeriod(youth);
    var pScore = evalPeriod(prime);
    var lScore = evalPeriod(later);

    trajectory += '<b>👦 青年时期（0-30岁）：</b>';
    if (yScore >= 2) trajectory += '运势较顺，早年得家庭和师长助力，学业有成。打好基础是关键。';
    else if (yScore >= 1) trajectory += '运势平稳，需自己努力打拼。青年时期多尝试不同方向，积累经验。';
    else trajectory += '早年可能较多波折，但这些都是宝贵的成长经历。30岁后运势逐步好转。';

    trajectory += '<br/><b>🏢 壮年时期（30-60岁）：</b>';
    if (pScore >= 2) trajectory += '此阶段是人生黄金期，事业有成，财运亨通。应把握时机大力开拓。';
    else if (pScore >= 1) trajectory += '中年运势稳定向上，稳步发展事业和家庭。注意平衡工作与生活。';
    else trajectory += '壮年需注意规划和风险管理，以稳为主不宜冒进，守成也是智慧。';

    trajectory += '<br/><b>🧘 晚年时期（60岁以后）：</b>';
    if (lScore >= 2) trajectory += '晚年运势佳，子女有靠，幸福安康。适合从事公益和兴趣事业。';
    else if (lScore >= 1) trajectory += '晚年生活平静，有稳定的生活来源。注意身体健康，保持乐观心态。';
    else trajectory += '晚年需提前做好养老规划，注意健康和财务安排。家庭和睦是幸福的基石。';

    return trajectory;
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
    var shengMap = {木:'水',火:'木',土:'火',金:'土',水:'金'};
    var self = this;
    var html = '';

    var industryByElement = {
      '木':'教育、出版、文化、园林、医疗、环保',
      '火':'互联网、影视、餐饮、能源、美容、广告',
      '土':'房地产、建筑、矿业、农业、物流、金融',
      '金':'金融、法律、制造、汽车、珠宝、军警',
      '水':'贸易、物流、旅游、渔业、清洁能源、数据'
    };

    daYun.forEach(function(dy, idx) {
      var elem = self.wuXingMap[dy.gan];
      var isFavorable = false;
      if (bodyStrength.level.indexOf('强') !== -1) {
        if (elem !== r.dmElement && shengMap[r.dmElement] !== elem) isFavorable = true;
      } else {
        if (elem === r.dmElement || shengMap[r.dmElement] === elem) isFavorable = true;
      }

      var icon = isFavorable ? '✅' : '⚠️';
      var label = isFavorable ? '有利' : '需注意';
      var role = '';
      var advice = '';

      if (idx === 0) { role = '奠定人生基础阶段。'; advice = '学习力强，适合打好学业和技能基础。'; }
      else if (idx === 1) { role = '确立人生方向。'; advice = '选对行业比努力更重要，找到适合的发展方向。'; }
      else if (idx === 2) { role = '事业起步期。'; advice = '积累经验和人脉，不必急于求成。适合' + (industryByElement[elem] || '综合发展') + '。'; }
      else if (idx === 3) { role = '事业上升期。'; advice = '事业进入快车道，抓住机遇大胆尝试。注意理财规划。'; }
      else if (idx === 4) { role = '事业高峰期。'; advice = '此阶段收获最大，名利双收。但要注意健康和家庭平衡。'; }
      else if (idx === 5) { role = '事业稳定期。'; advice = '巩固已有成果，培养接班人。开始规划退休生活。'; }
      else if (idx === 6) { role = '人生转型期。'; advice = '从事业转向兴趣爱好，享受生活。发挥余热回馈社会。'; }
      else { role = '安享晚年期。'; advice = '以健康为重，家庭和睦是最大的财富。传承智慧和经验。'; }

      html += '<div style="padding:0.4rem 0;border-bottom:1px solid var(--border-subtle);">' +
        '<b>' + icon + ' ' + dy.age + '岁 ' + dy.gan + dy.zhi + '（' + elem + '） ' + label + '</b>' +
        '<br/><span style="font-size:0.82rem;color:var(--text-secondary);">作用：' + role + '</span>' +
        '<br/><span style="font-size:0.82rem;color:var(--text);">建议：' + advice + '</span>' +
        '</div>';
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
