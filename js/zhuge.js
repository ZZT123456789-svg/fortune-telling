/**
 * 诸葛神数 — 384签
 * 三字起数法：(字1笔画×100 + 字2笔画×10 + 字3笔画) % 384
 */
var ZhugeModule = {
  open: function() {
    document.getElementById('zhugeOverlay').classList.add('active');
  },
  close: function() {
    document.getElementById('zhugeOverlay').classList.remove('active');
    document.getElementById('zhugeResult').style.display = 'none';
  },

  /** Get stroke count for common Chinese characters */
  _getStrokes: function(ch) {
    var strokeMap = {
      '一':1,'二':2,'三':3,'四':5,'五':4,'六':4,'七':2,'八':2,'九':2,'十':2,
      '人':2,'大':3,'小':3,'中':4,'上':3,'下':3,'不':4,'天':4,'地':6,'日':4,
      '月':4,'水':4,'火':4,'木':4,'金':8,'土':3,'山':3,'石':5,'风':4,'雨':8,
      '云':4,'龙':5,'虎':8,'马':3,'牛':4,'羊':6,'鸡':7,'狗':8,'猪':11,'鱼':8,
      '花':7,'草':9,'树':9,'林':8,'鸟':5,'虫':6,'家':10,'国':8,'王':4,'子':3,
      '女':3,'男':7,'父':4,'母':5,'兄':5,'弟':7,'姐':8,'妹':8,'夫':4,'妻':8,
      '爱':10,'恨':9,'喜':12,'怒':9,'哀':9,'乐':5,'思':9,'想':13,'心':4,'情':11,
      '明':8,'清':11,'白':5,'黑':12,'红':6,'黄':11,'蓝':13,'绿':11,'春':9,'夏':10,
      '秋':9,'冬':5,'东':5,'西':6,'南':9,'北':5,'前':9,'后':6,'左':5,'右':5,
      '福':13,'禄':12,'寿':7,'财':9,'安':6,'康':11,'吉':6,'祥':10,'平':5,'和':8,
      '学':8,'文':4,'武':8,'智':12,'仁':4,'义':3,'礼':5,'信':9,'道':12,'德':15,
      '好':6,'坏':7,'美':9,'丑':4,'善':12,'恶':12,'真':10,'假':11,'强':12,'弱':10,
      '行':6,'走':7,'坐':7,'立':5,'来':8,'去':5,'进':7,'退':9,'出':5,'入':2,
      '有':6,'无':4,'多':6,'少':4,'长':4,'短':12,'高':10,'低':7,'快':7,'慢':14,
      '生':5,'死':6,'老':6,'病':10,'开':4,'关':6,'始':8,'终':8,'新':13,'旧':5
    };
    if (strokeMap[ch]) return strokeMap[ch];
    // Estimate: use charCode mod 25 + 1 as rough stroke estimate
    var code = ch.charCodeAt(0);
    return (code % 25) + 1;
  },

  /** Generate lot interpretation */
  _getLot: function(num) {
    var lotNo = num % 384;
    if (lotNo === 0) lotNo = 384;

    var lots = [
      {no:1,level:'上上',poem:'天门一挂榜，预定夺标人。\n马嘶芳草地，秋高听鹿鸣。',advice:'此签大吉，预示着成功和荣誉即将到来。保持信心，你的努力会被看到。'},
      {no:2,level:'上中',poem:'地有神，甚威灵。\n兴邦辅国，尊主庇民。',advice:'有贵人相助，尤其是在事业方面。保持谦虚，听从有经验之人的建议。'},
      {no:3,level:'中平',poem:'长安花已尽，东风送故人。\n杨柳依依处，岁岁又逢春。',advice:'有些事情到了尾声，但也预示新的开始。顺其自然，不必强求。'},
      {no:4,level:'上上',poem:'玉兔出东升，光辉照万方。\n月中折桂树，天下共馨香。',advice:'好运当头，特别是学业和事业方面。积极争取，会有好结果。'},
      {no:5,level:'中下',poem:'春雷起蛰龙，一奋便腾空。\n风云相际会，万国尽来同。',advice:'机会虽大，但需要足够准备。不要急于求成，等做好准备再行动。'},
      {no:10,level:'上中',poem:'红日当天照，光辉遍四方。\n阴霾皆散尽，万里见晴光。',advice:'迷雾即将散去，真相和好运都会到来。保持乐观。'},
      {no:20,level:'中平',poem:'秋月照寒潭，清光浸碧澜。\n夜深风露冷，独立望长安。',advice:'有些孤独，但这也是思考和积累的好时机。守得云开见月明。'},
      {no:30,level:'下下',poem:'浊浪排空起，孤舟逆水行。\n前程多险阻，步步要留神。',advice:'当前阶段困难较多，宜小心行事，不要冒险。做好防范，等待风浪过去。'},
      {no:50,level:'上上',poem:'凤凰栖梧树，祥云护紫宸。\n天恩垂玉露，万象尽回春。',advice:'大吉之兆，万 象更新。适合开启新计划和项目。'},
      {no:64,level:'上中',poem:'六爻皆吉兆，八卦尽祯祥。\n龙虎风云会，乾坤日月光。',advice:'诸事顺遂，各方面运势都不错。但不可骄傲，保持平和。'},
      {no:100,level:'中平',poem:'一箭射双雕，功成万里遥。\n归来重检点，得失自分晓。',advice:'效率很高，但需复盘总结。得失之间要看长远。'},
      {no:128,level:'中上',poem:'花开蝶满枝，春色正当时。\n好景须珍惜，良辰不可迟。',advice:'美好时光到来，抓住机会享受生活。但也要注意花无百日红。'},
      {no:200,level:'中下',poem:'浮云蔽白日，游子不顾返。\n前路多迷惘，何时见故乡。',advice:'暂时迷茫，需要重新找到方向。多与亲友沟通，获得支持。'},
      {no:256,level:'上中',poem:'龙腾沧海阔，虎啸万山鸣。\n借问前程路，青云足下生。',advice:'气势正盛，适合大展拳脚。但记得保持谦逊。'},
      {no:300,level:'中平',poem:'一叶扁舟去，江湖万里心。\n不知何处宿，且向月中吟。',advice:'随遇而安，不强求。有些事情急不来，享受过程。'},
      {no:350,level:'上上',poem:'金榜题名日，春风得意时。\n一日看尽长安花，归来仍是少年。',advice:'大成功在即！保持初心，成功之后也不要迷失自己。'},
      {no:384,level:'上上',poem:'天书下降紫薇宫，万国衣冠拜冕旒。\n自此乾坤皆有序，风调雨顺乐悠悠。',advice:'终极好运！诸事圆满，功德有成。享受你的成果吧。'}
    ];

    // Find closest lot
    var best = lots[0];
    for (var i = 0; i < lots.length; i++) {
      if (Math.abs(lots[i].no - lotNo) < Math.abs(best.no - lotNo)) best = lots[i];
    }
    // Generate variant for non-exact matches
    return {
      no: lotNo,
      level: best.level,
      poem: best.poem,
      advice: best.advice + '\n\n（签号' + lotNo + '，最接近第' + best.no + '签）'
    };
  },

  calculate: function() {
    var w1 = document.getElementById('zhugeWord1').value.trim();
    var w2 = document.getElementById('zhugeWord2').value.trim();
    var w3 = document.getElementById('zhugeWord3').value.trim();
    if (!w1 || !w2 || !w3) { alert('请输入三个汉字'); return; }

    var s1 = this._getStrokes(w1);
    var s2 = this._getStrokes(w2);
    var s3 = this._getStrokes(w3);
    var num = (s1 * 100 + s2 * 10 + s3) % 384;
    if (num === 0) num = 384;
    var lot = this._getLot(num);
    this._render(lot, w1 + w2 + w3, s1, s2, s3);
  },

  byNumber: function() {
    var num = parseInt(document.getElementById('zhugeNumber').value);
    if (!num || num < 1 || num > 384) { alert('请输入1-384之间的签号'); return; }
    var lot = this._getLot(num);
    this._render(lot, '直接查签', null, null, null);
  },

  _render: function(lot, words, s1, s2, s3) {
    var ctn = document.getElementById('zhugeResult');
    ctn.style.display = 'block';
    ctn.innerHTML =
      '<div class="result-header">📜 诸葛神数 — 第' + lot.no + '签</div>' +
      (s1 ? '<div style="text-align:center;color:var(--text-secondary);font-size:0.82rem;">三字：' + words + '（笔画' + s1 + ' + ' + s2 + ' + ' + s3 + '）</div>' : '') +
      '<div style="text-align:center;padding:0.5rem;"><span style="font-size:1.3rem;color:var(--gold);">' + lot.level + '签</span></div>' +
      '<div class="lot-poem">' + lot.poem + '</div>' +
      '<div class="lot-advice">' + lot.advice.replace(/\n/g,'<br/>') + '</div>' +
      '<button class="btn-secondary" onclick="ZhugeModule.close()">🔙 返回</button>';
    Paywall.checkCover('zhugeResult');
  }
};
