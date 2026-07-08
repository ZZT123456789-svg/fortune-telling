/**
 * 塔罗牌占卜模块
 * 3 张牌阵（过去 → 现在 → 未来），CSS 3D 翻牌动画
 */

const TarotModule = {
  cards: [],
  selectedCards: [],
  drawnCount: 0,

  init() {
    this.generateCards();
  },

  /** 生成 78 张塔罗牌数据 */
  generateCards() {
    const majorArcana = [
      { name: '愚者', en: 'The Fool', keywords: '开始·冒险·天真', desc: '新的旅程即将开启，带着纯真的心踏上未知之路。保持开放的心态，宇宙将为你指引方向。', rev: '冲动鲁莽，计划不周，可能有逃避现实的倾向。需要停下来思考，不要盲目行动。' },
      { name: '魔术师', en: 'The Magician', keywords: '创造·技能·自信', desc: '你拥有实现目标所需的一切资源和能力。现在是行动的最佳时机，专注你的意念，创造奇迹。', rev: '能力被浪费或滥用，可能出现欺骗或操纵。缺乏自信和专注力，机会在指缝间溜走。' },
      { name: '女祭司', en: 'The High Priestess', keywords: '直觉·智慧·神秘', desc: '相信你的直觉和内在智慧。有些事情不必急于求成，静待时机，答案会自然浮现。', rev: '忽视直觉，过度理性，隐藏的秘密可能被揭露。内心感到迷茫和不安。' },
      { name: '女皇', en: 'The Empress', keywords: '丰饶·母性·美丽', desc: '丰盛与成长的时期到来。创造力迸发，感情生活甜蜜，事业上也将迎来收获。', rev: '创造力受阻，感情上缺乏安全感，可能过度依赖他人或过度保护。' },
      { name: '皇帝', en: 'The Emperor', keywords: '权威·秩序·领导', desc: '你需要以理性和秩序来掌控局面。领导才能凸显，适合做规划和决策。纪律和坚持是成功的关键。', rev: '滥用权力或过于专制，缺乏自律。可能遇到官僚主义的阻碍。' },
      { name: '教皇', en: 'The Hierophant', keywords: '传统·信仰·教导', desc: '遵循传统和规则会带来好运。适合寻求导师的指导，或通过学习和仪式感获得成长。', rev: '打破常规，挑战传统观念。可能出现盲从或教条主义的问题。' },
      { name: '恋人', en: 'The Lovers', keywords: '爱情·选择·和谐', desc: '重要的选择摆在面前，尤其是在感情和价值观方面。跟随内心，做出真正属于自己的决定。', rev: '感情出现裂痕或面临抉择困境。价值观冲突，需要重新审视关系。' },
      { name: '战车', en: 'The Chariot', keywords: '胜利·意志·前进', desc: '凭借坚强的意志力克服困难，取得胜利。行动力充沛，勇往直前，但要注意控制方向。', rev: '失控或方向错误，努力付诸东流。需要停下来重新规划，避免硬碰硬。' },
      { name: '力量', en: 'Strength', keywords: '勇气·耐心·内在', desc: '内在的力量比外在更强大。用耐心和温柔驯服困难，你有足够的勇气面对一切挑战。', rev: '内心脆弱，缺乏信心和勇气。可能被情绪或欲望压倒，需要找回自我。' },
      { name: '隐者', en: 'The Hermit', keywords: '内省·孤独·指引', desc: '暂时退隐，向内探索。独处的时光是宝贵的，反思过去，找到真正的方向和智慧。', rev: '过度孤立，逃避现实。可能变得孤僻和固执，需要打开心扉接受他人帮助。' },
      { name: '命运之轮', en: 'Wheel of Fortune', keywords: '转变·机遇·因果', desc: '命运之轮正在转动，好运即将到来。这是转折点，抓住机遇，顺应变化。', rev: '运气不佳，遭遇意外的挫折。需要接受无法改变的事实，耐心等待下一轮好运。' },
      { name: '正义', en: 'Justice', keywords: '公平·真理·因果', desc: '公正的结果即将出现，真相会浮出水面。做出诚实的选择，承担应尽的责任。', rev: '不公平的待遇，或者逃避责任。法律纠纷可能对你不利，需要诚实面对。' },
      { name: '倒吊人', en: 'The Hanged Man', keywords: '牺牲·换个角度·等待', desc: '换个角度看问题，暂时的停滞是为了更大的突破。愿意做出牺牲，获得更高的智慧。', rev: '徒劳的牺牲，固执己见不愿改变。停滞不前，陷入僵局。' },
      { name: '死神', en: 'Death', keywords: '结束·重生·蜕变', desc: '旧的必须结束，新的才能到来。这是蜕变的时刻，放下过去，迎接新生。无需恐惧，这是自然的过程。', rev: '抗拒改变，停滞不前。反复陷入旧的模式，无法走出阴影。' },
      { name: '节制', en: 'Temperance', keywords: '平衡·调和·耐心', desc: '保持中庸之道，凡事适度。调和不同的力量，找到内心的平衡与和谐。', rev: '失衡，过度放纵或过度节制。缺乏耐心，急于求成导致适得其反。' },
      { name: '恶魔', en: 'The Devil', keywords: '束缚·欲望·诱惑', desc: '警惕被物质或欲望束缚。认识并面对自己的阴暗面，才能获得真正的自由。', rev: '挣脱束缚，打破不良习惯。开始正视问题，走向解脱。' },
      { name: '高塔', en: 'The Tower', keywords: '崩塌·觉醒·突变', desc: '突如其来的变化打破旧有秩序。虽然痛苦，但崩塌的是不稳固的基础，重建后会更强大。', rev: '勉强维持摇摇欲坠的局面，压抑变革的需求。但压抑越久，崩塌越猛烈。' },
      { name: '星星', en: 'The Star', keywords: '希望·治愈·灵感', desc: '希望之光照亮前路，身心得到治愈。灵感涌现，对未来充满信心。这是美好的预兆。', rev: '失去希望，感到迷茫和沮丧。对生活丧失信心，需要重新发现美好。' },
      { name: '月亮', en: 'The Moon', keywords: '幻象·恐惧·潜意识', desc: '小心迷雾和幻象，事情可能不是你看到的那样。相信直觉，穿越黑暗，光明就在前方。', rev: '恐惧消散，真相渐渐浮现。混乱结束，开始看清现实。' },
      { name: '太阳', en: 'The Sun', keywords: '喜悦·成功·活力', desc: '阳光普照，一切明朗。成功和喜悦来到身边，充满活力和自信。享受这美好的时光吧！', rev: '暂时的阴霾遮挡了阳光。快乐被抑制，但太阳总会再次升起。' },
      { name: '审判', en: 'Judgement', keywords: '觉醒·重生·召唤', desc: '聆听内心的召唤，做出重要的觉醒。过去的行为得到评判，这是一个重新开始的机会。', rev: '逃避内心的召唤，拒绝改变。对过去的错误耿耿于怀，无法释怀。' },
      { name: '世界', en: 'The World', keywords: '圆满·完成·整合', desc: '一个阶段圆满结束，目标达成，获得了完整的体验。这是庆祝和感恩的时刻，新的循环即将开始。', rev: '接近完成但尚有缺憾。延迟的成功，或者成功后感到莫名的空虚。' }
    ];

    const suits = [
      { name: '权杖', en: 'Wands', element: '火', color: '#e74c3c', meaning: '行动、创造、事业、激情' },
      { name: '圣杯', en: 'Cups', element: '水', color: '#3498db', meaning: '情感、直觉、关系、灵性' },
      { name: '宝剑', en: 'Swords', element: '风', color: '#f1c40f', meaning: '思想、决断、挑战、真理' },
      { name: '星币', en: 'Pentacles', element: '土', color: '#2ecc71', meaning: '物质、财富、稳定、健康' }
    ];

    const courtNames = ['侍从', '骑士', '皇后', '国王'];
    const numNames = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

    this.cards = [];

    // 大阿卡纳 (0-21)
    majorArcana.forEach((card, i) => {
      this.cards.push({
        id: i,
        type: 'major',
        name: card.name,
        nameEn: card.en,
        number: i,
        keywords: card.keywords,
        upright: card.desc,
        reversed: card.rev,
        suit: null,
        color: '#c9a96e'
      });
    });

    // 小阿卡纳 (22-77)
    let id = 22;
    suits.forEach(suit => {
      // 数字牌 (Ace-10)
      numNames.forEach((name, i) => {
        const num = i + 1;
        this.cards.push({
          id: id++,
          type: 'minor',
          name: `${suit.name}${name}`,
          nameEn: `${name} of ${suit.en}`,
          number: num,
          suit: suit.name,
          suitElement: suit.element,
          keywords: `${suit.meaning}`,
          upright: `${suit.name}${name}正位：${this._getMinorMeaning(suit.name, num, true)}`,
          reversed: `${suit.name}${name}逆位：${this._getMinorMeaning(suit.name, num, false)}`,
          color: suit.color
        });
      });

      // 宫廷牌
      courtNames.forEach((name, i) => {
        this.cards.push({
          id: id++,
          type: 'court',
          name: `${suit.name}${name}`,
          nameEn: `${name} of ${suit.en}`,
          number: 11 + i,
          suit: suit.name,
          suitElement: suit.element,
          keywords: `人物·${suit.meaning}`,
          upright: `${suit.name}${name}正位：${this._getCourtMeaning(suit.name, name, true)}`,
          reversed: `${suit.name}${name}逆位：${this._getCourtMeaning(suit.name, name, false)}`,
          color: suit.color
        });
      });
    });
  },

  _getMinorMeaning(suit, num, upright) {
    const meanings = {
      '权杖': {
        1: ['新的创意或事业机会出现，充满激情与活力，是行动的最佳时机。', '计划延迟，缺乏方向和动力，机会可能从手中溜走。'],
        5: ['竞争激烈但充满活力，通过努力可以脱颖而出。', '冲突升级，陷入无谓的争斗，消耗精力。'],
        10: ['责任重大但收获也丰厚，事业达到新的高度。', '负担过重，难以承受压力，需要学会分担。']
      },
      '圣杯': {
        1: ['新的感情或创意灵感涌现，内心充满爱与喜悦。', '情感空虚或压抑，无法表达真实的感受。'],
        5: ['感到失落和遗憾，但将注意力转向仍然拥有的美好。', '沉浸在悲伤中无法自拔，看不到希望。'],
        10: ['家庭和睦，情感圆满，内心充满幸福感。', '家庭矛盾激化，情感破裂，失去归属感。']
      },
      '宝剑': {
        1: ['思维清晰，真理显现，做出明智的决策。', '思维混乱，信息过载，做出错误判断。'],
        5: ['在竞争中取得优势，但胜利可能带来孤独。', '失败和屈辱，被他人超越，需要反思策略。'],
        10: ['最坏的情况已经过去，黎明前的黑暗，即将迎来转机。', '彻底崩溃，但这也是重生的开始。']
      },
      '星币': {
        1: ['新的财富机会出现，物质生活即将改善。', '错失良机，投资失误，财务出现漏洞。'],
        5: ['财务困难，感到被排斥或孤立。', '走出困境，找到解决问题的方法。'],
        10: ['物质丰盛，家庭富足，遗产或长期投资的回报。', '家庭财务纠纷，财富流失，需要重新规划。']
      }
    };

    const suitMeanings = meanings[suit] || {};
    if (suitMeanings[num]) return suitMeanings[num][upright ? 0 : 1];

    // 通用含义
    const general = {
      true: `${suit}能量正向流动，${suit === '权杖' ? '行动力强' : suit === '圣杯' ? '情感丰富' : suit === '宝剑' ? '思维敏捷' : '财运亨通'}。`,
      false: `${suit}能量受阻，${suit === '权杖' ? '行动迟缓' : suit === '圣杯' ? '情感压抑' : suit === '宝剑' ? '思维混乱' : '财运不济'}。`
    };
    return general[upright];
  },

  _getCourtMeaning(suit, court, upright) {
    const traits = {
      '侍从': ['新的学习机会到来，充满好奇心和热情。', '学习动力不足，容易分心，需要更专注。'],
      '骑士': ['行动力强，追求目标，但在过程中可能过于急躁。', '冲动导致失误，或者行动被拖延。'],
      '皇后': ['成熟稳重的女性形象，善于照顾他人，创造温馨的环境。', '过度保护或依赖，失去自我。'],
      '国王': ['成熟稳重的男性形象，有权威和领导力，能够掌控大局。', '滥用权力，独断专行，或缺乏领导力。']
    };
    return traits[court][upright ? 0 : 1];
  },

  /** 开始洗牌 */
  shuffle() {
    hideEl('tarotStep1');
    showEl('tarotStep2');

    const deck = document.getElementById('cardDeck');
    deck.innerHTML = '';
    const shuffled = shuffle(this.cards);

    // === 洗牌动画 ===
    const animCards = [];
    const animCount = 15;

    for (let i = 0; i < animCount; i++) {
      const card = document.createElement('div');
      card.className = 'mini-card shuffling';
      card.textContent = '🃏';
      card.style.position = 'absolute';
      card.style.left = '50%';
      card.style.top = '50%';
      card.style.marginLeft = '-32px';
      card.style.marginTop = '-49px';
      card.style.opacity = '0';
      card.style.transition = `all ${0.3 + Math.random() * 0.4}s ease-out`;
      card.style.pointerEvents = 'none';
      deck.appendChild(card);
      animCards.push(card);
    }

    // 洗牌飞动
    let frame = 0;
    const shuffleInterval = setInterval(() => {
      animCards.forEach((card, i) => {
        const x = (Math.random() - 0.5) * 220;
        const y = (Math.random() - 0.5) * 160;
        const rot = (Math.random() - 0.5) * 180;
        card.style.opacity = '0.9';
        card.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      });
      frame++;
      if (frame >= 8) {
        clearInterval(shuffleInterval);
        // 收拢
        animCards.forEach((card, i) => {
          card.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.2)';
          card.style.transform = `rotate(${(i - 7) * 3}deg) translateY(${Math.abs(i - 7) * 3}px)`;
          card.style.opacity = '0.85';
        });

        // 渲染可选牌
        setTimeout(() => {
          animCards.forEach(c => c.remove());
          for (let i = 0; i < Math.min(22, shuffled.length); i++) {
            const cardEl = document.createElement('div');
            cardEl.className = 'mini-card';
            cardEl.style.transform = `rotate(${(i - 11) * 3}deg) translateY(${Math.abs(i - 11) * 2}px)`;
            cardEl.style.animation = 'fadeIn 0.3s ease forwards';
            cardEl.textContent = '🃏';
            cardEl.title = '点击选牌';
            cardEl.addEventListener('click', () => this.drawCard(shuffled[i]));
            deck.appendChild(cardEl);
          }
        }, 400);
      }
    }, 150);
  },

  /** 抽一张牌 */
  drawCard(card) {
    if (this.drawnCount >= 3) return;

    const slot = document.getElementById('slot' + this.drawnCount);
    const isReversed = Math.random() < 0.5;

    card.isReversed = isReversed;
    this.selectedCards[this.drawnCount] = card;

    // 翻牌动画
    slot.classList.add('flipping');
    setTimeout(() => {
      slot.classList.remove('empty', 'flipping');
      slot.classList.add('revealed');
      slot.innerHTML = `
        <div class="tarot-card-inner ${isReversed ? 'reversed' : ''}">
          <div class="tarot-card-front" style="border-color:${card.color}">
            <div class="card-type-badge ${card.type}">${card.type === 'major' ? '大阿卡纳' : card.type === 'court' ? '宫廷牌' : '小阿卡纳'}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-num">${card.type === 'major' ? (['0','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'][card.number]) : card.number}</div>
            <div class="card-keywords">${card.keywords}</div>
            <div class="card-suit" style="color:${card.color}">${card.suit || '大阿卡纳'}</div>
          </div>
        </div>
      `;
      this.drawnCount++;

      // 三张都抽完时展示解读
      if (this.drawnCount >= 3) {
        setTimeout(() => this.showReading(), 800);
      }
    }, 600);
  },

  /** 展示完整解读 */
  showReading() {
    hideEl('tarotStep2');
    showEl('tarotStep3');

    const reading = document.getElementById('tarotReading');
    const positions = ['过去', '现在', '未来'];

    let html = '<div class="reading-cards">';
    this.selectedCards.forEach((card, i) => {
      html += `
        <div class="reading-card" style="border-color:${card.color}">
          <div class="reading-card-header">
            <span class="position-badge">${positions[i]}</span>
            <span class="reversed-badge ${card.isReversed ? 'is-reversed' : 'is-upright'}">${card.isReversed ? '逆位' : '正位'}</span>
          </div>
          <h3>${card.name}</h3>
          <p class="reading-desc">${card.isReversed ? (card.reversed || card.upright + '（逆位含义）') : card.upright}</p>
          <small>${card.keywords}</small>
        </div>
      `;
    });
    html += '</div>';

    // 综合解读
    html += '<div class="reading-summary"><h4>🔮 综合解读</h4><p>';
    html += this._getSummary(this.selectedCards);
    html += '</p></div>';

    reading.innerHTML = html;
  },

  _getSummary(cards) {
    const reversedCount = cards.filter(c => c.isReversed).length;
    let summary = '';

    if (reversedCount === 0) {
      summary = '三张牌皆为正位，能量流畅。过去打下了良好基础，现在状态积极，未来前景光明。整体运势上扬，建议顺势而为，把握机遇。';
    } else if (reversedCount === 1) {
      summary = `一张牌为逆位，提示在「${cards.findIndex(c => c.isReversed) === 0 ? '过去' : cards.findIndex(c => c.isReversed) === 1 ? '现在' : '未来'}」阶段需要多加留意。整体运势尚可，注意调整心态和行动方式即可化解。`;
    } else if (reversedCount === 2) {
      summary = '两张牌为逆位，当前可能正处于转折期。过去的经验需要重新审视，当下的挑战需要勇气面对。但请相信，这是成长的必经之路。';
    } else {
      summary = '三张牌皆为逆位，暗示当前能量较为阻滞。但这并非坏事——逆位提醒我们需要停下来反思、修正方向。沉淀之后，必有更好的出发。';
    }

    return summary;
  },

  /** 重置 */
  reset() {
    this.selectedCards = [];
    this.drawnCount = 0;
    for (let i = 0; i < 3; i++) {
      const slot = document.getElementById('slot' + i);
      slot.classList.add('empty');
      slot.classList.remove('revealed', 'flipping');
      slot.innerHTML = '?';
    }
    hideEl('tarotStep2');
    hideEl('tarotStep3');
    showEl('tarotStep1');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  TarotModule.init();
});
