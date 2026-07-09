/**
 * 五行八字综合排盘
 */
var BaziModule = {
  init: function() {
    var form = document.getElementById('baziForm');
    var self = this;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      self.calculate();
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

    this._renderTable(result);
    this._renderChart(result);
    this._renderAnalysis(result, gender, name);

    document.getElementById('baziResult').scrollIntoView({behavior:'smooth'});
  },

  // ===== 排盘表 =====
  _renderTable: function(result) {
    var p = result.pillars;
    var cols = ['year','month','day','hour'];
    var h = '<table class="pillar-table">';
    h += '<thead><tr><th></th><th class="pillar-col">年柱</th><th class="pillar-col">月柱</th><th class="pillar-col">日柱</th><th class="pillar-col">时柱</th></tr></thead><tbody>';

    // 天干
    h += '<tr class="gan-row"><td class="row-label">天干</td>';
    for (var i=0;i<4;i++) {
      var k = cols[i];
      var dmClass = k==='day'?' day-master':'';
      var clr = WUXING_COLORS[TG_WUXING[p[k].gan]];
      h += '<td><span class="gan-char'+dmClass+'" style="color:'+clr+'">'+TIAN_GAN[p[k].gan]+'</span></td>';
    }
    h += '</tr>';

    // 地支
    h += '<tr class="zhi-row"><td class="row-label">地支</td>';
    for (i=0;i<4;i++) {
      var k2 = cols[i];
      h += '<td><span class="zhi-char" style="color:'+WUXING_COLORS[DZ_WUXING[p[k2].zhi]]+'">'+DI_ZHI[p[k2].zhi]+'</span></td>';
    }
    h += '</tr>';

    // 十神
    h += '<tr class="shishen-row"><td class="row-label">十神</td>';
    h += '<td>'+result.shiShen.year.gan+'</td><td>'+result.shiShen.month.gan+'</td>';
    h += '<td class="day-master-label">日主</td><td>'+result.shiShen.hour.gan+'</td></tr>';

    // 纳音
    h += '<tr class="wuxing-row"><td class="row-label">纳音</td>';
    for (i=0;i<4;i++) {
      var k3 = cols[i];
      h += '<td>'+this._nayin(p[k3].gan,p[k3].zhi)+'</td>';
    }
    h += '</tr></tbody></table>';

    var miss = result.missingWx.length ? '缺'+result.missingWx.join('、') : '齐全';
    h += '<div class="bazi-info-row">';
    h += '<span>🐲生肖：<b>'+result.shengXiao+'</b></span> ';
    h += '<span>☀️日主：<b style="color:'+WUXING_COLORS[result.riZhuWuxing]+'">'+result.riZhuWuxing+'</b></span> ';
    h += '<span>💪格局：<b>'+result.riZhuStrength+'</b></span> ';
    h += '<span>⚖️五行：<b>'+miss+'</b></span>';
    h += '</div>';

    document.getElementById('baziTable').innerHTML = h;
  },

  // ===== 五行雷达图 =====
  _renderChart: function(result) {
    var canvas = document.getElementById('wuxingChart');
    var ctx = canvas.getContext('2d');
    var cx=130, cy=130, mr=100;
    var order=['金','木','水','火','土'];
    var counts=[];
    for (var i=0;i<5;i++) counts.push(result.wuxingCount[order[i]]);
    ctx.clearRect(0,0,260,260);

    // 网格
    for (var ring=1;ring<=4;ring++) {
      var r=mr/4*ring;
      ctx.strokeStyle='rgba(140,110,60,0.12)';
      ctx.beginPath();
      for (var j=0;j<5;j++) {
        var a=Math.PI*2/5*j-Math.PI/2;
        var x=cx+r*Math.cos(a), y=cy+r*Math.sin(a);
        if(j===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();ctx.stroke();
    }

    // 数据区
    ctx.beginPath();
    for (j=0;j<5;j++) {
      var rr=Math.max(2,counts[j]/8*mr);
      var aa=Math.PI*2/5*j-Math.PI/2;
      var xx=cx+rr*Math.cos(aa), yy=cy+rr*Math.sin(aa);
      if(j===0)ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy);
    }
    ctx.closePath();
    ctx.fillStyle='rgba(196,30,58,0.15)';ctx.fill();
    ctx.strokeStyle='#c41e3a';ctx.lineWidth=2;ctx.stroke();

    // 标签
    ctx.fillStyle='#5c4a28';ctx.font='bold 12px "Microsoft YaHei",sans-serif';ctx.textAlign='center';
    for (j=0;j<5;j++) {
      var aaa=Math.PI*2/5*j-Math.PI/2;
      ctx.fillText(order[j]+'('+counts[j]+')', cx+(mr+22)*Math.cos(aaa), cy+(mr+22)*Math.sin(aaa)+4);
    }
  },

  // ===== 完整分析 =====
  _renderAnalysis: function(result, gender, name) {
    var dm=result.riZhuWuxing, s=result.riZhuStrength;
    var wx=result.wuxingCount, ms=result.missingWx, p=result.pillars;
    var yS=this._yongShen(dm,s,wx,ms);

    var html='';
    html+=this._card('📛 姓名解析', this._nameA(name,dm,gender));
    html+=this._card('☯️ 八字命格精解', this._baziA(result,gender));
    html+=this._card('💪 身强身弱·喜用神', this._strengthA(dm,s,wx,yS,ms));
    html+=this._card('💼 事业方向', this._careerA(dm,yS));
    html+=this._card('🗺️ 八方方位', this._dirA(dm,yS));
    html+=this._card('💰 财运解析', this._wealthA(dm,wx,yS));
    html+=this._card('🌟 人生运势', this._lifeA(result,gender,name));
    html+='<div class="analysis-card"><h4>✨ 寄语</h4><p class="disclaimer">以上分析基于八字五行理论，仅供研究参考。命运掌握在自己手中，积极努力才是改变命运的真正力量。🌟</p></div>';

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

  // === 姓名 ===
  _nameA: function(name,dm,gender) {
    var a = '「'+name+'」，此名';
    if (name.length===2) a += '二字简洁有力；';
    else if (name.length===3) a += '三字天地人三才具备；';
    else a += '笔画饱满内涵丰富；';
    a += '\n\n日主为'+dm+'，名字与命局五行'+['相互呼应','配合得当','相得益彰'][name.length%3]+'。'+name+'之名，音韵'+['铿锵','温润','清亮'][name.length%3]+'，是一个'+['非常好的','与命格配合的','有利于运势的'][name.length%3]+'名字。';
    return a;
  },

  // === 八字命格 ===
  _baziA: function(result,gender) {
    var dm=result.riZhuWuxing, s=result.riZhuStrength, p=result.pillars;
    var desc = '日主为'+result.dayPillar[0]+'（'+dm+'命），';
    if (dm==='金') desc += '金主义——刚毅果断、重情重义。';
    else if (dm==='木') desc += '木主仁——仁厚温和、生命力旺。';
    else if (dm==='水') desc += '水主智——聪慧灵活、适应力强。';
    else if (dm==='火') desc += '火主礼——热情奔放、充满活力。';
    else desc += '土主信——稳重诚信、包容大度。';

    if (s==='偏强') desc += '命局偏强，精力旺盛，抗压能力强。';
    else if (s==='偏弱') desc += '命局偏弱，心思细腻，大器晚成。';
    else desc += '命局中和，能屈能伸，难得的好格局。';

    var sp = ['聪明感性','踏实忠诚','积极强大','温柔优雅','包容智慧','热情迷人','阳光开朗','温顺顾家','独立聪明','精致魅力','忠诚坚定','浪漫感性'];
    desc += '\n\n日支'+DI_ZHI[p.day.zhi]+'为配偶宫，配偶特质「'+(sp[p.day.zhi]||'稳重可靠')+'」。';
    desc += '\n年柱'+result.yearPillar+'为祖业，月柱'+result.monthPillar+'为事业，时柱'+result.hourPillar+'为晚年。';
    desc += '\n'+(result.missingWx.length?'五行缺'+result.missingWx.join('、')+'，需后天补充。':'五行俱全！先天格局完美。');
    return desc;
  },

  // === 身强弱 ===
  _strengthA: function(dm,s,wx,yS,ms) {
    var a = '格局「'+s+'」。';
    if (s==='偏强') a += '日主能量充足，精力旺盛。过强则刚而易折，需适当收敛锋芒。';
    else if (s==='偏弱') a += '日主能量稍弱，心思细腻。需后天学习积累增强自身，大器晚成。';
    else a += '五行流通平衡，能屈能伸，刚柔并济，难得平衡格局。';

    a += '\n\n五行：金'+wx['金']+' 木'+wx['木']+' 水'+wx['水']+' 火'+wx['火']+' 土'+wx['土']+'（满分各8）';

    if (ms.length>0) {
      var tips={金:'穿戴白/金色、金属饰品',木:'接触自然、穿绿衣',水:'多喝水游泳、蓝黑色',火:'多运动、红紫色',土:'陶艺园艺、黄棕色'};
      a += '\n\n缺'+ms.join('、')+'：';
      for (var i=0;i<ms.length;i++) a += '\n• '+ms[i]+'——'+ (tips[ms[i]]||'');
    }

    a += '\n\n用神「'+yS.element+'」——'+yS.reason;

    var o=['金','木','水','火','土'], di=o.indexOf(dm);
    if (s==='偏强') {
      a += '\n喜：'+o[(di+3)%5]+'（克）·'+o[(di+1)%5]+'（泄）·'+o[(di+2)%5]+'（耗）';
      a += '\n忌：'+o[(di+4)%5]+'（生）·'+dm+'（同）';
    } else {
      a += '\n喜：'+o[(di+4)%5]+'（生）·'+dm+'（帮）';
      a += '\n忌：'+o[(di+3)%5]+'（克）·'+o[(di+1)%5]+'（泄）';
    }
    return a;
  },

  // === 事业 ===
  _careerA: function(dm,yS) {
    var c={
      金:{i:'金融、法律、管理、工程技术、军警、审计',d:'适合需要专业壁垒和决断力的行业。'},
      木:{i:'教育、文化、艺术、医疗、环保、心理咨询',d:'适合需要创造力和亲和力的行业。'},
      水:{i:'科研、咨询、传媒、贸易、IT、旅游',d:'适合需要智慧和变通能力的行业。'},
      火:{i:'演艺、公关、科技、营销、体育、时尚',d:'适合需要热情和表现力的行业。'},
      土:{i:'房地产、金融、管理、农业、教育',d:'适合需要稳重和责任心的行业。'}
    };
    var cc = c[dm]||c['土'];
    return '推荐行业：'+cc.i+'\n\n'+cc.d+'\n\n用神'+yS.element+'，选择'+yS.element+'属性领域发展更有利。35岁前后是关键事业转折点。';
  },

  // === 方位 ===
  _dirA: function(dm,yS) {
    var d={
      金:{b:'西方、西北方',g:'西南方',a:'南方、东方'},
      木:{b:'东方、东南方',g:'北方',a:'西方、西北方'},
      水:{b:'北方',g:'西方、西北方',a:'西南、东北'},
      火:{b:'南方',g:'东方、东南方',a:'北方'},
      土:{b:'西南、东北',g:'南方、中央',a:'东方、东南方'}
    };
    var dd=d[yS.element]||d[dm]||d['土'];
    var a='用神'+yS.element+'，方位推荐：\n\n';
    a += '🏠 首选：'+dd.b+'\n👍 次选：'+dd.g+'\n⚠️ 避开：'+dd.a+'\n\n';

    var all=['东（震·木）','南（离·火）','西（兑·金）','北（坎·水）','东南（巽·木）','东北（艮·土）','西南（坤·土）','西北（乾·金）'];
    for (var i=0;i<all.length;i++) {
      var nm=all[i].split('（')[0];
      var flag='➖ 适度';
      if (dd.b.indexOf(nm)>=0) flag='✅ 大吉';
      else if (dd.a.indexOf(nm)>=0) flag='⚠️ 注意';
      else if (dd.g.indexOf(nm)>=0) flag='👍 有利';
      a += '• '+all[i]+'：'+flag+'\n';
    }
    return a;
  },

  // === 财运 ===
  _wealthA: function(dm,wx,yS) {
    var o=['金','木','水','火','土'], di=o.indexOf(dm), cai=o[(di+2)%5], cc=wx[cai];
    var a = '日主'+dm+'，财星为'+cai+'（力量'+cc+'/8）。';
    if (cc>=4) a += '\n\n财星旺盛！天生有吸引财富的能力，善于发现商机。建议建立系统理财规划。';
    else if (cc>=2) a += '\n\n财星适中，财运平稳。偏稳健型积累，30岁后财运上升，45岁前后达高峰。';
    else a += '\n\n财星偏弱，需通过专业技能生财。'+cai+'属性行业最能催旺财运。';

    var rh='';
    if (dm==='金') rh='35-45岁黄金积累期';
    else if (dm==='木') rh='30岁前投资自己，回报在下半场';
    else if (dm==='水') rh='财运流动性强，多元配置最佳';
    else if (dm==='火') rh='赚钱强消费也大方，建议30%储蓄';
    else rh='稳健增长，40岁后财务安全感提升';
    a += '\n\n财富节奏：'+rh+'。';
    return a;
  },

  // === 人生 ===
  _lifeA: function(result,gender,name) {
    var dm=result.riZhuWuxing, s=result.riZhuStrength, p=result.pillars;
    var t={
      金:'人生如精金淬炼——每次挑战都是提纯的机会。30岁后渐入佳境，35岁发光，45岁巅峰。',
      木:'人生如树木生长——前期扎根后期繁茂。不急不躁，越老越有价值。',
      水:'人生如江河奔流——时急时缓始终向前。保持学习和探索，处处有惊喜。',
      火:'人生如火焰燃烧——热烈明亮。学会温火慢炖，人生更持久圆满。',
      土:'人生如大地承载——厚德载物。不求快但求稳，50岁后德高望重。'
    };
    var a = (t[dm]||t['土'])+'\n\n';

    var sp=['聪明感性','踏实忠诚','积极强大','温柔优雅','包容智慧','热情迷人','阳光开朗','温顺顾家','独立聪明','精致魅力','忠诚坚定','浪漫感性'];
    a += '婚姻：配偶宫'+DI_ZHI[p.day.zhi]+'，配偶「'+(sp[p.day.zhi]||'稳重')+'」。';
    a += gender==='男'?'婚姻质量高，妻子是人生重要支持者。':'婚姻幸福，丈夫是坚实依靠。';
    a += '晚年家庭温馨。\n\n';

    var hh={金:'呼吸系统·秋冬防燥',木:'肝胆排毒·少熬夜',水:'肾脏保暖·多喝水泡脚',火:'心血管·情绪平稳',土:'脾胃保养·饮食规律'};
    a += '健康：'+(hh[dm]||hh['土'])+'。\n\n';

    a += '"'+(name||'命主')+'"，';
    if (s==='偏强') a += '您注定成为人群中佼佼者——凭借实力而非投机。保持刚健同时学会柔韧。';
    else a += '您的价值在于持久积累。人生是马拉松，耐力带您到达别人到不了的高度。';
    a += '道法自然，顺势而为。🌟';
    return a;
  },

  // === 用神 ===
  _yongShen: function(dm,s,wx,ms) {
    var o=['金','木','水','火','土'],di=o.indexOf(dm),sw=o[(di+4)%5],kw=o[(di+3)%5];
    if (s==='偏强') {
      if (wx[kw]<3) return {element:kw, reason:'需'+kw+'克制过旺之气，给您适度压力和动力'};
      return {element:o[(di+1)%5], reason:'需'+o[(di+1)%5]+'泄秀生财，将精力转化为创造力'};
    }
    if (s==='偏弱') {
      if (wx[sw]<3) return {element:sw, reason:'需'+sw+'生助日主，印星代表贵人和学识'};
      return {element:dm, reason:'需同五行帮身，增强自信和行动力'};
    }
    if (ms.length>0) return {element:ms[0], reason:'补'+ms[0]+'使命局更完整'};
    return {element:dm, reason:'命局中和，保持平衡即可'};
  },

  // === 纳音 ===
  _nayin: function(g,z) {
    var t = ['海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土','霹雳火','松柏木','流年水','砂石金','山下火','平地木','壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金','桑柘木','柘溪水','沙中土','天上火','石榴木','大海水'];
    return t[((g*6+z*5)%60)%30]||'';
  }
};

document.addEventListener('DOMContentLoaded', function(){ BaziModule.init(); });
