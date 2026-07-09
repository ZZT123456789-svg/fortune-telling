/**
 * 六爻起卦 — 铜钱摇卦法
 * 六次摇卦，从下往上排爻，生成六爻卦象
 */
var LiuyaoModule = {
  currentRound: 0,
  yaoLines: [], // [{type:'old_yang'|'young_yang'|'old_yin'|'young_yin'}, ...]
  baguaNames: ['坤','震','坎','兑','艮','离','巽','乾'],
  baguaSymbols: ['☷','☳','☵','☱','☶','☲','☴','☰'],

  // 64 hexagram names indexed by (upper<<3 | lower)
  hex64: [
    '坤为地','山地剥','水地比','风地观','雷地豫','火地晋','泽地萃','天地否',
    '地山谦','艮为山','水山蹇','风山渐','雷山小过','火山旅','泽山咸','天山遁',
    '地水师','山水蒙','坎为水','风水涣','雷水解','火水未济','泽水困','天水讼',
    '地风升','山风蛊','水风井','巽为风','雷风恒','火风鼎','泽风大过','天风姤',
    '地雷复','山雷颐','水雷屯','风雷益','震为雷','火雷噬嗑','泽雷随','天雷无妄',
    '地火明夷','山火贲','水火既济','风火家人','雷火丰','离为火','泽火革','天火同人',
    '地泽临','山泽损','水泽节','风泽中孚','雷泽归妹','火泽睽','兑为泽','天泽履',
    '地天泰','山天大畜','水天需','风天小畜','雷天大壮','火天大有','泽天夬','乾为天'
  ],

  // 六亲 (based on hexagram's 所属五行 and each 爻的地支五行)
  sixQin: ['父母','兄弟','妻财','官鬼','子孙'],
  sixShen: ['青龙','朱雀','勾陈','螣蛇','白虎','玄武'],

  open: function() {
    document.getElementById('liuyaoOverlay').classList.add('active');
    this._reset();
  },
  close: function() {
    document.getElementById('liuyaoOverlay').classList.remove('active');
    this._reset();
  },

  _reset: function() {
    this.currentRound = 0;
    this.yaoLines = [];
    document.getElementById('liuyaoStart').style.display = 'block';
    document.getElementById('liuyaoShaking').style.display = 'none';
    document.getElementById('liuyaoResult').style.display = 'none';
    document.getElementById('yaoDisplay').innerHTML = '';
  },

  start: function() {
    document.getElementById('liuyaoStart').style.display = 'none';
    document.getElementById('liuyaoShaking').style.display = 'block';
    document.getElementById('liuyaoResult').style.display = 'none';
    this.currentRound = 0;
    this.yaoLines = [];
    document.getElementById('yaoDisplay').innerHTML = '';
    this._updateRound();
  },

  shake: function() {
    var self = this;
    var coin = document.getElementById('coinAnim');
    coin.classList.add('shaking');
    setTimeout(function() {
      coin.classList.remove('shaking');
      self._doShake();
    }, 600);
  },

  _doShake: function() {
    // Simulate 3 coins: each coin is heads(3) or tails(2)
    // Sum: 6=old yin(--x--), 7=young yang(---), 8=young yin(-- --), 9=old yang(--o--)
    var coins = [
      Math.random() < 0.5 ? 3 : 2,
      Math.random() < 0.5 ? 3 : 2,
      Math.random() < 0.5 ? 3 : 2
    ];
    var sum = coins[0] + coins[1] + coins[2];
    var type, display;
    if (sum === 6) { type = 'old_yin'; display = '⚋ ╳'; }
    else if (sum === 7) { type = 'young_yang'; display = '⚊'; }
    else if (sum === 8) { type = 'young_yin'; display = '⚋'; }
    else { type = 'old_yang'; display = '⚊ ○'; }

    this.yaoLines.push({type:type, display:display, sum:sum});
    this.currentRound++;

    // Display current yao lines
    var html = '';
    for (var i = this.yaoLines.length - 1; i >= 0; i--) {
      html += '<div class="yao-line">第' + (i+1) + '爻：' + this.yaoLines[i].display + '</div>';
    }
    document.getElementById('yaoDisplay').innerHTML = html;

    if (this.currentRound >= 6) {
      this._showResult();
    } else {
      this._updateRound();
    }
  },

  _updateRound: function() {
    document.getElementById('liuyaoRound').textContent = this.currentRound + 1;
    document.getElementById('liuyaoRoundBtn').textContent = this.currentRound + 1;
  },

  _showResult: function() {
    document.getElementById('liuyaoShaking').style.display = 'none';
    // Build hexagram from bottom (yaoLines[0]) to top (yaoLines[5])
    // Upper trigram: yaoLines[3..5], Lower trigram: yaoLines[0..2]
    var lowerVal = 0, upperVal = 0;
    for (var i = 0; i < 3; i++) {
      var line = this.yaoLines[i];
      var isYang = (line.type === 'young_yang' || line.type === 'old_yang');
      if (isYang) lowerVal |= (1 << i);
    }
    for (var i = 3; i < 6; i++) {
      var line = this.yaoLines[i];
      var isYang = (line.type === 'young_yang' || line.type === 'old_yang');
      if (isYang) upperVal |= (1 << (i - 3));
    }
    var hexIdx = upperVal * 8 + lowerVal;
    var benName = this.hex64[hexIdx] || ('卦' + hexIdx);

    // Check changing lines
    var changingLines = [];
    for (var j = 0; j < 6; j++) {
      if (this.yaoLines[j].type === 'old_yin' || this.yaoLines[j].type === 'old_yang') {
        changingLines.push(j + 1);
      }
    }

    // Calculate bian gua (changed hexagram)
    var changedLower = lowerVal, changedUpper = upperVal;
    for (var k = 0; k < changingLines.length; k++) {
      var idx = changingLines[k] - 1;
      if (idx < 3) changedLower ^= (1 << idx);
      else changedUpper ^= (1 << (idx - 3));
    }
    var bianIdx = changedUpper * 8 + changedLower;
    var bianName = this.hex64[bianIdx] || ('卦' + bianIdx);
    var isChanged = changingLines.length > 0;

    // Generate general advice
    var advices = [
      '时机成熟，适合积极行动。贵人可能在东南方出现。',
      '耐心等待，时机尚未完全成熟。多听取他人意见。',
      '目前形势对自己有利，抓住机会果断决策。',
      '小心谨慎为上，不宜冒进。守成为佳。',
      '贵人相助在即，保持积极心态，好事将近。',
      '需调整策略和方向，当前的方法可能需要改变。'
    ];
    var advice = advices[hexIdx % advices.length];

    var yaoDisplayFull = '';
    for (var y = 5; y >= 0; y--) {
      var label = '';
      if (y === 5) label = '上爻';
      else if (y === 4) label = '五爻';
      else if (y === 3) label = '四爻';
      else if (y === 2) label = '三爻';
      else if (y === 1) label = '二爻';
      else label = '初爻';
      yaoDisplayFull += '<div style="font-size:1.2rem;padding:0.1rem 0;">' + label + '：' + this.yaoLines[y].display + '</div>';
    }

    var resultEl = document.getElementById('liuyaoResult');
    resultEl.style.display = 'block';
    resultEl.innerHTML =
      '<div class="result-header">🪙 六爻排盘</div>' +
      '<div style="text-align:center;padding:0.5rem;">' +
        '<div style="font-size:2.5rem;">' + this.baguaSymbols[lowerVal] + ' ' + this.baguaSymbols[upperVal] + '</div>' +
        '<div style="color:var(--gold);font-weight:bold;font-size:1.1rem;">本卦：' + benName + '</div>' +
        '<div>' + this.baguaNames[lowerVal] + '下 ' + this.baguaNames[upperVal] + '上</div>' +
      '</div>' +
      yaoDisplayFull +
      (isChanged ?
        '<div style="text-align:center;padding:0.5rem;">' +
          '<div style="font-size:2rem;">' + this.baguaSymbols[changedLower] + ' ' + this.baguaSymbols[changedUpper] + '</div>' +
          '<div style="color:var(--gold);font-weight:bold;">变卦：' + bianName + '</div>' +
          '<div style="color:var(--text-secondary);">动爻：第' + changingLines.join('、') + '爻</div>' +
        '</div>' : '<div style="text-align:center;color:var(--text-muted);">静卦，无动爻</div>') +
      '<div style="color:var(--text);padding:0.5rem;line-height:1.7;">' + advice + '</div>' +
      '<div style="text-align:center;color:var(--text-muted);font-size:0.76rem;">提示：所问之事越具体，卦象越有参考价值</div>' +
      '<button class="btn-secondary" onclick="LiuyaoModule.start()">🪙 重新摇卦</button>' +
      '<button class="btn-secondary" onclick="LiuyaoModule.close()">🔙 返回</button>';
  }
};
