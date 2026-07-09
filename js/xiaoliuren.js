/**
 * 小六壬 — 掌诀推算
 * 大安(1) 留连(2) 速喜(3) 赤口(4) 小吉(5) 空亡(6)
 */
var XiaoLiuRenModule = {
  palaces: [
    {no:1,name:'大安',element:'木',direction:'东方',desc:'大安事事昌，求谋在东方。失物不远去，宅舍保安康。行人身未动，病者主无妨。将军回田野，仔细与推详。',
     advice:'诸事安稳，所求之事大吉。适合行动和决策。宜向东方求谋。',level:'上吉',color:'#3cb371'},
    {no:2,name:'留连',element:'水',direction:'南方',desc:'留连事难成，求谋日未明。官事只宜缓，去者未回程。失物南方见，急讨方称心。更须防口舌，人口且平平。',
     advice:'事情进展缓慢，需要耐心等待。可能有人从中作梗。不宜急于求成。',level:'中平',color:'#f0a040'},
    {no:3,name:'速喜',element:'火',direction:'南方',desc:'速喜喜来临，求财向南行。失物申午见，路上有人寻。官事有福德，病者无祸侵。田宅六畜吉，行人有信音。',
     advice:'喜事将至，所求快速有成。宜向南谋事。好消息在路上。',level:'上吉',color:'#e06060'},
    {no:4,name:'赤口',element:'金',direction:'西方',desc:'赤口主口舌，官非切要防。失物急去寻，行人有惊慌。鸡犬多作怪，病者出西方。更须防咒咀，诚恐染瘟皇。',
     advice:'注意口舌是非，容易与人发生争执。做事需谨慎，避免冲动。防范小人。',level:'凶',color:'#c04040'},
    {no:5,name:'小吉',element:'木',direction:'东北',desc:'小吉最吉昌，路上好商量。阳人来报喜，失物在坤方。行人立便至，交关真是强。凡事皆和合，病者祷上苍。',
     advice:'小吉之兆，万事和合。有贵人相助，适合合作和谈判。',level:'吉',color:'#50a050'},
    {no:6,name:'空亡',element:'土',direction:'无定',desc:'空亡事不祥，阴人多乖张。求财无利益，行人有灾殃。失物寻不见，官事主刑伤。病人逢暗鬼，禳解保安康。',
     advice:'事有不顺，求谋难成。此时不宜做重大决定。守成为上，静待时机好转。',level:'凶',color:'#808080'}
  ],

  open: function() {
    document.getElementById('xiaoliurenOverlay').classList.add('active');
  },
  close: function() {
    document.getElementById('xiaoliurenOverlay').classList.remove('active');
  },

  /** 推算掌诀位置 */
  _calc: function(lunarMonth, lunarDay, hourIdx) {
    // Month: from 大安(1), count lunarMonth steps
    var pos1 = (lunarMonth - 1) % 6;
    // Day: from pos1, count lunarDay steps
    var pos2 = (pos1 + lunarDay - 1) % 6;
    // Hour: from pos2, count hourIdx steps (hourIdx: 0-11)
    var pos3 = (pos2 + hourIdx) % 6;
    return {month: this.palaces[pos1], day: this.palaces[pos2], hour: this.palaces[pos3], final: this.palaces[pos3]};
  },

  calculate: function() {
    var m = parseInt(document.getElementById('xlrMonth').value);
    var d = parseInt(document.getElementById('xlrDay').value);
    var h = parseInt(document.getElementById('xlrHour').value);
    if (!m || !d || isNaN(h)) { alert('请填写完整的农历月日时'); return; }
    var result = this._calc(m, d, h);
    this._render(result);
  },

  useNow: function() {
    var now = new Date();
    // Use actual lunar month/day approximation based on solar calendar
    // Simplified: use solar date as approximation
    var m = now.getMonth() + 1;
    var d = now.getDate();
    var h = Math.floor(now.getHours() / 2);
    document.getElementById('xlrMonth').value = m;
    document.getElementById('xlrDay').value = d;
    document.getElementById('xlrHour').value = h;
    var result = this._calc(m, d, h);
    this._render(result);
  },

  _render: function(result) {
    var ctn = document.getElementById('xlrResult');
    ctn.style.display = 'block';
    var p = result.final;
    ctn.innerHTML =
      '<div class="result-header">🖐️ 掌诀推算结果</div>' +
      '<div style="text-align:center;padding:0.8rem;">' +
        '<span style="font-size:2rem;color:' + p.color + ';">' + p.name + '</span>' +
        '<div style="color:var(--text-secondary);margin-top:0.3rem;">' + p.level + ' · 五行属' + p.element + ' · ' + p.direction + '</div>' +
      '</div>' +
      '<div style="color:var(--gold-pale);font-size:0.9rem;line-height:1.7;padding:0.5rem;background:var(--bg-card);border-radius:var(--radius-sm);white-space:pre-line;">' + p.desc + '</div>' +
      '<div style="color:var(--text);line-height:1.7;padding:0.5rem;">' + p.advice + '</div>' +
      '<div style="font-size:0.78rem;color:var(--text-muted);text-align:center;">月落: ' + result.month.name + ' → 日落: ' + result.day.name + ' → 时落: ' + result.hour.name + '</div>' +
      '<button class="btn-secondary" onclick="XiaoLiuRenModule.close()">🔙 返回</button>';
  }
};
