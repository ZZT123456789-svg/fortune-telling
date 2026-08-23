/** 命盘术语与古籍依据的行内联动；仅负责展示，不参与排盘计算。 */
var BaziClassicLink = (function() {
  'use strict';

  var TEN_GOD = {
    '正官':'重在约束、秩序与责任。是否成用，要看官星强弱、日主能否承受，以及财印是否配合。',
    '七杀':'重在压力、执行与竞争。须结合制化：食神制杀、印星化杀或身强任杀时，意义才较完整。',
    '正印':'重在生扶、学习与保护。印旺不等于必吉，还要看是否过度助身、是否受财星制约。',
    '偏印':'重在非标准学习、洞察与保护。须同时检查是否夺食，以及财星能否形成制衡。',
    '食神':'重在表达、创造与温和泄秀。能否发挥，要看日主是否有力、是否被偏印所制。',
    '伤官':'重在输出、突破与批判。需结合官星、印星和财星判断，不能只凭“伤官见官”下结论。',
    '正财':'重在稳定资源、经营与现实责任。须看日主能否任财，以及食伤生财、比劫争财等条件。',
    '偏财':'重在流动资源、机会与外部经营。须结合根气、食伤和比劫，不能等同于必有意外之财。',
    '比肩':'重在自主、同类助力与竞争。身弱时可能为助，身旺时也可能加重失衡。',
    '劫财':'重在竞争、行动和资源分配。吉凶取决于身强身弱、财星状态及是否形成制化。',
    '比劫':'包含比肩、劫财，表示同类五行对日主的帮助或竞争。',
    '食伤':'包含食神、伤官，表示日主向外输出、表达和生财的通道。',
    '财星':'包含正财、偏财，表示日主所克之五行及资源经营关系。',
    '官杀':'包含正官、七杀，表示克制日主的秩序、责任与压力。',
    '印星':'包含正印、偏印，表示生日主的学习、支持与保护。'
  };
  var STAR = {
    '天乙贵人':'传统查法中的助缘标记，宜结合所在柱、是否受冲破及全局喜忌判断。',
    '文昌贵人':'传统上与学习、表达和条理相关，只能作为印星、食伤等结构的补充信息。',
    '国印贵人':'传统上与责任、制度和管理象意相关，仍须配合官印及格局成败。',
    '福星贵人':'传统上作福泽、缓和之象，不能抵消命局本身明显的失衡。',
    '太极贵人':'传统上与思辨、求知和玄理兴趣相关，应结合印星与华盖等结构观察。',
    '红艳':'传统桃花类标记之一，只提示人际吸引与情感表达的观察点，不作道德判断。',
    '流霞':'传统上用于提示人际情感与某些风险象意，不可脱离五行生克单独使用。',
    '禄神':'表示日干临禄的查表关系，可辅助观察根气与自我驱动力。',
    '金舆':'传统上有资源、照拂与生活条件之象，须结合财印和所在柱判断。',
    '暗禄':'表示暗中得禄的查表关系，宜作为通根与资源条件的补充。',
    '羊刃':'表示日干帝旺之地的特殊标记，重点观察力量是否过旺以及有无制化。',
    '飞刃':'刃类辅助标记，须结合冲合、旺衰和岁运，不单独判断风险。',
    '桃花':'又称咸池，主要提示人际吸引、审美与情感互动，不能直接等同于感情吉凶。',
    '驿马':'主要提示移动、变动和外部环境转换，是否有利要看所临五行是否为喜用。',
    '华盖':'常用于观察独立思考、技艺或宗教玄学倾向，过度孤立与否仍看全局。',
    '将星':'传统上与组织、担当和掌控力相关，须结合官杀、比劫和日主力量。',
    '劫煞':'传统查表中的竞争与突发性标记，只作岁运风险提示，不作确定事件判断。',
    '灾煞':'传统辅助标记，应优先核对五行失衡、冲刑及岁运触发条件。',
    '亡神':'传统上与心神、隐伏和变化相关，须结合喜忌与所在柱，不宜望文生义。',
    '红鸾':'传统婚恋类标记，用于提示关系主题被触发的可能，不代表必然婚期。',
    '天喜':'传统喜庆类标记，应与流年、大运及原局关系结构一起观察。',
    '孤辰':'传统关系类辅助标记，不等于必然孤独，也不应作为婚恋结论。',
    '寡宿':'传统关系类辅助标记，只提示独处倾向的观察点，不作命运定论。',
    '天德贵人':'月令体系中的德神标记，常作缓和象意，仍不能替代格局与喜忌。',
    '月德贵人':'月令体系中的德神标记，需结合所在柱和实际制化关系。',
    '月德合':'月德的合神查法，作为辅助信息使用，不单独定吉。',
    '天医':'传统上与照护、修复象意相关，不构成任何医学判断。',
    '魁罡':'特殊日柱标记，传统重视刚决之性，但必须结合全局旺衰和制化。',
    '阴差阳错':'传统日柱辅助标记，不可据此直接断婚姻或关系结果。',
    '十恶大败':'传统日柱名目，名称较重，本站仅作典籍查考，不据此下凶断。',
    '金神':'传统特殊组合名目，是否成格有严格条件，不能只见日时干支便定论。',
    '六秀日':'传统日柱辅助标记，多取秀气之意，仍需结合命局结构。'
  };
  var PATTERN_TO_GOD={'正官格':'正官','七杀格':'七杀','正印格':'正印','偏印格':'偏印','食神格':'食神','伤官格':'伤官','正财格':'正财','偏财格':'偏财','建禄格':'比肩','月刃格':'劫财'};

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function trigger(type,term,label){
    if(!term||term==='—'||term.indexOf('元男')===0||term.indexOf('元女')===0)return esc(label||term);
    return '<button class="classic-ref-trigger" type="button" data-ref-type="'+esc(type)+'" data-ref-term="'+esc(term)+'" onclick="BaziClassicLink.open(this)">'+esc(label||term)+'</button>';
  }
  function tenGod(term){
    return {term:term,kind:'十神',source:'《滴天髓》·知命',quote:'“用之为财不可劫，用之为官不可伤，用之印绶不可坏，用之食神不可夺。”',explain:TEN_GOD[term]||'该十神须结合所在柱、透干、通根、月令旺衰与全局制化判断。',condition:'十神名称本身没有固定吉凶。先看日主旺衰，再看该星是否得令、透干、通根，以及合冲与岁运是否触发。'};
  }
  function pattern(term){
    var god=PATTERN_TO_GOD[term]||String(term).replace(/格$/,'');
    return {term:term,kind:'格局',source:'《滴天髓》·八格',quote:'“先观月令所得何支，次看天干透出何神，再究司令以定真假，然后取用，以分清浊。”',explain:(TEN_GOD[god]||'格局用于概括月令、透干与全局气势的主要结构。')+' 当前格名只是结构入口，不代表最终吉凶。',condition:'以月令司令和透干为起点，并核对成格、破格、救应、调候与日主承受能力；不可只凭一个格名断事。'};
  }
  function shensha(term){
    var quote='“吉凶神煞之多端，何如生克制化之一理。”';
    var source='《滴天髓》·八格';
    if(term==='桃花'){quote='“阳刃桃花、伏吟返吟、休、囚、死、绝、衰、败者凶。遇帝旺、临官、禄马、贵人、生、养、冠带、库者吉。”';source='《渊海子平》·论桃花';}
    else if(term==='驿马'){quote='“咸池驿马纵有验，总之于理不长。其中究论，不可不详。”';source='《滴天髓》·女命章';}
    else if(term==='华盖'){quote='“柱中若逢华盖，犯二德清贵之人。”';source='《渊海子平》·杂论口诀';}
    return {term:term,kind:'神煞',source:source,quote:quote,explain:STAR[term]||'这是传统神煞查表所得的辅助标记，需结合所在柱与命局结构解释。',condition:'神煞只作辅证。必须同时核对月令、旺衰、十神、格局、合冲刑害和岁运；单见一项不作吉凶定论。'};
  }
  function lookup(type,term){return type==='pattern'?pattern(term):type==='shensha'?shensha(term):tenGod(term);}
  function panel(){return '<aside class="classic-reference-panel" hidden aria-live="polite"><div class="classic-reference-empty">点击命盘中的格局、十神或神煞，查看古籍依据。</div></aside>';}
  function open(button){
    var data=lookup(button.dataset.refType,button.dataset.refTerm),sheet=button.closest('.classic-bazi-sheet'),panelNode=sheet&&sheet.querySelector('.classic-reference-panel');
    if(!panelNode){var host=button.closest('.result-container')||document;panelNode=host.querySelector('.classic-reference-panel');}
    if(!panelNode)return;
    panelNode.hidden=false;panelNode.classList.add('is-open');
    panelNode.innerHTML='<header><div><span>'+esc(data.kind)+'</span><h3>'+esc(data.term)+' · 古籍依据</h3></div><button type="button" onclick="BaziClassicLink.close(this)" aria-label="收起古籍依据">收起</button></header>'+
      '<p class="classic-reference-source">出处：'+esc(data.source)+'</p><blockquote><b>原文摘录</b>'+esc(data.quote)+'</blockquote>'+
      '<section><h4>白话解释</h4><p>'+esc(data.explain)+'</p></section><section><h4>适用条件</h4><p>'+esc(data.condition)+'</p></section>'+
      '<a href="library.html" target="_blank" rel="noopener">前往古籍书库阅读全文</a>';
    panelNode.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function close(button){var node=button.closest('.classic-reference-panel');if(node){node.hidden=true;node.classList.remove('is-open');}}
  return {trigger:trigger,panel:panel,open:open,close:close,lookup:lookup};
})();
