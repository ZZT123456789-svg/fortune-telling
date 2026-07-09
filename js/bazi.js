/**
 * 五行八字综合排盘
 */
var BaziModule = {
  _hexagrams: [
    {id:1,n:'乾为天',e:'创始之力，大吉大利。得此卦者运势正盛，宜积极进取，发挥潜能。'},
    {id:2,n:'坤为地',e:'包容承载，以柔克刚。宜顺势而为，以静制动。'},
    {id:3,n:'水雷屯',e:'事物初生之艰难。宜稳扎稳打，不可急于求成。'},
    {id:4,n:'山水蒙',e:'启蒙之象。需虚心学习，心诚则灵。'},
    {id:5,n:'水天需',e:'等待时机。时机未到需耐心。'},
    {id:6,n:'天水讼',e:'争辩冲突。宜见好就收，不宜纠缠。'},
    {id:7,n:'地水师',e:'统帅之象。公正无私方能得众心。'},
    {id:8,n:'水地比',e:'亲附团结。人际关系和谐，有贵人相助。'},
    {id:9,n:'风天小畜',e:'小有积蓄。宜继续努力提升自己。'},
    {id:10,n:'天泽履',e:'谨慎实践。循规蹈矩可化险为夷。'},
    {id:11,n:'地天泰',e:'通达和谐。上上大吉！宜把握良机大展宏图。'},
    {id:12,n:'天地否',e:'闭塞不通。宜韬光养晦，否极泰来。'},
    {id:13,n:'天火同人',e:'志同道合。团结就是力量。'},
    {id:14,n:'火天大有',e:'丰收拥有。大吉！满招损谦受益。'},
    {id:15,n:'地山谦',e:'谦虚之道。谦逊之人终得善果。'},
    {id:16,n:'雷地豫',e:'愉悦准备。宜顺势而为积极行动。'},
    {id:17,n:'泽雷随',e:'跟随顺应。宜随从大势灵活变通。'},
    {id:18,n:'山风蛊',e:'整治革新。正是除弊革新的好时机。'},
    {id:19,n:'地泽临',e:'临近监督。好运正在临近。'},
    {id:20,n:'风地观',e:'观察展示。宜多观察少行动。'},
    {id:21,n:'火雷噬嗑',e:'咀嚼决断。果断公正处理则顺利。'},
    {id:22,n:'山火贲',e:'装饰美化。小事可成大事需等。'},
    {id:23,n:'山地剥',e:'剥落衰退。固守根本稳固基础。'},
    {id:24,n:'地雷复',e:'回复重生。运势触底反弹好运回归！'},
    {id:25,n:'天雷无妄',e:'真实无伪。正当行事则吉。'},
    {id:26,n:'山天大畜',e:'大积蓄势。厚积薄发！'},
    {id:27,n:'山雷颐',e:'颐养供养。谨慎言语节制饮食。'},
    {id:28,n:'泽风大过',e:'太过过度。保持中道不过不失。'},
    {id:29,n:'坎为水',e:'险阻深渊。内心诚信坚定就能化险为夷。'},
    {id:30,n:'离为火',e:'光明依附。运势光明前景灿烂！'},
    {id:31,n:'泽山咸',e:'感应感情。人际关系融洽感情运佳。'},
    {id:32,n:'雷风恒',e:'恒久坚持。持之以恒必有所成。'},
    {id:33,n:'天山遁',e:'退避隐退。宜退不宜进。'},
    {id:34,n:'雷天大壮',e:'强盛壮大。守正不阿方能长久。'},
    {id:35,n:'火地晋',e:'前进晋升。事业蒸蒸日上！'},
    {id:36,n:'地火明夷',e:'光明受损。韬光养晦等待时机。'},
    {id:37,n:'风火家人',e:'家庭内部。家庭和谐是事业基础。'},
    {id:38,n:'火泽睽',e:'乖离分歧。求同存异是智慧。'},
    {id:39,n:'水山蹇',e:'艰难险阻。反躬自省提升修养。'},
    {id:40,n:'雷水解',e:'解除释放。困难即将解除！'},
    {id:41,n:'山泽损',e:'减损节制。学会减法生活。'},
    {id:42,n:'风雷益',e:'增益利益。运势增益大有可为！'},
    {id:43,n:'泽天夬',e:'决断分离。当断则断。'},
    {id:44,n:'天风姤',e:'不期而遇。偶然中有必然。'},
    {id:45,n:'泽地萃',e:'聚集荟萃。人才汇聚资源集中！'},
    {id:46,n:'地风升',e:'上升成长。运势上升期！'},
    {id:47,n:'泽水困',e:'困境窘迫。坚守正道终能脱困。'},
    {id:48,n:'水风井',e:'源泉供养。固守根本。'},
    {id:49,n:'泽火革',e:'变革革新。旧的不去新的不来。'},
    {id:50,n:'火风鼎',e:'鼎器稳固。大吉事业可成。'},
    {id:51,n:'震为雷',e:'震动惊雷。保持镇静不失常态。'},
    {id:52,n:'艮为山',e:'停止静止。该停下来反思了。'},
    {id:53,n:'风山渐',e:'渐进徐行。欲速则不达。'},
    {id:54,n:'雷泽归妹',e:'婚嫁归属。需谨慎考虑长远。'},
    {id:55,n:'雷火丰',e:'丰盛充盈。盛极必衰保持清醒。'},
    {id:56,n:'火山旅',e:'旅行客居。小心谨慎明快果断。'},
    {id:57,n:'巽为风',e:'顺从渗透。以柔顺方式达成目标。'},
    {id:58,n:'兑为泽',e:'喜悦交流。心情愉悦人际和谐！'},
    {id:59,n:'风水涣',e:'涣散分散。将分散力量重新整合。'},
    {id:60,n:'水泽节',e:'节制约束。凡事有度过则苦。'},
    {id:61,n:'风泽中孚',e:'诚信信任。以诚信待人则大事可成。'},
    {id:62,n:'雷山小过',e:'小有过越。小事可为大事不宜。'},
    {id:63,n:'水火既济',e:'已经成功。成功时更要预防问题。'},
    {id:64,n:'火水未济',e:'尚未完成。意味着新开始和无限可能。'}
  ],

  init: function() {
    document.getElementById('baziForm').addEventListener('submit', function(e) {
      e.preventDefault();
      BaziModule.calculate();
    });
  },

  calculate: function() {
    var name = document.getElementById('baziName').value.trim();
    var y = parseInt(document.getElementById('baziYear').value);
    var m = parseInt(document.getElementById('baziMonth').value);
    var d = parseInt(document.getElementById('baziDay').value);
    var h = parseInt(document.getElementById('baziHour').value);
    var gender = document.getElementById('baziGender').value;

    if (!name) { alert('请输入姓名'); return; }
    if (y<1900||y>2100||m<1||m>12||d<1||d>31||d>daysInMonth(y,m)) { alert('日期有误'); return; }

    var result = calculateBazi(y,m,d,h,gender);
    hideEl('baziForm');
    showEl('baziResult');
    this.renderTable(result);
    this.renderChart(result);
    this.renderAnalysis(result, gender, name);
    document.getElementById('baziResult').scrollIntoView({behavior:'smooth'});
  },

  renderTable: function(result) {
    var p = result.pillars;
    var html = '<table class="pillar-table"><thead><tr><th></th><th class="pillar-col">年柱</th><th class="pillar-col">月柱</th><th class="pillar-col">日柱</th><th class="pillar-col">时柱</th></tr></thead><tbody>';

    var cols = ['year','month','day','hour'];
    // 天干
    html += '<tr class="gan-row"><td class="row-label">天干</td>';
    for (var i=0;i<4;i++) {
      var k = cols[i];
      var dm = (k==='day')?' day-master':'';
      var color = WUXING_COLORS[TG_WUXING[p[k].gan]];
      html += '<td><span class="gan-char'+dm+'" style="color:'+color+'">'+TIAN_GAN[p[k].gan]+'</span></td>';
    }
    html += '</tr>';
    // 地支
    html += '<tr class="zhi-row"><td class="row-label">地支</td>';
    for (i=0;i<4;i++) {
      var kk = cols[i];
      var c2 = WUXING_COLORS[DZ_WUXING[p[kk].zhi]];
      html += '<td><span class="zhi-char" style="color:'+c2+'">'+DI_ZHI[p[kk].zhi]+'</span></td>';
    }
    html += '</tr>';
    // 十神
    html += '<tr class="shishen-row"><td class="row-label">十神</td>';
    html += '<td>'+result.shiShen.year.gan+'</td><td>'+result.shiShen.month.gan+'</td><td class="day-master-label">日主</td><td>'+result.shiShen.hour.gan+'</td>';
    html += '</tr>';
    // 纳音
    html += '<tr class="wuxing-row"><td class="row-label">纳音</td>';
    for (i=0;i<4;i++) {
      var k3 = cols[i];
      html += '<td>'+this._naYin(p[k3].gan,p[k3].zhi)+'</td>';
    }
    html += '</tr></tbody></table>';

    var missWx = result.missingWx.length ? '缺'+result.missingWx.join('、') : '齐全';
    html += '<div class="bazi-info-row">';
    html += '<span>🐲生肖：<b>'+result.shengXiao+'</b></span>';
    html += '<span>☀️日主：<b style="color:'+WUXING_COLORS[result.riZhuWuxing]+'">'+result.riZhuWuxing+'</b></span>';
    html += '<span>💪格局：<b>'+result.riZhuStrength+'</b></span>';
    html += '<span>⚖️五行：<b>'+missWx+'</b></span>';
    html += '</div>';

    document.getElementById('baziTable').innerHTML = html;
  },

  renderChart: function(result) {
    var canvas = document.getElementById('wuxingChart');
    var ctx = canvas.getContext('2d');
    var cx=130, cy=130, mr=100;
    var order=['金','木','水','火','土'];
    var counts = order.map(function(w){return result.wuxingCount[w];});
    ctx.clearRect(0,0,260,260);

    for (var i=1;i<=4;i++) {
      var r = mr/4*i;
      ctx.strokeStyle = 'rgba(201,169,110,0.12)';
      ctx.beginPath();
      for (var j=0;j<5;j++) {
        var a = Math.PI*2/5*j-Math.PI/2;
        var x = cx+r*Math.cos(a), y = cy+r*Math.sin(a);
        if (j===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath(); ctx.stroke();
    }

    ctx.beginPath();
    for (j=0;j<5;j++) {
      var rr = Math.max(2, counts[j]/8*mr);
      var aa = Math.PI*2/5*j-Math.PI/2;
      var xx = cx+rr*Math.cos(aa), yy = cy+rr*Math.sin(aa);
      if (j===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(196,30,58,0.15)'; ctx.fill();
    ctx.strokeStyle = '#c41e3a'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = '#e8e0d0'; ctx.font = 'bold 12px "Microsoft YaHei",sans-serif'; ctx.textAlign = 'center';
    for (j=0;j<5;j++) {
      var aaa = Math.PI*2/5*j-Math.PI/2;
      ctx.fillText(order[j]+'('+counts[j]+')', cx+(mr+22)*Math.cos(aaa), cy+(mr+22)*Math.sin(aaa)+4);
    }
  },

  renderAnalysis: function(result, gender, name) {
    var dm = result.riZhuWuxing;
    var s = result.riZhuStrength;
    var wx = result.wuxingCount;
    var ms = result.missingWx;
    var yS = this._yongShen(dm,s,wx,ms);
    var p = result.pillars;
    var hexes = this._mapHex(result);

    var html = '';

    // 姓名
    html += this._card('📛 姓名解析', this._nameA(name,dm,gender));
    // 八字
    html += this._card('☯️ 八字命格精解', this._baziA(result,gender));
    // 卦象
    html += this._card('🔮 周易卦象对照', this._hexA(hexes));
    // 身强
    html += this._card('💪 身强身弱·喜用神', this._strengthA(dm,s,wx,yS,ms));
    // 道德经
    html += this._card('📜 道德经智慧', this._taoA(dm,s));
    // 事业
    html += this._card('💼 事业方向·职业规划', this._careerA(dm,yS,gender));
    // 方位
    html += this._card('🗺️ 八方方位详解', this._dirA(dm,yS));
    // 财运
    html += this._card('💰 财运解析', this._wealthA(dm,wx,yS,ms));
    // 人生
    html += this._card('🌟 人生运势', this._lifeA(result,gender,name,hexes));

    html += '<div class="analysis-card"><h4>✨ 寄语</h4><p class="disclaimer">以上分析融合八字命理、周易六十四卦和道德经智慧。命运掌握在自己手中，积极努力才是改变命运的真正力量。🌟</p></div>';

    document.getElementById('baziAnalysis').innerHTML = html;
  },

  _card: function(title, content) {
    var ps = content.split('\n\n');
    var h = '<div class="analysis-card"><h4>'+title+'</h4>';
    for (var i=0;i<ps.length;i++) {
      if (ps[i].trim()) h += '<p>'+ps[i].trim()+'</p>';
    }
    h += '</div>';
    return h;
  },

  _mapHex: function(result) {
    var p = result.pillars;
    var self = this;
    var gid = function(gan,zhi){ return (gan%8)*8+(zhi%8)+1; };
    var tid = ((p.year.gan+p.month.gan+p.day.gan+p.hour.gan)*4+(p.year.zhi+p.month.zhi+p.day.zhi+p.hour.zhi))%64+1;
    var find = function(id){ for(var fi=0;fi<self._hexagrams.length;fi++){if(self._hexagrams[fi].id===id)return self._hexagrams[fi];} return self._hexagrams[0]; };
    return {
      year: find(gid(p.year.gan,p.year.zhi)),
      month: find(gid(p.month.gan,p.month.zhi)),
      day: find(gid(p.day.gan,p.day.zhi)),
      hour: find(gid(p.hour.gan,p.hour.zhi)),
      total: find(tid)
    };
  },

  _nameA: function(name,dm,gender) {
    var wxChars = {金:'锋钧铭锐铮钰锦钢',木:'林森楠桐桦柏柳荣',水:'海洋涛涵浩鸿沐江',火:'煜炎烨焕炫炅灵',土:'坤坚培垚圣基城'};
    var nWx = dm;
    for (var wx in wxChars) {
      for (var i=0;i<name.length;i++) {
        if (wxChars[wx].indexOf(name[i]) >= 0) { nWx = wx; break; }
      }
    }
    var total = name.length;
    var a = '"'+name+'"，'+total+'字之名，';
    if (total===2) a += '简洁有力。';
    else if (total===3) a += '天地人三才结构完整。';
    else a += '笔画饱满，内涵丰富。';

    a += '\n\n日主为'+dm+'，';
    if (nWx===dm) a += '名字与命局日主同为'+dm+'属性，五行相合，名字对运势有增强作用，是非常好的配合。';
    else a += '名字暗含'+nWx+'气，与日主'+dm+'的配合为您的命运增添了独特色彩。';

    var sounds = ['铿锵有力','温润如玉','清亮悦耳','沉稳大气','灵动飘逸'];
    a += '\n\n音韵分析：此名读响'+sounds[name.length%5]+'，与命局配合'+['极佳','良好','相得益彰'][total%3]+'。';
    return a;
  },

  _baziA: function(result,gender) {
    var dm = result.riZhuWuxing;
    var s = result.riZhuStrength;
    var p = result.pillars;
    var dayGan = result.dayPillar[0];

    var desc;
    if (dm==='金') desc = '日主'+dayGan+'（金命），金主义——刚毅果断、重情重义。';
    else if (dm==='木') desc = '日主'+dayGan+'（木命），木主仁——仁厚温和、生命力旺。';
    else if (dm==='水') desc = '日主'+dayGan+'（水命），水主智——聪慧灵活、适应力强。';
    else if (dm==='火') desc = '日主'+dayGan+'（火命），火主礼——热情奔放、充满活力。';
    else desc = '日主'+dayGan+'（土命），土主信——稳重诚信、包容大度。';

    if (s==='偏强') desc += '命局偏强，精力旺盛，抗压能力强。';
    else if (s==='偏弱') desc += '命局偏弱，心思细腻，大器晚成。';
    else desc += '命局中和，能屈能伸，难得的好格局。';

    var spouses = ['聪明感性','踏实忠诚','积极强大','温柔优雅','包容智慧','热情迷人','阳光开朗','温顺顾家','独立聪明','精致魅力','忠诚坚定','浪漫感性'];
    desc += '\n\n日支'+DI_ZHI[p.day.zhi]+'为配偶宫，配偶特质「'+ (spouses[p.day.zhi]||'稳重可靠') +'」。';
    desc += '\n年柱'+result.yearPillar+'为祖业根基，月柱'+result.monthPillar+'为事业环境，时柱'+result.hourPillar+'为子女晚年。';
    desc += '\n'+(result.missingWx.length?'五行缺'+result.missingWx.join('、')+'，需后天补充。':'五行俱全！先天格局完美。');
    return desc;
  },

  _hexA: function(hexes) {
    var h = hexes.total;
    var a = '根据您的八字推演，对应周易「'+h.n+'」卦（第'+h.id+'卦）。\n\n';
    a += '🔍 解读：'+h.e+'\n\n';
    a += '四柱逐柱卦象：\n';
    a += '• 年柱→「'+hexes.year.n+'」：代表祖业根基和少年运势\n';
    a += '• 月柱→「'+hexes.month.n+'」：代表事业环境和青年运势\n';
    a += '• 日柱→「'+hexes.day.n+'」：代表自身和婚姻状况\n';
    a += '• 时柱→「'+hexes.hour.n+'」：代表子女和晚年运势\n';
    a += '\n"善易者不占"——了解卦象是为了更好地把握方向，而非被预测束缚。';
    return a;
  },

  _strengthA: function(dm,s,wx,yS,ms) {
    var a = '格局「'+s+'」。';
    if (s==='偏强') a += '日主能量充足，精力旺盛，抗压能力强。但过强则刚而易折，需适当收敛锋芒。';
    else if (s==='偏弱') a += '日主能量稍弱，心思细腻敏感。需通过后天学习积累增强自身，大器晚成。';
    else a += '日主中和！五行流通平衡，能屈能伸，刚柔并济，是难得的平衡格局。';

    a += '\n\n五行力量：金'+wx['金']+' 木'+wx['木']+' 水'+wx['水']+' 火'+wx['火']+' 土'+wx['土']+'（满分各8）。';

    if (ms.length > 0) {
      var tips = {金:'穿戴白/金色、金属饰品、金融法律行业',木:'接触自然、绿植、穿绿衣、教育文化行业',水:'多喝水游泳、养鱼、蓝黑色、咨询贸易',火:'多晒太阳运动、红紫色、演艺科技',土:'陶艺园艺、黄棕色、房地产管理'};
      a += '\n\n命局缺'+ms.join('、')+'。';
      for (var i=0;i<ms.length;i++) {
        var w = ms[i];
        a += '\n• '+w+'：'+(tips[w]||'');
      }
    }

    a += '\n\n用神为「'+yS.element+'」——'+yS.reason;

    var wxO=['金','木','水','火','土'], di=wxO.indexOf(dm);
    if (s==='偏强') {
      a += '\n喜：'+wxO[(di+3)%5]+'（克制）·'+wxO[(di+1)%5]+'（泄秀）·'+wxO[(di+2)%5]+'（消耗）';
      a += '\n忌：'+wxO[(di+4)%5]+'（生扶）·'+dm+'（同强）';
    } else {
      a += '\n喜：'+wxO[(di+4)%5]+'（生助）·'+dm+'（帮扶）';
      a += '\n忌：'+wxO[(di+3)%5]+'（克制）·'+wxO[(di+1)%5]+'（消耗）';
    }
    return a;
  },

  _taoA: function(dm,s) {
    var chapters = {
      金:[{c:8,t:'上善若水',e:'水善利万物而不争。金命之人当学水之柔韧，刚柔并济。'},{c:9,t:'功遂身退',e:'金玉满堂莫之能守。功成名就后及时退让，天之道也。'}],
      木:[{c:64,t:'千里之行始于足下',e:'合抱之木生于毫末。木命之人贵在坚持，从小处做起。'},{c:76,t:'柔弱胜刚强',e:'木之柔韧是最大力量。'}],
      水:[{c:78,t:'天下莫柔弱于水',e:'弱之胜强柔之胜刚。水命之人当以柔克刚，顺势而为。'},{c:8,t:'上善若水',e:'水命之人天然接近道。'}],
      火:[{c:52,t:'天下有始以为天下母',e:'用其光复归其明。火命之人当以光明照亮前路。'},{c:33,t:'自知者明',e:'火命之人贵在自知之明。'}],
      土:[{c:25,t:'道法自然',e:'人法地地法天。土命之人当效法大地之厚德。'},{c:63,t:'天下难事必作于易',e:'土命之人贵在稳重踏实。'}]
    };
    var chs = chapters[dm] || chapters['土'];
    var a = '根据日主'+dm+'，为您从《道德经》中择取以下智慧指引：';
    for (var i=0;i<chs.length;i++) {
      a += '\n📖 第'+chs[i].c+'章「'+chs[i].t+'」：'+chs[i].e;
    }
    var quote, advice;
    if (s==='偏强') { quote='弱者道之用'; advice='您命局偏强，当学水之柔韧，以柔济刚。'; }
    else if (s==='偏弱') { quote='天下之至柔驰骋天下之至坚'; advice='您命局偏弱，当知柔弱胜刚强，以智慧补力量之不足。'; }
    else { quote='道常无为而无不为'; advice='您命局中和，当效法道之自然，不妄为而万物自化。'; }
    a += '\n\n老子云"'+quote+'"——'+advice;
    return a;
  },

  _careerA: function(dm,yS,gender) {
    var careers = {
      金:{ind:'金融、法律、管理、工程技术、军警、审计、珠宝',d:'适合需要专业壁垒和决断力的行业。'},
      木:{ind:'教育、文化、艺术、医疗、环保、心理咨询、出版',d:'适合需要创造力和亲和力的行业。'},
      水:{ind:'科研、咨询、传媒、贸易、物流、IT、旅游',d:'适合需要智慧和变通能力的行业。'},
      火:{ind:'演艺、公关、餐饮、科技、能源、营销、体育、时尚',d:'适合需要热情和表现力的行业。'},
      土:{ind:'房地产、建筑、金融、管理、农业、教育、公共服务',d:'适合需要稳重和责任心的行业。'}
    };
    var c = careers[dm] || careers['土'];
    var a = '最佳行业：'+c.ind+'\n\n'+c.d;

    var cy = new Date().getFullYear();
    a += '\n近期（1-3年）：'+TIAN_GAN[(cy-4)%10]+DI_ZHI[(cy-4)%12]+'年，'+['运势上扬宜积极进取','稳中求进打好基础','面临挑战需以守为攻','平稳过渡做好规划'][cy%4]+'。';
    a += '\n中期（3-7年）：建议深耕专业领域成为不可替代的专家。';
    a += '\n长期（7-15年）：事业稳步上升，大器晚成越往后越有分量。';
    return a;
  },

  _dirA: function(dm,yS) {
    var dirs = {
      金:{best:'西方·西北方',good:'西南方',avoid:'南方·东方',r:'西方为金之正位。南方属火克金，宜避开。'},
      木:{best:'东方·东南方',good:'北方',avoid:'西方·西北方',r:'东方为木之正位。西方属金克木，宜避开。'},
      水:{best:'北方',good:'西方·西北方',avoid:'西南·东北',r:'北方为水之正位。西南东北属土克水，宜避开。'},
      火:{best:'南方',good:'东方·东南方',avoid:'北方',r:'南方为火之正位。北方属水克火，宜避开。'},
      土:{best:'西南·东北',good:'南方·中央',avoid:'东方·东南方',r:'西南东北为土之正位。东方属木克土，宜避开。'}
    };
    var d = dirs[yS.element] || dirs[dm] || dirs['土'];
    var a = '用神'+yS.element+'，推荐方位：\n\n🏠 首选：'+d.best+'\n👍 次选：'+d.good+'\n⚠️ 避开：'+d.avoid+'\n\n📝 '+d.r+'\n\n';
    var all = ['东（震·木）','南（离·火）','西（兑·金）','北（坎·水）','东南（巽·木）','东北（艮·土）','西南（坤·土）','西北（乾·金）'];
    for (var i=0;i<all.length;i++) {
      var dir = all[i];
      var name2 = dir.split('（')[0];
      var flag;
      if (d.best.indexOf(name2)>=0) flag = '✅ 大吉';
      else if (d.avoid.indexOf(name2)>=0) flag = '⚠️ 注意';
      else if (d.good.indexOf(name2)>=0) flag = '👍 有利';
      else flag = '➖ 适度';
      a += '• '+dir+'：'+flag+'\n';
    }
    return a;
  },

  _wealthA: function(dm,wx,yS,ms) {
    var wxO=['金','木','水','火','土'], di=wxO.indexOf(dm), cai=wxO[(di+2)%5], caiC=wx[cai];
    var a = '日主'+dm+'，以'+cai+'为财星（力量'+caiC+'/8）。';
    if (caiC>=4) a += '\n\n财星旺盛！天生具有吸引财富的能力，善于发现商机和创造收入。建议建立系统理财规划。';
    else if (caiC>=2) a += '\n\n财星适中，财运平稳。偏向稳健型积累，建议定投和养老规划。30岁后财运逐步上升，45岁前后达高峰。';
    else a += '\n\n财星偏弱，需通过专业技能和智慧生财。'+cai+'属性行业最能催旺财运。找'+yS.element+'属性的人作为合作伙伴。';

    var rhythm;
    if (dm==='金') rhythm = '35-45岁黄金积累期';
    else if (dm==='木') rhythm = '30岁前投资自己回报在下半场';
    else if (dm==='水') rhythm = '财运流动性强，多元化配置最佳';
    else if (dm==='火') rhythm = '赚钱能力强消费也大方，30%强制储蓄';
    else rhythm = '稳健增长，40岁后财务安全感大幅提升';
    a += '\n\n财富节奏：'+rhythm+'。';
    return a;
  },

  _lifeA: function(result,gender,name,hexes) {
    var dm = result.riZhuWuxing;
    var s = result.riZhuStrength;
    var p = result.pillars;
    var themes = {
      金:'人生如精金淬炼——每次挑战都是提纯。30岁后渐入佳境，35岁发光，45岁巅峰。',
      木:'人生如树木生长——前期扎根后期繁茂。不急不躁，越老越有价值。',
      水:'人生如江河奔流——时急时缓始终向前。保持学习和探索，处处有惊喜。',
      火:'人生如火焰燃烧——热烈明亮。学会温火慢炖更持久圆满。',
      土:'人生如大地承载——厚德载物。不求快但求稳，50岁后德高望重。'
    };
    var a = (themes[dm]||themes['土'])+'\n\n';

    var spa = ['聪明感性','踏实忠诚','积极强大','温柔优雅','包容智慧','热情迷人','阳光开朗','温顺顾家','独立聪明','精致魅力','忠诚坚定','浪漫感性'];
    a += '婚姻家庭：配偶宫'+DI_ZHI[p.day.zhi]+'，配偶「'+ (spa[p.day.zhi]||'稳重可靠') +'」。';
    a += (gender==='男'?'婚姻质量高，妻子是人生重要支持者。':'婚姻幸福指数高，丈夫是坚实依靠。');
    a += '晚年家庭温馨美满。\n\n';

    a += '🔮 梅花易数推演：以您的日柱'+result.dayPillar+'起卦，得「'+hexes.total.n+'」为终身卦。'+hexes.total.e+'\n\n';

    var hlth = {金:'呼吸系统·秋冬防燥·有氧运动',木:'肝胆排毒·少熬夜·亲近自然',水:'肾脏保暖·多喝水·泡脚养生',火:'心血管·情绪平稳·夏季防暑',土:'脾胃保养·饮食规律·避免思虑'};
    a += '健康：'+(hlth[dm]||hlth['土'])+'。\n\n';

    a += '"'+(name||'命主')+'"，';
    if (s==='偏强') a += '您注定成为人群中的佼佼者——凭借实力和意志而非投机。保持刚健同时学会柔韧，人生必将精彩。';
    else a += '您的价值在于持久的积累和沉淀。人生是马拉松，耐力将带您到达别人到不了的高度。';
    a += '道法自然，顺势而为。🌟';
    return a;
  },

  _yongShen: function(dm,s,wx,ms) {
    var o=['金','木','水','火','土'],di=o.indexOf(dm),sw=o[(di+4)%5],kw=o[(di+3)%5];
    if (s==='偏强') {
      if (wx[kw]<3) return {element:kw,reason:'需'+kw+'克制过旺之气，给您适度的压力和动力'};
      return {element:o[(di+1)%5],reason:'用'+o[(di+1)%5]+'泄秀生财，将过旺精力转化为创造力'};
    } else if (s==='偏弱') {
      if (wx[sw]<3) return {element:sw,reason:'需'+sw+'生助日主，印星代表贵人和学识'};
      return {element:dm,reason:'需同五行帮身，增强自信和行动力'};
    }
    if (ms.length>0) return {element:ms[0],reason:'五行缺'+ms[0]+'，补之使命局更完整'};
    return {element:dm,reason:'命局中和，保持平衡即可'};
  },

  _naYin: function(g,z) {
    var t = ['海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土','霹雳火','松柏木','流年水','砂石金','山下火','平地木','壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金','桑柘木','柘溪水','沙中土','天上火','石榴木','大海水'];
    return t[((g*6+z*5)%60)%30]||'';
  }
};

document.addEventListener('DOMContentLoaded', function(){ BaziModule.init(); });
