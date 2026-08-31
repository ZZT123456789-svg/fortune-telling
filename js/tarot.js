/**
 * 道问塔罗：完整 78 张 RWS 牌组、滑动选牌、牌阵与付费 AI 解读。
 * 牌组/牌阵模型参考 MIT Tarot.js；牌义结构来自 MIT Tarotoo dataset。
 */
var TarotModule = {
  DATA_URL: 'data/tarot-cards.en.json',
  CACHE_KEY: 'daowen_tarot_ai_cache_v2',
  cards: [], deck: [], selectedCards: [],
  spreadId: 'three', singleMode: 'daily', locked: false, revealed: false,
  reducedMotion: false, _scrollFrame: 0,

  spreads: {
    single: { name:'单牌阵', meta:'1 张 · 基础', desc:'今日指引或是非问题', positions:['核心指引'] },
    three: { name:'三牌阵', meta:'3 张 · 时间线', desc:'过去／现在／未来', positions:['过去','现在','未来'] },
    love: { name:'感情牌阵', meta:'5 张 · 关系', desc:'看清双方与关系走向', positions:['自己','对方','关系','阻碍','发展'] },
    career: { name:'事业牌阵', meta:'5 张 · 决策', desc:'梳理现状与行动方向', positions:['现状','优势','障碍','建议','结果'] },
    celtic: { name:'凯尔特十字', meta:'10 张 · 专业', desc:'多层次综合问题分析', cost:2, positions:['现状','挑战','潜意识','过去','可能发展','近期未来','自我态度','外部环境','希望与恐惧','最终走向'] }
  },

  majorNames: ['愚者','魔术师','女祭司','女皇','皇帝','教皇','恋人','战车','力量','隐士','命运之轮','正义','倒吊人','死神','节制','恶魔','高塔','星星','月亮','太阳','审判','世界'],
  majorUpright: [
    '新的开始、自由与冒险；保持开放，也要留意现实准备。','资源、意志与行动力已经具备，适合把想法落实。','倾听直觉与潜意识，答案需要在安静中浮现。','丰盛、创造与滋养，事情进入可持续生长阶段。','建立边界、秩序与长期结构，以稳定推进目标。','传统经验、共同价值与导师指引值得参考。','关系、价值观与重要选择正在对齐。','意志集中并持续推进，能够克服眼前阻力。','温和而坚定的内在力量胜过强硬对抗。','适合独处、复盘和寻找真正属于自己的答案。','周期正在转动，顺势调整会遇到新的机会。','以事实、责任与公平作出决定，结果重视因果。','暂停并换一个角度，放下控制才能看见出口。','旧阶段必须结束，主动释放才能完成转化。','调和差异、保持节制，稳定的小步更有效。','看见欲望、依赖与束缚，诚实面对阴影模式。','旧结构被现实打破，真相推动必要的重建。','希望、疗愈与灵感回归，坚持长期方向。','信息仍在迷雾中，情绪与想象可能影响判断。','清晰、活力与成果显现，适合公开表达和庆祝。','回应内心召唤，复盘过去并作出关键决定。','阶段圆满、经验整合，准备进入下一轮成长。'
  ],
  majorReversed: [
    '冲动、迟疑或判断不足；先确认方向再迈步。','能力分散或沟通失真，警惕操控与自我欺骗。','忽略直觉或信息被隐藏，暂时不要急于定论。','照顾过度或忽略自己，创造力暂时受阻。','控制过强或纪律松动，需要重建合理边界。','旧规则不再适配，需独立判断而非盲目反叛。','关系失衡或价值冲突，逃避选择会放大问题。','方向分散或控制失灵，先稳住节奏再行动。','自我怀疑或情绪失控，需要恢复耐心和信心。','过度封闭或逃避联系，别让反思变成孤立。','重复旧模式或抗拒变化，暂时的延迟需要耐心。','偏见、不公或逃避责任，需重新核对事实。','无效等待或牺牲过度，需要结束拖延。','抗拒结束、停滞或抓住过去，更新因此受阻。','失衡、过度或急躁，先恢复可持续节奏。','开始挣脱束缚并取回选择权，适合重建习惯。','危机被延后或内在震荡，回避只会累积压力。','暂时失去信心或目标感，需要重新连接愿景。','恐惧逐渐消散，隐藏的信息正在变得清晰。','快乐被短暂遮挡，调整预期仍可看到进展。','自我否定或拒绝觉醒，旧问题仍等待处理。','尚有收尾未完成，补齐最后环节即可前进。'
  ],
  suitNames: { Wands:'权杖', Cups:'圣杯', Swords:'宝剑', Pentacles:'星币' },
  rankNames: ['首牌','二','三','四','五','六','七','八','九','十','侍从','骑士','王后','国王'],
  suitThemes: {
    Wands:['行动、热情与创造力','行动方向、热情或创造力'],
    Cups:['情感、关系与直觉','情绪流动、关系或直觉'],
    Swords:['思考、沟通与挑战','思维、沟通或压力'],
    Pentacles:['工作、资源与现实基础','资源、执行或现实安全感']
  },
  rankThemes: [
    ['新的机会正在萌发，适合从小处开始。','起步受阻或准备不足，需要重新确认动机。'],
    ['选择与平衡成为重点，先比较再决定。','犹豫或失衡使进度放慢，需要明确优先级。'],
    ['成长与协作带来扩展，沟通能形成合力。','协作受阻或期待不一致，需重新分工。'],
    ['阶段进入稳定期，适合巩固已有成果。','稳定变成停滞，表面安全下仍有问题。'],
    ['冲突或失落暴露真实问题，也推动改变。','内耗正在累积，应停止无效对抗。'],
    ['调整之后出现进展、支持或过渡机会。','旧问题仍在牵制，接受帮助会更有效。'],
    ['面对考验时需要策略、耐心和清晰边界。','防御过度或策略失效，需要换一种方式。'],
    ['能量集中并加速推进，持续练习可见成果。','节奏混乱或重复无效，先校准方法。'],
    ['接近收获，独立与韧性是当前优势。','疲惫或过度依赖成果，需要恢复内在稳定。'],
    ['一个周期达到高点，结果与责任同时显现。','负担过重或结构失衡，需要取舍与释放。'],
    ['新消息与学习机会出现，保持好奇并求证。','表达不成熟或计划流于想象，需要落实。'],
    ['行动力增强，适合主动推进但要控制速度。','冲动、反复或承诺不稳，先处理风险。'],
    ['成熟的内在掌控与照顾能力正在发挥作用。','边界失衡或情绪化控制，需要回到自我价值。'],
    ['经验、领导力与长期视野帮助局面落地。','控制过强或固执，忽略反馈会放大盲点。']
  ],

  init: function() {
    this.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.renderSpreadPicker();
    this._loadCards();
  },

  _loadCards: async function() {
    var button = document.getElementById('tarotStartButton');
    if (button) { button.disabled = true; button.textContent = '正在载入 78 张牌…'; }
    try {
      var response = await fetch(this.DATA_URL, { cache:'force-cache' });
      if (!response.ok) throw new Error('牌义数据加载失败');
      var source = await response.json();
      if (!Array.isArray(source) || source.length !== 78) throw new Error('牌义数据不完整');
      this.cards = source.map(this._localizeCard.bind(this));
      if (button) { button.disabled = false; button.textContent = '洗牌并开始选牌'; }
    } catch (error) {
      console.error('[TarotModule]', error);
      if (button) button.textContent = '牌库加载失败，请刷新重试';
    }
  },

  _localizeCard: function(card) {
    var local = { id:Number(card.id), englishName:card.name, source:card };
    if (card.arcana === 'major') {
      local.name = this.majorNames[card.id]; local.suit = '大阿卡纳';
      local.upright = this.majorUpright[card.id]; local.reversed = this.majorReversed[card.id];
    } else {
      var rawSuit = String(card.suit || 'wands').toLowerCase(); var suit = rawSuit.charAt(0).toUpperCase() + rawSuit.slice(1); var rank = (card.id - 22) % 14;
      local.name = this.suitNames[suit] + this.rankNames[rank]; local.suit = this.suitNames[suit];
      local.upright = this.rankThemes[rank][0] + '本牌强调' + this.suitThemes[suit][0] + '。';
      local.reversed = this.rankThemes[rank][1] + '重点检查' + this.suitThemes[suit][1] + '。';
    }
    local.image = 'assets/tarot/cards/' + String(card.id).padStart(2, '0') + '.jpg';
    local.yes = card.yes_no || 'maybe'; local.yesReversed = card.yes_no_reversed || 'maybe';
    return local;
  },

  closeReading: function() { document.getElementById('tarotOverlay').classList.remove('active'); },

  renderSpreadPicker: function() {
    var target = document.getElementById('tarotSpreadPicker'); if (!target) return;
    var self = this; var oldModes = document.getElementById('tarotSingleModes'); if (oldModes) oldModes.remove();
    target.innerHTML = Object.keys(this.spreads).map(function(id) {
      var spread = self.spreads[id];
      return '<button type="button" class="tarot-spread-option' + (id === self.spreadId ? ' is-active' : '') + '" data-spread="' + id + '" onclick="TarotModule.selectSpread(\'' + id + '\')">' + (id === 'celtic' ? '<em>AI 2次</em>' : '') + '<strong>' + spread.name + '</strong><span>' + spread.meta + '</span><small>' + spread.desc + '</small></button>';
    }).join('');
    if (this.spreadId === 'single') {
      target.insertAdjacentHTML('afterend','<div class="tarot-single-modes" id="tarotSingleModes"><button type="button" class="' + (this.singleMode === 'daily' ? 'is-active' : '') + '" onclick="TarotModule.selectSingleMode(\'daily\')">今日指引</button><button type="button" class="' + (this.singleMode === 'yesno' ? 'is-active' : '') + '" onclick="TarotModule.selectSingleMode(\'yesno\')">是非问题</button></div>');
    }
    this._updateQuestionState();
  },
  selectSpread: function(id) { if (this.spreads[id]) { this.spreadId = id; this.renderSpreadPicker(); } },
  selectSingleMode: function(mode) { this.singleMode = mode === 'yesno' ? 'yesno' : 'daily'; this.renderSpreadPicker(); },
  _updateQuestionState: function() {
    var input=document.getElementById('tarotQuestion'), label=document.getElementById('tarotQuestionLabel'), help=document.getElementById('tarotQuestionHelp');
    if (!input || !label || !help) return;
    var optional=this.spreadId==='single' && this.singleMode==='daily';
    label.textContent=optional?'今日想关注什么（选填）':'你的问题（必填）';
    input.placeholder=optional?'例如：今天最需要留意什么？':'请具体描述你希望获得指引的问题';
    help.textContent=optional?'不填写时将以“今天的核心指引”为主题。':'问题越具体，牌阵和 AI 解读越有针对性。';
  },

  startReading: function() {
    if (this.cards.length !== 78) return;
    var question=document.getElementById('tarotQuestion'); var optional=this.spreadId==='single'&&this.singleMode==='daily';
    if (!optional && !question.value.trim()) { question.parentElement.classList.add('is-error'); question.focus(); return; }
    question.parentElement.classList.remove('is-error'); if (!question.value.trim()) question.value='今天的核心指引';
    this.selectedCards=[]; this.locked=false; this.revealed=false;
    var reversed=document.getElementById('tarotReversalToggle').checked;
    this.deck=this._shuffle(this.cards.slice()).map(function(card){ return {card:card,reversed:reversed?TarotModule._randomInt(2)===1:false}; });
    document.getElementById('tarotStep1').style.display='none'; document.getElementById('tarotStep2').style.display='block'; document.getElementById('tarotStep3').style.display='none';
    this._renderSlots(); this._renderCarousel();
  },
  shuffle: function() {
    var overlay=document.getElementById('tarotOverlay');
    if(overlay)overlay.classList.add('active');
    this.reset();
  },
  _randomInt: function(max) {
    if (window.crypto && window.crypto.getRandomValues) { var values=new Uint32Array(1), range=Math.floor(0x100000000/max)*max; do { window.crypto.getRandomValues(values); } while(values[0]>=range); return values[0]%max; }
    return Math.floor(Math.random()*max);
  },
  _shuffle: function(items) { for(var i=items.length-1;i>0;i--){var j=this._randomInt(i+1),t=items[i];items[i]=items[j];items[j]=t;} return items; },
  _activeSpread: function() {
    if(this.spreadId!=='single') return this.spreads[this.spreadId];
    return {name:this.singleMode==='yesno'?'是非问题':'今日指引',positions:[this.singleMode==='yesno'?'答案与提醒':'今日核心指引']};
  },

  _renderSlots: function() {
    var spread=this._activeSpread(), target=document.getElementById('tarotSlots'), columns=spread.positions.length===10?10:Math.min(5,spread.positions.length);
    target.style.setProperty('--tarot-slot-columns',columns); target.classList.toggle('is-celtic',spread.positions.length===10);
    target.innerHTML=spread.positions.map(function(position,index){return '<div class="tarot-slot"><div class="tarot-slot-label">'+(index+1)+' · '+TarotModule._escape(position)+'</div><button type="button" class="tarot-slot-card" id="tarotSlot'+index+'" onclick="TarotModule.undoCard('+index+')"><span class="tarot-card-3d"><span class="tarot-card-face tarot-card-back"></span><span class="tarot-card-face tarot-card-front"></span></span><b class="tarot-slot-index">'+(index+1)+'</b></button></div>';}).join('');
    this._updateCounter();
  },
  _renderCarousel: function() {
    var target=document.getElementById('cardDeck');
    target.innerHTML=this.deck.map(function(_,index){return '<button type="button" class="tarot-deck-card" data-index="'+index+'" aria-label="选择第 '+(index+1)+' 张牌"><span class="tarot-card-back"></span></button>';}).join('');
    target.onscroll=this._scheduleCenter.bind(this); target.onclick=function(event){var card=event.target.closest('.tarot-deck-card');if(card)TarotModule.selectCard(Number(card.dataset.index),card);};
    requestAnimationFrame(function(){target.scrollLeft=Math.max(0,(target.scrollWidth-target.clientWidth)/2);TarotModule._updateCenteredCard();});
  },
  _scheduleCenter: function(){if(this._scrollFrame)return;this._scrollFrame=requestAnimationFrame(function(){TarotModule._scrollFrame=0;TarotModule._updateCenteredCard();});},
  _updateCenteredCard: function(){
    var deck=document.getElementById('cardDeck');if(!deck)return;var center=deck.getBoundingClientRect().left+deck.clientWidth/2,best=null,distance=Infinity;
    deck.querySelectorAll('.tarot-deck-card:not(.is-used)').forEach(function(card){var rect=card.getBoundingClientRect(),current=Math.abs(rect.left+rect.width/2-center);card.classList.remove('is-centered');if(current<distance){distance=current;best=card;}});if(best)best.classList.add('is-centered');
  },
  selectCard: function(deckIndex,sourceEl){
    var spread=this._activeSpread();if(this.locked||this.selectedCards.length>=spread.positions.length||!this.deck[deckIndex]||sourceEl.classList.contains('is-used'))return;
    var selected={deckIndex:deckIndex,card:this.deck[deckIndex].card,reversed:this.deck[deckIndex].reversed},slotIndex=this.selectedCards.length;this.selectedCards.push(selected);sourceEl.classList.add('is-used');
    var slot=document.getElementById('tarotSlot'+slotIndex);slot.classList.add('is-selected');slot.querySelector('.tarot-card-front').innerHTML='<img src="'+selected.card.image+'" alt="'+this._escape(selected.card.name)+'">';if(selected.reversed)slot.querySelector('.tarot-card-front').classList.add('is-reversed');
    this._flyCard(sourceEl,slot);this._updateCounter();if(this.selectedCards.length===spread.positions.length){this.locked=true;setTimeout(function(){TarotModule._revealAll();},this.reducedMotion?120:800);}
  },
  _flyCard: function(from,to){
    if(this.reducedMotion)return;var a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),clone=document.createElement('div');clone.className='tarot-deck-card tarot-flying-card';clone.innerHTML='<span class="tarot-card-back"></span>';clone.style.left=a.left+'px';clone.style.top=a.top+'px';clone.style.width=a.width+'px';clone.style.height=a.height+'px';document.body.appendChild(clone);
    requestAnimationFrame(function(){clone.style.transform='translate('+(b.left-a.left)+'px,'+(b.top-a.top)+'px) scale('+(b.width/a.width)+')';clone.style.opacity='.25';});setTimeout(function(){clone.remove();},520);
  },
  undoCard: function(index){
    if(this.locked||index!==this.selectedCards.length-1)return;var removed=this.selectedCards.pop(),source=document.querySelector('.tarot-deck-card[data-index="'+removed.deckIndex+'"]');if(source)source.classList.remove('is-used');this._renderSlots();this._updateCenteredCard();
  },
  _updateCounter: function(){var spread=this._activeSpread(),counter=document.getElementById('cardSelectHint'),title=document.getElementById('tarotDrawTitle');if(counter)counter.textContent='已选 '+this.selectedCards.length+' / '+spread.positions.length;if(title)title.textContent=spread.name+' · 凭直觉选牌';},
  _revealAll: function(){this.revealed=true;this.selectedCards.forEach(function(_,index){setTimeout(function(){var slot=document.getElementById('tarotSlot'+index);if(slot)slot.classList.add('is-revealed');},TarotModule.reducedMotion?0:index*150);});setTimeout(function(){TarotModule.showReading();},this.reducedMotion?150:this.selectedCards.length*150+780);},
  _yesNoLabel: function(selected){var answer=selected.reversed?selected.card.yesReversed:selected.card.yes;return answer==='yes'?'倾向：是':answer==='no'?'倾向：否':'倾向：暂不明确';},

  showReading: function(){
    document.getElementById('tarotStep2').style.display='none';document.getElementById('tarotStep3').style.display='block';var spread=this._activeSpread(),question=document.getElementById('tarotQuestion').value.trim();
    var list=this.selectedCards.map(function(selected,index){var card=selected.card,direction=selected.reversed?'逆位':'正位',meaning=selected.reversed?card.reversed:card.upright,yesNo=TarotModule.spreadId==='single'&&TarotModule.singleMode==='yesno'?'<span class="tarot-yesno-answer">'+TarotModule._yesNoLabel(selected)+'</span>':'';return '<article class="tarot-reading-card" id="tarotMeaning'+(index+1)+'"><div class="tarot-result-art'+(selected.reversed?' is-reversed':'')+'"><img src="'+card.image+'" alt="'+TarotModule._escape(card.name)+' '+direction+'"><b class="tarot-result-number">'+(index+1)+'</b></div><div class="tarot-reading-copy"><p class="tarot-position">'+TarotModule._escape(spread.positions[index])+'</p><h3>'+TarotModule._escape(card.name)+' <span>'+direction+'</span></h3><p>'+TarotModule._escape(meaning)+'</p><small>'+TarotModule._escape(card.englishName)+' · '+TarotModule._escape(card.suit)+'</small><br>'+yesNo+'</div></article>';}).join('');
    var mini=this.spreadId==='celtic'?this._renderCelticMini():'',cost=this.spreadId==='celtic'?2:1;
    document.getElementById('tarotReading').innerHTML='<header class="tarot-result-head"><h3>'+this._escape(spread.name)+'</h3><p>问题：'+this._escape(question)+'</p></header><div class="tarot-result-grid'+(this.spreadId==='celtic'?' is-celtic':'')+'">'+mini+'<div class="tarot-reading-list">'+list+'</div></div><section class="tarot-ai-panel"><h3>塔罗 AI 深度解读</h3><p>AI 将结合你的问题、牌阵位置、牌面与正逆位进行整体解读。基础牌义已免费展示。</p><div class="tarot-ai-actions"><span class="tarot-ai-cost">本牌阵生成一次扣 '+cost+' 次</span><button type="button" class="btn-primary" onclick="TarotModule.generateAIReading()">生成 AI 解读（'+cost+'次）</button></div><div class="tarot-ai-output" id="tarotAIOutput"></div></section>';
    this._captureArchive();
  },
  _renderCelticMini: function(){var coordinates=[[43,46],[43,46],[43,67],[43,24],[20,46],[66,46],[86,78],[86,58],[86,37],[86,16]];return '<div class="tarot-mini-layout" aria-label="凯尔特十字牌阵位置图">'+coordinates.map(function(point,index){return '<button type="button" class="tarot-mini-card" style="left:'+point[0]+'%;top:'+point[1]+'%;'+(index===1?'transform:rotate(90deg);':'')+'" onclick="TarotModule.scrollToMeaning('+(index+1)+')">'+(index+1)+'</button>';}).join('')+'</div>';},
  scrollToMeaning: function(index){var target=document.getElementById('tarotMeaning'+index);if(target)target.scrollIntoView({behavior:this.reducedMotion?'auto':'smooth',block:'center'});},

  _aiPayload: function(){var spread=this._activeSpread();return {spread:this.spreadId==='single'?this.singleMode:this.spreadId,spreadName:spread.name,question:document.getElementById('tarotQuestion').value.trim(),cards:this.selectedCards.map(function(selected,index){return {id:selected.card.id,name:selected.card.name,englishName:selected.card.englishName,position:spread.positions[index],orientation:selected.reversed?'reversed':'upright',meaning:selected.reversed?selected.card.reversed:selected.card.upright};})};},
  _aiCacheKey: function(payload){var text=JSON.stringify(payload),hash=2166136261;for(var i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash+=(hash<<1)+(hash<<4)+(hash<<7)+(hash<<8)+(hash<<24);}return 'tarot-'+(hash>>>0).toString(36);},
  _renderAI: function(content,cached,cost){var target=document.getElementById('tarotAIOutput');if(!target)return;var html=this._escape(content||'').replace(/^###?\s+(.+)$/gm,'<h4>$1</h4>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');target.innerHTML='<div data-ai-complete="true"><small>'+(cached?'已读取本机保存的解读，本次未扣费':'本次已扣 '+cost+' 次并自动保存')+'</small><div>'+html+'</div></div>';this._captureArchive();},
  generateAIReading: async function(){
    var payload=this._aiPayload(),key=this._aiCacheKey(payload),cost=payload.spread==='celtic'?2:1,target=document.getElementById('tarotAIOutput'),cache={};try{cache=JSON.parse(localStorage.getItem(this.CACHE_KEY)||'{}');}catch(_){}
    if(cache[key]&&cache[key].content){this._renderAI(cache[key].content,true,cost);return;}if(window.Paywall&&Paywall._balanceLoaded&&Paywall.getBalance()<cost){Paywall.openShop();return;}target.innerHTML='<p>正在结合问题、牌阵位置与正逆位生成解读…</p>';
    try{var response=await fetch('/api/ai-tarot-reading',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reading:payload,cacheKey:key})}),data=await response.json();if(!data.success){if(data.code==='INSUFFICIENT'&&window.Paywall)Paywall.openShop();throw new Error(data.error||'塔罗 AI 解读失败');}if(window.Paywall&&data.balance!=null)Paywall._setBalance(Number(data.balance));cache[key]={content:data.content,savedAt:new Date().toISOString(),cost:cost};Object.keys(cache).sort(function(a,b){return String(cache[b].savedAt).localeCompare(String(cache[a].savedAt));}).slice(60).forEach(function(oldKey){delete cache[oldKey];});try{localStorage.setItem(this.CACHE_KEY,JSON.stringify(cache));}catch(_){}this._renderAI(data.content,false,cost);}catch(error){target.innerHTML='<p class="tarot-ai-error">'+this._escape(error.message||'AI 服务暂不可用，本次未扣费')+'</p>';if(window.Paywall)Paywall.syncBalance(true).catch(function(){});}
  },
  _captureArchive: function(){setTimeout(function(){if(window.DaoWenArchive&&typeof DaoWenArchive.capture==='function')DaoWenArchive.capture('tarotOverlay');},60);},
  returnToSetup: function(){if(this.locked)return;document.getElementById('tarotStep2').style.display='none';document.getElementById('tarotStep1').style.display='block';},
  reset: function(){this.selectedCards=[];this.deck=[];this.locked=false;this.revealed=false;document.getElementById('tarotStep2').style.display='none';document.getElementById('tarotStep3').style.display='none';document.getElementById('tarotStep1').style.display='block';document.getElementById('tarotReading').innerHTML='';},
  _escape: function(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
};

document.addEventListener('DOMContentLoaded',function(){TarotModule.init();});
