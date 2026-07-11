/**
 * 测字 — 单字取象，拆形观意
 * 分析汉字的部首、结构、五行偏向
 */
var CeziModule = {
  // 部首五行归类
  radicalElements: {
    '木':'木','林':'木','森':'木','树':'木','未':'木',
    '火':'火','炎':'火','日':'火','光':'火','丙':'火','丁':'火',
    '土':'土','山':'土','石':'土','田':'土','土':'土','圭':'土',
    '金':'金','钅':'金','刀':'金','刂':'金','辛':'金','酉':'金',
    '水':'水','氵':'水','冫':'水','雨':'水','氵':'水','川':'水','子':'水','亥':'水'
  },
  // 常见字的详细含义
  charMeanings: {
    '安':'家中有女，心安则安。此字暗示安稳和家庭和谐。求安稳之事有成。',
    '福':'示旁一口田，有衣有食便是福。暗示知足常乐，好运在基础生活中。',
    '龙':'大气磅礴，有腾飞之象。但高处不胜寒，需要实力匹配。',
    '凤':'百鸟之王，高贵吉祥。贵人运旺，适合社交和展示才华。',
    '明':'日月同辉，光明正大。事情会越来越清晰，适合做决策。',
    '强':'弓虽有力，但需要技巧。暗示用巧劲而非蛮力。',
    '顺':'川流而下，顺势而为。时机对你有利，随势而行即可。',
    '发':'弓弩发力，一念之间。机会可能突然出现，需要快速反应。',
    '财':'贝是钱，才是能力。能力和财富相匹配才是真财。提醒提升自我价值。',
    '富':'家有一口田，富足安定。偏财运不错，但要守得住。',
    '贵':'中有一贝，价值居中。不卑不亢，你的价值会被认可。',
    '爱':'心在友之上，爱需要友情做基础。感情方面宜先友后爱。',
    '情':'青心为情，年轻的心最易动情。保持真心，但也要理性。',
    '缘':'丝线相连，缘分天定。不必强求，缘来自来。',
    '运':'云走之旁，运势如云流动。变化之中有机遇。',
    '成':'万事具备，只欠"力"量。再加把劲，成功在即。',
    '功':'工力结合，成功需要工作和力量。踏实努力是唯一捷径。',
    '学':'子需学习，永远保持学生心态。适合进修和提升技能。',
    '乐':'丝竹之声，快乐简单。提醒享受生活中的小确幸。',
    '梦':'林下之夕，梦想虽好但要脚踏实地。',
    '平':'天平两端，不偏不倚。保持平衡和中立，事情会自然平息。',
    '宁':'心安为宁，心静了世界就静了。适合冥想和休整。',
    '和':'禾口为和，有饭吃有话说是为和。人际和谐是当前重点。',
    '美':'羊大为美，简单质朴才是真美。',
    '善':'羊口为善，温和的言语是善的开始。',
    '进':'走之井边，前进需要绕过陷阱。提醒不要冒进。',
    '退':'艮为山，适可而止。见好就收。',
    '升':'太阳升起，向上的趋势明显。把握上升期。',
    '落':'洛水下降，有起有落是常态。低谷是蓄力的时机。'
  },

  open: function() {
    document.getElementById('ceziOverlay').classList.add('active');
  },
  close: function() {
    document.getElementById('ceziOverlay').classList.remove('active');
    document.getElementById('ceziResult').style.display = 'none';
  },

  analyze: function() {
    var ch = document.getElementById('ceziChar').value.trim();
    if (!ch || ch.length < 1) { alert('请输入一个汉字'); return; }
    ch = ch.charAt(0);

    var category = document.getElementById('ceziCategory').value;

    // Determine element based on character
    var element = '土';
    for (var rad in this.radicalElements) {
      if (ch.indexOf(rad) !== -1) { element = this.radicalElements[rad]; break; }
    }

    // Get interpretation
    var meaning = this.charMeanings[ch];
    if (!meaning) {
      // Generate based on structure
      var code = ch.charCodeAt(0);
      var elements = ['木','火','土','金','水'];
      element = elements[code % 5];
      meaning = '此字结构独特。' + element + '性之字，建议结合所问之事综合判断。';
    }

    // Category-specific advice
    var categoryAdvice = {
      general:'综合运势来看，此字透露出你的命运轨迹。',
      career:'事业方面，此字暗示了你的职业发展方向。',
      love:'感情方面，此字反映出你内心的情感状态。',
      wealth:'财运方面，此字提示了财富的流向和机会。',
      health:'健康方面，此字提醒你需要注意的身体信号。'
    };

    var ctn = document.getElementById('ceziResult');
    ctn.style.display = 'block';
    ctn.innerHTML =
      '<div class="result-header">✍️ 测字：「' + ch + '」</div>' +
      '<div style="text-align:center;font-size:4rem;padding:0.5rem;">' + ch + '</div>' +
      '<div style="text-align:center;color:var(--text-secondary);">五行属' + element + '</div>' +
      '<div style="color:var(--gold-pale);padding:0.5rem;line-height:1.7;">' + meaning + '</div>' +
      '<div style="color:var(--text);padding:0.5rem;line-height:1.7;">' + categoryAdvice[category] + '</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.76rem;">测字为趣味参考，请理性看待结果</p>' +
      '<button class="btn-secondary" onclick="CeziModule.close()">🔙 返回</button>';
    Paywall.checkCover('ceziResult');
  }
};
