/**
 * 每日运势签模块 — 完全重写，自包含
 */
var DailyModule = {
  sticks: [],
  initialized: false,

  /** 工具函数(自包含) */
  _today: function() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },
  _randomInt: function(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  _randomPick: function(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  /** 生成100签 */
  _generate: function() {
    var levels = [
      { name: '上上签', color: '#c9a96e', weight: 5, emoji: '🏆' },
      { name: '上签',   color: '#d4a574', weight: 20, emoji: '✨' },
      { name: '中签',   color: '#7a9a5a', weight: 40, emoji: '🎯' },
      { name: '中平签', color: '#7a8a9a', weight: 20, emoji: '🌤️' },
      { name: '下签',   color: '#888888', weight: 15, emoji: '🌧️' }
    ];

    var poems = [
      { title:'钟离成道', poem:'天开地辟作良缘，\n日吉时良万物全。\n若得此签非小可，\n公行忠正帝王宣。', summary:'大吉之兆，万事求谋皆顺利。' },
      { title:'苏秦得志', poem:'鹏程万里任翱翔，\n云外飞鸿志气昂。\n他日功名成就后，\n锦衣归里好风光。', summary:'志向高远，终将功成名就。' },
      { title:'董永遇仙', poem:'姻缘本是前生定，\n月老红绳一线牵。\n莫问前程多坎坷，\n春风送暖入心田。', summary:'美好姻缘将至，宜耐心等待。' },
      { title:'姜太公钓鱼', poem:'渭水河边垂钓竿，\n时机未到莫心寒。\n风云际会终须有，\n一举成名天下安。', summary:'时机将至，需耐心等待。' },
      { title:'韩信点兵', poem:'将帅之才不可量，\n运筹帷幄定家邦。\n莫愁前路无知己，\n天下谁人不识君。', summary:'才华终将施展，贵人在侧。' },
      { title:'三顾茅庐', poem:'诚意感天金石开，\n机缘巧合自然来。\n莫将心事藏深处，\n敞开心扉见光埃。', summary:'诚心所致，金石为开。' },
      { title:'昭君出塞', poem:'雁落平沙万里秋，\n琵琶一曲解千愁。\n人生聚散皆天定，\n随缘守分莫强求。', summary:'顺应天意，随遇而安。' },
      { title:'李白醉酒', poem:'诗酒风流趁年华，\n豪情万丈走天涯。\n今朝有酒今朝醉，\n明日愁来明日嗟。', summary:'及时行乐，莫负韶华。' },
      { title:'悟空出世', poem:'石破天惊意气豪，\n翻江倒海显英豪。\n纵然前路多磨难，\n终成正果领风骚。', summary:'历经磨难，终成大器。' },
      { title:'白蛇传', poem:'千年修得共枕眠，\n情深似海感动天。\n纵然风雨来相阻，\n真心可破万重山。', summary:'情深意切，可破万难。' },
      { title:'孟姜女', poem:'泪洒长城万里寒，\n贞心一片感苍天。\n守得云开见月朗，\n日出东方照大千。', summary:'坚贞不渝，终见光明。' },
      { title:'精忠报国', poem:'壮志凌云报国心，\n精诚所至金石音。\n莫道浮云终蔽日，\n严冬过尽绽春樱。', summary:'赤诚之心，天道酬勤。' },
      { title:'伯牙绝弦', poem:'高山流水觅知音，\n琴断弦绝泪满襟。\n人生难得一知己，\n且行且惜眼前心。', summary:'珍惜知己，缘分难得。' },
      { title:'愚公移山', poem:'门前山岳阻前程，\n立志移平誓不停。\n子子孙孙无穷尽，\n功夫到处自然成。', summary:'持之以恒，终有所成。' },
      { title:'牛郎织女', poem:'银河迢迢暗度难，\n七夕相逢泪未干。\n两情若是久长时，\n又岂在朝朝暮暮。', summary:'情深不惧距离，终得团圆。' },
      { title:'庄子梦蝶', poem:'浮生若梦梦如真，\n世事如棋局局新。\n莫被虚名羁绊住，\n逍遥自在做闲人。', summary:'看淡名利，自在逍遥。' },
      { title:'卧薪尝胆', poem:'苦心人天不负心，\n三千越甲可吞金。\n莫言今日多艰苦，\n他日功成万古钦。', summary:'忍辱负重，终得雪耻。' },
      { title:'孟母三迁', poem:'慈母择邻为子忧，\n三迁其舍意悠悠。\n春风化雨润桃李，\n他日成龙耀九州。', summary:'良禽择木，环境造就人才。' },
      { title:'夸父追日', poem:'追逐光明志气昂，\n纵然倒下化山岗。\n丹心一片留天地，\n万古流芳姓氏香。', summary:'壮志未酬，精神永存。' },
      { title:'精卫填海', poem:'沧海茫茫志不移，\n微木衔来誓要齐。\n世人莫笑心太傻，\n恒心可把泰山移。', summary:'矢志不渝，铁杵磨针。' }
    ];

    var interpretations = [
      { career:'事业运上升，宜积极争取机会，贵人运旺。', love:'桃花运佳，单身者有望遇到心仪对象。', wealth:'正财运稳中有升，投资需谨慎。', health:'精力充沛，保持运动习惯。', study:'学业进步显著，考试运佳。' },
      { career:'稳扎稳打，勿急于求成，厚积薄发。', love:'感情需耐心经营，细水长流。', wealth:'财运平稳，宜储蓄不宜投机。', health:'注意劳逸结合。', study:'循序渐进，打好基础。' },
      { career:'面临选择，三思而后行，听取长辈意见。', love:'缘分未到，先完善自己。', wealth:'破财之象，避免大额消费。', health:'注意肠胃问题。', study:'调整状态，找回专注。' },
      { career:'贵人出现，事业迎来转机。', love:'旧情复燃或新缘出现。', wealth:'意外之财，但不可贪多。', health:'小病初愈，仍需调养。', study:'豁然开朗，难题迎刃而解。' },
      { career:'挑战与机遇并存，勇敢面对。', love:'感情出现波折，冷静沟通。', wealth:'财运起伏大，守住底线。', health:'压力山大，适当放松。', study:'坚持不懈突破瓶颈。' }
    ];

    this.sticks = [];
    for (var li = 0; li < levels.length; li++) {
      var level = levels[li];
      for (var j = 0; j < level.weight; j++) {
        var idx = this.sticks.length;
        var p = poems[idx % poems.length];
        var ip = interpretations[idx % interpretations.length];
        this.sticks.push({
          id: idx + 1,
          level: level.name, levelColor: level.color, levelEmoji: level.emoji,
          title: p.title + ' · 第' + (idx + 1) + '签',
          poem: p.poem, summary: p.summary,
          career: ip.career, love: ip.love, wealth: ip.wealth, health: ip.health, study: ip.study
        });
      }
    }
  },

  /** 打开模块 */
  openModule: function() {
    // 首次使用时生成签库
    if (!this.initialized) { this._generate(); this.initialized = true; }

    var overlay = document.getElementById('dailyFortuneOverlay');
    if (!overlay) { alert('模块加载失败，请刷新页面'); return; }
    overlay.classList.add('active');

    // 重置UI
    var holder = document.getElementById('stickHolder');
    var btn = document.getElementById('shakeBtn');
    var result = document.getElementById('stickResult');
    if (holder) holder.style.display = 'block';
    if (btn) {
      btn.style.display = 'block';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
    if (result) result.style.display = 'none';

    // 检查今日是否已抽
    var today = this._today();
    var lastDraw = localStorage.getItem('dailyFortuneDate');
    if (lastDraw === today) {
      var savedStr = localStorage.getItem('dailyFortuneResult');
      if (savedStr) {
        try {
          var saved = JSON.parse(savedStr);
          if (saved) {
            if (holder) holder.style.display = 'none';
            if (btn) { btn.style.display = 'none'; }
            this._showResult(saved);
          }
        } catch(e) {}
      }
    }
  },

  closeModule: function() {
    var overlay = document.getElementById('dailyFortuneOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  /** 摇签 */
  shake: function() {
    var today = this._today();
    if (localStorage.getItem('dailyFortuneDate') === today) {
      alert('今日已抽过签，请明日再来！\n（每日限抽一次）');
      return;
    }

    var holder = document.getElementById('stickHolder');
    var btn = document.getElementById('shakeBtn');
    if (!holder || !btn) return;

    holder.classList.add('shaking');
    btn.disabled = true;
    btn.textContent = '🎋 摇晃中...';

    var self = this;
    setTimeout(function() {
      holder.classList.remove('shaking');
      var stick = self._randomPick(self.sticks);
      self._showResult(stick);
      localStorage.setItem('dailyFortuneDate', today);
      localStorage.setItem('dailyFortuneResult', JSON.stringify(stick));
    }, 2000);
  },

  _showResult: function(stick) {
    var holder = document.getElementById('stickHolder');
    var btn = document.getElementById('shakeBtn');
    var result = document.getElementById('stickResult');
    if (holder) holder.style.display = 'none';
    if (btn) btn.style.display = 'none';
    if (result) result.style.display = 'block';

    var levelEl = document.getElementById('stickLevel');
    var poemEl = document.getElementById('stickPoem');
    var interpEl = document.getElementById('stickInterpretation');
    var extrasEl = document.getElementById('stickExtras');

    if (levelEl) levelEl.innerHTML =
      '<span class="level-badge" style="background:' + stick.levelColor + '20;color:' + stick.levelColor + ';border:2px solid ' + stick.levelColor + ';padding:0.3rem 1rem;border-radius:20px;font-weight:bold;">' +
      stick.levelEmoji + ' ' + stick.level + '</span>';

    if (poemEl) poemEl.innerHTML =
      '<h3 class="stick-title">📜 ' + stick.title + '</h3>' +
      '<pre class="stick-poem-text" style="white-space:pre-line;font-family:KaiTi,STKaiti,serif;font-size:1.05rem;color:var(--gold-pale);line-height:1.8;padding:0.6rem;">' + stick.poem + '</pre>' +
      '<p class="stick-summary" style="color:var(--text-secondary);font-style:italic;">' + stick.summary + '</p>';

    if (interpEl) interpEl.innerHTML =
      '<div class="interp-grid" style="display:flex;flex-direction:column;gap:0.4rem;">' +
      '<div class="interp-item">💼 <b>事业：</b>' + stick.career + '</div>' +
      '<div class="interp-item">💕 <b>感情：</b>' + stick.love + '</div>' +
      '<div class="interp-item">💰 <b>财运：</b>' + stick.wealth + '</div>' +
      '<div class="interp-item">🏥 <b>健康：</b>' + stick.health + '</div>' +
      '<div class="interp-item">📚 <b>学业：</b>' + stick.study + '</div>' +
      '</div>';

    if (extrasEl) {
      var dirs = ['东方','南方','西方','北方','东南方','东北方','西南方','西北方'];
      var fruits = ['苹果','橙子','葡萄','草莓','香蕉','桃子','西瓜','猕猴桃','火龙果','芒果'];
      extrasEl.innerHTML =
        '<div class="lucky-extras" style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;margin-top:0.6rem;">' +
        '<span class="lucky-item">🎨 幸运色：<b>' + this._randomPick(['金色','红色','紫色','蓝色','绿色','白色']) + '</b></span>' +
        '<span class="lucky-item">🔢 幸运数字：<b>' + this._randomInt(1,99) + '</b></span>' +
        '<span class="lucky-item">🧭 幸运方向：<b>' + this._randomPick(dirs) + '</b></span>' +
        '<span class="lucky-item">🍎 幸运水果：<b>' + this._randomPick(fruits) + '</b></span>' +
        '<span class="lucky-item">📅 宜：<b>' + this._randomPick(['出行','会友','签约','学习','投资','表白','求职']) + '</b></span>' +
        '<span class="lucky-item">⚠️ 忌：<b>' + this._randomPick(['冲动消费','熬夜','争吵','独断专行','过度劳累']) + '</b></span>' +
        '</div>';
    }
    Paywall.blockAll('stickResult');
  },

  reshake: function() {
    alert('今日已抽过签，请明日再来！\n（每日限抽一次，让运势沉淀）');
  }
};
