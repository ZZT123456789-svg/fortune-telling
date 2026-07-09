/**
 * 择日速览 — 按日期和事项查看宜忌
 */
var AuspiciousDateModule = {
  open: function() {
    document.getElementById('auspiciousDateOverlay').classList.add('active');
  },
  close: function() {
    document.getElementById('auspiciousDateOverlay').classList.remove('active');
    document.getElementById('ausDateResult').style.display = 'none';
  },

  lookup: function() {
    var y = parseInt(document.getElementById('ausDateYear').value);
    var m = parseInt(document.getElementById('ausDateMonth').value);
    var d = parseInt(document.getElementById('ausDateDay').value);
    var event = document.getElementById('ausDateEvent').value;

    if (!y || !m || !d) { alert('请输入完整日期'); return; }

    // Simple algorithm: use date modulo to determine auspiciousness
    var dateNum = y * 10000 + m * 100 + d;
    var score = (dateNum * 7 + 13) % 100;

    var eventNames = {move:'搬家入宅',marry:'结婚嫁娶',open:'开业开市',travel:'出行远行',build:'动土装修',bury:'安葬入土'};
    var eventName = eventNames[event] || event;

    var level, levelColor, desc;
    if (score >= 70) {
      level = '吉日';
      levelColor = '#3cb371';
      desc = '此日适合' + eventName + '。各项条件都比较有利，可以放心安排。';
    } else if (score >= 40) {
      level = '平日';
      levelColor = '#f0a040';
      desc = '此日' + eventName + '为平。没有特别的冲煞，但也不是最佳选择。可以根据个人情况安排。';
    } else {
      level = '不宜';
      levelColor = '#c04040';
      desc = '此日不太适合' + eventName + '。建议另择吉日，避开此日以保顺利。';
    }

    var altDate = new Date(y, m-1, d);
    altDate.setDate(altDate.getDate() + (3 - (score % 6)));
    var altY = altDate.getFullYear(), altM = altDate.getMonth()+1, altD = altDate.getDate();

    var ctn = document.getElementById('ausDateResult');
    ctn.style.display = 'block';
    ctn.innerHTML =
      '<div class="result-header">🗓️ ' + y + '年' + m + '月' + d + '日 择日结果</div>' +
      '<div style="text-align:center;padding:0.8rem;">' +
        '<div style="font-size:1.3rem;color:' + levelColor + ';font-weight:bold;">' + level + '</div>' +
        '<div style="color:var(--text-secondary);">事项：' + eventName + '</div>' +
      '</div>' +
      '<div style="color:var(--text);line-height:1.7;padding:0.5rem;">' + desc + '</div>' +
      '<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;">建议备选日期：' + altY + '年' + altM + '月' + altD + '日</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.74rem;">仅供参考，重大事宜请咨询专业择日师</p>' +
      '<button class="btn-secondary" onclick="AuspiciousDateModule.close()">🔙 返回</button>';
  }
};
