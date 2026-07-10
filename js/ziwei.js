/**
 * 紫微斗数 — 十二宫命盘排盘
 */
var ZiweiModule = {
  // 十四主星
  stars: [
    {name:'紫微',type:'北斗',element:'土',desc:'帝星，尊贵威严，有领导力。坐命宫者天生有贵人运。'},
    {name:'天机',type:'南斗',element:'木',desc:'智星，思维敏捷善谋略。适合策划型工作。变数多。'},
    {name:'太阳',type:'中天',element:'火',desc:'贵星，光明磊落热情大方。男性贵人运强。需防锋芒过露。'},
    {name:'武曲',type:'北斗',element:'金',desc:'财星，刚毅果决执行力强。适合金融军警。性格刚直。'},
    {name:'天同',type:'南斗',element:'水',desc:'福星，温和善良有福气。人缘好但有时缺乏进取心。'},
    {name:'廉贞',type:'北斗',element:'火',desc:'囚星，聪明但多变。才华横溢但情绪波动大。需自我约束。'},
    {name:'天府',type:'南斗',element:'土',desc:'库星，稳重包容能聚财。有管理才能。南斗之首。'},
    {name:'太阴',type:'中天',element:'水',desc:'富星，温柔细腻有美感。女性贵人运强。内向善感。'},
    {name:'贪狼',type:'北斗',element:'木',desc:'桃花星，多才多艺善交际。欲望强但才华横溢。需克制。'},
    {name:'巨门',type:'北斗',element:'水',desc:'暗星，口才好但易惹是非。适合法律、辩论。需慎言。'},
    {name:'天相',type:'南斗',element:'水',desc:'印星，公正温和善协调。适合管理、辅助型角色。'},
    {name:'天梁',type:'南斗',element:'土',desc:'荫星，慈悲为怀有长者之风。适合医疗、教育。福寿之相。'},
    {name:'七杀',type:'南斗',element:'金',desc:'将星，勇猛果断不畏挑战。将才之命。需防冲动鲁莽。'},
    {name:'破军',type:'北斗',element:'水',desc:'耗星，破旧立新敢闯敢拼。适合创业。大起大落之命。'}
  ],

  palaces: ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'],
  palaceDescs: {
    '命宫':'代表命主本人的性格、天赋和整体命运走向。是十二宫的核心。',
    '兄弟':'代表兄弟姐妹关系、同辈竞争与合作、母亲状况。',
    '夫妻':'代表婚姻状况、配偶特质、感情生活和合作对象。',
    '子女':'代表子女状况、创造力、娱乐、享受和性关系。',
    '财帛':'代表赚钱能力、理财观念、物质生活和财富格局。',
    '疾厄':'代表身体健康状况、疾病倾向和意外灾厄。',
    '迁移':'代表外出运、旅行、环境变化和在外发展的情况。',
    '交友':'代表朋友关系、同事、下属以及在群体中的位置。',
    '官禄':'代表事业发展、学业成就和社会地位。',
    '田宅':'代表家庭环境、房产运、祖业和居家生活。',
    '福德':'代表精神世界、福气、兴趣爱好和晚年生活品质。',
    '父母':'代表父母状况、长辈关系、师长和上司。'
  },

  open: function() {
    document.getElementById('ziweiOverlay').classList.add('active');
  },
  close: function() {
    document.getElementById('ziweiOverlay').classList.remove('active');
    document.getElementById('ziweiResult').style.display = 'none';
  },

  /** 根据农历生年定紫微星位置 */
  _calcZiweiPosition: function(yearGan, yearZhi) {
    // 简化算法：基于年干支确定紫微星在十二宫的位置
    var base = (yearGan * 12 + yearZhi) % 12;
    return base;
  },

  /** 定十二宫起宫位置 */
  _calcPalaceStart: function(month, hourZhi) {
    // 命宫从寅宫起正月，逆数至生月，再从该宫起子时逆数至生时
    var m = month - 1; // 0-based
    var h = hourZhi; // 时辰地支 0-11
    var start = (2 - m + 12) % 12; // 逆数：从寅(2)开始
    start = (start - h + 12) % 12;
    return start;
  },

  /** 排十四主星到各宫 */
  _placeStars: function(ziweiPos) {
    // 紫微系六星和天府系八星的位置规则
    var positions = {};
    for (var i = 0; i < 12; i++) positions[i] = [];

    // 紫微星
    positions[ziweiPos].push(this.stars[0]);

    // 紫微系：天机(紫微-1)、太阳(紫微-3)、武曲(紫微-4)、天同(紫微-5)、廉贞(紫微+4)
    var ziweiFamily = [
      {offset:-1,starIdx:1},{offset:-3,starIdx:2},{offset:-4,starIdx:3},
      {offset:-5,starIdx:4},{offset:4,starIdx:5}
    ];
    ziweiFamily.forEach(function(f) {
      var pos = ((ziweiPos + f.offset) % 12 + 12) % 12;
      positions[pos].push(this.stars[f.starIdx]);
    }.bind(this));

    // 天府星位置：紫微位置的对宫偏移
    var tianfuPos = ((ziweiPos - 4) % 12 + 12) % 12;
    positions[tianfuPos].push(this.stars[6]);

    // 天府系：太阴(天府+1)、贪狼(天府+2)、巨门(天府+3)、天相(天府+4)、天梁(天府+5)、七杀(天府+6)、破军(天府+10)
    var tianfuFamily = [
      {offset:1,starIdx:7},{offset:2,starIdx:8},{offset:3,starIdx:9},
      {offset:4,starIdx:10},{offset:5,starIdx:11},{offset:6,starIdx:12},
      {offset:10,starIdx:13}
    ];
    tianfuFamily.forEach(function(f) {
      var pos = ((tianfuPos + f.offset) % 12 + 12) % 12;
      positions[pos].push(this.stars[f.starIdx]);
    }.bind(this));

    return positions;
  },

  calculate: function() {
    var year = parseInt(document.getElementById('ziweiYear').value);
    var month = parseInt(document.getElementById('ziweiMonth').value);
    var day = parseInt(document.getElementById('ziweiDay').value);
    var hour = parseInt(document.getElementById('ziweiHour').value);
    var gender = document.getElementById('ziweiGender').value;

    if (!year || !month || !day || isNaN(hour)) { alert('请填写完整出生信息'); return; }

    // 计算年干支
    var baseYear = 2024, baseGan = 0, baseZhi = 4;
    var diff = year - baseYear;
    var yearGan = ((baseGan + diff) % 10 + 10) % 10;
    var yearZhi = ((baseZhi + diff) % 12 + 12) % 12;

    // 时辰地支
    var hourZhi = Math.floor((hour + 1) / 2) % 12;

    // 排盘
    var ziweiPos = this._calcZiweiPosition(yearGan, yearZhi);
    var palaceStart = this._calcPalaceStart(month, hourZhi);
    var starMap = this._placeStars(ziweiPos);

    // 将星曜分配到各宫
    var palaceData = [];
    for (var i = 0; i < 12; i++) {
      var palaceIdx = ((palaceStart + i) % 12 + 12) % 12;
      palaceData.push({
        name: this.palaces[i],
        desc: this.palaceDescs[this.palaces[i]],
        stars: starMap[palaceIdx] || [],
        isMing: i === 0
      });
    }

    this._render(year, month, day, hour, gender, yearGan, yearZhi, palaceData);
  },

  _render: function(year, month, day, hour, gender, yearGan, yearZhi, palaceData) {
    var tianGan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var diZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    var shengXiao = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];

    var ctn = document.getElementById('ziweiResult');
    ctn.style.display = 'block';

    // 命宫分析
    var mingGong = palaceData[0];
    var mingStars = mingGong.stars;
    var mingAnalysis = '';
    if (mingStars.length > 0) {
      mingAnalysis = '命宫主星：' + mingStars.map(function(s){return '<b>' + s.name + '</b>(' + s.element + ')';}).join('、') + '。<br/>';
      mingStars.forEach(function(s) {
        mingAnalysis += '<b>' + s.name + '：</b>' + s.desc + '<br/>';
      });
    } else {
      mingAnalysis = '命宫无主星，需借对宫迁移宫之星曜来看。命主性格随环境变化较大。';
    }

    // 十二宫表格
    var gridHtml = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.4rem;font-size:0.76rem;">';
    for (var i = 0; i < 12; i++) {
      var pd = palaceData[i];
      var starsHtml = pd.stars.length > 0 ? pd.stars.map(function(s){return '<span style="color:var(--gold);">' + s.name + '</span>';}).join('<br/>') : '<span style="color:var(--text-muted);">—</span>';
      var bg = pd.isMing ? 'background:rgba(201,169,110,0.12);border-color:var(--gold);' : '';
      gridHtml += '<div style="padding:0.4rem;border:1px solid var(--border-subtle);border-radius:4px;text-align:center;' + bg + '">' +
        '<b>' + pd.name + '</b><br/>' + starsHtml + '</div>';
    }
    gridHtml += '</div>';

    // 星曜一览
    var starListHtml = '';
    for (var j = 0; j < 12; j++) {
      var pdd = palaceData[j];
      if (pdd.stars.length > 0) {
        starListHtml += '<p style="font-size:0.84rem;margin:0.2rem 0;"><b>' + pdd.name + '：</b>' +
          pdd.stars.map(function(s){return s.name + '(' + s.type + '·' + s.element + ')';}).join('、') +
          '</p>';
      }
    }

    ctn.innerHTML =
      '<div class="result-header">🔮 紫微斗数命盘</div>' +
      '<div style="text-align:center;padding:0.3rem;color:var(--text-secondary);">' +
        year + '年' + month + '月' + day + '日 ' + hour + '时 · ' + gender + ' · ' +
        tianGan[yearGan] + diZhi[yearZhi] + '年（' + shengXiao[yearZhi] + '）' +
      '</div>' +
      '<div class="analysis-card"><h4>🏛️ 命宫解析</h4><p style="line-height:1.8;">' + mingAnalysis + '</p></div>' +
      '<div class="analysis-card"><h4>🪐 十二宫命盘</h4>' + gridHtml + '</div>' +
      '<div class="analysis-card"><h4>⭐ 星曜分布</h4>' + starListHtml + '</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.74rem;">紫微斗数为简化排盘，仅排十四主星，未排辅星和小星。仅供娱乐参考。</p>' +
      '<button class="btn-secondary" onclick="ZiweiModule.close()">🔙 返回</button>';
  }
};
