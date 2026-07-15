/**
 * 六爻纳甲数据库 — 64卦装卦·世应·六亲
 * 每卦: {name, palace, palaceElem, lines:[{zhi, gan, shiYing, liuQin?, liuShen?}], shi, ying}
 */
var LiuYaoDB = {
  // 八宫卦首
  palaces: {
    '乾':'金','兑':'金','离':'火','震':'木','巽':'木','坎':'水','艮':'土','坤':'土'
  },
  // 五行相生相克
  sheng: {木:'火',火:'土',土:'金',金:'水',水:'木'},
  ke:   {木:'土',土:'水',水:'火',火:'金',金:'木'},

  // 纳甲地支表(八宫卦 六爻地支 从初爻到上爻)
  nazhi: {
    '乾':['子','寅','辰','午','申','戌'],
    '坎':['寅','辰','午','申','戌','子'],
    '艮':['辰','午','申','戌','子','寅'],
    '震':['子','寅','辰','午','申','戌'],
    '巽':['丑','亥','酉','未','巳','卯'],
    '离':['卯','丑','亥','酉','未','巳'],
    '坤':['未','巳','卯','丑','亥','酉'],
    '兑':['巳','卯','丑','亥','酉','未']
  },

  // 地支五行
  zhiWuXing: {
    '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
  },

  // 64卦数据: [卦名, 宫名, 世爻位置(1-6), 上卦(tri), 下卦(tri)]
  hexagrams: {
    // 乾宫八卦 (金)
    '111111':{name:'乾为天',palace:'乾',shi:6,ying:3},
    '111110':{name:'天风姤',palace:'乾',shi:1,ying:4},
    '111101':{name:'天山遁',palace:'乾',shi:2,ying:5},
    '111100':{name:'天地否',palace:'乾',shi:3,ying:6},
    '111011':{name:'风地观',palace:'乾',shi:4,ying:1},
    '111010':{name:'山地剥',palace:'乾',shi:5,ying:2},
    '110111':{name:'火地晋',palace:'乾',shi:4,ying:1}, // 游魂
    '110000':{name:'火天大有',palace:'乾',shi:3,ying:6}, // 归魂
    // 坎宫八卦 (水)
    '010010':{name:'坎为水',palace:'坎',shi:6,ying:3},
    '010011':{name:'水泽节',palace:'坎',shi:1,ying:4},
    '010001':{name:'水雷屯',palace:'坎',shi:2,ying:5},
    '010000':{name:'水火既济',palace:'坎',shi:3,ying:6},
    '011010':{name:'泽火革',palace:'坎',shi:4,ying:1},
    '011011':{name:'雷火丰',palace:'坎',shi:5,ying:2},
    '010101':{name:'地火明夷',palace:'坎',shi:4,ying:1}, // 游魂
    '010111':{name:'地水师',palace:'坎',shi:3,ying:6}, // 归魂
    // 艮宫八卦 (土)
    '001001':{name:'艮为山',palace:'艮',shi:6,ying:3},
    '001011':{name:'山火贲',palace:'艮',shi:1,ying:4},
    '001111':{name:'山天大畜',palace:'艮',shi:2,ying:5},
    '000001':{name:'山泽损',palace:'艮',shi:3,ying:6},
    '001101':{name:'火泽睽',palace:'艮',shi:4,ying:1},
    '001100':{name:'天泽履',palace:'艮',shi:5,ying:2},
    '001000':{name:'风泽中孚',palace:'艮',shi:4,ying:1}, // 游魂
    '001010':{name:'风山渐',palace:'艮',shi:3,ying:6}, // 归魂
    // 震宫八卦 (木)
    '100100':{name:'震为雷',palace:'震',shi:6,ying:3},
    '100101':{name:'雷地豫',palace:'震',shi:1,ying:4},
    '100111':{name:'雷水解',palace:'震',shi:2,ying:5},
    '100110':{name:'雷风恒',palace:'震',shi:3,ying:6},
    '100010':{name:'地风升',palace:'震',shi:4,ying:1},
    '100011':{name:'水风井',palace:'震',shi:5,ying:2},
    '100000':{name:'泽风大过',palace:'震',shi:4,ying:1}, // 游魂
    '100001':{name:'泽雷随',palace:'震',shi:3,ying:6}, // 归魂
    // 巽宫八卦 (木)
    '011100':{name:'巽为风',palace:'巽',shi:6,ying:3},
    '011101':{name:'风天小畜',palace:'巽',shi:1,ying:4},
    '011111':{name:'风火家人',palace:'巽',shi:2,ying:5},
    '011110':{name:'风雷益',palace:'巽',shi:3,ying:6},
    '110100':{name:'天雷无妄',palace:'巽',shi:4,ying:1},
    '110101':{name:'火雷噬嗑',palace:'巽',shi:5,ying:2},
    '110110':{name:'山雷颐',palace:'巽',shi:4,ying:1}, // 游魂
    '110111':{name:'山风蛊',palace:'巽',shi:3,ying:6}, // 归魂
    // 离宫八卦 (火)
    '101101':{name:'离为火',palace:'离',shi:6,ying:3},
    '101111':{name:'火山旅',palace:'离',shi:1,ying:4},
    '101001':{name:'火风鼎',palace:'离',shi:2,ying:5},
    '101000':{name:'火水未济',palace:'离',shi:3,ying:6},
    '100101':{name:'山水蒙',palace:'离',shi:4,ying:1},
    '100100':{name:'风水涣',palace:'离',shi:5,ying:2},
    '101010':{name:'天水讼',palace:'离',shi:4,ying:1}, // 游魂
    '101011':{name:'天火同人',palace:'离',shi:3,ying:6}, // 归魂
    // 坤宫八卦 (土)
    '000000':{name:'坤为地',palace:'坤',shi:6,ying:3},
    '000001':{name:'地雷复',palace:'坤',shi:1,ying:4},
    '000011':{name:'地泽临',palace:'坤',shi:2,ying:5},
    '000010':{name:'地天泰',palace:'坤',shi:3,ying:6},
    '000110':{name:'雷天大壮',palace:'坤',shi:4,ying:1},
    '000111':{name:'泽天夬',palace:'坤',shi:5,ying:2},
    '010110':{name:'水天需',palace:'坤',shi:4,ying:1}, // 游魂
    '010001':{name:'水地比',palace:'坤',shi:3,ying:6}, // 归魂
    // 兑宫八卦 (金)
    '011011':{name:'兑为泽',palace:'兑',shi:6,ying:3},
    '011010':{name:'泽水困',palace:'兑',shi:1,ying:4},
    '011000':{name:'泽地萃',palace:'兑',shi:2,ying:5},
    '011001':{name:'泽山咸',palace:'兑',shi:3,ying:6},
    '110011':{name:'水山蹇',palace:'兑',shi:4,ying:1},
    '110010':{name:'地山谦',palace:'兑',shi:5,ying:2},
    '110001':{name:'雷山小过',palace:'兑',shi:4,ying:1}, // 游魂
    '110000':{name:'雷泽归妹',palace:'兑',shi:3,ying:6}  // 归魂
  },

  // 六兽(按日干排)
  liuShou: ['青龙','朱雀','勾陈','螣蛇','白虎','玄武'],

  /** 获取日干对应的六兽起始 */
  getLiuShou: function(dayGan) {
    // 甲乙起青龙,丙丁起朱雀,戊起勾陈,己起螣蛇,庚辛起白虎,壬癸起玄武
    var start = {甲:0,乙:0,丙:1,丁:1,戊:2,己:3,庚:4,辛:4,壬:5,癸:5};
    var s = start[dayGan] || 0;
    return [this.liuShou[s],this.liuShou[(s+1)%6],this.liuShou[(s+2)%6],this.liuShou[(s+3)%6],this.liuShou[(s+4)%6],this.liuShou[(s+5)%6]];
  },

  /** 六亲生克：以卦宫五行为"我"，与爻地支五行对比 */
  getLiuQin: function(palaceElem, zhiElem) {
    // 同我=兄弟, 我生=子孙, 我克=妻财, 生我=父母, 克我=官鬼
    if (palaceElem === zhiElem) return '兄弟';
    if (this.sheng[palaceElem] === zhiElem) return '子孙';
    if (this.ke[palaceElem] === zhiElem) return '妻财';
    if (this.sheng[zhiElem] === palaceElem) return '父母';
    if (this.ke[zhiElem] === palaceElem) return '官鬼';
    return '—';
  },

  /** 获得完整纳甲排盘 */
  getNaJia: function(benGuaKey, dayGan, monthZhi, dayZhi) {
    var hx = this.hexagrams[benGuaKey];
    if (!hx) return null;

    var palace = hx.palace;
    var palaceElem = this.palaces[palace];
    var nazhiArr = this.nazhi[palace];
    var liuShou = this.getLiuShou(dayGan);

    var lines = [];
    for (var i=0;i<6;i++) {
      var zhi = nazhiArr[i];
      var zhiElem = this.zhiWuXing[zhi];
      var liuQin = this.getLiuQin(palaceElem, zhiElem);
      var role = (i+1===hx.shi) ? '世' : (i+1===hx.ying) ? '应' : '';
      lines.push({pos:i+1,zhi:zhi,zhiElem:zhiElem,liuQin:liuQin,liuShou:liuShou[i],role:role});
    }

    // 月建对爻的影响
    var monthElem = this.zhiWuXing[monthZhi]||'';
    var dayElem = this.zhiWuXing[dayZhi]||'';
    lines.forEach(function(l){
      l.monthEffect = '';
      if (monthElem === l.zhiElem) l.monthEffect = '临月建(旺)';
      else if (this.sheng[monthElem] === l.zhiElem) l.monthEffect = '月建生(相)';
      else if (this.ke[monthElem] === l.zhiElem) l.monthEffect = '月建克(囚)';
    }.bind(this));

    // 用神
    var yongShen = lines.filter(function(l){return l.role==='世';})[0]||lines[0];

    return {
      name:hx.name,palace:palace,palaceElem:palaceElem,
      lines:lines,shi:hx.shi,ying:hx.ying,
      monthZhi:monthZhi,dayZhi:dayZhi,dayGan:dayGan
    };
  }
};
