/**
 * 黄历查询 — 农历、干支、宜忌、冲煞
 */
var AlmanacModule = {
  // 天干地支
  tianGan: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  diZhi: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  shengXiao: ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'],

  // 建除十二神 (by month branch)
  jianChu: ['建','除','满','平','定','执','破','危','成','收','开','闭'],

  // 星宿 (28)
  xingXiu: ['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'],

  // 宜忌事项
  yiItems: ['嫁娶','纳采','祭祀','祈福','出行','移徙','入宅','开市','交易','立券','纳财','修造','动土','安床','安门','安葬','破土','启攒','除服','成服','入学','裁衣','理发','沐浴','会友','订盟','纳婿','买车','提车','置业'],
  jiItems: ['嫁娶','移徙','入宅','开市','安葬','动土','修造','上梁','安门','伐木','行丧','破土'],

  // 彭祖百忌 (by heavenly stem and earthly branch of the day)
  pengZu: {
    '甲':'甲不开仓，财物耗亡。','乙':'乙不栽植，千株不长。','丙':'丙不修灶，必见灾殃。','丁':'丁不剃头，头必生疮。',
    '戊':'戊不受田，田主不祥。','己':'己不破券，二比并亡。','庚':'庚不经络，织机虚张。','辛':'辛不合酱，主人不尝。',
    '壬':'壬不决水，更难提防。','癸':'癸不词讼，理弱敌强。',
    '子':'子不问卜，自惹祸殃。','丑':'丑不冠带，主不还乡。','寅':'寅不祭祀，神鬼不尝。','卯':'卯不穿井，水泉不香。',
    '辰':'辰不哭泣，必主重丧。','巳':'巳不远行，财物伏藏。','午':'午不苫盖，屋主更张。','未':'未不服药，毒气入肠。',
    '申':'申不安床，鬼祟入房。','酉':'酉不会客，醉坐颠狂。','戌':'戌不吃犬，作怪上床。','亥':'亥不嫁娶，不利新郎。'
  },

  open: function() {
    document.getElementById('almanacOverlay').classList.add('active');
  },
  close: function() {
    document.getElementById('almanacOverlay').classList.remove('active');
    document.getElementById('almanacResult').style.display = 'none';
  },

  /** Get day's gan-zhi (simplified calculation) */
  _getDayGanZhi: function(year, month, day) {
    // Use a known reference: 2024-01-01 = 甲子日 (ganIdx=0, zhiIdx=0)
    // Calculate days since reference
    var refDate = new Date(2024, 0, 1);
    var targetDate = new Date(year, month-1, day);
    var daysDiff = Math.floor((targetDate - refDate) / 86400000);
    var ganIdx = ((daysDiff % 10) + 10) % 10;
    var zhiIdx = ((daysDiff % 12) + 12) % 12;
    return {gan:this.tianGan[ganIdx], zhi:this.diZhi[zhiIdx], ganIdx:ganIdx, zhiIdx:zhiIdx};
  },

  /** Get year's gan-zhi */
  _getYearGanZhi: function(year) {
    // 2024 = 甲辰年
    var baseYear = 2024, baseGanIdx = 0, baseZhiIdx = 4; // 甲辰
    var diff = year - baseYear;
    var ganIdx = ((baseGanIdx + diff) % 10 + 10) % 10;
    var zhiIdx = ((baseZhiIdx + diff) % 12 + 12) % 12;
    return {gan:this.tianGan[ganIdx], zhi:this.diZhi[zhiIdx], ganIdx:ganIdx, zhiIdx:zhiIdx};
  },

  /** Get month's gan-zhi (simplified) */
  _getMonthGanZhi: function(year, month) {
    var yearGZ = this._getYearGanZhi(year);
    var ganIdx = (yearGZ.ganIdx * 2 + month - 1) % 10;
    var zhiIdx = (month + 1) % 12; // 寅月 = month 0
    return {gan:this.tianGan[ganIdx], zhi:this.diZhi[zhiIdx]};
  },

  /** Get generic yi/ji for the day */
  _getYiJi: function(dayGZ) {
    // Generate a deterministic but varied set based on day gan-zhi
    var idx = dayGZ.ganIdx * 12 + dayGZ.zhiIdx;
    var yi = [], ji = [];
    var allYi = this.yiItems.slice();
    var allJi = this.jiItems.slice();

    // Pick yi items
    var numYi = 3 + (idx % 5);
    for (var i = 0; i < numYi; i++) {
      yi.push(allYi[(idx + i * 7) % allYi.length]);
    }

    // Pick ji items
    var numJi = 2 + (idx % 3);
    for (var j = 0; j < numJi; j++) {
      ji.push(allJi[(idx + j * 11) % allJi.length]);
    }

    return {yi:yi, ji:ji};
  },

  lookup: function() {
    var y = parseInt(document.getElementById('almanacYear').value);
    var m = parseInt(document.getElementById('almanacMonth').value);
    var d = parseInt(document.getElementById('almanacDay').value);
    if (!y || !m || !d) { alert('请输入完整日期'); return; }
    this._render(y, m, d);
  },

  today: function() {
    var now = new Date();
    document.getElementById('almanacYear').value = now.getFullYear();
    document.getElementById('almanacMonth').value = now.getMonth()+1;
    document.getElementById('almanacDay').value = now.getDate();
    this._render(now.getFullYear(), now.getMonth()+1, now.getDate());
  },

  _render: function(year, month, day) {
    var yearGZ = this._getYearGanZhi(year);
    var monthGZ = this._getMonthGanZhi(year, month);
    var dayGZ = this._getDayGanZhi(year, month, day);
    var yiJi = this._getYiJi(dayGZ);

    var shengxiao = this.shengXiao[yearGZ.zhiIdx];
    var dayXingXiu = this.xingXiu[dayGZ.zhiIdx % 28];
    var jianChuDay = this.jianChu[(month - 1) % 12];

    var pengZuDay = this.pengZu[dayGZ.gan] || '';
    var pengZuZhi = this.pengZu[dayGZ.zhi] || '';

    // Clash: earthly branch that's 6 positions away
    var clashZhi = this.diZhi[(dayGZ.zhiIdx + 6) % 12];
    var clashSx = this.shengXiao[(dayGZ.zhiIdx + 6) % 12];

    var ctn = document.getElementById('almanacResult');
    ctn.style.display = 'block';
    ctn.innerHTML =
      '<div class="result-header">📆 ' + year + '年' + month + '月' + day + '日 黄历</div>' +
      '<div class="almanac-grid">' +
        '<div class="almanac-item"><span class="alabel">农历年份</span><br/><span class="avalue">' + yearGZ.gan + yearGZ.zhi + '年（' + shengxiao + '年）</span></div>' +
        '<div class="almanac-item"><span class="alabel">农历月份</span><br/><span class="avalue">' + monthGZ.gan + monthGZ.zhi + '月</span></div>' +
        '<div class="almanac-item"><span class="alabel">日干支</span><br/><span class="avalue">' + dayGZ.gan + dayGZ.zhi + '日</span></div>' +
        '<div class="almanac-item"><span class="alabel">星宿</span><br/><span class="avalue">' + dayXingXiu + '宿</span></div>' +
        '<div class="almanac-item"><span class="alabel">建除</span><br/><span class="avalue">' + jianChuDay + '日</span></div>' +
        '<div class="almanac-item"><span class="alabel">冲煞</span><br/><span class="avalue">冲' + clashZhi + '（' + clashSx + '）</span></div>' +
      '</div>' +
      '<div class="almanac-yi"><span class="alabel">✅ 宜：</span>' + yiJi.yi.join('、') + '</div>' +
      '<div class="almanac-ji"><span class="alabel">❌ 忌：</span>' + yiJi.ji.join('、') + '</div>' +
      '<div style="font-size:0.8rem;color:var(--text-muted);padding:0.3rem;">📜 彭祖百忌：' + pengZuDay + ' ' + pengZuZhi + '</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.74rem;">⚠ 黄历数据为简化推算，仅供参考</p>' +
      '<button class="btn-secondary" onclick="AlmanacModule.close()">🔙 返回</button>';
    Paywall.blockAll('almanacResult');
  }
};
