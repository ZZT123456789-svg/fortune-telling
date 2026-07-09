/**
 * 每日一卦 — 日期起卦、每日卦象
 */
var DailyHexagramModule = {
  hexagrams: [
    {no:1,name:'乾为天',upper:'☰',lower:'☰',judgment:'元亨利贞。',advice:'今天是开创与主动的一天。抓住机会展现你的领导力，但不要刚愎自用。适合做决策和启动新项目。'},
    {no:2,name:'坤为地',upper:'☷',lower:'☷',judgment:'元亨，利牝马之贞。',advice:'今天适合顺势而为，以柔克刚。耐心和包容会带来好运。多倾听他人意见，做好后勤和准备。'},
    {no:3,name:'水雷屯',upper:'☵',lower:'☳',judgment:'元亨利贞，勿用有攸往。',advice:'万事开头难，今天可能遇到一些挑战。不要急于求成，先打好基础。等待合适的时机再行动。'},
    {no:4,name:'山水蒙',upper:'☶',lower:'☵',judgment:'亨。匪我求童蒙，童蒙求我。',advice:'今天是学习的好日子。保持好奇心，虚心求教。如果不确定方向，先停下来观察学习。'},
    {no:5,name:'水天需',upper:'☵',lower:'☰',judgment:'有孚，光亨，贞吉，利涉大川。',advice:'今天需要耐心等待。好事多磨，不要因为一时看不到结果就放弃。相信时机终会到来。'},
    {no:6,name:'天水讼',upper:'☰',lower:'☵',judgment:'有孚窒惕，中吉终凶。',advice:'今天注意避免口舌之争。有理不在声高。如果发生争执，见好就收，不要非要争个输赢。'},
    {no:7,name:'地水师',upper:'☷',lower:'☵',judgment:'贞丈人吉，无咎。',advice:'今天适合团队协作。找靠谱的人一起做事，集体的力量比你想象的要大。领路人越有经验越好。'},
    {no:8,name:'水地比',upper:'☵',lower:'☷',judgment:'吉。原筮元永贞，无咎。',advice:'今天适合建立关系、寻求合作。主动靠近对你有帮助的人和资源。团结就是力量。'},
    {no:9,name:'风天小畜',upper:'☴',lower:'☰',judgment:'亨。密云不雨，自我西郊。',advice:'今天是小积累的一天。虽然还没有看到大成果，但每一步都在为将来铺路。耐心积累，厚积薄发。'},
    {no:10,name:'天泽履',upper:'☰',lower:'☱',judgment:'履虎尾，不咥人，亨。',advice:'今天行事要谨慎，如履薄冰。遵守规则和礼仪，即使有风险也能化险为夷。跟对人做对事很重要。'},
    {no:11,name:'地天泰',upper:'☷',lower:'☰',judgment:'小往大来，吉亨。',advice:'今天是天地交泰的好日子。诸事顺利，适合开展新计划。保持谦逊开放的心态，好运自来。'},
    {no:12,name:'天地否',upper:'☰',lower:'☷',judgment:'否之匪人，不利君子贞。',advice:'今天可能感到阻塞和不顺。这是正常的周期，不必气馁。收敛锋芒，守住本心，等待否极泰来。'},
    {no:13,name:'天火同人',upper:'☰',lower:'☲',judgment:'同人于野，亨。',advice:'今天适合社交和团队活动。找到志同道合的人，一起做事效率更高。开放心态，接纳不同。'},
    {no:14,name:'火天大有',upper:'☲',lower:'☰',judgment:'元亨。',advice:'今天是大丰收的日子。分享你的成果，慷慨大方会带来更多好运。感恩已有的一切。'},
    {no:15,name:'地山谦',upper:'☷',lower:'☶',judgment:'亨，君子有终。',advice:'今天谦虚是最好的策略。越是有能力，越要低调。谦虚让人受人尊敬，也是长久之道。'},
    {no:16,name:'雷地豫',upper:'☳',lower:'☷',judgment:'利建侯行师。',advice:'今天适合欢庆和分享快乐。但也要适度，不要乐极生悲。如果有好的想法，抓紧时机行动。'},
    {no:17,name:'泽雷随',upper:'☱',lower:'☳',judgment:'元亨利贞，无咎。',advice:'今天适合随遇而安。顺势而为比逆势而行更省力。保持灵活，根据情况调整计划。'},
    {no:18,name:'山风蛊',upper:'☶',lower:'☴',judgment:'元亨，利涉大川。',advice:'今天注意发现和解决问题。积压已久的问题可能浮出水面。拿出勇气处理它，处理完会很轻松。'},
    {no:19,name:'地泽临',upper:'☷',lower:'☱',judgment:'元亨利贞。至于八月有凶。',advice:'今天适合亲临现场，实地观察。好消息在靠近。但也要注意未来的风险，提前准备。'},
    {no:20,name:'风地观',upper:'☴',lower:'☷',judgment:'盥而不荐，有孚颙若。',advice:'今天适合观察和反思。多看看别人怎么做，从中学习。不要急着下结论，先全面了解。'}
  ],

  open: function() {
    var overlay = document.getElementById('dailyHexagramOverlay');
    overlay.classList.add('active');
    var today = new Date();
    var dayOfYear = Math.floor((today - new Date(today.getFullYear(),0,0)) / 86400000);
    var idx = dayOfYear % this.hexagrams.length;
    this._render(this.hexagrams[idx], today);
  },

  close: function() {
    document.getElementById('dailyHexagramOverlay').classList.remove('active');
  },

  _render: function(hex, date) {
    var container = document.getElementById('dailyHexagramResult');
    var dateStr = date.getFullYear() + '年' + (date.getMonth()+1) + '月' + date.getDate() + '日';
    container.innerHTML =
      '<div class="result-header">☰ 今日卦象 — ' + dateStr + '</div>' +
      '<div class="hexa-display">' + hex.lower + '<br/>' + hex.upper + '</div>' +
      '<div style="text-align:center;font-size:1.3rem;color:var(--gold);font-weight:bold;">第' + hex.no + '卦 · ' + hex.name + '</div>' +
      '<div style="text-align:center;color:var(--gold-pale);padding:0.5rem;">' + hex.judgment + '</div>' +
      '<div style="color:var(--text);line-height:1.7;padding:0.5rem;">' + hex.advice + '</div>' +
      '<button class="btn-secondary" onclick="DailyHexagramModule.close()">🔙 返回</button>';
  }
};

