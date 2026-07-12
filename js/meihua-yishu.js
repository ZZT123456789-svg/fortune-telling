/**
 * 梅花易数 — 数字/时间起卦
 * 三数起卦：上卦=数1%8, 下卦=数2%8, 动爻=数3%6
 */
var MeihuaModule = {
  bagua: [
    {no:1,name:'乾',symbol:'☰',element:'金',nature:'天',direction:'西北'},
    {no:2,name:'兑',symbol:'☱',element:'金',nature:'泽',direction:'西'},
    {no:3,name:'离',symbol:'☲',element:'火',nature:'火',direction:'南'},
    {no:4,name:'震',symbol:'☳',element:'木',nature:'雷',direction:'东'},
    {no:5,name:'巽',symbol:'☴',element:'木',nature:'风',direction:'东南'},
    {no:6,name:'坎',symbol:'☵',element:'水',nature:'水',direction:'北'},
    {no:7,name:'艮',symbol:'☶',element:'土',nature:'山',direction:'东北'},
    {no:8,name:'坤',symbol:'☷',element:'土',nature:'地',direction:'西南'}
  ],

  // 六十四卦简表 (上卦*8+下卦)
  hexNames: {
    '11':'乾为天','12':'天泽履','13':'天火同人','14':'天雷无妄','15':'天风姤','16':'天水讼','17':'天山遁','18':'天地否',
    '21':'泽天夬','22':'兑为泽','23':'泽火革','24':'泽雷随','25':'泽风大过','26':'泽水困','27':'泽山咸','28':'泽地萃',
    '31':'火天大有','32':'火泽睽','33':'离为火','34':'火雷噬嗑','35':'火风鼎','36':'火水未济','37':'火山旅','38':'火地晋',
    '41':'雷天大壮','42':'雷泽归妹','43':'雷火丰','44':'震为雷','45':'雷风恒','46':'雷水解','47':'雷山小过','48':'雷地豫',
    '51':'风天小畜','52':'风泽中孚','53':'风火家人','54':'风雷益','55':'巽为风','56':'风水涣','57':'风山渐','58':'风地观',
    '61':'水天需','62':'水泽节','63':'水火既济','64':'水雷屯','65':'水风井','66':'坎为水','67':'水山蹇','68':'水地比',
    '71':'山天大畜','72':'山泽损','73':'山火贲','74':'山雷颐','75':'山风蛊','76':'山水蒙','77':'艮为山','78':'山地剥',
    '81':'地天泰','82':'地泽临','83':'地火明夷','84':'地雷复','85':'地风升','86':'地水师','87':'地山谦','88':'坤为地'
  },

  hexInterpretations: {
    '11':'大吉之卦。乾为天，纯阳之象，代表创始和力量。宜主动进取，把握时机。',
    '12':'谨慎行事。踩在虎尾上而不被咬，说明处境微妙。守规矩，跟对人。',
    '13':'利于合作。天火同人，大家同心协力。多交朋友，少树敌人。',
    '14':'大获丰收。火在天上，光明普照。分享你的成果，好运加倍。',
    '18':'闭塞不通。天地不交，事情受阻。守成为上，等待时机转变。',
    '27':'感而遂通。山泽通气，感情上的事情比较有利。',
    '33':'离为火，光明之象。事业和人际关系都比较明朗。',
    '44':'雷声大作，震动四方。适合大动作和重要决策。',
    '51':'小有积蓄。密云不雨，还差一点火候。继续努力。',
    '55':'巽为风，柔顺之象。顺势而为，随机应变。',
    '61':'需要耐心等待。前面有水，要慎重。时机未到不要急。',
    '66':'坎为水，险陷之象。可能遇到困难，但坚守正道可化险为夷。',
    '68':'水地比，亲附和合。适合合作与团结。',
    '77':'艮为山，止息之象。适可而止，不要贪多。',
    '81':'天地交泰，大吉大利。万事亨通，适合开展新计划。',
    '84':'一阳来复，冬去春来。情况开始好转，坚持就是胜利。',
    '88':'坤为地，柔顺承载。顺势包容，以柔克刚。'
  },

  open: function() {
    document.getElementById('meihuaOverlay').classList.add('active');
  },
  close: function() {
    document.getElementById('meihuaOverlay').classList.remove('active');
    document.getElementById('meihuaResult').style.display = 'none';
  },

  /** 梅花易数起卦 */
  _qiGua: function(n1, n2, n3) {
    var upperIdx = ((n1 - 1) % 8);
    var lowerIdx = ((n2 - 1) % 8);
    var dongYao = ((n3 - 1) % 6) + 1;

    var upper = this.bagua[upperIdx];
    var lower = this.bagua[lowerIdx];
    var benGuaKey = '' + upper.no + lower.no;
    var benGuaName = this.hexNames[benGuaKey] || (upper.name + lower.name);

    // 变卦：动爻改变下卦对应的爻位
    var changedUpperIdx = upperIdx;
    var changedLowerIdx = lowerIdx;
    if (dongYao <= 3) {
      // 下卦变动
      var mask = 1 << (2 - (dongYao - 1)); // bit 2,1,0 for yao 1,2,3
      changedLowerIdx = lowerIdx ^ mask;
    } else {
      // 上卦变动 (yao 4,5,6 -> bit 2,1,0)
      var mask = 1 << (5 - dongYao);
      changedUpperIdx = upperIdx ^ mask;
    }
    var changedUpper = this.bagua[changedUpperIdx];
    var changedLower = this.bagua[changedLowerIdx];
    var bianGuaKey = '' + changedUpper.no + changedLower.no;
    var bianGuaName = this.hexNames[bianGuaKey] || (changedUpper.name + changedLower.name);

    // 体用：动爻在上卦则上卦为用，下卦为体；反之亦然
    var tiGua = dongYao <= 3 ? upper : lower;
    var yongGua = dongYao <= 3 ? lower : upper;

    // 体用生克
    var relation = this._shengKe(tiGua.element, yongGua.element);

    var interpretation = this.hexInterpretations[benGuaKey] || this.hexInterpretations[bianGuaKey] || '此卦提示需要结合具体情况判断。体用关系是重要参考。';

    return {
      benGua: {key:benGuaKey, name:benGuaName, upper:upper, lower:lower},
      bianGua: {key:bianGuaKey, name:bianGuaName, upper:changedUpper, lower:changedLower},
      dongYao: dongYao,
      tiGua: tiGua,
      yongGua: yongGua,
      relation: relation,
      interpretation: interpretation
    };
  },

  _shengKe: function(elem1, elem2) {
    var cycle = {木:'火',火:'土',土:'金',金:'水',水:'木'};
    var ke = {木:'土',土:'水',水:'火',火:'金',金:'木'};
    if (cycle[elem1] === elem2) return '用生体，大吉。外物来助你，所求顺遂。';
    if (cycle[elem2] === elem1) return '体生用，小吉。你需要付出努力，但结果是好的。';
    if (ke[elem1] === elem2) return '体克用，中吉。你能掌控局面，适合积极争取。';
    if (ke[elem2] === elem1) return '用克体，谨慎。外部力量不利，需要小心应对。';
    if (elem1 === elem2) return '体用比和，顺遂。内外和谐，事情自然发展。';
    return '体用关系需结合具体卦象分析。';
  },

  calculate: function() {
    var n1 = parseInt(document.getElementById('meihuaNum1').value);
    var n2 = parseInt(document.getElementById('meihuaNum2').value);
    var n3 = parseInt(document.getElementById('meihuaNum3').value);
    if (!n1 || !n2 || !n3) { alert('请输入三个数字（1-999）'); return; }
    var result = this._qiGua(n1, n2, n3);
    MeihuaModule._render(result);
    Paywall.blockAll('meihuaResult');
  },

  useTime: function() {
    var now = new Date();
    var n1 = now.getFullYear() % 100;
    var n2 = now.getMonth() + 1;
    var n3 = now.getDate();
    document.getElementById('meihuaNum1').value = n1;
    document.getElementById('meihuaNum2').value = n2;
    document.getElementById('meihuaNum3').value = n3;
    var result = this._qiGua(n1, n2, n3);
    MeihuaModule._render(result);
    Paywall.blockAll('meihuaResult');
  },

  _render: function(r) {
    var ctn = document.getElementById('meihuaResult');
    ctn.style.display = 'block';
    ctn.innerHTML =
      '<div class="result-header">🌸 梅花易数排盘</div>' +
      '<div style="text-align:center;padding:0.6rem;">' +
        '<div style="font-size:2rem;">' + r.benGua.lower.symbol + ' ' + r.benGua.upper.symbol + '</div>' +
        '<div style="color:var(--gold);font-weight:bold;font-size:1.1rem;">本卦：' + r.benGua.name + '</div>' +
        '<div style="color:var(--text-secondary);">' + r.benGua.upper.name + '上' + r.benGua.lower.name + '下 · 动爻第' + r.dongYao + '爻</div>' +
        '<div style="font-size:2rem;margin-top:0.5rem;">' + r.bianGua.lower.symbol + ' ' + r.bianGua.upper.symbol + '</div>' +
        '<div style="color:var(--gold);font-weight:bold;">变卦：' + r.bianGua.name + '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:center;gap:1rem;padding:0.5rem;">' +
        '<div style="text-align:center;"><b>体卦</b><br/>' + r.tiGua.symbol + '<br/>' + r.tiGua.name + '·' + r.tiGua.element + '</div>' +
        '<div style="text-align:center;"><b>用卦</b><br/>' + r.yongGua.symbol + '<br/>' + r.yongGua.name + '·' + r.yongGua.element + '</div>' +
      '</div>' +
      '<div style="color:var(--gold-pale);padding:0.5rem;background:var(--bg-card);border-radius:var(--radius-sm);line-height:1.7;">' + r.relation + '</div>' +
      '<div style="color:var(--text);padding:0.5rem;line-height:1.7;">' + r.interpretation + '</div>' +
      '<button class="btn-secondary" onclick="MeihuaModule.close()">🔙 返回</button>';
  }
};
