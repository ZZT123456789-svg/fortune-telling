/**
 * 五行八字排盘模块 - 整合AI解命全部功能
 * 八字排盘 + 姓名解析 + 事业财运 + 方位推荐
 */
const BaziModule = {
  init() {
    const form = document.getElementById('baziForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.calculate();
    });
  },

  calculate() {
    const name = document.getElementById('baziName').value.trim();
    const year = parseInt(document.getElementById('baziYear').value);
    const month = parseInt(document.getElementById('baziMonth').value);
    const day = parseInt(document.getElementById('baziDay').value);
    const hour = parseInt(document.getElementById('baziHour').value);
    const gender = document.getElementById('baziGender').value;

    if (!name) { alert('请输入姓名'); return; }
    if (year < 1900 || year > 2100) { alert('年份需在 1900-2100 之间'); return; }
    if (month < 1 || month > 12) { alert('月份需在 1-12 之间'); return; }
    if (day < 1 || day > 31) { alert('日期需在 1-31 之间'); return; }
    if (day > daysInMonth(year, month)) { alert('日期超出当月天数'); return; }

    const result = calculateBazi(year, month, day, hour, gender);
    hideEl('baziForm');
    showEl('baziResult');
    this.renderTable(result);
    this.renderChart(result);
    this.renderAnalysis(result, gender, name);
    document.getElementById('baziResult').scrollIntoView({ behavior: 'smooth' });
  },

  renderTable(result) {
    const p = result.pillars;
    const table = document.getElementById('baziTable');
    const cangGan = { 0:'癸',1:'己癸辛',2:'甲丙戊',3:'乙',4:'戊乙癸',5:'丙庚戊',6:'丁己',7:'己丁乙',8:'庚壬戊',9:'辛',10:'戊辛丁',11:'壬甲' };
    table.innerHTML = `<table class="pillar-table"><thead><tr><th></th><th class="pillar-col">年柱</th><th class="pillar-col">月柱</th><th class="pillar-col">日柱</th><th class="pillar-col">时柱</th></tr></thead><tbody>
      <tr class="gan-row"><td class="row-label">天干</td><td><span class="gan-char" style="color:${WUXING_COLORS[TG_WUXING[p.year.gan]]}">${TIAN_GAN[p.year.gan]}</span></td><td><span class="gan-char" style="color:${WUXING_COLORS[TG_WUXING[p.month.gan]]}">${TIAN_GAN[p.month.gan]}</span></td><td><span class="gan-char day-master" style="color:${WUXING_COLORS[TG_WUXING[p.day.gan]]}">${TIAN_GAN[p.day.gan]}</span></td><td><span class="gan-char" style="color:${WUXING_COLORS[TG_WUXING[p.hour.gan]]}">${TIAN_GAN[p.hour.gan]}</span></td></tr>
      <tr class="zhi-row"><td class="row-label">地支</td><td><span class="zhi-char" style="color:${WUXING_COLORS[DZ_WUXING[p.year.zhi]]}">${DI_ZHI[p.year.zhi]}</span></td><td><span class="zhi-char" style="color:${WUXING_COLORS[DZ_WUXING[p.month.zhi]]}">${DI_ZHI[p.month.zhi]}</span></td><td><span class="zhi-char" style="color:${WUXING_COLORS[DZ_WUXING[p.day.zhi]]}">${DI_ZHI[p.day.zhi]}</span></td><td><span class="zhi-char" style="color:${WUXING_COLORS[DZ_WUXING[p.hour.zhi]]}">${DI_ZHI[p.hour.zhi]}</span></td></tr>
      <tr class="canggan-row"><td class="row-label">藏干</td><td>${this._fmtCg(cangGan[p.year.zhi]||'')}</td><td>${this._fmtCg(cangGan[p.month.zhi]||'')}</td><td>${this._fmtCg(cangGan[p.day.zhi]||'')}</td><td>${this._fmtCg(cangGan[p.hour.zhi]||'')}</td></tr>
      <tr class="shishen-row"><td class="row-label">十神</td><td>${result.shiShen.year.gan}</td><td>${result.shiShen.month.gan}</td><td class="day-master-label">日主</td><td>${result.shiShen.hour.gan}</td></tr>
      <tr class="wuxing-row"><td class="row-label">纳音</td><td>${this._getNaYin(p.year.gan,p.year.zhi)}</td><td>${this._getNaYin(p.month.gan,p.month.zhi)}</td><td>${this._getNaYin(p.day.gan,p.day.zhi)}</td><td>${this._getNaYin(p.hour.gan,p.hour.zhi)}</td></tr>
    </tbody></table>
    <div class="bazi-info-row"><span>🐲生肖：<b>${result.shengXiao}</b></span><span>☀️日主：<b style="color:${WUXING_COLORS[result.riZhuWuxing]}">${result.riZhuWuxing}</b></span><span>💪格局：<b>${result.riZhuStrength}</b></span><span>⚖️五行：<b>${result.missingWuxing.length?'缺'+result.missingWuxing.join('、'):'齐全'}</b></span></div>`;
  },

  renderChart(result) {
    const canvas = document.getElementById('wuxingChart');
    const ctx = canvas.getContext('2d');
    const cx = 130, cy = 130, maxR = 100;
    ctx.clearRect(0, 0, 260, 260);
    const order = ['金','木','水','火','土'];
    const counts = order.map(w => result.wuxingCount[w]);
    // grid
    for (let i = 1; i <= 4; i++) {
      const r = maxR/4*i; ctx.strokeStyle = 'rgba(201,169,110,0.12)'; ctx.beginPath();
      order.forEach((_,j)=>{const a=Math.PI*2/5*j-Math.PI/2;const x=cx+r*Math.cos(a),y=cy+r*Math.sin(a);j===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.closePath();ctx.stroke();
    }
    // data
    ctx.beginPath();const pts=order.map((_,j)=>{const r=Math.max(2,counts[j]/8*maxR);const a=Math.PI*2/5*j-Math.PI/2;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};});ctx.moveTo(pts[0].x,pts[0].y);for(let j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y);ctx.closePath();ctx.fillStyle='rgba(196,30,58,0.15)';ctx.fill();ctx.strokeStyle='#c41e3a';ctx.lineWidth=2;ctx.stroke();
    pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3.5,0,Math.PI*2);ctx.fillStyle='#c9a96e';ctx.fill();});
    ctx.fillStyle='#e8e0d0';ctx.font='bold 12px "Microsoft YaHei",sans-serif';ctx.textAlign='center';
    order.forEach((w,j)=>{const a=Math.PI*2/5*j-Math.PI/2;ctx.fillText(`${w}(${counts[j]})`,cx+(maxR+22)*Math.cos(a),cy+(maxR+22)*Math.sin(a)+4);});
  },

  // ========== 完整命理分析 ==========
  renderAnalysis(result, gender, name) {
    const dm = result.riZhuWuxing;
    const p = result.pillars;
    const wxCount = result.wuxingCount;
    const missWx = result.missingWuxing;
    const strength = result.riZhuStrength;
    const yongShen = this._calcYongShen(dm, strength, wxCount, missWx);

    const cards = [
      { title:'📛 姓名解析', content:this._nameAnalysis(name, dm, gender) },
      { title:'☀️ 八字命格解析', content:this._baziAnalysis(result, gender) },
      { title:'💪 身强身弱与喜用', content:this._strengthAnalysis(dm, strength, wxCount, yongShen, missWx) },
      { title:'💼 适合职业方向', content:this._careerDirection(dm, yongShen, gender) },
      { title:'🗺️ 八字八方方位', content:this._directionAnalysis(dm, yongShen) },
      { title:'📈 未来职业规划', content:this._careerPlan(dm, strength, yongShen, gender) },
      { title:'💰 未来财运解析', content:this._wealthFuture(dm, wxCount, yongShen, missWx) },
      { title:'🌟 未来人生运势', content:this._lifeFuture(result, gender, yongShen) }
    ];

    let html = '';
    cards.forEach(c => {
      html += `<div class="analysis-card"><h4>${c.title}</h4>${c.content.split('\n\n').filter(p=>p.trim()).map(p=>`<p>${p}</p>`).join('')}</div>`;
    });
    html += `<div class="analysis-card"><h4>✨ 温馨提示</h4><p class="disclaimer">以上分析基于传统八字五行理论，仅供研究参考。命由天定，运由己造，积极努力才是改变命运的真正力量。🌟</p></div>`;
    document.getElementById('baziAnalysis').innerHTML = html;
  },

  // ========== 姓名解析 ==========
  _nameAnalysis(name, dm, gender) {
    const total = name.length;
    const firstChar = name[0];
    const wxMap = {
      '金':'锋钧铭锐铮钰锦','木':'林森楠桐桦柏柳','水':'海洋涛涵浩鸿沐',
      '火':'煜炎烨焕炜炫灵','土':'坤坚城培垚圣基'
    };
    const allWxChars = Object.entries(wxMap);
    let nameWx = dm;
    for (const [wx, chars] of allWxChars) {
      for (const ch of name) {
        if (chars.includes(ch)) { nameWx = wx; break; }
      }
    }

    let analysis = `"${name}"，此名共${total}字，`;
    if (total === 2) analysis += '二字之名简洁有力。';
    else if (total === 3) analysis += '三字之名结构完整，天地人三才具备。';
    else analysis += `${total}字之名，${total>3?'笔画较多，但':'简洁明快。'}`;

    analysis += `\n\n从五行来看，您日主为${dm}，`;
    if (nameWx === dm) {
      analysis += `名字与命局日主同为${dm}属性，两者相合，名字对运势有增强作用，是非常好的配合。`;
    } else {
      const wxCyc = ['木','火','土','金','水'];
      const dmI = wxCyc.indexOf(dm), nwI = wxCyc.indexOf(nameWx);
      if ((nwI+1)%5 === dmI) analysis += `名字暗含${nameWx}气，能生助日主${dm}，名字对您的运势有滋养之效。`;
      else if (nwI === (dmI+1)%5) analysis += `日主${dm}生名字之${nameWx}气，名字可能在无形中消耗您的精力，但也能激发您的才华。`;
      else analysis += `名字与命局五行各有所属，${nameWx}与${dm}的配合为您的命运增添了独特的色彩。`;
    }

    analysis += `\n\n"${name}"音韵${['铿锵有力','温润如玉','清亮悦耳','沉稳大气','灵动飘逸'][name.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%5]}，${gender==='男'?'男儿气概十足，抱负远大。':'温婉中不失坚韧，气质不凡。'}整体而言，此名与命局${['配合极佳','相辅相成','相得益彰','各有所长'][total%4]}。`;

    return analysis;
  },

  // ========== 八字命格解析 ==========
  _baziAnalysis(result, gender) {
    const p = result.pillars;
    const dm = result.riZhuWuxing;
    const s = result.riZhuStrength;

    const dmProfiles = {
      '金':`日主为${result.dayPillar[0]}（${result.riZhuWuxing}命），金主义，性格刚毅果断、重情重义。${result.dayPillar}为日柱，代表自身与配偶宫。${s==='偏强'?'命局金气旺盛，如同百炼精钢，有领袖气质和不屈意志。'：s==='偏弱'?'命局金气稍弱，如待琢璞玉，外柔内刚，愈炼愈精。':'金气中和，刚柔并济，是难得的好格局。'}`,
      '木':`日主为${result.dayPillar[0]}（${result.riZhuWuxing}命），木主仁，性格仁厚温和、生命力旺盛。${result.dayPillar}为日柱，代表自身与配偶宫。${s==='偏强'?'命局木气蓬勃如参天大树，志向远大，有栋梁之才。'：s==='偏弱'?'命局木气如精致盆栽，心思细腻，善于在细节中发现机会。':'木气舒展有度，既有生长力又有柔韧性。'}`,
      '水':`日主为${result.dayPillar[0]}（${result.riZhuWuxing}命），水主智，聪慧灵活、适应力强。${result.dayPillar}为日柱，代表自身与配偶宫。${s==='偏强'?'命局水势浩荡如大江奔流，格局宏大，有战略眼光。'：s==='偏弱'?'命局水气如清泉细流，心思敏感细腻，直觉力强。':'水气恰到好处，智慧而不狡猾，灵活而不散漫。'}`,
      '火':`日主为${result.dayPillar[0]}（${result.riZhuWuxing}命），火主礼，热情奔放、充满活力。${result.dayPillar}为日柱，代表自身与配偶宫。${s==='偏强'?'命局火势熊熊如日中天，气场强大，天生领袖。'：s==='偏弱'?'命局火气如温暖烛光，低调而有魅力，需要找到能点燃你的人。':'火气适中，热情而有度，温暖而不灼人。'}`,
      '土':`日主为${result.dayPillar[0]}（${result.riZhuWuxing}命），土主信，稳重诚信、包容大度。${result.dayPillar}为日柱，代表自身与配偶宫。${s==='偏强'?'命局土气厚重如泰山巍峨，是团队中定海神针。'：s==='偏弱'?'命局土气如精致陶瓷，温润细腻，大器晚成。':'土气恰到好处，稳重而有原则，是厚福之命。'}`
    };

    let a = (dmProfiles[dm]||dmProfiles['土'])+'\n\n';

    const spouses = {0:'聪明灵动',1:'踏实稳重',2:'积极进取',3:'温柔善良',4:'包容有责任心',5:'热情有魅力',6:'热情开朗',7:'温和顾家',8:'聪明独立',9:'精致讲究',10:'忠诚可靠',11:'感性浪漫'};
    a += `日支${DI_ZHI[p.day.zhi]}为配偶宫，配偶特质：${spouses[p.day.zhi]||'性格稳定'}。`;

    a += `\n\n年柱${result.yearPillar}代表祖业根基，月柱${result.monthPillar}代表父母与事业环境，时柱${result.hourPillar}代表子女与晚年。四柱${result.missingWx.length?'五行缺'+result.missingWx.join('、')+'，在对应领域需后天补充。':'五行俱全，先天格局平衡，是难得的完满命局。'}`;

    return a;
  },

  // ========== 身强身弱与喜用 ==========
  _strengthAnalysis(dm, strength, wxCount, yongShen, missWx) {
    const wxNatures = {
      '金':'金主义，代表决断力、原则性和执行力',
      '木':'木主仁，代表创造力、生命力和亲和力',
      '水':'水主智，代表智慧、灵活性和沟通力',
      '火':'火主礼，代表热情、表现力和领导力',
      '土':'土主信，代表稳重、诚信和包容力'
    };

    let a = `八字格局为「${strength}」，${strength==='偏强'?'日主能量充足，精力旺盛，抗压能力强，做事积极主动。但过强则刚而易折，需要在生活中适当收敛锋芒，学会以柔克刚。'：strength==='偏弱'?'日主能量稍显不足，心思细腻敏感，善于思考和观察。需要通过后天的学习和积累来增强自身能量，大器晚成型。'：'日主中和，五行流通平衡，是难得的平衡格局。能屈能伸，刚柔并济，人生起伏平缓。'}`;

    a += `\n\n五行力量：金${wxCount['金']} 木${wxCount['木']} 水${wxCount['水']} 火${wxCount['火']} 土${wxCount['土']}（满分各8）。`;

    if (missWx.length > 0) {
      const missTips = {
        '金':'可通过穿戴白色/金色、佩戴金属饰品、从事金融法律相关行业来补金',
        '木':'可多接触大自然、种植绿植、穿戴绿色、从事教育文化行业来补木',
        '水':'可多喝水、游泳、养鱼、穿戴蓝黑色、从事咨询贸易行业来补水',
        '火':'可多晒太阳、运动、穿戴红紫色、从事演艺科技行业来补火',
        '土':'可接触大地自然、穿戴黄棕色、从事房地产管理行业来补土'
      };
      a += `\n\n命局缺${missWx.join('、')}。`;
      missWx.forEach(w => { a += `\n• ${w}：${missTips[w]||''}`; });
    }

    a += `\n\n「用神」为${yongShen.element}——${yongShen.reason}`;

    // 喜忌
    const wxOrder = ['金','木','水','火','土'];
    const dmI = wxOrder.indexOf(dm);
    const shengWo = wxOrder[(dmI+4)%5];
    const keWo = wxOrder[(dmI+3)%5];
    a += `\n\n喜：${strength==='偏强'?keWo+'（克制平衡）'+'、'+wxOrder[(dmI+1)%5]+'（泄秀生财）'+'、'+wxOrder[(dmI+2)%5]+'（消耗能量）':shengWo+'（生助日主）'+'、'+dm+'（同类帮扶）'}。`;
    a += `\n忌：${strength==='偏强'?shengWo+'（生扶过旺）'+'、'+dm+'（同类过强）':keWo+'（克制日主）'+'、'+wxOrder[(dmI+1)%5]+'（过度消耗）'}。`;

    return a;
  },

  // ========== 适合职业方向 ==========
  _careerDirection(dm, yongShen, gender) {
    const careers = {
      '金':{industries:'金融、法律、管理、工程技术、军警、审计、珠宝鉴定、精密制造',desc:'金命之人适合需要专业壁垒和决断力的行业。你做事的严谨和原则性在这些领域能得到最大发挥。'},
      '木':{industries:'教育、文化、艺术、医疗、环保、心理咨询、出版、园林设计',desc:'木命之人适合需要创造力和亲和力的行业。你的同理心和耐心让你在与人打交道的领域特别出色。'},
      '水':{industries:'科研、咨询、传媒、贸易、物流、IT、旅游、智慧水务',desc:'水命之人适合需要智慧和变通能力的行业。你的灵活思维和沟通能力在复杂多变的环境中如鱼得水。'},
      '火':{industries:'演艺、公关、餐饮、科技、能源、营销、体育、时尚美妆',desc:'火命之人适合需要热情和表现力的行业。你的感染力和领导力能带领团队创造出色业绩。'},
      '土':{industries:'房地产、建筑、金融、管理、农业、教育、公共服务、人力资源',desc:'土命之人适合需要稳重和责任心的行业。你的靠谱和耐心让你在任何组织中都备受信任。'}
    };
    const c = careers[dm] || careers['土'];
    return `最佳行业：${c.industries}\n\n${c.desc}\n\n用神为${yongShen.element}，选择与${yongShen.element}五行相关的领域发展更有利。${gender==='女'?'女性命主在现代职场中有着独特的优势——你既有专业能力，又有细腻的洞察力和人际处理能力。':'男性命主在事业上应当发挥自身优势，选择适合的方向深耕，中年之后事业将进入黄金期。'}`;
  },

  // ========== 八方方位分析 ==========
  _directionAnalysis(dm, yongShen) {
    const dirMap = {
      '金':{best:'西方、西北方',good:'西南方',avoid:'南方、东方',reason:'西方为金之正位，西北为乾金之位，都是增强金运的方位。南方属火克金，东方属木（金克木消耗），宜避开。'},
      '木':{best:'东方、东南方',good:'北方',avoid:'西方、西北方',reason:'东方为木之正位，东南为巽木之位。北方属水生木，也是吉利方位。西方属金克木，西北乾金亦不利，宜避开。'},
      '水':{best:'北方',good:'西方、西北方',avoid:'西南方、东北方',reason:'北方为水之正位。西方和西北属金生水，也是有利方位。西南和东北属土克水，宜避开。'},
      '火':{best:'南方',good:'东方、东南方',avoid:'北方',reason:'南方为火之正位。东方和东南属木生火，也是有利方位。北方属水克火，宜避开。'},
      '土':{best:'西南方、东北方',good:'南方、中央',avoid:'东方、东南方',reason:'西南和东北为土之正位。南方属火生土，也是有利方位。东方和东南属木克土，宜避开。'}
    };
    const d = dirMap[yongShen.element] || dirMap[dm] || dirMap['土'];

    return `根据命局用神为${yongShen.element}，推荐以下方位：

🏠 居住/办公首选：${d.best}
👍 次选方位：${d.good}
⚠️ 尽量避开：${d.avoid}

📝 解析：${d.reason}

此外，八个方位的具体建议：
• 东（震位·木）：${d.best.includes('东')?'✅ 大吉':'宜平衡使用'}
• 南（离位·火）：${d.best.includes('南')?'✅ 大吉':d.avoid.includes('南')?'⚠️ 需注意':'宜适度'}
• 西（兑位·金）：${d.best.includes('西')?'✅ 大吉':d.avoid.includes('西')?'⚠️ 需注意':'宜适度'}
• 北（坎位·水）：${d.best.includes('北')?'✅ 大吉':d.avoid.includes('北')?'⚠️ 需注意':'宜适度'}
• 东南（巽位·木）：${d.best.includes('东南')?'✅ 大吉':d.avoid.includes('东南')?'⚠️ 需注意':'宜适度'}
• 东北（艮位·土）：${d.best.includes('东北')?'✅ 大吉':d.avoid.includes('东北')?'⚠️ 需注意':'宜适度'}
• 西南（坤位·土）：${d.best.includes('西南')?'✅ 大吉':d.avoid.includes('西南')?'⚠️ 需注意':'宜适度'}
• 西北（乾位·金）：${d.best.includes('西北')?'✅ 大吉':d.avoid.includes('西北')?'⚠️ 需注意':'宜适度'}`;
  },

  // ========== 未来职业规划 ==========
  _careerPlan(dm, strength, yongShen, gender) {
    const currentYear = new Date().getFullYear();
    const yearGan = (currentYear-4)%10;
    const yearWx = TG_WUXING[yearGan];
    const wxOrder = ['金','木','水','火','土'];
    const dmI = wxOrder.indexOf(dm);
    const yearI = wxOrder.indexOf(yearWx);
    const shengWo = wxOrder[(dmI+4)%5];
    const keWo = wxOrder[(dmI+3)%5];

    let a = `基于您的八字格局（日主${dm}，${strength}），为您规划未来职业路径：\n\n`;

    a += `🎯 近期（1-3年）：当前${currentYear}年为${TIAN_GAN[yearGan]}${DI_ZHI[(currentYear-4)%12]}年`;
    if (yearWx === yongShen.element) {
      a += `，流年走用神运，是近三年最好的时机！宜大胆行动，抓住事业上的关键机会，尤其${yongShen.element}属性相关的行业将迎来重要突破。`;
    } else if (yearWx === shengWo) {
      a += '，流年生助日主，运势稳中有升。宜在现有岗位上深耕专业能力，打好基础。适合考取资质证书或深造学习。';
    } else if (yearWx === keWo) {
      a += '，流年与日主有克制关系，事业上可能遇到一些压力和挑战。建议稳扎稳打，以守为主，利用这段时间修炼内功。';
    } else {
      a += '，流年运势平稳，适合做中长期规划，为未来的跃升做好铺垫。';
    }

    a += `\n\n📊 中期（3-7年）：${strength==='偏强'?'您正处于事业上升通道，建议在35岁前后完成从专业岗位到管理岗位的转型。您的领导力和决断力将在这个阶段充分发挥。':'建议走"专家路线"——在细分领域深耕成为不可替代的人才。您的细腻和专注会让你在专业领域建立很高的壁垒。'}`;

    a += `\n\n🏆 长期（7-15年）：${strength==='偏强'?'40岁前后有望达到事业巅峰，适合独立创业或担任高管。您的格局和魄力将在这个阶段全部展现。':'事业呈螺旋上升，45岁前后将迎来事业第二春。大器晚成，越往后越有分量。记住：不是跑得最快的人赢，而是坚持最久的人赢。'}`;

    if (gender === '女') a += `\n\n👩 作为现代女性命主，您在事业上有着不输任何人的潜力。关键是找到适合自己五行特质的方向，并坚持不懈。${['金','火'].includes(dm)?'您的果敢和决断力在职场中非常难得，适当的时候要敢于主动争取机会。':'您的细腻和韧性是最宝贵的职场品质，在需要耐心和专注的领域您会脱颖而出。'}`;

    return a;
  },

  // ========== 未来财运 ==========
  _wealthFuture(dm, wxCount, yongShen, missWx) {
    const wxOrder = ['金','木','水','火','土'];
    const dmI = wxOrder.indexOf(dm);
    const cai = wxOrder[(dmI+2)%5]; // 我克者为财
    const caiCount = wxCount[cai];

    let a = `日主${dm}，以${cai}为财星。当前财星力量：${caiCount}/8。`;

    if (caiCount >= 4) {
      a += `\n\n财星旺盛，财运亨通！您天生具有吸引财富的能力，善于发现商机和创造收入。不过财多也需注意理财——赚得多也容易花得多，建议建立系统的理财规划。投资方面适合${missWx.includes('土')?'房地产和固定资产':missWx.includes('水')?'流动性强的理财产品':'多元化配置'}。`;
    } else if (caiCount >= 2) {
      a += `\n\n财星力量适中，财运平稳。您的财富增长偏向稳健型，不善于投机但善于积累。建议坚持长期投资策略，如定额定投、房产和养老保险。30岁后财运逐步上升，45岁前后达到财富高峰。`;
    } else {
      a += `\n\n财星力量偏弱，但这不代表财运不好——而是在提醒您需要通过专业技能和智慧来生财。${cai}属性的行业和人事物最能催旺您的财运。建议多关注与${cai}五行相关的投资机会，并找到${yongShen.element}属性的人作为合作伙伴或财务顾问。`;
    }

    a += `\n\n财富节奏：${dm==='金'?'35-45岁是财富积累黄金期':'35岁之后财运明显提升，之前的积累开始产生复利效应'}。建议在30岁前重点投资自己的专业能力和人脉，回报会在下半场集中体现。`;

    a += `\n\n关键提醒：五行${missWx.length?'缺'+missWx.join('、')+'，在理财方面可能对应'+(missWx.includes('金')?'决断力不足，重大投资决策时多咨询专业人士；':'')+(missWx.includes('木')?'创造力不足，可多参与团队投资而非独立决策；':'')+(missWx.includes('水')?'灵活性不足，可适当关注新兴投资渠道；':'')+(missWx.includes('火')?'行动力不足，看准了就要果断出手，不可犹豫太久；':'')+(missWx.includes('土')?'稳定性不足，优先考虑稳健型投资产品；':''):'五行齐全，理财各维度相对平衡，这是先天的优势。'}`;

    return a;
  },

  // ========== 未来人生 ==========
  _lifeFuture(result, gender, yongShen) {
    const dm = result.riZhuWuxing;
    const s = result.riZhuStrength;
    const p = result.pillars;

    const lifeThemes = {
      '金':`您的人生如同精金淬炼——每一次挑战都是提纯的过程。${s==='偏强'?'年轻时会经历一些磨砺，但这正是炼金必经之路。30岁后逐渐找到人生方向，35岁开始发光，45岁前后达到巅峰。晚年如纯金般沉稳而有分量。':'人生前期稍显平淡，但随着阅历增长，如同璞玉被逐渐打磨，魅力与实力与日俱增。40岁是重要转折点。'}`,
      '木':`您的人生如同树木生长——前期扎根，后期枝繁叶茂。${s==='偏强'?'年轻时冲劲十足，敢于尝试各种可能。30岁前后确定主攻方向，之后持续深耕，40岁后成为参天大树。':'不急不躁是您的优势。人生如同一棵精品的盆景——虽不大，但每一处都精心雕琢。大器晚成，越老越有价值。'}`,
      '水':`您的人生如同江河奔流——时而湍急时而平缓，但始终向前。${s==='偏强'?'格局宏大，视野开阔，适合做影响众人的事业。人生的几次关键抉择至关重要——选对了方向，便能顺流而下，势不可挡。':'人生如溪流，虽不汹涌但清澈持久。您的智慧和细腻会在关键时刻发挥巨大作用。保持学习和探索的热情，人生处处有惊喜。'}`,
      '火':`您的人生如同火焰燃烧——热烈、明亮、有感染力。${s==='偏强'?'年轻时就注定不平凡，走到哪里都是焦点。但需注意节奏——火烧得太旺容易后劲不足。学会"温火慢炖"，人生会更持久和圆满。':'您有一种特别的温暖魅力——不是烈日当空，而是烛火温馨。人生中会遇到能"点燃"您的人或事，抓住那个契机，星火可以燎原。'}`,
      '土':`您的人生如同大地承载——厚德载物，稳定而持久。${s==='偏强'?'您是天生的守护者和建设者。人生不求快但求稳，每一步都踏实前进。30岁后事业稳步上升，50岁后德高望重。':'人生如温润的陶瓷——需要时间来成就。不争不抢，但岁月会证明您的价值。中年之后，那些曾经看似"走得快"的人会来向您请教经验。'}`
    };

    let a = (lifeThemes[dm]||lifeThemes['土'])+'\n\n';

    const zhi = p.day.zhi;
    const spouseDesc = ['聪明感性','踏实忠诚','积极强大','温柔优雅','包容智慧','热情迷人','阳光开朗','温顺顾家','独立聪明','精致魅力','忠诚坚定','浪漫感性'];
    a += `婚姻家庭：配偶宫为${DI_ZHI[zhi]}，伴侣特质为「${spouseDesc[zhi]||'稳重可靠'}」。${gender==='男'?'您的婚姻质量较高，妻子会是您人生的重要支持者。':'您的婚姻幸福指数较高，丈夫会是您坚实的依靠。'}晚年家庭生活温馨美满。\n\n`;

    a += `健康提示：${dm==='金'?'注重呼吸系统保养，秋冬防燥，多做有氧运动'：dm==='木'?'注重肝胆保养，少熬夜，多亲近大自然'：dm==='水'?'注重肾脏保暖，多喝水，冬季泡脚养生'：dm==='火'?'注重心血管健康，保持情绪平稳，夏季防暑'：dm==='土'?'注重脾胃保养，饮食规律，避免思虑过度'}。保持良好生活习惯，晚年身体硬朗。\n\n`;

    a += `总体寄语：${['您的人生如同','您的命运图谱显示','从您的八字来看','纵观您的命格'][new Date().getSeconds()%4]}，${strength==='偏强'?'您注定要成为人群中的佼佼者——不是通过投机取巧，而是凭借过人的实力和坚韧的意志。保持这份刚健之气，同时学会适时的柔韧，您的人生必将精彩纷呈。':'您的价值不在于一时的轰轰烈烈，而在于持久的积累和沉淀。人生是马拉松不是短跑——您的耐力和毅力终将带您到达别人到不了的高度。'}道法自然，顺势而为，${name?name:'您'}的未来充满无限可能。🌟`;

    return a;
  },

  // ========== 用神计算 ==========
  _calcYongShen(dm, strength, wxCount, missWx) {
    const wxOrder = ['金','木','水','火','土'];
    const dmI = wxOrder.indexOf(dm);
    const shengWo = wxOrder[(dmI+4)%5];
    const keWo = wxOrder[(dmI+3)%5];

    if (strength === '偏强') {
      const candidates = [
        { element: keWo, reason: `日主${dm}偏强，需${keWo}来克制过旺之气，使命局趋于平衡。${keWo}是您的"官杀"，给您适度的压力和动力。` },
        { element: wxOrder[(dmI+1)%5], reason: `日主${dm}偏强，用${wxOrder[(dmI+1)%5]}来泄秀生财，将过旺的精力转化为创造力。` }
      ];
      for (const c of candidates) { if (wxCount[c.element] < 3) return c; }
      return candidates[0];
    } else if (strength === '偏弱') {
      const candidates = [
        { element: shengWo, reason: `日主${dm}偏弱，需${shengWo}来生助日主。"印星"代表贵人和学识，多接触${shengWo}属性事物对运势大有裨益。` },
        { element: dm, reason: `日主${dm}偏弱，需同五行来帮身。"比劫助身"增强自信和行动力。` }
      ];
      for (const c of candidates) { if (wxCount[c.element] < 3) return c; }
      return candidates[0];
    }
    if (missWx.length > 0) return { element: missWx[0], reason: `命局中和，五行缺${missWx[0]}，补${missWx[0]}使命局更加完整。` };
    return { element: dm, reason: '命局中和，保持现有平衡即可。' };
  },

  // ========== 辅助方法 ==========
  _fmtCg(cgStr) {
    if (!cgStr) return '-';
    let html = '';
    for (const char of cgStr) {
      const idx = TIAN_GAN.indexOf(char);
      if (idx>=0) html += `<span style="color:${WUXING_COLORS[TG_WUXING[idx]]};font-size:0.78rem">${char}</span>`;
      else html += char;
    }
    return html||'-';
  },

  _getNaYin(gan, zhi) {
    const t = ['海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土','霹雳火','松柏木','流年水','砂石金','山下火','平地木','壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金','桑柘木','柘溪水','沙中土','天上火','石榴木','大海水'];
    return t[((gan*6+zhi*5)%60)%30]||'';
  }
};

document.addEventListener('DOMContentLoaded', () => { BaziModule.init(); });
