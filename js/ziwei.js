/**
 * 紫微斗数 — 完整排盘 + SVG命盘
 * 主星/副星/杂星/四化/三合/飞星/大限/小限/流年
 */
var ZiweiModule = {
  currentMode: 'single',

  // 天干地支基础
  tianGan: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  diZhi: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],

  // 十四主星
  mainStars: [
    {id:'ziwei',name:'紫微',type:'北斗',elem:'土',short:'紫'},
    {id:'tianji',name:'天机',type:'南斗',elem:'木',short:'机'},
    {id:'taiyang',name:'太阳',type:'中天',elem:'火',short:'阳'},
    {id:'wuqu',name:'武曲',type:'北斗',elem:'金',short:'武'},
    {id:'tiantong',name:'天同',type:'南斗',elem:'水',short:'同'},
    {id:'lianzhen',name:'廉贞',type:'北斗',elem:'火',short:'廉'},
    {id:'tianfu',name:'天府',type:'南斗',elem:'土',short:'府'},
    {id:'taiyin',name:'太阴',type:'中天',elem:'水',short:'阴'},
    {id:'tanlang',name:'贪狼',type:'北斗',elem:'木',short:'贪'},
    {id:'jumen',name:'巨门',type:'北斗',elem:'水',short:'巨'},
    {id:'tianxiang',name:'天相',type:'南斗',elem:'水',short:'相'},
    {id:'tianliang',name:'天梁',type:'南斗',elem:'土',short:'梁'},
    {id:'qisha',name:'七杀',type:'南斗',elem:'金',short:'杀'},
    {id:'pojun',name:'破军',type:'北斗',elem:'水',short:'破'}
  ],

  // 副星
  subStars: [
    {id:'zuofu',name:'左辅',short:'辅',type:'吉'},
    {id:'youbi',name:'右弼',short:'弼',type:'吉'},
    {id:'wenchang',name:'文昌',short:'昌',type:'吉'},
    {id:'wenqu',name:'文曲',short:'曲',type:'吉'},
    {id:'tiankui',name:'天魁',short:'魁',type:'吉'},
    {id:'tianyue',name:'天钺',short:'钺',type:'吉'},
    {id:'lucun',name:'禄存',short:'禄',type:'吉'}
  ],

  // 杂星
  miscStars: [
    {id:'qingyang',name:'擎羊',short:'羊',type:'煞'},
    {id:'tuoluo',name:'陀罗',short:'陀',type:'煞'},
    {id:'huoxing',name:'火星',short:'火',type:'煞'},
    {id:'lingxing',name:'铃星',short:'铃',type:'煞'},
    {id:'dikong',name:'地空',short:'空',type:'煞'},
    {id:'dijie',name:'地劫',short:'劫',type:'煞'},
    {id:'tianma',name:'天马',short:'马',type:'吉'},
    {id:'tianku',name:'天哭',short:'哭',type:'煞'},
    {id:'tianxu',name:'天虚',short:'虚',type:'煞'}
  ],

  // 十二宫
  palaces: [
    '命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'
  ],

  // 四化星
  siHuaNames: {禄:'禄',权:'权',科:'科',忌:'忌'},
  siHuaColors: {禄:'#2a8','权':'#e80','科':'#48c','忌':'#c44'},

  // 定位盘模式
  open: function() {
    document.getElementById('ziweiOverlay').classList.add('active');
    document.getElementById('ziweiResult').style.display = 'none';
  },
  close: function() {
    document.getElementById('ziweiOverlay').classList.remove('active');
  },

  // ========== 排盘计算 ==========

  /** 计算年干支 */
  _yearGZ: function(y) {
    var d = y - 2024, g = ((d%10)+10)%10, z = ((d%12)+12)%12;
    return {gan:g, zhi:z, ganStr:this.tianGan[g], zhiStr:this.diZhi[z]};
  },

  /** 计算月干支 */
  _monthGZ: function(yGan, m) {
    var startGan = [2,4,6,8,0][yGan%5];
    return {gan:(startGan+m-1)%10, zhi:(m+1)%12};
  },

  /** 计算日干支 */
  _dayGZ: function(y, m, d) {
    var ref = new Date(2024,0,1), tgt = new Date(y,m-1,d);
    var diff = Math.floor((tgt-ref)/86400000);
    return {gan:((diff%10)+10)%10, zhi:((diff%12)+12)%12};
  },

  /** 定五行局 (based on 命宫纳音) */
  _wuxingJu: function(mingGan, mingZhi) {
    // 纳音五行局 0=水2局 1=木3局 2=金4局 3=土5局 4=火6局
    var naYinMap = [
      [2,2,3,4,4,5,4,4,5,0,0,3], // 甲子..甲亥
      [2,2,3,4,4,5,4,4,5,0,0,3],
      [3,4,4,5,0,0,3,2,2,3,4,4],
      [3,4,4,5,0,0,3,2,2,3,4,4],
      [4,4,5,0,0,3,2,2,3,4,4,5],
      [4,4,5,0,0,3,2,2,3,4,4,5],
      [4,5,0,0,3,2,2,3,4,4,5,4],
      [4,5,0,0,3,2,2,3,4,4,5,4],
      [5,0,0,3,2,2,3,4,4,5,4,4],
      [5,0,0,3,2,2,3,4,4,5,4,4]
    ];
    var juMap = {0:2, 1:3, 2:4, 3:5, 4:6};
    return juMap[naYinMap[mingGan][mingZhi]] || 5;
  },

  /** 安命宫和十二宫 */
  _placePalaces: function(month, hourZhi) {
    // 从寅宫(2)起正月，逆数到生月 → 命宫地支
    var mIdx = (month - 1) % 12;
    var mingZhi = ((2 - mIdx) % 12 + 12) % 12;
    // 从命宫起子时，逆数到生时
    mingZhi = ((mingZhi - hourZhi) % 12 + 12) % 12;

    // 十二宫从命宫逆排
    var result = [];
    for (var i = 0; i < 12; i++) {
      result.push({
        name: this.palaces[i],
        zhiIdx: ((mingZhi - i) % 12 + 12) % 12,
        zhi: this.diZhi[((mingZhi - i) % 12 + 12) % 12],
        mainStars: [], subStars: [], miscStars: [],
        siHua: null, daXian: 0, xiaoXian: 0, liuNian: null
      });
    }
    return {palaces: result, mingZhi: mingZhi, mingGan: 0};
  },

  /** 按紫微星位置分布十四主星 */
  _placeMainStars: function(ziweiPos) {
    var p = [];
    for (var i = 0; i < 12; i++) p[i] = [];

    // 紫微
    p[ziweiPos].push(this.mainStars[0]);

    // 紫微系：天机(-1) 太阳(-3) 武曲(-4) 天同(-5) 廉贞(+4)
    var zwFam = [{off:-1,s:1},{off:-3,s:2},{off:-4,s:3},{off:-5,s:4},{off:4,s:5}];
    zwFam.forEach(function(f) {
      var pos = ((ziweiPos + f.off) % 12 + 12) % 12;
      p[pos].push(this.mainStars[f.s]);
    }.bind(this));

    // 天府(紫微对宫-4)
    var tfPos = ((ziweiPos - 4) % 12 + 12) % 12;
    p[tfPos].push(this.mainStars[6]);

    // 天府系：太阴(+1) 贪狼(+2) 巨门(+3) 天相(+4) 天梁(+5) 七杀(+6) 破军(+10)
    var tfFam = [{off:1,s:7},{off:2,s:8},{off:3,s:9},{off:4,s:10},{off:5,s:11},{off:6,s:12},{off:10,s:13}];
    tfFam.forEach(function(f) {
      var pos = ((tfPos + f.off) % 12 + 12) % 12;
      p[pos].push(this.mainStars[f.s]);
    }.bind(this));

    return p;
  },

  /** 安副星 */
  _placeSubStars: function(yearZhi, month, hourZhi) {
    var p = [];
    for (var i = 0; i < 12; i++) p[i] = [];

    // 左辅：辰起正月顺数至生月
    p[(2 + month - 1) % 12].push(this.subStars[0]);
    // 右弼：戌起正月逆数至生月
    p[((10 - (month-1)) % 12 + 12) % 12].push(this.subStars[1]);
    // 文昌：戌起子时逆数至生时
    p[((10 - hourZhi) % 12 + 12) % 12].push(this.subStars[2]);
    // 文曲：辰起子时顺数至生时
    p[(2 + hourZhi) % 12].push(this.subStars[3]);
    // 天魁/天钺 based on year stem
    // 禄存 based on year stem
    var lucunMap = {0:2,1:5,2:8,3:11,4:2,5:5,6:8,7:11,8:2,9:5}; // 甲/己→寅...
    var dayGan = (month * 3 + 5) % 10; // approximate
    p[lucunMap[dayGan] || 2].push(this.subStars[6]);

    // 天魁/天钺简化
    p[(month+2)%12].push(this.subStars[4]);
    p[(month+8)%12].push(this.subStars[5]);

    return p;
  },

  /** 安杂星 */
  _placeMiscStars: function(yearZhi, month, hourZhi) {
    var p = [];
    for (var i = 0; i < 12; i++) p[i] = [];

    // 擎羊(禄存前一位)、陀罗(禄存后一位)
    var lucunMap = {0:2,1:5,2:8,3:11,4:2,5:5,6:8,7:11,8:2,9:5};
    var dayGan = (month * 3 + 5) % 10;
    var luPos = lucunMap[dayGan] || 2;
    p[(luPos+1)%12].push(this.miscStars[0]); // 擎羊
    p[(luPos-1+12)%12].push(this.miscStars[1]); // 陀罗

    // 火星/铃星 based on year+hour
    p[(yearZhi+hourZhi)%12].push(this.miscStars[2]);
    p[(yearZhi+hourZhi+6)%12].push(this.miscStars[3]);

    // 地空/地劫
    p[(hourZhi+2)%12].push(this.miscStars[4]);
    p[(hourZhi+8)%12].push(this.miscStars[5]);

    // 天马
    var tianmaMap = {0:2,1:2,2:2,3:8,4:8,5:8,6:5,7:5,8:5,9:11,10:11,11:11};
    p[tianmaMap[yearZhi] || 2].push(this.miscStars[6]);

    // 天哭/天虚
    p[(yearZhi+month)%12].push(this.miscStars[7]);
    p[(yearZhi+month+6)%12].push(this.miscStars[8]);

    return p;
  },

  /** 定四化 */
  _getSiHua: function(yearGan) {
    // 四化表 [禄,权,科,忌] by year stem
    var siHuaMap = {
      0:['廉贞','破军','武曲','太阳'],   // 甲
      1:['天机','天梁','紫微','太阴'],   // 乙
      2:['天同','天机','文昌','廉贞'],   // 丙
      3:['太阴','天同','天机','巨门'],   // 丁
      4:['贪狼','太阴','右弼','天机'],   // 戊
      5:['武曲','贪狼','天梁','文曲'],   // 己
      6:['太阳','武曲','太阴','天同'],   // 庚
      7:['巨门','太阳','文曲','文昌'],   // 辛
      8:['天梁','紫微','左辅','武曲'],   // 壬
      9:['破军','巨门','太阴','贪狼']    // 癸
    };
    var names = siHuaMap[yearGan] || siHuaMap[0];
    return {禄:names[0],权:names[1],科:names[2],忌:names[3]};
  },

  /** 大限起法 (simplified: 命宫从某岁起运) */
  _getDaXian: function(ju, gender, yangGan) {
    var isMale = gender === '男';
    var isYang = yangGan % 2 === 0;
    var forward = (isYang && isMale) || (!isYang && !isMale);

    // 五行局对应起运年龄: 水2=2,木3=3,金4=4,土5=5,火6=6
    var startAge = ju;
    var daXian = [];
    for (var i = 0; i < 12; i++) {
      var age = forward ? (startAge + i * 10) : (startAge + (11-i) * 10);
      daXian.push(age);
    }
    return daXian;
  },

  /** 主计算 */
  calculate: function() {
    var y = parseInt(document.getElementById('ziweiYear').value);
    var m = parseInt(document.getElementById('ziweiMonth').value);
    var d = parseInt(document.getElementById('ziweiDay').value);
    var h = parseInt(document.getElementById('ziweiHour').value);
    var gender = document.getElementById('ziweiGender').value;
    if (!y||!m||!d||isNaN(h)) { alert('请填写完整出生信息'); return; }

    var hourZhi = Math.floor((h+1)/2) % 12;
    var yGZ = this._yearGZ(y);
    var dGZ = this._dayGZ(y,m,d);

    // 安十二宫
    var chart = this._placePalaces(m, hourZhi);

    // 定命宫干支
    var mGZ = this._monthGZ(yGZ.gan, m);
    chart.mingGan = (mGZ.gan * 2 + chart.mingZhi) % 10;

    // 五行局
    var ju = this._wuxingJu(chart.mingGan, chart.mingZhi);

    // 紫微星位置
    var ziweiTable = [2,5,8,11,1,4,7,10,0,3,6,9];
    var juOffset = (ju-2)*2;
    var zwPos = ((ziweiTable[(d-1+juOffset)%12]) % 12 + 12) % 12;

    // 排主星
    var mainMap = this._placeMainStars(zwPos);
    for (var i = 0; i < 12; i++) chart.palaces[i].mainStars = mainMap[(chart.palaces[i].zhiIdx)] || [];

    // 排副星
    var subMap = this._placeSubStars(yGZ.zhi, m, hourZhi);
    for (var i = 0; i < 12; i++) chart.palaces[i].subStars = subMap[(chart.palaces[i].zhiIdx)] || [];

    // 排杂星
    var miscMap = this._placeMiscStars(yGZ.zhi, m, hourZhi);
    for (var i = 0; i < 12; i++) chart.palaces[i].miscStars = miscMap[(chart.palaces[i].zhiIdx)] || [];

    // 四化
    var siHua = this._getSiHua(yGZ.gan);

    // 大限
    var daXian = this._getDaXian(ju, gender, yGZ.gan);

    // 小限
    var now = new Date();
    var curAge = now.getFullYear() - y;
    for (var j = 0; j < 12; j++) {
      chart.palaces[j].daXian = daXian[j];
      chart.palaces[j].xiaoXian = ((curAge - 1 + j) % 12) + 1;
    }

    // 流年
    var liuNianGZ = this._yearGZ(now.getFullYear());
    chart.liuNian = {year: now.getFullYear(), gan: liuNianGZ.ganStr, zhi: liuNianGZ.zhiStr};

    var self = this;
    Paywall.tryAccess('ziweiResult', function() {
      self._renderSVG(chart, siHua, y, m, d, h, gender, yGZ, ju);
    });

    // 安十二宫
    var chart = this._placePalaces(m, hourZhi);

    // 定命宫干支
    var mGZ = this._monthGZ(yGZ.gan, m);
    chart.mingGan = (mGZ.gan * 2 + chart.mingZhi) % 10;

    // 五行局
    var ju = this._wuxingJu(chart.mingGan, chart.mingZhi);

    // 紫微星位置 (simplified based on 五行局 and day of month)
    var ziweiTable = [2,5,8,11,1,4,7,10,0,3,6,9]; // 简化表
    var juOffset = (ju-2)*2;
    var zwPos = ((ziweiTable[(d-1+juOffset)%12]) % 12 + 12) % 12;

    // 排主星
    var mainMap = this._placeMainStars(zwPos);
    for (var i = 0; i < 12; i++) chart.palaces[i].mainStars = mainMap[(chart.palaces[i].zhiIdx)] || [];

    // 排副星
    var subMap = this._placeSubStars(yGZ.zhi, m, hourZhi);
    for (var i = 0; i < 12; i++) chart.palaces[i].subStars = subMap[(chart.palaces[i].zhiIdx)] || [];

    // 排杂星
    var miscMap = this._placeMiscStars(yGZ.zhi, m, hourZhi);
    for (var i = 0; i < 12; i++) chart.palaces[i].miscStars = miscMap[(chart.palaces[i].zhiIdx)] || [];

    // 四化
    var siHua = this._getSiHua(yGZ.gan);

    // 大限
    var daXian = this._getDaXian(ju, gender, yGZ.gan);

    // 小限 (命宫=1岁起)
    var now = new Date();
    var curAge = now.getFullYear() - y;
    for (var j = 0; j < 12; j++) {
      chart.palaces[j].daXian = daXian[j];
      chart.palaces[j].xiaoXian = ((curAge - 1 + j) % 12) + 1;
    }

    // 流年
    var liuNianGZ = this._yearGZ(now.getFullYear());
    chart.liuNian = {year: now.getFullYear(), gan: liuNianGZ.ganStr, zhi: liuNianGZ.zhiStr};

    this._renderSVG(chart, siHua, y, m, d, h, gender, yGZ, ju);
  },

  // ========== SVG 渲染 ==========

  _renderSVG: function(chart, siHua, year, month, day, hour, gender, yGZ, ju) {
    var ctn = document.getElementById('ziweiResult');
    ctn.style.display = 'block';

    var svgW = 640, svgH = 760;
    var marginX = 20, marginY = 120;
    var cellW = 150, cellH = 130;
    var startX = marginX + 20, startY = marginY;
    var titleY = 30;

    // 宫格位置映射 (standard order)
    var gridPos = [
      {row:0,col:1},{row:0,col:2},{row:0,col:3},{row:1,col:3},
      {row:2,col:3},{row:2,col:2},{row:2,col:1},{row:2,col:0},
      {row:1,col:0},{row:1,col:1},{row:0,col:0},{row:1,col:2}
    ];

    var self = this;
    var html = '<svg width="' + svgW + '" height="' + svgH + '" viewBox="0 0 ' + svgW + ' ' + svgH + '" xmlns="http://www.w3.org/2000/svg">';

    // 背景
    html += '<rect width="' + svgW + '" height="' + svgH + '" fill="#faf6ed"/>';

    // 标题
    html += '<text x="' + (svgW/2) + '" y="' + titleY + '" text-anchor="middle" font-family="KaiTi,serif" font-size="22" fill="#8b6f3a" font-weight="bold">紫微斗数命盘</text>';
    html += '<text x="' + (svgW/2) + '" y="' + (titleY+22) + '" text-anchor="middle" font-family="KaiTi,serif" font-size="13" fill="#5c4e3a">' +
      year+'-'+month+'-'+day+' '+hour+'时 · '+gender+' · '+yGZ.ganStr+yGZ.zhiStr+'年 · '+ju+'局 · 流年'+chart.liuNian.year+'</text>';

    // 绘制12宫
    for (var i = 0; i < 12; i++) {
      var gp = gridPos[i];
      var x = startX + gp.col * cellW;
      var y = startY + gp.row * cellH;
      var p = chart.palaces[i];

      // 宫格底色
      var isMing = i === 0;
      var fill = isMing ? '#fef8e8' : '#fdfaf3';
      html += '<rect x="' + x + '" y="' + y + '" width="' + cellW + '" height="' + cellH + '" fill="' + fill + '" stroke="' + (isMing ? '#c9a040' : '#d4c5a0') + '" stroke-width="' + (isMing ? '2' : '1') + '"/>';

      // 宫名
      html += '<text x="' + (x+cellW/2) + '" y="' + (y+18) + '" text-anchor="middle" font-family="KaiTi,serif" font-size="' + (isMing?'15':'13') + '" fill="#8b6f3a" font-weight="bold">' + p.name + '</text>';

      // 地支标注
      html += '<text x="' + (x+cellW-10) + '" y="' + (y+16) + '" text-anchor="end" font-size="10" fill="#aaa">' + p.zhi + '</text>';

      var cy = y + 35;
      var lineH = 16;

      // === 主星 (大字突出) ===
      for (var ms = 0; ms < p.mainStars.length; ms++) {
        var star = p.mainStars[ms];
        var hasSiHua = false;
        var siHuaLabel = '';
        for (var sh in siHua) {
          if (siHua[sh] === star.name) { hasSiHua = true; siHuaLabel = sh; break; }
        }
        var msColor = self.siHuaColors[siHuaLabel] || '#5c3a1a';
        var msSize = 13;
        html += '<text x="' + (x+8) + '" y="' + cy + '" font-family="KaiTi,serif" font-size="' + msSize + '" fill="' + msColor + '" font-weight="bold">' + star.short + '</text>';
        html += '<text x="' + (x+30) + '" y="' + cy + '" font-size="11" fill="' + msColor + '">' + star.name + '</text>';
        if (hasSiHua) {
          // 四化角标
          var shColor = self.siHuaColors[siHuaLabel];
          html += '<circle cx="' + (x+22) + '" cy="' + (cy-3) + '" r="5" fill="' + shColor + '"/>';
          html += '<text x="' + (x+22) + '" y="' + (cy-1) + '" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">' + siHuaLabel + '</text>';
        }
        cy += lineH;
      }

      // === 副星 ===
      for (var ss = 0; ss < p.subStars.length; ss++) {
        html += '<text x="' + (x+8) + '" y="' + cy + '" font-size="10" fill="#8b6f3a">' + p.subStars[ss].short + '</text>';
        html += '<text x="' + (x+24) + '" y="' + cy + '" font-size="9" fill="#8a7a60">' + p.subStars[ss].name + '</text>';
        cy += 14;
      }

      // === 杂星(小字) ===
      var miscText = '';
      for (var mc = 0; mc < p.miscStars.length; mc++) {
        miscText += p.miscStars[mc].short + ' ';
      }
      if (miscText) {
        html += '<text x="' + (x+8) + '" y="' + cy + '" font-size="8" fill="#999">' + miscText.trim() + '</text>';
        cy += 12;
      }

      // === 大限/小限/流年 (右下角) ===
      var dx = p.daXian;
      var sx = p.xiaoXian;
      html += '<text x="' + (x+cellW-8) + '" y="' + (y+cellH-24) + '" text-anchor="end" font-size="8" fill="#aaa">大限' + dx + '~' + (dx+9) + '岁</text>';
      html += '<text x="' + (x+cellW-8) + '" y="' + (y+cellH-12) + '" text-anchor="end" font-size="8" fill="#aaa">小限' + sx + '</text>';
    }

    // === 四化图例 ===
    var legendX = marginX + 40, legendY = svgH - 35;
    html += '<text x="' + legendX + '" y="' + legendY + '" font-size="10" fill="#8a7a60">四化：</text>';
    var shEntries = [{k:'禄',v:siHua.禄},{k:'权',v:siHua.权},{k:'科',v:siHua.科},{k:'忌',v:siHua.忌}];
    shEntries.forEach(function(se, idx) {
      var lx = legendX + 40 + idx * 100;
      html += '<circle cx="' + (lx+10) + '" cy="' + (legendY-4) + '" r="6" fill="' + self.siHuaColors[se.k] + '"/>';
      html += '<text x="' + (lx+10) + '" y="' + (legendY-1) + '" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold">' + se.k + '</text>';
      html += '<text x="' + (lx+20) + '" y="' + legendY + '" font-size="9" fill="#5c4e3a">' + se.k + ':' + se.v + '</text>';
    });

    // === 三合标注 ===
    // 命宫/财帛/官禄 三合
    var triHe = [[0,4,8],[1,5,9],[2,6,10],[3,7,11]];
    triHe.forEach(function(th) {
      var cx1 = startX + gridPos[th[0]].col * cellW + cellW/2;
      var cy1 = startY + gridPos[th[0]].row * cellH + cellH/2;
      var cx2 = startX + gridPos[th[1]].col * cellW + cellW/2;
      var cy2 = startY + gridPos[th[1]].row * cellH + cellH/2;
      var cx3 = startX + gridPos[th[2]].col * cellW + cellW/2;
      var cy3 = startY + gridPos[th[2]].row * cellH + cellH/2;
      html += '<polygon points="' + cx1+','+cy1 + ' ' + cx2+','+cy2 + ' ' + cx3+','+cy3 + '" fill="none" stroke="rgba(201,169,110,0.2)" stroke-width="1" stroke-dasharray="4,4"/>';
    });

    html += '</svg>';

    // 加上命宫解读文字
    var mingGong = chart.palaces[0];
    var mingStarsStr = mingGong.mainStars.map(function(s){return s.name;}).join('、');
    var textHtml = '<div class="analysis-card" style="margin-top:0.5rem;"><h4>🏛️ 命宫简析</h4>' +
      '<p>命宫主星：' + (mingStarsStr || '无主星借对宫') + '</p>' +
      '<p>' + (mingStarsStr ? '命主性格受' + mingStarsStr + '影响较大。' : '命宫无主星，性格随环境变化较大，需借迁移宫星曜参考。') + '</p>' +
      '<p style="font-size:0.76rem;color:var(--text-muted);">以上为简化紫微斗数排盘，十四主星+副星+杂星+四化+大限小限流年。仅供娱乐参考。</p>' +
      '</div>';

    ctn.innerHTML = html + textHtml +
      '<button class="btn-secondary" onclick="ZiweiModule.close()">🔙 返回</button>';
  }
};
