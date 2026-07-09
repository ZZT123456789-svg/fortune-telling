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

    var wxMax = Math.max(1, r.wxCount['金'], r.wxCount['木'], r.wxCount['水'], r.wxCount['火'], r.wxCount['土']);
    var wxBars = '';
    var wxColors = {金:'#e8c040',木:'#4a9',水:'#59c',火:'#e55',土:'#da5'};
    ['金','木','水','火','土'].forEach(function(k) {
      var pct = Math.round(r.wxCount[k] / wxMax * 100);
      wxBars += '<div class="wx-bar-row"><span class="wx-label">' + k + '</span>' +
        '<div class="wx-bar-track"><div class="wx-bar-fill" style="width:' + pct + '%;background:' + wxColors[k] + ';"></div></div>' +
        '<span class="wx-count">' + r.wxCount[k] + '</span></div>';
    });

    var daYunHtml = '<div class="bazi-info-row">';
    r.daYun.forEach(function(dy) {
      daYunHtml += '<span style="padding:0 0.25rem;">' + dy.age + '岁:<b>' + dy.gan + dy.zhi + '</b></span>';
    });
    daYunHtml += '</div>';

    var labels = ['年柱','月柱','日柱','时柱'];
    var ssHtml = '';
    labels.forEach(function(l, i) {
      ssHtml += '<span style="padding:0 0.25rem;">' + l + ': <b>' + (r.shiShen[i].ganSS || '日主') + '</b></span>';
    });

    var dmAnalysis = this._getDayMasterAnalysis(r.dayMaster, r.dmElement, r.wxCount);

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
      '<div class="analysis-card"><h4>📊 日主分析</h4><p>' + dmAnalysis + '</p></div>' +
      '<div class="analysis-card"><h4>📊 五行分布</h4>' + wxBars + '</div>' +
      '<div class="analysis-card"><h4>🔗 十神关系</h4><p>' + ssHtml + '</p></div>' +
      '<div class="analysis-card"><h4>📅 大运走势</h4>' + daYunHtml + '</div>' +
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
