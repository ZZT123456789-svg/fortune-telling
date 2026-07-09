/**
 * 节气查询 — 二十四节气日期映射
 */
var SolarTermModule = {
  // 2024-2030 approximate solar term dates (month, day)
  terms: [
    {name:'小寒',approx:[1,5]},{name:'大寒',approx:[1,20]},
    {name:'立春',approx:[2,3]},{name:'雨水',approx:[2,18]},
    {name:'惊蛰',approx:[3,5]},{name:'春分',approx:[3,20]},
    {name:'清明',approx:[4,4]},{name:'谷雨',approx:[4,19]},
    {name:'立夏',approx:[5,5]},{name:'小满',approx:[5,20]},
    {name:'芒种',approx:[6,5]},{name:'夏至',approx:[6,21]},
    {name:'小暑',approx:[7,6]},{name:'大暑',approx:[7,22]},
    {name:'立秋',approx:[8,7]},{name:'处暑',approx:[8,22]},
    {name:'白露',approx:[9,7]},{name:'秋分',approx:[9,22]},
    {name:'寒露',approx:[10,7]},{name:'霜降',approx:[10,23]},
    {name:'立冬',approx:[11,7]},{name:'小雪',approx:[11,22]},
    {name:'大雪',approx:[12,6]},{name:'冬至',approx:[12,21]}
  ],
  seasonMap: {立春:'春',雨水:'春',惊蛰:'春',春分:'春',清明:'春',谷雨:'春',
             立夏:'夏',小满:'夏',芒种:'夏',夏至:'夏',小暑:'夏',大暑:'夏',
             立秋:'秋',处暑:'秋',白露:'秋',秋分:'秋',寒露:'秋',霜降:'秋',
             立冬:'冬',小雪:'冬',大雪:'冬',冬至:'冬',小寒:'冬',大寒:'冬'},

  open: function() {
    document.getElementById('solarTermOverlay').classList.add('active');
  },
  close: function() {
    document.getElementById('solarTermOverlay').classList.remove('active');
  },

  _findTerm: function(year, month, day) {
    var date = new Date(year, month-1, day);
    var currentTerm = null, nextTerm = null;
    for (var i = 0; i < this.terms.length; i++) {
      var t = this.terms[i];
      var tDate = new Date(year, t.approx[0]-1, t.approx[1]);
      if (date >= tDate) { currentTerm = t; }
      else { nextTerm = t; break; }
    }
    if (!currentTerm) {
      // Before first term of year
      var lastTerm = this.terms[this.terms.length-1];
      currentTerm = {name:lastTerm.name, approx:[12,21]}; // approximate
      nextTerm = this.terms[0];
    }
    if (!nextTerm) nextTerm = this.terms[0];
    var season = this.seasonMap[currentTerm.name] || '?';
    return {current:currentTerm, next:nextTerm, season:season};
  },

  lookup: function() {
    var year = parseInt(document.getElementById('solarTermYear').value) || new Date().getFullYear();
    var month = parseInt(document.getElementById('solarTermMonth').value) || new Date().getMonth()+1;
    var day = parseInt(document.getElementById('solarTermDay').value) || new Date().getDate();
    var termInfo = this._findTerm(year, month, day);
    this._render(year, month, day, termInfo);
  },

  today: function() {
    var now = new Date();
    var termInfo = this._findTerm(now.getFullYear(), now.getMonth()+1, now.getDate());
    document.getElementById('solarTermYear').value = now.getFullYear();
    document.getElementById('solarTermMonth').value = now.getMonth()+1;
    document.getElementById('solarTermDay').value = now.getDate();
    this._render(now.getFullYear(), now.getMonth()+1, now.getDate(), termInfo);
  },

  _render: function(year, month, day, termInfo) {
    var ctn = document.getElementById('solarTermResult');
    ctn.style.display = 'block';
    ctn.innerHTML =
      '<div class="result-header">🌿 ' + year + '年' + month + '月' + day + '日 节气</div>' +
      '<div style="text-align:center;padding:0.8rem;">' +
        '<div style="font-size:1.5rem;color:var(--gold);">当前节气：<b>' + termInfo.current.name + '</b></div>' +
        '<div style="color:var(--text-secondary);margin-top:0.3rem;">季节：' + termInfo.season + '季</div>' +
        '<div style="color:var(--text-muted);margin-top:0.5rem;">下一节气：' + termInfo.next.name + '（约' + termInfo.next.approx[0] + '月' + termInfo.next.approx[1] + '日）</div>' +
      '</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.8rem;">⚠ 节气日期为近似值，精确日期每年有1-2天偏差</p>' +
      '<button class="btn-secondary" onclick="SolarTermModule.close()">🔙 返回</button>';
  }
};
