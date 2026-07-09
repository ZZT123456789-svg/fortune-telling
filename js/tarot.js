/**
 * 塔罗牌占卜模块 - 弧牌滑动抽牌
 */
var TarotModule = {
  cards: [],
  selectedCards: [],
  drawnCount: 0,
  shuffledDeck: [],

  init: function() { this.generateCards(); },

  generateCards: function() {
    var major = [
      {n:'愚者',kw:'开始·冒险·天真',u:'新的旅程即将开启，带着纯真的心踏上未知之路。',r:'冲动鲁莽，计划不周，可能有逃避现实的倾向。'},
      {n:'魔术师',kw:'创造·技能·自信',u:'你拥有实现目标所需的一切资源。专注意念，创造奇迹。',r:'能力被浪费或滥用，可能出现欺骗或操纵。'},
      {n:'女祭司',kw:'直觉·智慧·神秘',u:'相信你的直觉和内在智慧。静待时机，答案会自然浮现。',r:'忽视直觉，过度理性，隐藏的秘密可能被揭露。'},
      {n:'女皇',kw:'丰饶·母性·美丽',u:'丰盛与成长的时期到来。创造力迸发，感情甜蜜。',r:'创造力受阻，感情上缺乏安全感。'},
      {n:'皇帝',kw:'权威·秩序·领导',u:'以理性和秩序掌控局面。纪律和坚持是成功的关键。',r:'滥用权力或过于专制，缺乏自律。'},
      {n:'教皇',kw:'传统·信仰·教导',u:'遵循传统规则会带来好运。适合寻求导师指导。',r:'打破常规，盲从或教条主义。'},
      {n:'恋人',kw:'爱情·选择·和谐',u:'重要选择摆在面前。跟随内心，做真正属于自己的决定。',r:'感情出现裂痕，价值观冲突。'},
      {n:'战车',kw:'胜利·意志·前进',u:'凭借坚强意志力克服困难，勇往直前。',r:'失控或方向错误，努力付诸东流。'},
      {n:'力量',kw:'勇气·耐心·内在',u:'内在的力量比外在更强大。用耐心驯服困难。',r:'内心脆弱，被情绪或欲望压倒。'},
      {n:'隐者',kw:'内省·孤独·指引',u:'暂时退隐向内探索。独处时光宝贵。',r:'过度孤立，逃避现实，孤僻固执。'},
      {n:'命运之轮',kw:'转变·机遇·因果',u:'命运之轮正在转动，好运即将到来。',r:'运气不佳，遭遇意外挫折。'},
      {n:'正义',kw:'公平·真理·因果',u:'公正的结果即将出现，真相浮出水面。',r:'不公平待遇，逃避责任。'},
      {n:'倒吊人',kw:'牺牲·换个角度·等待',u:'换个角度看问题，暂时停滞是为了更大突破。',r:'徒劳牺牲，固执己见不愿改变。'},
      {n:'死神',kw:'结束·重生·蜕变',u:'旧的必须结束新的才能到来。放下过去迎接新生。',r:'抗拒改变，反复陷入旧模式。'},
      {n:'节制',kw:'平衡·调和·耐心',u:'保持中庸之道，凡事适度。调和不同力量。',r:'失衡，过度放纵或过度节制。'},
      {n:'恶魔',kw:'束缚·欲望·诱惑',u:'警惕被物质或欲望束缚。面对阴暗面才能自由。',r:'挣脱束缚，打破不良习惯。'},
      {n:'高塔',kw:'崩塌·觉醒·突变',u:'突如其来的变化打破旧秩序。重建后会更强。',r:'勉强维持摇摇欲坠的局面。'},
      {n:'星星',kw:'希望·治愈·灵感',u:'希望之光照亮前路，身心得到治愈。',r:'失去希望，感到迷茫沮丧。'},
      {n:'月亮',kw:'幻象·恐惧·潜意识',u:'小心迷雾和幻象。相信直觉穿越黑暗。',r:'恐惧消散，真相渐渐浮现。'},
      {n:'太阳',kw:'喜悦·成功·活力',u:'阳光普照一切明朗。成功和喜悦来到身边。',r:'暂时阴霾遮挡阳光，但太阳总会再升。'},
      {n:'审判',kw:'觉醒·重生·召唤',u:'聆听内心召唤，做出重要觉醒。重新开始。',r:'逃避内心召唤，拒绝改变。'},
      {n:'世界',kw:'圆满·完成·整合',u:'一个阶段圆满结束。庆祝和感恩的时刻。',r:'接近完成但尚有缺憾，延迟的成功。'}
    ];
    var suits = ['权杖','圣杯','宝剑','星币'];
    var nums = ['王牌','二','三','四','五','六','七','八','九','十','侍从','骑士','皇后','国王'];
    this.cards = [];
    var self = this;
    major.forEach(function(c,i){
      self.cards.push({id:i,type:'major',name:c.n,keywords:c.kw,upright:c.u,reversed:c.r,suit:null,color:'#8b6f3a'});
    });
    var id = 22;
    suits.forEach(function(s){
      nums.forEach(function(n,i){
        var type = i < 10 ? 'minor' : 'court';
        self.cards.push({id:id++,type:type,name:s+n,keywords:s,number:i+1,suit:s,
          upright:s+n+'正位：蕴含着'+s+'的能量。',
          reversed:s+n+'逆位：'+s+'的能量受阻。',
          color:s==='权杖'?'#a0522d':s==='圣杯'?'#3a6b8c':s==='宝剑'?'#7a7a3a':'#4a7a3a'
        });
      });
    });
  },

  shuffle: function() {
    hideEl('tarotStep1');
    showEl('tarotStep2');
    this.drawnCount = 0;
    this.selectedCards = [];
    this.shuffledDeck = shuffle(this.cards);
    document.getElementById('cardDeck').innerHTML = '';
    document.getElementById('tarotReading').innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var s = document.getElementById('slot'+i);
      s.classList.add('empty'); s.classList.remove('revealed'); s.innerHTML = '?';
    }
    this._animateShuffle();
  },

  _animateShuffle: function() {
    var deck = document.getElementById('cardDeck');
    deck.innerHTML = '';
    deck.style.cssText = 'position:relative;min-height:200px;display:flex;align-items:center;justify-content:center;';

    var txt = document.createElement('div');
    txt.style.cssText = 'position:absolute;z-index:10;font-size:1.2rem;color:#8b6f3a;animation:shufflePulse 0.6s ease-in-out infinite;pointer-events:none;font-family:KaiTi,STKaiti,serif;';
    txt.textContent = '正在洗牌...';
    deck.appendChild(txt);

    var animCards = [];
    for (var i = 0; i < 8; i++) {
      var card = document.createElement('div');
      card.textContent = '🃏';
      card.style.cssText = 'position:absolute;width:80px;height:120px;background:linear-gradient(135deg,#f5f0e8,#e8dcc8);border:2px solid #8b6f3a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:all 0.15s ease;';
      deck.appendChild(card);
      animCards.push({el:card});
    }

    var frame = 0;
    var maxFrames = 14;
    var self = this;
    var shuffleTimer = setInterval(function(){
      animCards.forEach(function(c,i){
        var progress = frame / maxFrames;
        var x = Math.sin(progress*Math.PI*6+i*0.8) * 60 * (1-progress*0.5);
        var y = Math.cos(progress*Math.PI*5+i*1.1) * 40 * (1-progress*0.5) - Math.abs(x)*0.3;
        var rot = Math.sin(progress*Math.PI*8+i) * 45 * (1-progress*0.5);
        var scale = 1 - Math.abs(Math.sin(progress*Math.PI*3+i)) * 0.3;
        c.el.style.transform = 'translate('+x+'px,'+y+'px) rotate('+rot+'deg) scale('+scale+')';
        c.el.style.opacity = 1 - progress*0.3;
        c.el.style.zIndex = Math.abs(y) < 20 ? 5 : 1;
      });
      frame++;
      if (frame >= maxFrames) {
        clearInterval(shuffleTimer);
        animCards.forEach(function(c){
          c.el.style.transition = 'all 0.4s ease';
          c.el.style.opacity = '0';
          c.el.style.transform = 'scale(0.5)';
        });
        txt.style.transition = 'all 0.4s ease';
        txt.style.opacity = '0';
        setTimeout(function(){
          deck.innerHTML = '';
          self._showCards();
        }, 450);
      }
    }, 157);
  },

  _showCards: function() {
    var deck = document.getElementById('cardDeck');
    deck.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(68px,1fr));gap:8px;padding:10px;max-height:60vh;overflow-y:auto;justify-items:center;';
    deck.innerHTML = '';

    var hint = document.createElement('div');
    hint.style.cssText = 'grid-column:1/-1;text-align:center;color:#8b6f3a;font-size:0.9rem;font-family:KaiTi,STKaiti,serif;margin-bottom:4px;';
    hint.textContent = '请凭直觉点击选择 3 张牌（已选 0/3）';
    hint.id = 'cardSelectHint';
    deck.appendChild(hint);

    var self = this;
    this.shuffledDeck.forEach(function(cardData, i){
      var card = document.createElement('div');
      card.title = cardData.name;
      card.style.cssText = 'width:64px;height:90px;background:linear-gradient(135deg,#f5f0e8,#e8dcc8);border:2px solid #8b6f3a;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;box-shadow:0 2px 6px rgba(0,0,0,0.1);cursor:pointer;transition:all 0.2s ease;color:#5c4a28;font-family:KaiTi,STKaiti,serif;opacity:0;animation:bounceIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;animation-delay:'+(i*0.008)+'s;user-select:none;';
      card.textContent = '🃏';

      card.addEventListener('click', function(){
        self._selectCard(card, cardData);
      });

      deck.appendChild(card);
    });
  },

  _selectCard: function(cardEl, cardData) {
    if (this.drawnCount >= 3) return;
    if (cardEl.classList.contains('selected')) return;

    cardEl.classList.add('selected');
    cardEl.style.transform = 'translateY(-4px) scale(1.08)';
    cardEl.style.boxShadow = '0 6px 18px rgba(140,110,60,0.4)';
    cardEl.style.borderColor = '#c9a96e';
    cardEl.style.borderWidth = '3px';
    cardEl.style.background = 'linear-gradient(135deg,#fffdf5,#f5edd8)';
    cardEl.textContent = cardData.name.substring(0,2);

    var isReversed = Math.random() < 0.5;
    cardData.isReversed = isReversed;
    this.selectedCards[this.drawnCount] = cardData;

    var slot = document.getElementById('slot'+this.drawnCount);
    slot.classList.remove('empty'); slot.classList.add('revealed');
    var inner = '<div class="tarot-card-inner' + (isReversed ? ' reversed' : '') + '">';
    inner += '<div class="tarot-card-front" style="border-color:' + (cardData.color || '#8b6f3a') + '">';
    inner += '<div class="card-type-badge ' + cardData.type + '">' + (cardData.type === 'major' ? '大' : cardData.type === 'court' ? '宫廷' : '小') + '</div>';
    inner += '<div class="card-name">' + cardData.name + '</div>';
    inner += '<div class="card-keywords">' + cardData.keywords + '</div>';
    inner += '</div></div>';
    slot.innerHTML = inner;
    this.drawnCount++;

    // 更新提示
    var hint = document.getElementById('cardSelectHint');
    if (hint) hint.textContent = '请凭直觉点击选择 3 张牌（已选 '+this.drawnCount+'/3）';

    if (this.drawnCount >= 3) {
      var self = this;
      setTimeout(function(){ self.showReading(); }, 500);
    }
  },

  showReading: function() {
    hideEl('tarotStep2');
    showEl('tarotStep3');
    var reading = document.getElementById('tarotReading');
    var positions = ['过去','现在','未来'];
    var html = '<div class="reading-cards">';
    var self = this;
    this.selectedCards.forEach(function(card, i){
      var revTag = card.isReversed ? 'is-reversed' : 'is-upright';
      var revLabel = card.isReversed ? '逆位' : '正位';
      var desc = card.isReversed ? (card.reversed || card.upright) : card.upright;
      html += '<div class="reading-card" style="border-color:' + (card.color || '#8b6f3a') + '">';
      html += '<div class="reading-card-header"><span class="position-badge">' + positions[i] + '</span>';
      html += '<span class="reversed-badge ' + revTag + '">' + revLabel + '</span></div>';
      html += '<h3>' + card.name + '</h3>';
      html += '<p class="reading-desc">' + desc + '</p>';
      html += '<small>' + card.keywords + '</small></div>';
    });
    html += '</div>';
    var revCount = this.selectedCards.filter(function(c){ return c.isReversed; }).length;
    var summary;
    if (revCount === 0) summary = '三张牌皆为正位，能量流畅。过去奠定了良好基础，现在状态积极，未来前景光明。';
    else if (revCount === 1) summary = '一张逆位，在特定阶段需多加留意。整体运势尚可，调整心态即可化解。';
    else if (revCount === 2) summary = '两张逆位，可能正处于转折期。挑战是成长的必经之路。';
    else summary = '三张皆逆位，能量较为阻滞。但逆位提醒我们停下来反思、修正方向。沉淀之后必有更好的出发。';
    html += '<div class="reading-summary"><h4>🔮 综合解读</h4><p>' + summary + '</p></div>';
    reading.innerHTML = html;
  },

  reset: function() {
    this.selectedCards = [];
    this.drawnCount = 0;
    for (var i = 0; i < 3; i++) {
      var s = document.getElementById('slot'+i);
      s.classList.add('empty'); s.classList.remove('revealed'); s.innerHTML = '?';
    }
    hideEl('tarotStep2'); hideEl('tarotStep3'); showEl('tarotStep1');
  }
};

document.addEventListener('DOMContentLoaded', function(){ TarotModule.init(); });
