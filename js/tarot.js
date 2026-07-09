/**
 * 塔罗牌占卜模块 - 弧牌滑动抽牌
 * 洗牌动画 → 弧牌展开 → 滑动选牌 → 3张解读
 */
const TarotModule = {
  cards: [],
  selectedCards: [],
  drawnCount: 0,
  shuffledDeck: [],

  init() { this.generateCards(); },

  generateCards() {
    const major = [
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
    const suits=['权杖','圣杯','宝剑','星币'];
    const nums=['王牌','二','三','四','五','六','七','八','九','十','侍从','骑士','皇后','国王'];
    this.cards=[];
    major.forEach((c,i)=>{this.cards.push({id:i,type:'major',name:c.n,keywords:c.kw,upright:c.u,reversed:c.r,suit:null,color:'#8b6f3a'});});
    let id=22;
    suits.forEach(s=>{nums.forEach((n,i)=>{this.cards.push({id:id++,type:i<10?'minor':'court',name:s+n,keywords:s,number:i+1,suit:s,upright:s+n+'正位：蕴含着'+s+'的能量。',reversed:s+n+'逆位：'+s+'的能量受阻。',color:s==='权杖'?'#a0522d':s==='圣杯'?'#3a6b8c':s==='宝剑'?'#7a7a3a':s==='星币'?'#4a7a3a'});});});
  },

  /** 入口：开始洗牌 */
  shuffle() {
    hideEl('tarotStep1');
    showEl('tarotStep2');
    this.drawnCount=0;
    this.selectedCards=[];
    this.shuffledDeck=shuffle(this.cards);
    document.getElementById('cardDeck').innerHTML='';
    document.getElementById('tarotReading').innerHTML='';
    // 清理旧slot
    for(let i=0;i<3;i++){const s=document.getElementById('slot'+i);s.classList.add('empty');s.classList.remove('revealed');s.innerHTML='?';}

    this._animateShuffle();
  },

  /** 洗牌动画：8张牌中央交错翻飞 */
  _animateShuffle() {
    const deck=document.getElementById('cardDeck');
    deck.innerHTML='';
    deck.style.position='relative';
    deck.style.minHeight='200px';
    deck.style.display='flex';
    deck.style.alignItems='center';
    deck.style.justifyContent='center';

    // "正在洗牌"文字
    const txt=document.createElement('div');
    txt.className='shuffle-text';
    txt.textContent='正在洗牌...';
    txt.style.cssText='position:absolute;z-index:10;font-size:1.2rem;color:#8b6f3a;animation:shufflePulse 0.6s ease-in-out infinite;pointer-events:none;font-family:KaiTi,STKaiti,serif;';
    deck.appendChild(txt);

    // 8张牌
    const animCards=[];
    for(let i=0;i<8;i++){
      const card=document.createElement('div');
      card.className='shuffle-card';
      card.textContent='🃏';
      card.style.cssText=`position:absolute;width:80px;height:120px;background:linear-gradient(135deg,#f5f0e8,#e8dcc8);border:2px solid #8b6f3a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2rem;box-shadow:0 4px 16px rgba(0,0,0,0.2);transition:all 0.15s ease;`;
      deck.appendChild(card);
      animCards.push({el:card,x:0,y:0,rot:0});
    }

    // 翻飞动画
    let frame=0;
    const maxFrames=14; // 2.2s / 0.15s ≈ 14帧
    const shuffleTimer=setInterval(()=>{
      animCards.forEach((c,i)=>{
        const progress=frame/maxFrames;
        const x=(Math.sin(progress*Math.PI*6+i*0.8)*60)*(1-progress*0.5);
        const y=(Math.cos(progress*Math.PI*5+i*1.1)*40-Math.abs(x)*0.3)*(1-progress*0.5);
        const rot=(Math.sin(progress*Math.PI*8+i)*45)*(1-progress*0.5);
        const scale=1-Math.abs(Math.sin(progress*Math.PI*3+i))*0.3;
        c.el.style.transform=`translate(${x}px,${y}px) rotate(${rot}deg) scale(${scale})`;
        c.el.style.opacity=1-progress*0.3;
        c.el.style.zIndex=Math.abs(y)<20?5:1;
      });
      frame++;
      if(frame>=maxFrames){
        clearInterval(shuffleTimer);
        // 牌堆淡出
        animCards.forEach(c=>{c.el.style.transition='all 0.4s ease';c.el.style.opacity='0';c.el.style.transform='scale(0.5)';});
        txt.style.transition='all 0.4s ease';txt.style.opacity='0';
        setTimeout(()=>{
          deck.innerHTML='';
          this._showArcCards();
        },450);
      }
    },157);
  },

  /** 弧牌展开：78张从中心飞入 */
  _showArcCards() {
    const deck=document.getElementById('cardDeck');
    deck.style.minHeight='320px';
    deck.style.position='relative';
    deck.style.overflowX='auto';
    deck.style.overflowY='hidden';
    deck.style.display='flex';
    deck.style.alignItems='center';
    deck.style.padding='80px 30px 40px';
    deck.style.gap='0';
    deck.style.justifyContent='flex-start';
    deck.style.cursor='grab';
    deck.style.scrollBehavior='smooth';
    deck.style.webkitOverflowScrolling='touch';

    // 提示文字
    const hint=document.createElement('div');
    hint.style.cssText='position:absolute;top:15px;left:50%;transform:translateX(-50%);color:#8b6f3a;font-size:1rem;font-family:KaiTi,STKaiti,serif;z-index:10;pointer-events:none;';
    hint.textContent='← 滑动浏览牌堆，点击选择 3 张牌 →';
    deck.appendChild(hint);

    const arcCards=[];
    this.shuffledDeck.forEach((cardData,i)=>{
      const card=document.createElement('div');
      card.className='arc-card';
      card.textContent='🃏';
      card.title=cardData.name;
      card.dataset.idx=i;
      // 初始位置：中心
      card.style.cssText=`flex-shrink:0;width:90px;height:135px;background:linear-gradient(135deg,#f5f0e8,#e8dcc8);border:2px solid #8b6f3a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2.2rem;box-shadow:0 4px 16px rgba(0,0,0,0.2);margin:0 -8px;transform:translateY(40px) scale(0.3);opacity:0;transition:all 0.5s cubic-bezier(0.34,1.56,0.64,1);cursor:pointer;z-index:1;position:relative;`;
      // bounce飞入
      const delay=i*0.015;
      card.style.transitionDelay=`${delay}s`;
      deck.appendChild(card);

      // hover放大
      card.addEventListener('mouseenter',()=>{card.style.transform='translateY(-15px) scale(1.08)';card.style.zIndex='10';card.style.boxShadow='0 12px 32px rgba(0,0,0,0.35)';});
      card.addEventListener('mouseleave',()=>{if(!card.classList.contains('selected')){card.style.transform='translateY(0) scale(1)';card.style.zIndex='1';card.style.boxShadow='0 4px 16px rgba(0,0,0,0.2)';}});

      card.addEventListener('click',()=>this._selectArcCard(card,cardData,i));

      arcCards.push({el:card,data:cardData});
    });

    // 飞入
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        arcCards.forEach((c,i)=>{
          c.el.style.transform='translateY(0) scale(1)';
          c.el.style.opacity='1';
        });
      });
    });

    this._arcCards=arcCards;
  },

  /** 选择弧牌 */
  _selectArcCard(cardEl,cardData,idx) {
    if(this.drawnCount>=3)return;
    if(cardEl.classList.contains('selected'))return;

    cardEl.classList.add('selected');
    cardEl.style.transform='translateY(-20px) scale(1.1)';
    cardEl.style.zIndex='20';
    cardEl.style.boxShadow='0 12px 32px rgba(140,110,60,0.5)';
    cardEl.style.borderColor='#c9a96e';
    cardEl.style.borderWidth='3px';
    cardEl.textContent=cardData.name.substring(0,2);

    const isReversed=Math.random()<0.5;
    cardData.isReversed=isReversed;
    this.selectedCards[this.drawnCount]=cardData;

    const slotId='slot'+this.drawnCount;
    const slot=document.getElementById(slotId);
    slot.classList.remove('empty');
    slot.classList.add('revealed');
    slot.innerHTML=`<div class="tarot-card-inner${isReversed?' reversed':''}"><div class="tarot-card-front" style="border-color:${cardData.color||'#8b6f3a'}"><div class="card-type-badge ${cardData.type}">${cardData.type==='major'?'大阿卡纳':cardData.type==='court'?'宫廷牌':'小阿卡纳'}</div><div class="card-name">${cardData.name}</div><div class="card-keywords">${cardData.keywords}</div></div></div>`;
    this.drawnCount++;

    if(this.drawnCount>=3){
      setTimeout(()=>this.showReading(),600);
    }
  },

  /** 展示解读 */
  showReading() {
    hideEl('tarotStep2');
    showEl('tarotStep3');
    const reading=document.getElementById('tarotReading');
    const positions=['过去','现在','未来'];
    let html='<div class="reading-cards">';
    this.selectedCards.forEach((card,i)=>{
      html+=`<div class="reading-card" style="border-color:${card.color||'#8b6f3a'}"><div class="reading-card-header"><span class="position-badge">${positions[i]}</span><span class="reversed-badge ${card.isReversed?'is-reversed':'is-upright'}">${card.isReversed?'逆位':'正位'}</span></div><h3>${card.name}</h3><p class="reading-desc">${card.isReversed?(card.reversed||card.upright):card.upright}</p><small>${card.keywords}</small></div>`;
    });
    html+='</div>';
    const revCount=this.selectedCards.filter(c=>c.isReversed).length;
    html+=`<div class="reading-summary"><h4>🔮 综合解读</h4><p>${revCount===0?'三张牌皆为正位，能量流畅。过去奠定了良好基础，现在状态积极，未来前景光明。':revCount===1?'一张逆位，在特定阶段需多加留意。整体运势尚可，调整心态即可化解。':revCount===2?'两张逆位，可能正处于转折期。挑战是成长的必经之路。':'三张皆逆位，能量较为阻滞。但逆位提醒我们停下来反思、修正方向。沉淀之后必有更好的出发。'}</p></div>`;
    reading.innerHTML=html;
  },

  reset() {
    this.selectedCards=[];this.drawnCount=0;
    for(let i=0;i<3;i++){const s=document.getElementById('slot'+i);s.classList.add('empty');s.classList.remove('revealed');s.innerHTML='?';}
    hideEl('tarotStep2');hideEl('tarotStep3');showEl('tarotStep1');
  }
};

document.addEventListener('DOMContentLoaded',()=>{TarotModule.init()});
