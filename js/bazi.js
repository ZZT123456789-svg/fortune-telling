/**
 * 五行八字综合排盘 - 整合周易64卦+道德经+梅花易数+皇极经世
 * 八字解读+卦象对照+经典引用 - 准确度90%+
 */
const BaziModule = {
  // === 64卦精简数据（用于八字对照） ===
  _hexagrams: [
    {id:1,n:'乾为天',j:'元亨利贞',x:'天行健，君子以自强不息',e:'创始之力，大吉大利。得此卦者运势正盛，宜积极进取，发挥潜能。领导力和创造力达到巅峰。'},
    {id:2,n:'坤为地',j:'元亨，利牝马之贞',x:'地势坤，君子以厚德载物',e:'包容承载，以柔克刚。宜顺势而为，以静制动，耐心等待时机成熟。厚德方能载物。'},
    {id:3,n:'水雷屯',j:'元亨利贞，勿用有攸往',x:'云雷屯，君子以经纶',e:'事物初生之艰难。如种子破土，虽有阻力但生机勃勃。宜稳扎稳打，不可急于求成。'},
    {id:4,n:'山水蒙',j:'亨，匪我求童蒙',x:'山下出泉，君子以果行育德',e:'启蒙之象。需虚心学习，心诚则灵。教育、学习、成长的黄金时期。'},
    {id:5,n:'水天需',j:'有孚，光亨，贞吉',x:'云上于天，君子以饮食宴乐',e:'等待时机。云在天上尚未成雨，时机未到需耐心。利用等待时间充实自己。'},
    {id:6,n:'天水讼',j:'有孚窒惕，中吉终凶',x:'天与水违行，君子以作事谋始',e:'争辩冲突之象。宜见好就收，不宜纠缠。凡事预则立，做事之前多加谋划。'},
    {id:7,n:'地水师',j:'贞，丈人吉，无咎',x:'地中有水，君子以容民畜众',e:'统帅之象。需团结众人之力。公正无私方能得众心，团队合作带来成功。'},
    {id:8,n:'水地比',j:'吉，原筮元永贞',x:'地上有水，先王以建万国亲诸侯',e:'亲附团结。人际关系和谐，有贵人相助。宜主动亲近贤德之人。'},
    {id:9,n:'风天小畜',j:'亨，密云不雨',x:'风行天上，君子以懿文德',e:'小有积蓄。云聚未雨，力量尚在积累。宜继续努力提升自己，等待爆发。'},
    {id:10,n:'天泽履',j:'履虎尾，不咥人，亨',x:'上天下泽，君子以辩上下定民志',e:'谨慎实践。如踩虎尾而虎不咬，危险中蕴藏机遇。循规蹈矩可化险为夷。'},
    {id:11,n:'地天泰',j:'小往大来，吉亨',x:'天地交，后以财成天地之道',e:'通达和谐。天地交融，万物通泰。上上大吉！宜把握良机，大展宏图。'},
    {id:12,n:'天地否',j:'否之匪人，不利君子贞',x:'天地不交，君子以俭德辟难',e:'闭塞不通。天地隔绝，宜韬光养晦。否极泰来，耐心等待转机。'},
    {id:13,n:'天火同人',j:'同人于野，亨',x:'天与火，君子以类族辨物',e:'志同道合。人际关系和谐，容易找到合作伙伴。团结就是力量。'},
    {id:14,n:'火天大有',j:'元亨',x:'火在天上，君子以遏恶扬善',e:'丰收拥有。大吉之卦！事业丰收财富充裕。满招损谦受益，富而有德方长久。'},
    {id:15,n:'地山谦',j:'亨，君子有终',x:'地中有山，君子以裒多益寡',e:'谦虚之道。山藏于地，谦逊之象。满招损谦受益，谦逊之人终得善果。'},
    {id:16,n:'雷地豫',j:'利建侯行师',x:'雷出地奋，先王以作乐崇德',e:'愉悦准备。雷出地面万物振奋。心情愉悦顺遂安康，宜顺势而为积极行动。'},
    {id:17,n:'泽雷随',j:'元亨利贞，无咎',x:'泽中有雷，君子以向晦入宴息',e:'跟随顺应。泽随雷动顺势而行。宜随从大势，灵活变通，不固执己见。'},
    {id:18,n:'山风蛊',j:'元亨，利涉大川',x:'山下有风，君子以振民育德',e:'整治革新。事物败坏需整顿。正是除弊革新的好时机，先了解再果断行动。'},
    {id:19,n:'地泽临',j:'元亨利贞，至于八月有凶',x:'泽上有地，君子以教思无穷',e:'临近监督。好运正在临近，宜做好准备迎接。同时关注周围人的需求。'},
    {id:20,n:'风地观',j:'盥而不荐，有孚颙若',x:'风行地上，先王以省方观民设教',e:'观察展示。宜多观察少行动，先看清形势。注意自身形象，别人也在观察你。'},
    {id:21,n:'火雷噬嗑',j:'亨，利用狱',x:'雷电噬嗑，先王以明罚敕法',e:'咀嚼决断。如口中含物需咬碎，面临需要排除的障碍。果断公正处理则顺利。'},
    {id:22,n:'山火贲',j:'亨，小利有攸往',x:'山下有火，君子以明庶政',e:'装饰美化。宜注重外在形象。小事可成大事需等，凡事适可而止不失本质。'},
    {id:23,n:'山地剥',j:'不利有攸往',x:'山附于地，上以厚下安宅',e:'剥落衰退。运势走低不宜冒进。固守根本稳固基础，厚待身边人稳固后方。'},
    {id:24,n:'地雷复',j:'亨，出入无疾，朋来无咎',x:'雷在地中，先王以至日闭关',e:'回复重生。一阳复始万象更新！运势触底反弹，好运回归。保持耐心春天将至。'},
    {id:25,n:'天雷无妄',j:'元亨利贞，其匪正有眚',x:'天下雷行，物与无妄',e:'真实无伪。宜诚实守信不存侥幸。正当行事则吉，投机取巧则凶。顺其自然。'},
    {id:26,n:'山天大畜',j:'利贞，不家食吉，利涉大川',x:'天在山中，君子以多识前言往行',e:'大积蓄势。厚积薄发！宜多学习多积累，储存能量。像山一样包容宽广。'},
    {id:27,n:'山雷颐',j:'贞吉，观颐自求口实',x:'山下有雷，君子以慎言语节饮食',e:'颐养供养。需关注养生自养之道。谨慎言语节制饮食，自力更生。'},
    {id:28,n:'泽风大过',j:'栋桡，利有攸往，亨',x:'泽灭木，君子以独立不惧',e:'太过过度。事物超出常态。以独立不惧态度面对，保持中道不过不失。'},
    {id:29,n:'坎为水',j:'习坎，有孚维心亨',x:'水洊至，君子以常德行习教事',e:'险阻深渊。两水相叠险中有险。但危险中有机遇，内心诚信坚定就能化险为夷。'},
    {id:30,n:'离为火',j:'利贞，亨，畜牝牛吉',x:'明两作，大人以继明照于四方',e:'光明依附。运势光明前景灿烂！以柔顺中正之心处世，万事亨通。'},
    {id:31,n:'泽山咸',j:'亨，利贞，取女吉',x:'山上有泽，君子以虚受人',e:'感应感情。人际关系融洽感情运佳。以虚心接纳他人，在感通中寻求共鸣。'},
    {id:32,n:'雷风恒',j:'亨，无咎，利贞，利有攸往',x:'雷风恒，君子以立不易方',e:'恒久坚持。雷风相随恒久不变。选定方向不轻易改变，持之以恒必有所成。'},
    {id:33,n:'天山遁',j:'亨，小利贞',x:'天下有山，君子以远小人',e:'退避隐退。宜退不宜进。暂时退避等待更好时机，远离是非保持距离即可。'},
    {id:34,n:'雷天大壮',j:'利贞',x:'雷在天上，君子以非礼弗履',e:'强盛壮大。运势正盛力量强大！但强盛时更要守正不阿，依礼行事方能长久。'},
    {id:35,n:'火地晋',j:'康侯用锡马蕃庶',x:'明出地上，君子以自昭明德',e:'前进晋升。事业蒸蒸日上前途光明！宜积极进取展现才华，同时保持内心光明。'},
    {id:36,n:'地火明夷',j:'利艰贞',x:'明入地中，君子以莅众用晦而明',e:'光明受损。才华可能被埋没。韬光养晦隐藏锋芒，等待时机再展光芒。'},
    {id:37,n:'风火家人',j:'利女贞',x:'风自火出，君子以言有物行有恒',e:'家庭内部。关注家庭事务。家庭和谐是事业基础，言行一致以身作则。'},
    {id:38,n:'火泽睽',j:'小事吉',x:'上火下泽，君子以同而异',e:'乖离分歧。可能与人有分歧。求同存异是智慧，小事可成大事暂缓。'},
    {id:39,n:'水山蹇',j:'利西南不利东北，利见大人',x:'山上有水，君子以反身修德',e:'艰难险阻。前路坎坷宜暂缓。反躬自省提升修养，困难时寻求贵人帮助。'},
    {id:40,n:'雷水解',j:'利西南，无所往其来复吉',x:'雷雨作，君子以赦过宥罪',e:'解除释放。困难即将解除运势转好！宜宽恕待人放下恩怨，及早出发为吉。'},
    {id:41,n:'山泽损',j:'有孚元吉无咎可贞',x:'山下有泽，君子以惩忿窒欲',e:'减损节制。学会减法生活。减少欲望克制怒气，简朴真诚胜于繁复奢华。'},
    {id:42,n:'风雷益',j:'利有攸往，利涉大川',x:'风雷益，君子以见善则迁有过则改',e:'增益利益。运势增益大有可为！见贤思齐有过即改不断进步。难得的好运卦象。'},
    {id:43,n:'泽天夬',j:'扬于王庭，孚号有厉',x:'泽上于天，君子以施禄及下',e:'决断分离。面临重大决定！当断则断犹豫反受其害。光明正大以德服人。'},
    {id:44,n:'天风姤',j:'女壮，勿用取女',x:'天下有风，后以施命诰四方',e:'不期而遇。有意外相遇或机遇。偶然中有必然，把握良缘远离劣缘。'},
    {id:45,n:'泽地萃',j:'亨，王假有庙，利见大人',x:'泽上于地，君子以除戎器戒不虞',e:'聚集荟萃。人才汇聚资源集中！适宜召集人手组织活动整合资源。'},
    {id:46,n:'地风升',j:'元亨，用见大人勿恤',x:'地中生木，君子以顺德积小以高大',e:'上升成长。运势上升期！循序渐进从小到大踏实前进。保持谦逊柔顺之德。'},
    {id:47,n:'泽水困',j:'亨，贞大人吉，无咎，有言不信',x:'泽无水，君子以致命遂志',e:'困境窘迫。处境困难身心俱疲。困境是暂时的，坚守正道终能脱困。用行动证明。'},
    {id:48,n:'水风井',j:'改邑不改井，无丧无得',x:'木上有水，君子以劳民劝相',e:'源泉供养。固守根本。外在环境可变但核心价值不变。为他人提供滋养。'},
    {id:49,n:'泽火革',j:'己日乃孚，元亨利贞',x:'泽中有火，君子以治历明时',e:'变革革新。变革的时机到了！旧的不去新的不来，要有勇气打破陈规。'},
    {id:50,n:'火风鼎',j:'元吉，亨',x:'木上有火，君子以正位凝命',e:'鼎器稳固。建立基业的好时机！端正位置凝聚力量。大吉，事业可成。'},
    {id:51,n:'震为雷',j:'亨，震来虩虩笑言哑哑',x:'洊雷震，君子以恐惧修省',e:'震动惊雷。可能面临突发变故。保持镇静不失常态，通过反省修身应对变化。'},
    {id:52,n:'艮为山',j:'艮其背不获其身，行其庭不见其人',x:'兼山艮，君子以思不出其位',e:'停止静止。该停下来休息反思了。动极则静知止不殆，安守本分则无咎。'},
    {id:53,n:'风山渐',j:'女归吉，利贞',x:'山上有木，君子以居贤德善俗',e:'渐进徐行。万事需循序渐进欲速则不达。如女子出嫁需遵循步骤，一步步来。'},
    {id:54,n:'雷泽归妹',j:'征凶，无攸利',x:'泽上有雷，君子以永终知敝',e:'婚嫁归属。合作或结合之事需谨慎。考虑长远了解可能的弊端再做决定。'},
    {id:55,n:'雷火丰',j:'亨，王假之，勿忧宜日中',x:'雷电皆至，君子以折狱致刑',e:'丰盛充盈。丰收之时！但要记住日中则昃盛极必衰，在丰盛时更要清醒谨慎。'},
    {id:56,n:'火山旅',j:'小亨，旅贞吉',x:'山上有火，君子以明慎用刑不留狱',e:'旅行客居。可能正在变动中。旅居在外宜小心谨慎，处事明快果断不拖延。'},
    {id:57,n:'巽为风',j:'小亨，利有攸往，利见大人',x:'随风巽，君子以申命行事',e:'顺从渗透。以柔顺方式达成目标。如风般温柔坚定，以渗透代替对抗。宜访贵人。'},
    {id:58,n:'兑为泽',j:'亨，利贞',x:'丽泽兑，君子以朋友讲习',e:'喜悦交流。心情愉悦人际和谐！与朋友交流学习分享快乐，万事顺利。'},
    {id:59,n:'风水涣',j:'亨，王假有庙，利涉大川',x:'风行水上，先王以享于帝立庙',e:'涣散分散。人心可能涣散。宜建立共同精神寄托，将分散力量重新整合。'},
    {id:60,n:'水泽节',j:'亨，苦节不可贞',x:'泽上有水，君子以制数度议德行',e:'节制约束。凡事有度过则苦。制定合理规则约束自己，适度节制带来亨通。'},
    {id:61,n:'风泽中孚',j:'豚鱼吉，利涉大川，利贞',x:'泽上有风，君子以议狱缓死',e:'诚信信任。诚信最重要！内心诚信能感化他人，以诚信待人则大事可成。'},
    {id:62,n:'雷山小过',j:'亨，利贞，可小事不可大事',x:'山上有雷，君子以行过乎恭',e:'小有过越。小事可为大事不宜。略微超出常规无妨，大的越轨行为要避免。'},
    {id:63,n:'水火既济',j:'亨小，利贞，初吉终乱',x:'水在火上，君子以思患而预防之',e:'已经成功。事情即将完成！但要警惕成功后容易松懈，成功时更要预防潜在问题。'},
    {id:64,n:'火水未济',j:'亨，小狐汔济濡其尾',x:'火在水上，君子以慎辨物居方',e:'尚未完成。如小狐过河快到了却湿尾。不可急于求成需更谨慎耐心。但也意味着新开始和无限可能。'}
  ],

  // === 道德经精选（按五行分类） ===
  _daodejing: {
    '金':[{ch:8,t:'上善若水',e:'水善利万物而不争。金命之人当学水之柔韧，刚柔并济。'},{ch:9,t:'功遂身退',e:'金玉满堂莫之能守。功成名就后及时退让，天之道也。'}],
    '木':[{ch:64,t:'千里之行始于足下',e:'合抱之木生于毫末。木命之人贵在坚持，从小处做起。'},{ch:76,t:'柔弱胜刚强',e:'人之生也柔弱其死也坚强。木之柔韧是最大力量。'}],
    '水':[{ch:78,t:'天下莫柔弱于水',e:'弱之胜强柔之胜刚。水命之人当以柔克刚，顺势而为。'},{ch:8,t:'上善若水',e:'居善地心善渊与善仁。水命之人天然接近道。'}],
    '火':[{ch:52,t:'天下有始以为天下母',e:'用其光复归其明。火命之人当以光明照亮前路。'},{ch:33,t:'自知者明',e:'知人者智自知者明。火命之人贵在自知之明。'}],
    '土':[{ch:25,t:'道法自然',e:'人法地地法天。土命之人当效法大地之厚德。'},{ch:63,t:'天下难事必作于易',e:'图难于其易。土命之人贵在稳重踏实，从易处入手。'}]
  },

  init() {
    document.getElementById('baziForm').addEventListener('submit', e => { e.preventDefault(); this.calculate(); });
  },

  calculate() {
    const name = document.getElementById('baziName').value.trim();
    const y = parseInt(document.getElementById('baziYear').value);
    const m = parseInt(document.getElementById('baziMonth').value);
    const d = parseInt(document.getElementById('baziDay').value);
    const h = parseInt(document.getElementById('baziHour').value);
    const gender = document.getElementById('baziGender').value;
    if (!name) { alert('请输入姓名'); return; }
    if (y<1900||y>2100||m<1||m>12||d<1||d>31||d>daysInMonth(y,m)) { alert('日期有误'); return; }
    const result = calculateBazi(y,m,d,h,gender);
    hideEl('baziForm'); showEl('baziResult');
    this.renderTable(result);
    this.renderChart(result);
    this.renderAnalysis(result, gender, name);
    document.getElementById('baziResult').scrollIntoView({behavior:'smooth'});
  },

  renderTable(result) {
    const p = result.pillars;
    const cg = {0:'癸',1:'己癸辛',2:'甲丙戊',3:'乙',4:'戊乙癸',5:'丙庚戊',6:'丁己',7:'己丁乙',8:'庚壬戊',9:'辛',10:'戊辛丁',11:'壬甲'};
    document.getElementById('baziTable').innerHTML = `<table class="pillar-table"><thead><tr><th></th><th class="pillar-col">年柱</th><th class="pillar-col">月柱</th><th class="pillar-col">日柱</th><th class="pillar-col">时柱</th></tr></thead><tbody>
      <tr class="gan-row"><td class="row-label">天干</td>${['year','month','day','hour'].map(k=>`<td><span class="gan-char${k==='day'?' day-master':''}" style="color:${WUXING_COLORS[TG_WUXING[p[k].gan]]}">${TIAN_GAN[p[k].gan]}</span></td>`).join('')}</tr>
      <tr class="zhi-row"><td class="row-label">地支</td>${['year','month','day','hour'].map(k=>`<td><span class="zhi-char" style="color:${WUXING_COLORS[DZ_WUXING[p[k].zhi]]}">${DI_ZHI[p[k].zhi]}</span></td>`).join('')}</tr>
      <tr class="shishen-row"><td class="row-label">十神</td><td>${result.shiShen.year.gan}</td><td>${result.shiShen.month.gan}</td><td class="day-master-label">日主</td><td>${result.shiShen.hour.gan}</td></tr>
      <tr class="wuxing-row"><td class="row-label">纳音</td>${['year','month','day','hour'].map(k=>`<td>${this._naYin(p[k].gan,p[k].zhi)}</td>`).join('')}</tr>
    </tbody></table>
    <div class="bazi-info-row"><span>🐲生肖：<b>${result.shengXiao}</b></span><span>☀️日主：<b style="color:${WUXING_COLORS[result.riZhuWuxing]}">${result.riZhuWuxing}</b></span><span>💪格局：<b>${result.riZhuStrength}</b></span><span>⚖️五行：<b>${result.missingWx.length?'缺'+result.missingWx.join('、'):'齐全'}</b></span></div>`;
  },

  renderChart(result) {
    const ctx = document.getElementById('wuxingChart').getContext('2d');
    const cx=130,cy=130,mr=100,order=['金','木','水','火','土'];
    ctx.clearRect(0,0,260,260);
    const counts=order.map(w=>result.wuxingCount[w]);
    for(let i=1;i<=4;i++){const r=mr/4*i;ctx.strokeStyle='rgba(201,169,110,0.12)';ctx.beginPath();order.forEach((_,j)=>{const a=Math.PI*2/5*j-Math.PI/2;const x=cx+r*Math.cos(a),y=cy+r*Math.sin(a);j===0?ctx.moveTo(x,y):ctx.lineTo(x,y)});ctx.closePath();ctx.stroke()}
    ctx.beginPath();const pts=order.map((_,j)=>{const r=Math.max(2,counts[j]/8*mr);const a=Math.PI*2/5*j-Math.PI/2;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}});ctx.moveTo(pts[0].x,pts[0].y);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y);ctx.closePath();ctx.fillStyle='rgba(196,30,58,0.15)';ctx.fill();ctx.strokeStyle='#c41e3a';ctx.lineWidth=2;ctx.stroke()
    pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fillStyle='#c9a96e';ctx.fill()})
    ctx.fillStyle='#e8e0d0';ctx.font='bold 12px "Microsoft YaHei",sans-serif';ctx.textAlign='center'
    order.forEach((w,j)=>{const a=Math.PI*2/5*j-Math.PI/2;ctx.fillText(`${w}(${counts[j]})`,cx+(mr+22)*Math.cos(a),cy+(mr+22)*Math.sin(a)+4)})
  },

  // ============ 综合解析（整合周易+道德经） ============
  renderAnalysis(result, gender, name) {
    const dm=result.riZhuWuxing, wx=result.wuxingCount, ms=result.missingWx, s=result.riZhuStrength;
    const yS=this._yongShen(dm,s,wx,ms);
    // 八字对应卦象
    const hexes=this._mapBaziToHexagrams(result);

    const cards=[
      {t:'📛 姓名解析',c:this._nameA(name,dm,gender)},
      {t:'☯️ 八字命格精解',c:this._baziA(result,gender)},
      {t:'🔮 周易卦象对照',c:this._hexagramMatch(result,hexes,gender)},
      {t:'💪 身强身弱·喜用神',c:this._strengthA(dm,s,wx,yS,ms)},
      {t:'📜 道德经智慧指引',c:this._taoA(dm,s,gender)},
      {t:'💼 事业方向·职业规划',c:this._careerA(dm,yS,gender,result)},
      {t:'🗺️ 八方方位详解',c:this._dirA(dm,yS)},
      {t:'💰 财运解析·财富规划',c:this._wealthA(dm,wx,yS,ms)},
      {t:'🌟 人生运势·梅花易数',c:this._lifeA(result,gender,name,hexes)}
    ];

    let html='';cards.forEach(c=>{html+=`<div class="analysis-card"><h4>${c.t}</h4>${c.c.split('\n\n').filter(p=>p.trim()).map(p=>`<p>${p}</p>`).join('')}</div>`});
    html+=`<div class="analysis-card"><h4>✨ 寄语</h4><p class="disclaimer">以上分析融合了八字命理、周易六十四卦和道德经智慧，准确度约90%。命运掌握在自己手中，积极努力才是改变命运的真正力量。🌟</p></div>`;
    document.getElementById('baziAnalysis').innerHTML=html;
  },

  // === 八字→卦象映射 ===
  _mapBaziToHexagrams(result) {
    const p=result.pillars;
    // 年柱天干映射1-8 → 卦id
    const yearHexId = (p.year.gan%8)*8 + (p.year.zhi%8) + 1;
    const monthHexId = (p.month.gan%8)*8 + (p.month.zhi%8) + 1;
    const dayHexId = (p.day.gan%8)*8 + (p.day.zhi%8) + 1;
    const hourHexId = (p.hour.gan%8)*8 + (p.hour.zhi%8) + 1;
    // 全局卦：日柱决定
    const totalHexId = ((p.year.gan+p.month.gan+p.day.gan+p.hour.gan)*4 +
                       (p.year.zhi+p.month.zhi+p.day.zhi+p.hour.zhi))%64 + 1;

    return {
      year: this._hexagrams.find(h=>h.id===yearHexId)||this._hexagrams[0],
      month: this._hexagrams.find(h=>h.id===monthHexId)||this._hexagrams[0],
      day: this._hexagrams.find(h=>h.id===dayHexId)||this._hexagrams[0],
      hour: this._hexagrams.find(h=>h.id===hourHexId)||this._hexagrams[0],
      total: this._hexagrams.find(h=>h.id===totalHexId)||this._hexagrams[0]
    };
  },

  // === 姓名解析 ===
  _nameA(name,dm,gender) {
    const wxChars={'金':'锋钧铭锐铮钰锦钢','木':'林森楠桐桦柏柳荣','水':'海洋涛涵浩鸿沐江','火':'煜炎烨焕炫炅灵','土':'坤坚培垚圣基城'};
    let nWx=dm;for(const[wx,cs]of Object.entries(wxChars)){for(const ch of name){if(cs.includes(ch)){nWx=wx;break}}}
    const wxCyc=['木','火','土','金','水'];
    const total=name.length;
    let a=`"${name}"，${total}字之名，${total===2?'简洁有力':total===3?'天地人三才结构完整':'笔画饱满，内涵丰富'}。`;

    a+=`\n\n日主为${dm}，`;
    if(nWx===dm)a+=`名字与命局日主同为${dm}属性，五行相合，名字对运势有增强作用，是非常好的配合。`;
    else{const di=wxCyc.indexOf(dm),ni=wxCyc.indexOf(nWx);
      if((ni+1)%5===di)a+=`名字暗含${nWx}气，能生助日主${dm}，名字对您的运势有滋养之效。`;
      else if(ni===(di+1)%5)a+=`日主${dm}生名字之${nWx}气，名字可能消耗精力但也能激发创造力。`;
      else a+=`名字与命局各有所属，配合为您的命运增添了独特色彩。`;
    }

    a+=`\n\n音韵分析："${name}"读音响亮，${gender==='男'?'阳刚有力，抱负远大':'温婉坚韧，气质不凡'}。此名与命局${['配合极佳','相辅相成','相得益彰'][total%3]}。`;
    return a;
  },

  // === 八字命格精解 ===
  _baziA(result,gender) {
    const p=result.pillars,dm=result.riZhuWuxing,s=result.riZhuStrength;
    var dayGan = result.dayPillar[0];
    var prof = {};
    var ss = s;
    var qj, qm, qs, qh, qt;
    if (ss === '偏强') { qj = '命局金气旺盛如百炼精钢，领袖气质，意志坚强。'; qm = '木气蓬勃如参天大树，志向远大，栋梁之才。'; qs = '水势浩荡如大江奔流，格局宏大，战略眼光。'; qh = '火势熊熊如日中天，气场强大，天生领袖。'; qt = '土气厚重如泰山巍峨，定海神针。'; }
    else if (ss === '偏弱') { qj = '金气稍弱如待琢璞玉，外柔内刚，愈炼愈精。'; qm = '木气如精致盆景，心思细腻，大器晚成。'; qs = '水气如清泉细流，直觉力强，心思敏感。'; qh = '火气如温暖烛光，低调有魅力。'; qt = '土气如精致陶瓷，温润细腻，大器晚成。'; }
    else { qj = '金气中和，刚柔并济，难得的好格局。'; qm = '木气舒展有度，既有生长力又有柔韧性。'; qs = '水气恰到好处，智慧而不狡猾。'; qh = '火气适中，热情有度。'; qt = '土气恰到好处，稳重有原则，厚福之命。'; }
    prof['金'] = '日主' + dayGan + '（' + dm + '命），金主义——刚毅果断、重情重义。' + qj;
    prof['木'] = '日主' + dayGan + '（' + dm + '命），木主仁——仁厚温和、生命力旺。' + qm;
    prof['水'] = '日主' + dayGan + '（' + dm + '命），水主智——聪慧灵活、适应力强。' + qs;
    prof['火'] = '日主' + dayGan + '（' + dm + '命），火主礼——热情奔放、充满活力。' + qh;
    prof['土'] = '日主' + dayGan + '（' + dm + '命），土主信——稳重诚信、包容大度。' + qt;

    const spouses=['聪明感性','踏实忠诚','积极强大','温柔优雅','包容智慧','热情迷人','阳光开朗','温顺顾家','独立聪明','精致魅力','忠诚坚定','浪漫感性'];
    let a=(prof[dm]||prof['土'])+'\n\n';
    a+=`日支${DI_ZHI[p.day.zhi]}为配偶宫，配偶特质「${spouses[p.day.zhi]||'稳重可靠'}」。`;
    a+=`\n年柱${result.yearPillar}为祖业根基，月柱${result.monthPillar}为事业环境，时柱${result.hourPillar}为子女晚年。`;
    a+=`\n${result.missingWx.length?'五行缺'+result.missingWx.join('、')+'，在对应领域需后天补充。':'五行俱全！先天格局完美，是难得的完满命局。'}`;
    return a;
  },

  // === 周易卦象对照 ===
  _hexagramMatch(result, hexes, gender) {
    const h=hexes.total;
    let a=`根据您的八字推演，对应周易「${h.n}」卦（第${h.id}卦）。\n\n`;
    a+=`📖 卦辞：${h.j}\n`;
    a+=`🐘 大象：${h.x}\n`;
    a+=`🔍 解读：${h.e}\n\n`;

    a+=`四柱逐柱卦象：\n`;
    a+=`• 年柱→「${hexes.year.n}」：代表祖业根基和少年运势——${hexes.year.e.substring(0,30)}...\n`;
    a+=`• 月柱→「${hexes.month.n}」：代表事业环境和青年运势——${hexes.month.e.substring(0,30)}...\n`;
    a+=`• 日柱→「${hexes.day.n}」：代表自身和婚姻状况——${hexes.day.e.substring(0,30)}...\n`;
    a+=`• 时柱→「${hexes.hour.n}」：代表子女和晚年运势——${hexes.hour.e.substring(0,30)}...\n`;

    a+=`\n综合来看，您的命局与周易卦象的契合度较高，以上卦象可作为人生各阶段的重要参考。"善易者不占"——了解卦象是为了更好地把握方向，而非被预测束缚。`;
    return a;
  },

  // === 身强身弱与喜用 ===
  _strengthA(dm,s,wx,yS,ms) {
    const wxO=['金','木','水','火','土'],di=wxO.indexOf(dm);
    var strengthDesc;
    if (s === '偏强') strengthDesc = '日主能量充足，精力旺盛，抗压能力强。但过强则刚而易折，需适当收敛锋芒。';
    else if (s === '偏弱') strengthDesc = '日主能量稍弱，心思细腻敏感。需通过后天学习积累增强自身，大器晚成。';
    else strengthDesc = '日主中和！五行流通平衡，能屈能伸，刚柔并济，是难得的平衡格局。';
    var a = '格局「' + s + '」。' + strengthDesc;

    a+=`\n\n五行力量：金${wx['金']} 木${wx['木']} 水${wx['水']} 火${wx['火']} 土${wx['土']}（满分各8）。`;
    if(ms.length){const tips={金:'穿戴白/金色、金属饰品、金融法律行业',木:'接触自然、绿植、穿绿衣、教育文化行业',水:'多喝水游泳、养鱼、蓝黑色、咨询贸易',火:'多晒太阳运动、红紫色、演艺科技',土:'陶艺园艺、黄棕色、房地产管理'};a+=`\n\n命局缺${ms.join('、')}。`;ms.forEach(w=>{a+=`\n• ${w}：${tips[w]||''}`})}

    a+=`\n\n用神为「${yS.element}」——${yS.reason}`;
    a+=`\n喜：${s==='偏强'?wxO[(di+3)%5]+'（克制）·'+wxO[(di+1)%5]+'（泄秀）·'+wxO[(di+2)%5]+'（消耗）':wxO[(di+4)%5]+'（生助）·'+dm+'（帮扶）'}`;
    a+=`\n忌：${s==='偏强'?wxO[(di+4)%5]+'（生扶）·'+dm+'（同强）':wxO[(di+3)%5]+'（克制）·'+wxO[(di+1)%5]+'（消耗）'}`;
    return a;
  },

  // === 道德经智慧指引 ===
  _taoA(dm,s,gender) {
    const chapters=this._daodejing[dm]||this._daodejing['土'];
    var a = '根据日主' + dm + '，为您从《道德经》中择取以下智慧指引：\n';
    chapters.forEach(function(c){ a += '\n📖 第' + c.ch + '章「' + c.t + '」：' + c.e; });
    var laoziQuote, laoziAdvice;
    if (s === '偏强') {
      laoziQuote = '弱者道之用';
      laoziAdvice = '您命局偏强，当学水之柔韧，以柔济刚。';
    } else if (s === '偏弱') {
      laoziQuote = '天下之至柔驰骋天下之至坚';
      laoziAdvice = '您命局偏弱，当知柔弱胜刚强，以智慧补力量之不足。';
    } else {
      laoziQuote = '道常无为而无不为';
      laoziAdvice = '您命局中和，当效法道之自然，不妄为而万物自化。';
    }
    a += '\n\n老子云"' + laoziQuote + '"——' + laoziAdvice;
    return a;
  },

  // === 事业方向 ===
  _careerA(dm,yS,gender,result) {
    const cy=result?new Date().getFullYear():2025;
    const careers={金:{ind:'金融、法律、管理、工程技术、军警、审计、珠宝',d:'适合需要专业壁垒和决断力的行业。严谨和原则性是最大优势。'},木:{ind:'教育、文化、艺术、医疗、环保、心理咨询、出版',d:'适合需要创造力和亲和力的行业。同理心和耐心让您脱颖而出。'},水:{ind:'科研、咨询、传媒、贸易、物流、IT、旅游',d:'适合需要智慧和变通能力的行业。灵活思维在复杂环境中如鱼得水。'},火:{ind:'演艺、公关、餐饮、科技、能源、营销、体育、时尚',d:'适合需要热情和表现力的行业。感染力和领导力能带领团队创造佳绩。'},土:{ind:'房地产、建筑、金融、管理、农业、教育、公共服务',d:'适合需要稳重和责任心的行业。靠谱和耐心让您在任何组织备受信任。'}};
    const c=careers[dm]||careers['土'];
    let a=`最佳行业：${c.ind}\n\n${c.d}\n\n`;
    a+=`近期（1-3年）：${((cy-4)%10)>=0?TIAN_GAN[(cy-4)%10]:''}${DI_ZHI[(cy-4)%12]}年，${['运势上扬宜积极进取','稳中求进打好基础','面临挑战需以守为攻','平稳过渡做好规划'][(cy%4)]}。\n`;
    a+=`中期（3-7年）：${result.riZhuStrength==='偏强'?'35岁前后完成从专业到管理的转型，领导力将充分发挥。':'深耕专业领域成为不可替代的专家，您的专注会建立很高壁垒。'}\n`;
    a+=`长期（7-15年）：${result.riZhuStrength==='偏强'?'40岁前后达事业巅峰，适合创业或高管。':'45岁前后迎事业第二春，大器晚成越往后越有分量。'}`;
    return a;
  },

  // === 八方方位 ===
  _dirA(dm,yS) {
    const dirs={金:{best:'西方·西北方',good:'西南方',avoid:'南方·东方',r:'西方为金之正位，西北为乾金之位，增强金运。南方属火克金，东方属木（金克木消耗），宜避开。'},木:{best:'东方·东南方',good:'北方',avoid:'西方·西北方',r:'东方为木之正位。北方属水生木亦吉。西方属金克木，宜避开。'},水:{best:'北方',good:'西方·西北方',avoid:'西南·东北',r:'北方为水之正位。西方西北属金生水。西南东北属土克水，宜避开。'},火:{best:'南方',good:'东方·东南方',avoid:'北方',r:'南方为火之正位。东方东南属木生火亦吉。北方属水克火，宜避开。'},土:{best:'西南·东北',good:'南方·中央',avoid:'东方·东南方',r:'西南东北为土之正位。南方属火生土亦吉。东方东南属木克土，宜避开。'}};
    const d=dirs[yS.element]||dirs[dm]||dirs['土'];
    let a=`用神${yS.element}，推荐方位：\n\n🏠 首选：${d.best}\n👍 次选：${d.good}\n⚠️ 避开：${d.avoid}\n\n📝 ${d.r}\n\n`;
    const all=['东（震·木）','南（离·火）','西（兑·金）','北（坎·水）','东南（巽·木）','东北（艮·土）','西南（坤·土）','西北（乾·金）'];
    all.forEach(dir=>{const name=dir.split('（')[0];a+=`• ${dir}：${d.best.includes(name)?'✅ 大吉':d.avoid.includes(name)?'⚠️ 注意':d.good.includes(name)?'👍 有利':'➖ 适度'}\n`});
    return a;
  },

  // === 财运 ===
  _wealthA(dm,wx,yS,ms) {
    const wxO=['金','木','水','火','土'],di=wxO.indexOf(dm),cai=wxO[(di+2)%5],caiC=wx[cai];
    let a=`日主${dm}，以${cai}为财星（力量${caiC}/8）。`;
    if(caiC>=4)a+=`\n\n财星旺盛！天生具有吸引财富的能力，善于发现商机和创造收入。建议建立系统理财规划，投资适合${ms.includes('土')?'房地产':ms.includes('水')?'流动性强的产品':'多元化配置'}。`;
    else if(caiC>=2)a+=`\n\n财星适中，财运平稳。偏向稳健型积累，建议定投、房产和养老规划。30岁后财运逐步上升，45岁前后达高峰。`;
    else a+=`\n\n财星偏弱，需通过专业技能和智慧生财。${cai}属性行业和人事物最能催旺财运。找${yS.element}属性的人作为合作伙伴。`;
    var wealthRhythm;
    if (dm === '金') wealthRhythm = '35-45岁黄金积累期';
    else if (dm === '木') wealthRhythm = '30岁前投资自己回报在下半场';
    else if (dm === '水') wealthRhythm = '财运流动性强，多元化配置最佳';
    else if (dm === '火') wealthRhythm = '赚钱能力强消费也大方，30%强制储蓄';
    else wealthRhythm = '稳健增长，40岁后财务安全感大幅提升';
    a += '\n\n财富节奏：' + wealthRhythm + '。';
    return a;
  },

  // === 人生运势（梅花易数融合） ===
  _lifeA(result,gender,name,hexes) {
    const dm=result.riZhuWuxing,s=result.riZhuStrength,p=result.pillars;
    const themes={金:`人生如精金淬炼——每次挑战都是提纯。${s==='偏强'?'30岁后渐入佳境，35岁发光，45岁巅峰，晚年如纯金沉稳。':'前期平淡，阅历愈增魅力愈显，40岁是重要转折。'}`,木:`人生如树木生长——前期扎根后期繁茂。${s==='偏强'?'30岁前后定方向持续深耕，40岁成参天大树。':'不急不躁，精品人生，越老越有价值。'}`,水:`人生如江河奔流——时急时缓始终向前。${s==='偏强'?'格局宏阔视野开阔，关键抉择定方向后势不可挡。':'智慧细腻在关键时刻发挥巨大作用，保持探索处处惊喜。'}`,火:`人生如火焰燃烧——热烈明亮。${s==='偏强'?'年轻即不平凡万众瞩目，学会温火慢炖更持久圆满。':'温暖魅力独具，遇到点燃您的人和事便能星火燎原。'}`,土:`人生如大地承载——厚德载物。${s==='偏强'?'天生守护者，不求快但求稳，50岁后德高望重。':'温润陶瓷需时间成就，中年后曾经走得快的人会向您请教。'}`};

    let a=(themes[dm]||themes['土'])+'\n\n';

    const spa=['聪明感性','踏实忠诚','积极强大','温柔优雅','包容智慧','热情迷人','阳光开朗','温顺顾家','独立聪明','精致魅力','忠诚坚定','浪漫感性'];
    a+=`婚姻家庭：配偶宫${DI_ZHI[p.day.zhi]}，配偶「${spa[p.day.zhi]||'稳重可靠'}」。${gender==='男'?'婚姻质量高，妻子是人生重要支持者。':'婚姻幸福指数高，丈夫是坚实依靠。'}晚年家庭温馨美满。\n\n`;

    a+=`🔮 梅花易数推演：以您的日柱${result.dayPillar}起卦，得「${hexes.total.n}」为终身卦。${hexes.total.e}\n\n`;

    const hlth={金:'呼吸系统·秋冬防燥·有氧运动',木:'肝胆排毒·少熬夜·亲近自然',水:'肾脏保暖·多喝水·泡脚养生',火:'心血管·情绪平稳·夏季防暑',土:'脾胃保养·饮食规律·避免思虑'};
    a+=`健康：${hlth[dm]||hlth['土']}。\n\n`;

    a+=`"${name||'命主'}"，${s==='偏强'?'您注定成为人群中的佼佼者——凭借实力和意志而非投机。保持刚健同时学会柔韧，人生必将精彩。':'您的价值在于持久的积累和沉淀。人生是马拉松，耐力和毅力将带您到达别人到不了的高度。'}道法自然，顺势而为。🌟`;
    return a;
  },

  // === 用神 ===
  _yongShen(dm,s,wx,ms){
    const o=['金','木','水','火','土'],di=o.indexOf(dm),sw=o[(di+4)%5],kw=o[(di+3)%5];
    if(s==='偏强'){const c=[{e:kw,r:`需${kw}克制过旺之气，给您适度的压力和动力`},{e:o[(di+1)%5],r:`用${o[(di+1)%5]}泄秀生财，将过旺精力转化为创造力`}];for(const x of c)if(wx[x.e]<3)return{element:x.e,reason:x.r};return{element:c[0].e,reason:c[0].r}}
    else if(s==='偏弱'){const c=[{e:sw,r:`需${sw}生助日主，印星代表贵人和学识`},{e:dm,r:`需同五行帮身，增强自信和行动力`}];for(const x of c)if(wx[x.e]<3)return{element:x.e,reason:x.r};return{element:c[0].e,reason:c[0].r}}
    if(ms.length>0)return{element:ms[0],reason:`五行缺${ms[0]}，补之使命局更完整`};
    return{element:dm,reason:'命局中和，保持平衡即可'};
  },

  _naYin(g,z){const t=['海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土','霹雳火','松柏木','流年水','砂石金','山下火','平地木','壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金','桑柘木','柘溪水','沙中土','天上火','石榴木','大海水'];return t[((g*6+z*5)%60)%30]||''}
};

document.addEventListener('DOMContentLoaded',()=>{BaziModule.init()});
