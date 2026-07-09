/**
 * MBTI × 星座 趣味算命模块
 * 10 道趣味题 → MBTI 类型 → 星座匹配 → 命理人格
 */

const MbtiModule = {
  currentQuestion: 0,
  scores: { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 },
  zodiac: '',

  openModule: function() {
    document.getElementById('mbtiOverlay').classList.add('active');
    this.reset();
  },

  closeModule: function() {
    document.getElementById('mbtiOverlay').classList.remove('active');
  },

  questions: [
    {
      text: '🌍 来到一个陌生的城市旅行，你更喜欢？',
      options: [
        { text: '跟着感觉走，探索未知的街巷', dim: 'N', score: 2 },
        { text: '提前做好攻略，按计划打卡', dim: 'S', score: 2 },
        { text: '看看别人推荐什么再决定', dim: 'S', score: 1 }
      ]
    },
    {
      text: '🎉 参加一个热闹的派对，你通常会？',
      options: [
        { text: '主动认识新朋友，成为全场焦点', dim: 'E', score: 2 },
        { text: '和熟悉的朋友待在一起聊天', dim: 'I', score: 2 },
        { text: '找个安静的角落观察大家', dim: 'I', score: 1 }
      ]
    },
    {
      text: '🤔 做重要决定时，你更相信？',
      options: [
        { text: '数据、事实和逻辑分析', dim: 'T', score: 2 },
        { text: '内心的直觉和感受', dim: 'F', score: 2 },
        { text: '朋友或家人的建议', dim: 'F', score: 1 }
      ]
    },
    {
      text: '📅 面对截止日期，你倾向于？',
      options: [
        { text: '提前计划，按部就班完成', dim: 'J', score: 2 },
        { text: '最后时刻冲刺，压力产生动力', dim: 'P', score: 2 },
        { text: '看情况，有时早有时晚', dim: 'P', score: 1 }
      ]
    },
    {
      text: '📚 学习新知识时，你喜欢？',
      options: [
        { text: '先了解整体框架和理论', dim: 'N', score: 2 },
        { text: '从具体的例子和实践入手', dim: 'S', score: 2 },
        { text: '边做边学，在实践中领悟', dim: 'S', score: 1 }
      ]
    },
    {
      text: '💬 和朋友产生分歧时，你会？',
      options: [
        { text: '理性分析对错，讲道理说服对方', dim: 'T', score: 2 },
        { text: '照顾对方情绪，优先维护关系', dim: 'F', score: 2 },
        { text: '先冷静一下，回头再聊', dim: 'T', score: 1 }
      ]
    },
    {
      text: '🏠 周末你更想怎么度过？',
      options: [
        { text: '约朋友出去玩、聚会、参加活动', dim: 'E', score: 2 },
        { text: '在家看书、追剧、独处充电', dim: 'I', score: 2 },
        { text: '出门走走，但一个人就好', dim: 'I', score: 1 }
      ]
    },
    {
      text: '🎨 你更欣赏哪种能力？',
      options: [
        { text: '天马行空的想象力和创造力', dim: 'N', score: 2 },
        { text: '脚踏实地的执行力和细心', dim: 'S', score: 2 },
        { text: '两者都很重要，难以抉择', dim: 'N', score: 1 }
      ]
    },
    {
      text: '🗂️ 你的桌面/房间通常是？',
      options: [
        { text: '井井有条，每样东西都有位置', dim: 'J', score: 2 },
        { text: '有点乱但我能快速找到想要的东西', dim: 'P', score: 2 },
        { text: '时整洁时乱，看心情', dim: 'J', score: 1 }
      ]
    },
    {
      text: '💭 别人对你最常见的评价是？',
      options: [
        { text: '理性冷静，逻辑清晰', dim: 'T', score: 2 },
        { text: '温暖体贴，善解人意', dim: 'F', score: 2 },
        { text: '活泼开朗，人缘好', dim: 'E', score: 1 }
      ]
    }
  ],

  mbtiProfiles: {
    'INTJ': { name: '建筑师', emoji: '🏛️', desc: '你是天生的战略家，拥有宏大的视野和缜密的思维。在命理中，你就像运筹帷幄的诸葛亮，深谋远虑，善于布局。', ancient: '诸葛亮', element: '金' },
    'INTP': { name: '逻辑学家', emoji: '🔬', desc: '你拥有旺盛的好奇心和卓越的分析能力。在命理中，你就像发明家张衡，不断探索世界的规律和真理。', ancient: '张衡', element: '水' },
    'ENTJ': { name: '指挥官', emoji: '👑', desc: '你是天生的领导者，果断、有魄力、目标明确。在命理中，你就像一代天骄成吉思汗，注定要成就一番事业。', ancient: '成吉思汗', element: '火' },
    'ENTP': { name: '辩论家', emoji: '⚡', desc: '你机智善辩，思维敏捷，总能找到创新的解决方案。在命理中，你就像鬼谷子，纵横捭阖，口才无双。', ancient: '鬼谷子', element: '木' },
    'INFJ': { name: '提倡者', emoji: '🌙', desc: '你拥有深邃的洞察力和强烈的使命感。在命理中，你就像观世音菩萨，心怀慈悲，普度众生。', ancient: '观世音', element: '水' },
    'INFP': { name: '调停者', emoji: '🕊️', desc: '你是理想主义者，内心充满诗意和美好。在命理中，你就像陶渊明，追求内心的桃花源，不落俗套。', ancient: '陶渊明', element: '木' },
    'ENFJ': { name: '主人公', emoji: '🌟', desc: '你非常有感染力，能够激励和帮助身边的人。在命理中，你就像孔子，传道授业，桃李满天下。', ancient: '孔子', element: '火' },
    'ENFP': { name: '竞选者', emoji: '🦋', desc: '你热情洋溢，充满好奇和可能性。在命理中，你就像李白，自由洒脱，才华横溢，一生不羁。', ancient: '李白', element: '木' },
    'ISTJ': { name: '物流师', emoji: '⚙️', desc: '你可靠、务实、一丝不苟。在命理中，你就像包拯，铁面无私，秉公执法，值得信赖。', ancient: '包拯', element: '土' },
    'ISFJ': { name: '守卫者', emoji: '🛡️', desc: '你温柔体贴，默默守护身边的人。在命理中，你就像花木兰，忠孝两全，勇敢而细腻。', ancient: '花木兰', element: '土' },
    'ESTJ': { name: '总经理', emoji: '📋', desc: '你擅长组织和管理，执行力一流。在命理中，你就像秦始皇，统一六国，建立秩序，功勋赫赫。', ancient: '秦始皇', element: '金' },
    'ESFJ': { name: '执政官', emoji: '🤝', desc: '你热心周到，是大家的贴心人。在命理中，你就像王昭君，以和为贵，凝聚人心。', ancient: '王昭君', element: '土' },
    'ISTP': { name: '鉴赏家', emoji: '🔧', desc: '你冷静沉着，动手能力超强。在命理中，你就像鲁班，技艺精湛，巧夺天工。', ancient: '鲁班', element: '金' },
    'ISFP': { name: '探险家', emoji: '🎨', desc: '你拥有独特的审美和艺术天赋。在命理中，你就像王羲之，笔墨丹青，自成一派。', ancient: '王羲之', element: '木' },
    'ESTP': { name: '企业家', emoji: '🚀', desc: '你精力充沛，行动力强，是实干型的冒险家。在命理中，你就像孙悟空，敢作敢为，大闹天宫。', ancient: '孙悟空', element: '火' },
    'ESFP': { name: '表演者', emoji: '🎭', desc: '你是天生的表演者，享受当下的快乐。在命理中，你就像唐伯虎，风流倜傥，才华横溢。', ancient: '唐伯虎', element: '火' }
  },

  zodiacTraits: {
    '白羊座': '热情勇敢、直率冲动',
    '金牛座': '稳重踏实、固执坚持',
    '双子座': '聪明机智、多变好奇',
    '巨蟹座': '温柔敏感、顾家恋旧',
    '狮子座': '自信大方、霸气外露',
    '处女座': '细致周到、追求完美',
    '天秤座': '优雅公正、犹豫不决',
    '天蝎座': '深沉神秘、洞察力强',
    '射手座': '乐观自由、热爱冒险',
    '摩羯座': '自律坚韧、目标导向',
    '水瓶座': '独立创新、理性博爱',
    '双鱼座': '浪漫梦幻、富有同情心'
  },

  init() {
    // 初始化由 HTML onclick 触发
  },

  start() {
    this.zodiac = document.getElementById('mbtiZodiac').value;
    this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    this.currentQuestion = 0;

    hideEl('mbtiStart');
    showEl('mbtiQuiz');
    hideEl('mbtiResult');

    this.showQuestion();
  },

  showQuestion() {
    if (this.currentQuestion >= this.questions.length) {
      this.showResult();
      return;
    }

    const q = this.questions[this.currentQuestion];
    document.getElementById('quizQuestion').textContent = q.text;
    document.getElementById('quizProgress').style.width = `${(this.currentQuestion / this.questions.length) * 100}%`;
    document.getElementById('quizProgressText').textContent = `${this.currentQuestion + 1}/${this.questions.length}`;

    const optionsEl = document.getElementById('quizOptions');
    optionsEl.innerHTML = '';

    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        this.scores[opt.dim] = (this.scores[opt.dim] || 0) + opt.score;
        this.currentQuestion++;
        // 小延迟让用户看到选择
        btn.style.background = 'rgba(201,169,110,0.3)';
        setTimeout(() => this.showQuestion(), 300);
      });
      optionsEl.appendChild(btn);
    });
  },

  showResult() {
    hideEl('mbtiQuiz');
    showEl('mbtiResult');

    // 计算 MBTI
    const type =
      (this.scores.E >= this.scores.I ? 'E' : 'I') +
      (this.scores.S >= this.scores.N ? 'S' : 'N') +
      (this.scores.T >= this.scores.F ? 'T' : 'F') +
      (this.scores.J >= this.scores.P ? 'J' : 'P');

    const profile = this.mbtiProfiles[type] || this.mbtiProfiles['INFP'];
    const zodiacTrait = this.zodiacTraits[this.zodiac] || '性格独特，与众不同';

    document.getElementById('mbtiResultHeader').innerHTML = `
      <div class="mbti-type-badge">
        <span class="mbti-emoji">${profile.emoji}</span>
        <span class="mbti-type-name">${type} - ${profile.name}</span>
        <span class="mbti-ancient">🏛️ 命理人格：${profile.ancient}</span>
      </div>
    `;

    document.getElementById('mbtiResultContent').innerHTML = `
      <div class="mbti-profile-card">
        <p class="mbti-desc">${profile.desc}</p>
        <div class="mbti-details">
          <div class="mbti-trait-box">
            <h5>♈ 你的星座特质</h5>
            <p>${this.zodiac}：${zodiacTrait}</p>
          </div>
          <div class="mbti-trait-box">
            <h5>🎭 MBTI + 星座 综合分析</h5>
            <p>当 <b>${type}</b> 遇上 <b>${this.zodiac}</b>，${this._getCompatibility(type, this.zodiac)}</p>
          </div>
          <div class="mbti-trait-box">
            <h5>🎨 五行倾向</h5>
            <p>你的命理人格偏向 <b style="color:${WUXING_COLORS[profile.element] || '#c9a96e'}">${profile.element}</b> 属性，建议在日常生活中多接触${this._getElementAdvice(profile.element)}</p>
          </div>
          <div class="mbti-trait-box">
            <h5>🍀 今日幸运提示</h5>
            <p>幸运色：<b>${randomPick(['金色','紫色','蓝色','红色','绿色','白色'])}</b> | 幸运数字：<b>${randomInt(1, 99)}</b></p>
            <p>宜：<b>${randomPick(['勇敢表达','尝试新事物','与朋友相聚','静心思考','大胆决策','放松身心'])}</b></p>
          </div>
        </div>
        <p class="mbti-share-hint">📸 截图分享给你的朋友，看看他们是什么命理人格吧！</p>
      </div>
    `;
  },

  _getCompatibility(type, zodiac) {
    const fireSigns = ['白羊座', '狮子座', '射手座'];
    const earthSigns = ['金牛座', '处女座', '摩羯座'];
    const airSigns = ['双子座', '天秤座', '水瓶座'];
    const waterSigns = ['巨蟹座', '天蝎座', '双鱼座'];

    const extrovertTypes = ['E'];
    const firstLetter = type[0];

    if (firstLetter === 'E' && fireSigns.indexOf(zodiac) >= 0) return '你的外向特质与火象星座的热情完美匹配，注定光芒四射！';
    if (firstLetter === 'E' && airSigns.indexOf(zodiac) >= 0) return '你的社交天赋与风象星座的灵动相得益彰，人脉是你的财富。';
    if (firstLetter === 'I' && waterSigns.indexOf(zodiac) >= 0) return '你的内敛与水象星座的深邃不谋而合，内心世界丰富而强大。';
    if (firstLetter === 'I' && earthSigns.indexOf(zodiac) >= 0) return '你的沉稳与土象星座的务实完美契合，脚踏实地终成大器。';

    if (type[1] === 'N' && (waterSigns.indexOf(zodiac) >= 0 || airSigns.indexOf(zodiac) >= 0))
      return '你的直觉力与星座的灵性特质相互加持，创意和灵感源源不断。';
    if (type[1] === 'S' && (earthSigns.indexOf(zodiac) >= 0 || fireSigns.indexOf(zodiac) >= 0))
      return '你的务实作风与星座的现实特质相辅相成，执行力是你的王牌。';

    return '形成了独特的性格组合，既有理性的思考，又有星座赋予的独特魅力。';
  },

  _getElementAdvice(element) {
    const advices = {
      '金': '金属性的颜色（白色、金色）和饰品，有助于增强决断力。',
      '木': '绿色植物和木质元素，有助于增强创造力和生命力。',
      '水': '蓝色和黑色元素，多接触水（如养鱼、游泳），有助于增强智慧和灵活性。',
      '火': '红色元素和适量阳光，有助于增强热情和行动力。',
      '土': '黄色和棕色元素，多接触大地（如陶艺、园艺），有助于增强稳定感。'
    };
    return advices[element] || '平衡的五行元素，保持身心健康。';
  },

  reset() {
    document.getElementById('mbtiResult').style.display = 'none';
    document.getElementById('mbtiStart').style.display = 'block';
    document.getElementById('mbtiQuiz').style.display = 'none';
    this.scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    this.currentQuestion = 0;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MbtiModule.init();
});
