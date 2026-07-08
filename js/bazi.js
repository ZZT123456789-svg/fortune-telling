/**
 * 五行八字排盘模块
 * 四柱八字排盘 + 十神分析 + 五行生克 + 命理详批
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
    const year = parseInt(document.getElementById('baziYear').value);
    const month = parseInt(document.getElementById('baziMonth').value);
    const day = parseInt(document.getElementById('baziDay').value);
    const hour = parseInt(document.getElementById('baziHour').value);
    const gender = document.getElementById('baziGender').value;

    if (year < 1900 || year > 2100) { alert('年份需在 1900-2100 之间'); return; }
    if (month < 1 || month > 12) { alert('月份需在 1-12 之间'); return; }
    if (day < 1 || day > 31) { alert('日期需在 1-31 之间'); return; }
    if (day > daysInMonth(year, month)) { alert('日期超出当月天数'); return; }

    const result = calculateBazi(year, month, day, hour, gender);

    hideEl('baziForm');
    showEl('baziResult');

    this.renderTable(result);
    this.renderChart(result);
    this.renderAnalysis(result, gender);

    // 滚动到结果
    document.getElementById('baziResult').scrollIntoView({ behavior: 'smooth' });
  },

  // ========== 八字排盘表 ==========
  renderTable(result) {
    const p = result.pillars;
    const table = document.getElementById('baziTable');

    const cangGan = {
      0: '癸', 1: '己癸辛', 2: '甲丙戊', 3: '乙', 4: '戊乙癸',
      5: '丙庚戊', 6: '丁己', 7: '己丁乙', 8: '庚壬戊', 9: '辛',
      10: '戊辛丁', 11: '壬甲'
    };

    table.innerHTML = `
      <table class="pillar-table">
        <thead>
          <tr>
            <th></th>
            <th class="pillar-col">年柱</th>
            <th class="pillar-col">月柱</th>
            <th class="pillar-col">日柱</th>
            <th class="pillar-col">时柱</th>
          </tr>
        </thead>
        <tbody>
          <tr class="gan-row">
            <td class="row-label">天干</td>
            <td><span class="gan-char" style="color:${WUXING_COLORS[TG_WUXING[p.year.gan]]}">${TIAN_GAN[p.year.gan]}</span></td>
            <td><span class="gan-char" style="color:${WUXING_COLORS[TG_WUXING[p.month.gan]]}">${TIAN_GAN[p.month.gan]}</span></td>
            <td><span class="gan-char day-master" style="color:${WUXING_COLORS[TG_WUXING[p.day.gan]]}">${TIAN_GAN[p.day.gan]}</span></td>
            <td><span class="gan-char" style="color:${WUXING_COLORS[TG_WUXING[p.hour.gan]]}">${TIAN_GAN[p.hour.gan]}</span></td>
          </tr>
          <tr class="zhi-row">
            <td class="row-label">地支</td>
            <td><span class="zhi-char" style="color:${WUXING_COLORS[DZ_WUXING[p.year.zhi]]}">${DI_ZHI[p.year.zhi]}</span></td>
            <td><span class="zhi-char" style="color:${WUXING_COLORS[DZ_WUXING[p.month.zhi]]}">${DI_ZHI[p.month.zhi]}</span></td>
            <td><span class="zhi-char" style="color:${WUXING_COLORS[DZ_WUXING[p.day.zhi]]}">${DI_ZHI[p.day.zhi]}</span></td>
            <td><span class="zhi-char" style="color:${WUXING_COLORS[DZ_WUXING[p.hour.zhi]]}">${DI_ZHI[p.hour.zhi]}</span></td>
          </tr>
          <tr class="canggan-row">
            <td class="row-label">藏干</td>
            <td>${this._formatCangGan(cangGan[p.year.zhi] || '')}</td>
            <td>${this._formatCangGan(cangGan[p.month.zhi] || '')}</td>
            <td>${this._formatCangGan(cangGan[p.day.zhi] || '')}</td>
            <td>${this._formatCangGan(cangGan[p.hour.zhi] || '')}</td>
          </tr>
          <tr class="shishen-row">
            <td class="row-label">十神</td>
            <td>${result.shiShen.year.gan}</td>
            <td>${result.shiShen.month.gan}</td>
            <td class="day-master-label">日主</td>
            <td>${result.shiShen.hour.gan}</td>
          </tr>
          <tr class="wuxing-row">
            <td class="row-label">纳音</td>
            <td>${this._getNaYin(p.year.gan, p.year.zhi)}</td>
            <td>${this._getNaYin(p.month.gan, p.month.zhi)}</td>
            <td>${this._getNaYin(p.day.gan, p.day.zhi)}</td>
            <td>${this._getNaYin(p.hour.gan, p.hour.zhi)}</td>
          </tr>
        </tbody>
      </table>
      <div class="bazi-info-row">
        <span>🐲 生肖：<b>${result.shengXiao}</b></span>
        <span>☀️ 日主：<b style="color:${WUXING_COLORS[result.riZhuWuxing]}">${result.riZhuWuxing}</b>（${this._dmYinYang(p.day.gan)}${result.riZhuWuxing}）</span>
        <span>💪 格局：<b>${result.riZhuStrength}</b></span>
        <span>⚖️ 五行：<b>${result.missingWuxing.length ? '缺' + result.missingWuxing.join('、') : '齐全'}</b></span>
      </div>
    `;
  },

  // ========== 五行雷达图 ==========
  renderChart(result) {
    const canvas = document.getElementById('wuxingChart');
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxR = 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const wuxingOrder = ['金', '木', '水', '火', '土'];
    const counts = wuxingOrder.map(wx => result.wuxingCount[wx]);

    // 背景网格
    for (let i = 1; i <= 4; i++) {
      ctx.strokeStyle = 'rgba(201,169,110,0.12)';
      ctx.beginPath();
      const r = (maxR / 4) * i;
      const points = wuxingOrder.map((_, j) => {
        const angle = (Math.PI * 2 / 5) * j - Math.PI / 2;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
      });
      ctx.moveTo(points[0].x, points[0].y);
      for (let j = 1; j < points.length; j++) ctx.lineTo(points[j].x, points[j].y);
      ctx.closePath();
      ctx.stroke();
    }

    // 轴线
    ctx.strokeStyle = 'rgba(201,169,110,0.2)';
    ctx.lineWidth = 1;
    wuxingOrder.forEach((_, j) => {
      const angle = (Math.PI * 2 / 5) * j - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
      ctx.stroke();
    });

    // 数据区域
    ctx.beginPath();
    const dataPoints = wuxingOrder.map((_, j) => {
      const r = (counts[j] / 8) * maxR;
      const angle = (Math.PI * 2 / 5) * j - Math.PI / 2;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
    ctx.moveTo(dataPoints[0].x, dataPoints[0].y);
    for (let j = 1; j < dataPoints.length; j++) ctx.lineTo(dataPoints[j].x, dataPoints[j].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(196, 30, 58, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#c41e3a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 数据点
    dataPoints.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#c9a96e';
      ctx.fill();
    });

    // 标签
    ctx.fillStyle = '#e8e0d0';
    ctx.font = 'bold 13px "Microsoft YaHei","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    wuxingOrder.forEach((wx, j) => {
      const angle = (Math.PI * 2 / 5) * j - Math.PI / 2;
      const labelR = maxR + 22;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);
      ctx.fillText(`${wx}(${counts[j]})`, lx, ly + 4);
    });
  },

  // ========== 详细命理分析 ==========
  renderAnalysis(result, gender) {
    const analysis = document.getElementById('baziAnalysis');
    const dm = result.riZhuWuxing;
    const p = result.pillars;
    const wxCount = result.wuxingCount;
    const missWx = result.missingWuxing;
    const strength = result.riZhuStrength;

    // 计算用神
    const yongShen = this._calcYongShen(dm, strength, wxCount, missWx);

    const sections = [
      {
        title: '☀️ 日主命格详析',
        content: this._dayMasterAnalysis(dm, p.day, strength, gender, result.shengXiao)
      },
      {
        title: '🏛️ 四柱精解',
        content: this._pillarDetailAnalysis(p, result.shiShen, gender)
      },
      {
        title: '🔗 十神格局',
        content: this._tenGodAnalysis(result.shiShen, p, dm, gender)
      },
      {
        title: '⚡ 五行生克与用神',
        content: this._wuxingInteractionAnalysis(dm, wxCount, missWx, yongShen, strength)
      },
      {
        title: '🎭 性格详批',
        content: this._personalityDeepAnalysis(dm, p, strength, gender)
      },
      {
        title: '💼 事业财运精断',
        content: this._careerWealthDeepAnalysis(dm, p, wxCount, yongShen, gender)
      },
      {
        title: '💕 感情婚姻剖析',
        content: this._marriageDeepAnalysis(p, dm, gender)
      },
      {
        title: '🏥 健康体质分析',
        content: this._healthDeepAnalysis(dm, wxCount, missWx)
      },
      {
        title: '🔮 当前流年简析',
        content: this._currentYearAnalysis(dm, wxCount, yongShen)
      },
      {
        title: '💡 命理总结与建议',
        content: this._summaryAdvice(dm, strength, missWx, yongShen, gender, result.shengXiao)
      }
    ];

    let html = '';
    for (const sec of sections) {
      html += `<div class="analysis-card">
        <h4>${sec.title}</h4>
        ${sec.content.split('\n\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')}
      </div>`;
    }

    html += `<div class="analysis-card">
      <h4>✨ 温馨提示</h4>
      <p class="disclaimer">以上八字命理分析基于传统五行理论推算，旨在帮助了解自身特质和趋势，仅供研究参考。命由天定，运由己造，积极的人生态度和持续的努力才是改变命运的真正力量。🌟</p>
    </div>`;

    analysis.innerHTML = html;
  },

  // ============ 各分析模块 ============

  _dayMasterAnalysis(dm, dayPillar, strength, gender, sx) {
    const dmChar = TIAN_GAN[dayPillar.gan];
    const yinYang = TG_YINYANG[dayPillar.gan] ? '阳' : '阴';

    const descriptions = {
      '金': [
        `日主为${dmChar}（${yinYang}金），在十天干中${dmChar === '庚' ? '庚为阳金，如斧钺刀剑，刚健锋利，有开拓之力。庚金之人多具有强烈的正义感和不屈的意志，做事雷厉风行，不畏艰难。' : dmChar === '辛' ? '辛为阴金，如金银珠宝，精致华美，温润而贵气。辛金之人多具有细腻的审美和高雅的气质，外柔内刚，追求品质生活。' : '属金之质，刚毅果断，重义守信。'}金主义，其性刚，其情烈。金命之人天生具有领导才能和决断力，是团队中可以依靠的中坚力量。`,
        `从命局强弱来看，${strength === '偏强' ? '日主偏强，金气旺盛，如同百炼精钢。这种格局的人精力充沛，抗压能力极强，面对困难从不退缩。但金过旺则易折，需要注意在坚持原则的同时保留一些灵活性，刚柔并济才能走得长远。' : strength === '偏弱' ? '日主偏弱，金气稍显不足，如同待打磨的璞玉。这种格局的人内心强大但外在表现谦和，需要通过不断的学习和实践来"炼金"，随着人生阅历的增长，会越来越有分量和光彩。' : '日主中和，金气恰到好处，是最理想的状态——既有原则性又有灵活性，既能坚持又能妥协，人生相对顺遂。'}`,
        `${gender === '女' ? '女命金日主，在现代社会是很有优势的格局。你理性、独立、有能力，不依赖他人也能活得精彩。感情上需要注意的是，偶尔放下"铠甲"，展现柔软的一面，反而能收获更美满的关系。' : '男命金日主，是天生的领导者。你的决断力和担当会吸引追随者，事业发展有先天优势。需要注意的是，刚则易折，多听取身边人的意见能让你避免不必要的弯路。'}`
      ],
      '木': [
        `日主为${dmChar}（${yinYang}木），在十天干中${dmChar === '甲' ? '甲为阳木，如参天大树，挺拔向上，有栋梁之材。甲木之人多具有宏大的志向和坚韧的品格，是天生的领导者，注定要成就一番事业。' : dmChar === '乙' ? '乙为阴木，如花草藤蔓，柔美而有韧性。乙木之人多具有艺术天赋和亲和力，善于在复杂的环境中找到生存和发展的空间。' : '属木之质，仁厚温和，蓬勃向上。'}木主仁，其性直，其情和。木命之人天生具有旺盛的生命力和创造力。`,
        `从命局强弱来看，${strength === '偏强' ? '日主偏强，木气蓬勃，如森林之王。这种格局的人志向远大，执行力强，能够在竞争激烈的环境中脱颖而出。但木过旺则需金来修剪，适当接受批评和约束反而有助于成长。' : strength === '偏弱' ? '日主偏弱，木气稍显不足，但如同精致的盆景——虽不大却有韵味。这种格局的人心思细腻，善于在细节中发现机会，通过持续的努力和积累，同样能成就非凡。' : '日主中和，木气舒展有度，是很好的格局。既保持了向上的生长力，又有足够的柔韧性应对人生风雨。'}`,
        `${gender === '女' ? '女命木日主，温柔而有力量。你像一株韧竹——看起来柔弱，实际上风来不倒、雪压不垮。在职场中，你的亲和力是最大的优势；在感情中，你的温柔是最动人的魅力。' : '男命木日主，有一种儒雅的君子气质。你不是靠强势服人，而是以德服人、以魅感人。这种"温柔的力量"在现代社会越来越受认可和欢迎。'}`
      ],
      '水': [
        `日主为${dmChar}（${yinYang}水），在十天干中${dmChar === '壬' ? '壬为阳水，如江河大海，浩瀚奔流，有容纳百川之量。壬水之人格局宏大，视野开阔，有着深远的智慧和战略眼光。' : dmChar === '癸' ? '癸为阴水，如雨露甘泉，润物无声。癸水之人细腻敏感，直觉力极强，有着润物细无声的影响力。' : '属水之质，聪慧灵动，善于变通。'}水主智，其性聪，其情善。水命之人天生头脑灵活，适应力超群。`,
        `从命局强弱来看，${strength === '偏强' ? '日主偏强，水势浩荡，如大江奔流。这种格局的人思维开阔，视野宏大，有着超越常人的智慧格局。但水多易泛滥，需要土的堤岸来约束——在现实生活中，需要一个稳定的平台或制度来承载你的才华。' : strength === '偏弱' ? '日主偏弱，水气稍弱但清澈如泉。这种格局的人心思敏感，有很强的直觉力和创造力，适合在需要深度思考的领域发展。找到对的"容器"（平台/环境），你的才华就会绽放。' : '日主中和，水气恰到好处——智慧而不狡猾，灵活而不散漫，是非常难得的格局。'}`,
        `${gender === '女' ? '女命水日主，天生有一种神秘而迷人的气质。你情感丰富、直觉敏锐，在艺术和创意领域有独特的天赋。感情中你追求灵魂层面的契合，宁缺毋滥。' : '男命水日主，有一种儒雅智慧的君子之风。你善于思考和策划，在需要谋略和智慧的领域能大放异彩。感情中你深情而专一。'}`
      ],
      '火': [
        `日主为${dmChar}（${yinYang}火），在十天干中${dmChar === '丙' ? '丙为阳火，如太阳之光，普照万物，热情奔放。丙火之人天生具有感染力和领导力，走到哪里都是焦点。' : dmChar === '丁' ? '丁为阴火，如灯烛之光，温暖而不灼人。丁火之人细腻温暖，有着持久的热情和坚定的信念。' : '属火之质，热情有礼，充满活力。'}火主礼，其性急，其情恭。火命之人天生具有感染他人的魅力。`,
        `从命局强弱来看，${strength === '偏强' ? '日主偏强，火势熊熊，如日中天。这种格局的人气场强大，有领袖魅力，是天生的开创者。但火旺需水济，注意控制情绪和节奏，避免"烧得太旺"而后继无力。' : strength === '偏弱' ? '日主偏弱，火气稍弱但温暖如烛。这种格局的人有一种低调的魅力——不张扬但让人感到温暖和舒服。需要找到能"点燃"你的人和事来激发潜能。' : '日主中和，火气恰到好处——热情而不急躁，温暖而有度，是很好的格局。'}`,
        `${gender === '女' ? '女命火日主，是现代版的"大女主"。你自信、独立、有魄力，在事业上不输任何人。感情中也倾向于占据主动，需要注意的是给对方留出空间，感情需要双方的共同经营。' : '男命火日主，有一种英雄主义的气质。你热情主动，敢想敢干，是天生的行动派。在朋友中你是那个能带动气氛、鼓舞士气的人。'}`
      ],
      '土': [
        `日主为${dmChar}（${yinYang}土），在十天干中${dmChar === '戊' ? '戊为阳土，如城墙大地，厚重稳固，有承载万物之德。戊土之人稳重可靠，是天生的管理者和守护者。' : dmChar === '己' ? '己为阴土，如田园之土，松软肥沃，能生养万物。己土之人温和包容，有着润物无声的影响力。' : '属土之质，诚信稳重，包容大度。'}土主信，其性重，其情厚。土命之人天生让人感到安心和信赖。`,
        `从命局强弱来看，${strength === '偏强' ? '日主偏强，土气厚重，如泰山巍峨。这种格局的人极其稳重可靠，是团队中的定海神针。但土多需木疏，适当增添一些活力和创新，人生会更加丰富多彩。' : strength === '偏弱' ? '日主偏弱，土气稍弱但温润细腻。这种格局的人踏实本分，虽然不善于表现自己，但每一步都走得稳稳当当。大器晚成型，越往后越有分量。' : '日主中和，土气恰到好处——稳重而不呆板，包容而有原则，是"厚福"之命。'}`,
        `${gender === '女' ? '女命土日主，是传统意义上的贤妻良母，但这并不妨碍你在事业上有所成就。你的靠谱和责任心是最宝贵的品质，无论是在家庭还是职场都备受信赖。' : '男命土日主，有一种让人安心的厚重感。你不需要多么花哨的表现，你的稳重和诚信就是最好的名片。在事业上，你是那个可以被委以重任的人。'}`
      ]
    };

    return (descriptions[dm] || descriptions['土']).join('\n\n');
  },

  _pillarDetailAnalysis(p, shiShen, gender) {
    const yearDesc = `年柱${TIAN_GAN[p.year.gan]}${DI_ZHI[p.year.zhi]}代表祖荫和少年运势。年干${TIAN_GAN[p.year.gan]}（${TG_WUXING[p.year.gan]}）为${shiShen.year.gan}，代表你与祖辈、父母的关系以及遗传的禀赋。年支${DI_ZHI[p.year.zhi]}（${DZ_WUXING[p.year.zhi]}）反映家庭环境和童年经历对你的影响。整体来看，你从小生活的环境${TG_YINYANG[p.year.gan] ? '充满阳刚之气，长辈对你期望较高，培养了你独立自主的性格。' : '相对温和，长辈给予了你较多关爱和自由成长的空间。'}`;

    const monthDesc = `月柱${TIAN_GAN[p.month.gan]}${DI_ZHI[p.month.zhi]}代表父母宫和青年运势。月干${TIAN_GAN[p.month.gan]}（${TG_WUXING[p.month.gan]}）为${shiShen.month.gan}，反映你与上司、前辈的缘分及事业发展环境。月支${DI_ZHI[p.month.zhi]}（${DZ_WUXING[p.month.zhi]}）是月令提纲，决定命局的寒暖燥湿。你出生在${DI_ZHI[p.month.zhi]}月，${['寒冷','尚寒','渐暖','温暖','温热','炎热','暑热','尚热','凉爽','渐凉','寒凉','严寒'][p.month.zhi]}之季，这对你的五行平衡和人生节奏有重要影响。`;

    const dayDesc = `日柱${TIAN_GAN[p.day.gan]}${DI_ZHI[p.day.zhi]}代表你自己和配偶宫。日干${TIAN_GAN[p.day.gan]}（${TG_WUXING[p.day.gan]}）就是你——日主，是整个八字的核心。日支${DI_ZHI[p.day.zhi]}（${DZ_WUXING[p.day.zhi]}）为配偶宫，代表你的婚姻状况和伴侣特质。${this._spousePalaceDesc(p.day.zhi, gender)}`;

    const hourDesc = `时柱${TIAN_GAN[p.hour.gan]}${DI_ZHI[p.hour.zhi]}代表子女宫和晚年运势。时干${TIAN_GAN[p.hour.gan]}（${TG_WUXING[p.hour.gan]}）为${shiShen.hour.gan}，反映你与子女、下属的关系以及人生收尾阶段的状态。时支${DI_ZHI[p.hour.zhi]}（${DZ_WUXING[p.hour.zhi]}）代表你的晚年生活质量。${TG_YINYANG[p.hour.gan] ? '时柱阳干，晚年依然精力充沛，有可能在退休后开启事业第二春。' : '时柱阴干，晚年心境平和，更注重精神层面的满足和家庭的温暖。'}`;

    return yearDesc + '\n\n' + monthDesc + '\n\n' + dayDesc + '\n\n' + hourDesc;
  },

  _spousePalaceDesc(zhi, gender) {
    const descs = {
      0: '子水为配偶宫——配偶聪明灵动，适应力强，但情绪如潮水有涨有落。婚姻中需要多一些理解和耐心，给对方情绪上的支持。配偶可能从事流动性较强的职业。',
      1: '丑土为配偶宫——配偶踏实稳重，是可靠的终身伴侣。丑为金库，配偶可能在金融、技术或管理领域有所建树。婚姻稳定性高，但需注意增添生活情趣。',
      2: '寅木为配偶宫——配偶积极进取，有领导才能，但可能较为强势。寅为火之长生，配偶事业心强，有一定社会地位。婚姻中需要平等对话，互相尊重。',
      3: '卯木为配偶宫——配偶温柔善良，有艺术气质和审美品位。卯为桃花之地，配偶颜值较高或人缘好。婚姻质量较高，双方在精神和情感上契合度好。',
      4: '辰土为配偶宫——配偶有包容心和责任感，是可靠的另一半。辰为水库，配偶心思深沉有智慧。婚姻如细水长流，平淡中见真情，越久越醇。',
      5: '巳火为配偶宫——配偶热情有魅力，社交能力强人脉广。巳为金之长生，配偶在经济上对你可能有较大帮助。但性格较急，婚姻中需要互相迁就。',
      6: '午火为配偶宫——配偶热情开朗，颜值较高，但异性缘好需要注意。午为桃花旺地，婚姻中建立信任是最重要的课题。配偶可能在文艺或创意领域发展。',
      7: '未土为配偶宫——配偶温和善良，家庭观念强。未为木库，配偶有文化和教育方面的素养。婚姻生活温馨平淡，是细水长流的幸福。',
      8: '申金为配偶宫——配偶聪明独立，有自己的事业和主见。申为水之长生，配偶应变能力强。婚姻中两人最好保持各自的独立空间，不过度依赖也不过度控制。',
      9: '酉金为配偶宫——配偶精致讲究，注重生活品质和外在形象。酉为桃花地，配偶魅力出众。需要注意婚姻中的信任和沟通，避免因为小事产生嫌隙。',
      10: '戌土为配偶宫——配偶忠诚可靠，但有时固执己见。戌为火库，配偶内心有热情但不善表达。婚姻需要多沟通少较劲，互相理解对方的表达方式。',
      11: '亥水为配偶宫——配偶感性浪漫，有丰富的内心世界。亥为木之长生，配偶有成长潜力。婚姻中可能需要你多承担一些实际事务，让配偶发挥创意和灵感方面的优势。'
    };
    return descs[zhi] || '配偶宫位平和，伴侣性格稳定，婚姻中相互尊重最为重要。';
  },

  _tenGodAnalysis(shiShen, p, dm, gender) {
    const tenGodNames = {
      '比肩': '比肩代表自己、兄弟朋友、竞争与合作。命局中比肩多者，独立自主意识强，不喜受人管束，适合创业或自由职业。',
      '劫财': '劫财代表同辈中的竞争者，也代表行动力和魄力。劫财旺者敢想敢干，但需注意冲动决策和人际摩擦。在合作中要明确权责边界。',
      '食神': '食神代表才华、口福、享受和创造力。食神旺者天性乐观，有艺术天赋，人缘好。食神也代表输出和表达，适合从事需要创意的行业。',
      '伤官': '伤官代表聪明才智、创新思维和叛逆精神。伤官旺者智商高、有才华，但有时锋芒太露容易得罪人。学会收敛和包装自己的想法，会更利于事业发展。',
      '偏财': '偏财代表意外之财、投资回报和商业头脑。偏财旺者善于发现赚钱机会，适合经商或投资。但也需注意风险控制，不可过于投机。',
      '正财': '正财代表稳定的收入、工资和积蓄。正财旺者理财观念强，财运稳健。在感情中，正财也代表对家庭的责任感和稳定的婚姻。',
      '偏印': '偏印代表特殊的智慧、创意和非传统思维。偏印旺者直觉敏锐，有独特的天赋，适合在专业领域深耕。但有时思虑过多，需要增强行动力。',
      '正印': '正印代表学识、贵人、长辈的关爱和保护。正印旺者学习能力强，有贵人运，一生中常有长辈或上级提携。正印也代表慈悲心和包容力。',
      '七杀': '七杀代表权威、挑战、竞争和压力。七杀旺者事业心强，有领导力和魄力，适合从事军警、管理、竞争性强的行业。需注意压力管理和健康。',
      '正官': '正官代表规则、秩序、责任和社会地位。正官旺者自律性强，有社会责任感，适合在体制内或大型组织发展。在感情中，正官代表正经的婚姻缘分。'
    };

    const godOrder = ['year', 'month', 'day', 'hour'];
    const godNames = ['年', '月', '日', '时'];
    let analysis = '十神是八字命理中描述天干之间关系的核心概念，揭示了人生各个维度的信息：\n\n';

    for (let i = 0; i < godOrder.length; i++) {
      const god = godOrder[i];
      if (god === 'day') {
        analysis += `日柱天干为「日主」，是命主本人，不参与十神比较。\n\n`;
        continue;
      }
      const godName = shiShen[god].gan;
      const desc = tenGodNames[godName] || '';
      const ganName = TIAN_GAN[p[god].gan];
      analysis += `${godNames[i]}干${ganName}为「${godName}」——${desc}\n\n`;
    }

    return analysis.trim();
  },

  _wuxingInteractionAnalysis(dm, wxCount, missWx, yongShen, strength) {
    const wxOrder = ['金', '木', '水', '火', '土'];
    const wxIdx = wxOrder.indexOf(dm);

    // 生克关系
    const shengWo = wxOrder[(wxIdx + 4) % 5]; // 生我者
    const woSheng = wxOrder[(wxIdx + 1) % 5]; // 我生者
    const keWo = wxOrder[(wxIdx + 3) % 5];   // 克我者
    const woKe = wxOrder[(wxIdx + 2) % 5];   // 我克者

    let analysis = '';

    analysis += `日主${dm}，在五行循环中：${shengWo}生${dm}（印星，给我力量）、${dm}生${woSheng}（食伤，我输出的才华）、${keWo}克${dm}（官杀，给我的压力）、${dm}克${woKe}（财星，我掌控的资源）。\n\n`;

    // 用神分析
    analysis += `根据命局综合分析，你的「用神」（最需要的五行）为${yongShen.element}。`;
    analysis += yongShen.reason + '\n\n';

    // 五行缺失的影响
    if (missWx.length > 0) {
      analysis += `命局五行缺${missWx.join('、')}，这会在对应的生活领域产生一定影响：\n`;
      for (const wx of missWx) {
        const wxImpacts = {
          '金': '缺金可能在决断力和原则性方面需要后天加强，也需注意呼吸系统保养。可通过穿戴白色/金色、佩戴金属饰品、多接触金融/法律类知识来补金。',
          '木': '缺木可能在创造力和韧性方面需要后天培养，也需注意肝胆健康。可通过多接触大自然、种植绿植、穿戴绿色来补木。',
          '水': '缺水可能在灵活性和直觉力方面需要后天锻炼，也需注意肾脏和泌尿系统。可通过多喝水、游泳、养鱼、穿戴蓝黑色来补水。',
          '火': '缺火可能在热情和表现力方面需要后天激发，也需注意心血管保养。可通过多晒太阳、运动、穿戴红紫色来补火。',
          '土': '缺土可能在稳重性和安全感方面需要后天建立，也需注意脾胃健康。可通过接触大地（陶艺、园艺）、穿戴黄色/棕色来补土。'
        };
        analysis += `• ${wxImpacts[wx] || ''}\n`;
      }
      analysis += '\n';
    } else {
      analysis += '命局五行俱全，先天条件较好，五行之间能够相互制衡和流通，人生各方面运势相对平衡。但"全"不等于"均"，仍然需要通过后天的努力来优化五行力量的配比。\n\n';
    }

    // 五行流通建议
    analysis += `从五行流通来看，${strength === '偏强' ? `你的命局喜${keWo}、${woSheng}、${woKe}来平衡过旺的${dm}气。在日常生活和职业选择中，多接触这些五行属性的人事物，有助于运势的平衡和提升。` : strength === '偏弱' ? `你的命局喜${shengWo}、${dm}来补强偏弱的日主。在日常生活和职业选择中，多接触这些五行属性的人事物，有助于增强自身能量。` : `你的命局相对中和，五行流通较好。保持现有的平衡状态，同时根据实际需要适当补充不足的元素即可。`}`;

    return analysis;
  },

  _calcYongShen(dm, strength, wxCount, missWx) {
    const wxOrder = ['金', '木', '水', '火', '土'];
    const wxIdx = wxOrder.indexOf(dm);
    const shengWo = wxOrder[(wxIdx + 4) % 5];
    const keWo = wxOrder[(wxIdx + 3) % 5];

    if (strength === '偏强') {
      // 身强喜克泄耗
      const candidates = [
        { element: keWo, reason: `因为日主${dm}偏强，需要${keWo}来克制过旺的日主，使命局趋于平衡。${keWo}是你的"官杀"，能给你适度的压力和动力，让你更加精进。` },
        { element: wxOrder[(wxIdx + 1) % 5], reason: `日主${dm}偏强，用${wxOrder[(wxIdx + 1) % 5]}来泄秀（食伤生财），将过旺的精力转化为才华和财富的输出。` }
      ];
      // 优先选五行中较弱的
      for (const c of candidates) {
        if (wxCount[c.element] < 3) return c;
      }
      return candidates[0];
    } else if (strength === '偏弱') {
      // 身弱喜生扶
      const candidates = [
        { element: shengWo, reason: `因为日主${dm}偏弱，需要${shengWo}来生助日主，增强自身能量。${shengWo}是你的"印星"，代表贵人和学识，多接触${shengWo}属性的人和事物对运势大有裨益。` },
        { element: dm, reason: `日主${dm}偏弱，需要同五行（${dm}）来帮身（比劫助身），增强自信和行动力。多与${dm}属性的人为伍，互相扶持。` }
      ];
      for (const c of candidates) {
        if (wxCount[c.element] < 3) return c;
      }
      return candidates[0];
    } else {
      // 中和
      if (missWx.length > 0) {
        return { element: missWx[0], reason: `命局中和，但五行缺${missWx[0]}，适当补充${missWx[0]}的能量能让命局更加完整和流通。` };
      }
      return { element: dm, reason: '命局中和，五行流通良好，保持现有的平衡状态即可。可以日主五行作为参考方向。' };
    }
  },

  _personalityDeepAnalysis(dm, p, strength, gender) {
    const traits = {
      '金': [
        '核心性格：果断坚毅，重情重义，有原则和底线。行事风格利落，不喜欢拖泥带水。在团队中往往是那个敢于拍板的人。',
        `思维方式：逻辑清晰，善于抓住事物本质。${strength === '偏强' ? '思维偏向"硬逻辑"，有时过于理性和固执。' : '思维灵活，能理性分析也能听取他人意见。'}在做决策时，你更相信自己的判断而非他人的建议。`,
        `情感模式：外表刚硬内心火热。你可能不善于表达情感，但会通过行动来证明你的在乎。${gender === '女' ? '作为女性，你的独立和坚强让很多人佩服，但也有人会觉得你"不够温柔"。记住，强大和温柔并不矛盾。' : '作为男性，你的可靠和担当是最大的魅力，但伴侣可能希望你能多一些情感上的交流和表达。'}`,
        '社交表现：在社交场合有选择性——不是所有人都值得你的时间和精力。但一旦认定是朋友，就会非常讲义气。你的人脉网络质量高于数量。',
        '潜在挑战：金多易折，刚过易断。学会在坚持原则的同时保留弹性，在果断决策的同时多听不同声音。'
      ],
      '木': [
        '核心性格：仁厚善良，积极向上，有同理心和创造力。你是那种能给人带来希望和温暖的人，天生具有治愈他人的能力。',
        `思维方式：善于联想和发散，有丰富的想象力和创造力。${strength === '偏强' ? '思维开阔有大局观，是很好的策划者和梦想家。' : '思维细腻敏感，善于捕捉细节中的机会。'}学习能力是你的核心优势。`,
        `情感模式：在感情中温柔体贴，善于照顾对方的感受。${gender === '女' ? '你是那种让人如沐春风的女性，温暖而有力量。但有时过于付出需要学会保护自己的边界。' : '你有一种特别的温柔力量，不是强势的霸道而是春风化雨的影响力。女生会觉得你很"暖"。'}`,
        '社交表现：人缘很好，朋友众多。你善于倾听和共情，是朋友圈中的"心灵导师"。但有时过于照顾他人而委屈了自己。',
        '潜在挑战：有时过于理想主义，对现实感到失望。需要在理想和现实之间找到平衡，把梦想转化为可行的计划。'
      ],
      '水': [
        '核心性格：聪慧机敏，适应力强，有深沉的智慧和丰富的内心世界。你像水一样——放在什么容器里就能变成什么形状，生存能力极强。',
        `思维方式：思维灵活多变，善于从不同角度看问题。${strength === '偏强' ? '格局宏大，有战略眼光和长远规划能力。' : '心思细腻，直觉敏锐，善于察觉别人忽略的细节。'}你的创意和洞察力是最大的天赋。`,
        `情感模式：情感丰富而深沉。你不轻易表露内心，但情感深度超过大多数人。${gender === '女' ? '你有一种神秘的气质，让人想要接近却又觉得难以捉摸。感情中追求灵魂的共鸣。' : '你深沉而有魅力，但情绪波动可能让伴侣感到无所适从，学会表达和沟通很重要。'}`,
        '社交表现：能和各种类型的人打交道，社交灵活性极高。你懂得"到什么山唱什么歌"，这种能力让你在复杂的人际环境中游刃有余。',
        '潜在挑战：水无定形，有时过于随波逐流，缺乏坚定的立场。在该坚定的时候坚定，在该灵活的时候灵活，是你的人生功课。'
      ],
      '火': [
        '核心性格：热情开朗，充满活力，有强烈的感染力和领导欲。你是那种一进门就能让整个房间"亮起来"的人。',
        `思维方式：快速敏捷，善于当机立断。${strength === '偏强' ? '思维跳跃性强，创意源源不断，但有时缺乏深度思考。' : '思维活跃但不失缜密，能在快速反应和深度思考之间找到平衡。'}行动力是你最大的优势。`,
        `情感模式：敢爱敢恨，情感表达直接而热烈。${gender === '女' ? '你是新时代的独立女性代表——自信、主动、不依附。在感情中你也希望占据主导，但要注意给对方表达的空间。' : '你热情主动，是恋爱中的"进攻型"选手。浪漫是你的天赋，但长久的关系需要的不只是激情。'}`,
        '社交表现：天生的社交达人，走到哪里都是焦点。你善于调动气氛，让人感到快乐和振奋。但有时需要注意社交节奏，你不是永动机，也需要独处充电。',
        '潜在挑战：急躁是你的头号敌人。想得快、说得快、做得快——但欲速则不达。学会"小火慢炖"的智慧。'
      ],
      '土': [
        '核心性格：稳重诚信，包容大度，是所有人眼中"靠谱"的代名词。你像大地一样——不言不语，但承载和滋养着身边的一切。',
        `思维方式：务实稳健，重视逻辑和经验的积累。${strength === '偏强' ? '思维缜密有深度，善于做长线规划和系统性的思考。' : '思维踏实本分，一步一个脚印，不投机取巧。'}你的可靠和耐心是你最大的财富。`,
        `情感模式：不善于花哨的浪漫，但会用实际的行动来表达爱。${gender === '女' ? '你是传统意义上的"贤妻良母"——但这不是贬义，而是说你具有维系一个幸福家庭的所有品质。' : '你给伴侣满满的安全感，是那个可以托付终身的人。但偶尔也需要一些小浪漫来调剂感情。'}`,
        '社交表现：朋友数量可能不多，但每一个都是真朋友。你不善于social，但善于深交。在朋友眼中，你是那个最值得信赖的人。',
        '潜在挑战：过于保守，害怕变化。记住——大地也会"地震"，适时的变化不是背叛自己而是进化。勇敢拥抱新事物。'
      ]
    };
    return (traits[dm] || traits['土']).join('\n\n');
  },

  _careerWealthDeepAnalysis(dm, p, wxCount, yongShen, gender) {
    const careerAdvice = {
      '金': {
        industries: '金融投资、法律法务、企业管理、工程技术、军警纪律部队、审计监察、精密制造、珠宝鉴定',
        strategy: `职场策略：你的专业能力和决断力是最大武器。适合在需要明确规则和专业壁垒的领域深耕。${gender === '女' ? '作为女性，在男性主导的金属性行业中反而更容易脱颖而出。' : '你有天然的领袖气质，35岁前后有望走上高级管理岗位。'}在团队中你适合做决策者而非执行者。`,
        wealth: '财富特征：正财运稳健，偏财运偶有亮点。你的财富增长模式偏向"厚积薄发"——前期积累较慢，但一旦突破临界点就会加速。投资风格偏向稳健型，建议关注蓝筹股、黄金、优质债券等。35-45岁是财富积累黄金期。'
      },
      '木': {
        industries: '教育培训、文化传媒、艺术设计、医疗健康、环保生态、心理咨询、出版写作、青少年教育',
        strategy: `职场策略：你的学习能力和创造力是核心竞争力。适合在需要持续学习和创新的领域发展。${gender === '女' ? '在教育、文化、心理咨询等领域有天然的优势。' : '你的亲和力让你在团队协作中如鱼得水，适合做连接者和协调者。'}建议在30岁前确定主攻方向，然后持续深耕。`,
        wealth: '财富特征：财富如树木生长——前期投入大（学习、考证、积累），后期回报高。正财为主，偏财一般。长期投资（基金定投、教育投资）对你最有利。30岁前重点投资自己，回报在下半场。'
      },
      '水': {
        industries: '科研学术、咨询策划、媒体传播、国际贸易、物流运输、IT互联网、旅游行业、智慧水务',
        strategy: `职场策略：你的智慧和沟通能力是最大的优势。适合在需要脑力和灵活性的领域发光发热。${gender === '女' ? '在咨询、传媒、艺术创作等领域有出色的表现。' : '在科技、金融、国际贸易等领域能大有作为。'}建议走"专家路线"——在细分领域做到极致。`,
        wealth: '财富特征：财运流动性强，有赚有花，但整体增长。善于发现赚钱机会，但同样容易被消费诱惑。建议建立强制储蓄和自动投资机制。多元化投资最适合你的命局——不把鸡蛋放一个篮子里。'
      },
      '火': {
        industries: '演艺娱乐、公关传媒、餐饮美食、科技创新、能源化工、市场营销、体育健身、时尚美妆',
        strategy: `职场策略：你的热情和表现力是你最大的职场武器。适合需要展现自我的领域。${gender === '女' ? '在时尚、美妆、演艺、公关等领域有天然优势，你的感染力能吸引大量追随者。' : '在科技创业、市场营销、体育等领域能发挥领导才能。'}不适合过于枯燥和重复的工作。`,
        wealth: '财富特征：财运如火焰——来去都快。赚钱能力强，花钱也大方。自媒体、直播、演讲等"一对多"模式最适你。建议把收入的30%强制储蓄或定投，剩下的自由支配。28-38岁是财富爆发期。'
      },
      '土': {
        industries: '房地产建筑、金融保险、行政管理、农业食品、教育培养、公共服务、人力资源、矿产资源',
        strategy: `职场策略：你的稳重和靠谱是最宝贵的职场品质。适合在需要责任心和耐心的领域长期发展。${gender === '女' ? '在行政管理、人力资源、教育等领域有出色的表现。' : '在房地产、金融、大型企业管理等领域能稳步上升。'}考取专业资质和证书对你的职业发展很有帮助。`,
        wealth: '财富特征：财运稳定，不善投机但善于守成。房产和固定资产是最适合你的投资方向。你会是那种"慢慢变富"的典型，40岁之后财务安全感越来越强。建议尽早开始房产或REITs投资。'
      }
    };

    const advice = careerAdvice[dm] || careerAdvice['土'];

    return `最佳行业方向：${advice.industries}\n\n${advice.strategy}\n\n${advice.wealth}\n\n用神为${yongShen.element}，在选择行业方向时也可多关注与${yongShen.element}五行相关的领域，有助于运势提升。`;
  },

  _marriageDeepAnalysis(p, dm, gender) {
    const dayZhi = p.day.zhi;
    const spouseWx = DZ_WUXING[dayZhi];
    const dmWx = dm;

    // 日支与日主的关系
    let relationship = '';
    const wxOrder = ['金', '木', '水', '火', '土'];
    const dmIdx = wxOrder.indexOf(dmWx);
    const spouseIdx = wxOrder.indexOf(spouseWx);

    if (spouseIdx === dmIdx) {
      relationship = '配偶宫五行与日主相同，意味着你们性格相似，价值观一致，是"同类相吸"的组合。好处是彼此理解，坏处是可能缺乏互补性。婚姻中需要在"同"与"异"之间找到平衡。';
    } else if (spouseIdx === (dmIdx + 1) % 5) {
      relationship = '日主生配偶宫（我生者），意味着你在婚姻中付出较多，愿意照顾和支持对方。你是给予型伴侣，配偶在你身边会感到很幸福。但也要注意不要过度付出而忽略了自己的需求。';
    } else if (spouseIdx === (dmIdx + 4) % 5) {
      relationship = '配偶宫生日主（生我者），意味着配偶是你的贵人和支持者。对方会在精神上或物质上滋养你，婚姻对你的成长大有裨益。要懂得珍惜和感恩这份缘分。';
    } else if (spouseIdx === (dmIdx + 3) % 5) {
      relationship = '配偶宫克日主（克我者），意味着配偶对你可能有一定的"管束"和要求。这在某种程度上是好事——对方推动你变得更好。但需要注意方式方法，避免让"关心"变成"压力"。';
    } else {
      relationship = '日主克配偶宫（我克者），意味着你在婚姻中有较强的主导权。对方可能比较依赖你的决策和引导。作为主导方，你需要多一些耐心和温柔，不要让对方感到被压制。';
    }

    const spouseDesc = this._spousePalaceDesc(dayZhi, gender);

    return `日支${DI_ZHI[dayZhi]}（${spouseWx}）为配偶宫。${spouseDesc}\n\n${relationship}\n\n${gender === '女' ? '女命以正官为夫星，日支配偶宫的状况直接反映婚姻质量。' : '男命以正财为妻星，日支配偶宫的状况直接反映婚姻质量。'}婚姻是一辈子的事，选择一个能互相成就的伴侣，比什么都重要。从命局来看，你的婚恋运势${['水','木'].includes(dmWx) ? '较旺' : '中等偏上'}，${strength === '偏强' && gender === '男' ? '建议在30岁前后考虑婚姻大事，此时运势最佳。' : '不必急于求成，缘分会在对的时间自然出现。'}`;
  },

  _healthDeepAnalysis(dm, wxCount, missWx) {
    const healthAdvice = {
      '金': {
        organs: '肺、大肠、气管、皮肤',
        advice: '金主呼吸系统，需特别关注肺部和呼吸道健康。秋冬季节是养肺黄金期，多吃白色食物（银耳、百合、梨、山药）。避免吸烟和长期处于空气污浊的环境中。适当进行深呼吸练习和有氧运动，增强肺活量。',
        avoid: '过度的悲伤和忧虑（悲忧伤肺），保持乐观心态对健康至关重要。'
      },
      '木': {
        organs: '肝、胆、筋、指甲',
        advice: '木主肝胆，需注意肝胆排毒和情绪管理。春季是养肝最佳时节，多吃绿色蔬菜（菠菜、西兰花、芹菜），喝菊花枸杞茶。晚上11点前入睡对肝脏修复非常重要。适度运动有助于疏通肝气。',
        avoid: '过度愤怒和压抑情绪（怒伤肝），学会合理表达和释放情绪。'
      },
      '水': {
        organs: '肾、膀胱、骨骼、耳朵',
        advice: '水主肾与泌尿系统，需注意下半身保暖和肾脏保养。冬季是补肾最佳时节，多吃黑色食物（黑豆、黑芝麻、黑木耳、海带）。睡前泡脚是极好的养生习惯。适当进行腰部锻炼和散步。',
        avoid: '过度恐惧和焦虑（恐伤肾），保持心态平和对肾脏健康至关重要。'
      },
      '火': {
        organs: '心脏、小肠、血管、舌头',
        advice: '火主心脏与血液循环，需关注心血管健康和情绪管理。夏季是养心最佳时节，多吃红色食物（红枣、枸杞、番茄）。午间小憩15分钟对心脏极好。保持适度运动但避免过度剧烈。',
        avoid: '过度兴奋和暴喜（喜伤心），保持情绪平稳对心脏健康很重要。'
      },
      '土': {
        organs: '脾、胃、肌肉、口腔',
        advice: '土主脾胃，需注意饮食规律和消化系统保养。季末（3、6、9、12月）是健脾最佳时节。多吃黄色食物（小米、南瓜、玉米、红薯），细嚼慢咽。避免暴饮暴食和长期吃冷食。',
        avoid: '过度思虑（思伤脾），学会放松大脑，不要把所有事情都扛在肩上。'
      }
    };

    const advice = healthAdvice[dm] || healthAdvice['土'];

    let missWxHealth = '';
    if (missWx.length > 0) {
      missWxHealth = '\n\n五行缺失对应的健康提示：';
      const missHealth = {
        '金': '缺金可能影响呼吸系统功能，注意肺部保养。',
        '木': '缺木可能影响肝胆功能，注意情绪管理和排毒。',
        '水': '缺水可能影响肾脏和泌尿系统，注意补水和保暖。',
        '火': '缺火可能影响心血管功能，注意保持活力和温暖。',
        '土': '缺土可能影响消化系统，注意饮食规律和脾胃保养。'
      };
      for (const wx of missWx) {
        missWxHealth += '\n• ' + (missHealth[wx] || '');
      }
    }

    return `重点关注器官：${advice.organs}\n\n${advice.advice}\n\n注意事项：${advice.avoid}${missWxHealth}`;
  },

  _currentYearAnalysis(dm, wxCount, yongShen) {
    const currentYear = new Date().getFullYear();
    const yearGanIdx = (currentYear - 4) % 10;
    const yearZhiIdx = (currentYear - 4) % 12;
    const yearGan = TIAN_GAN[yearGanIdx];
    const yearZhi = DI_ZHI[yearZhiIdx];
    const yearWx = TG_WUXING[yearGanIdx];
    const shengXiaoYear = SHENG_XIAO[yearZhiIdx];

    const wxOrder = ['金', '木', '水', '火', '土'];
    const dmIdx = wxOrder.indexOf(dm);
    const yearIdx = wxOrder.indexOf(yearWx);

    let analysis = `当前${currentYear}年为${yearGan}${yearZhi}年（${shengXiaoYear}年），流年天干五行属${yearWx}。`;

    if (yearIdx === dmIdx) {
      analysis += `\n\n流年与日主同五行（${dm}），今年运势总体平稳。适合在现有基础上深耕细作、巩固已有成果，不宜冒进做重大改变。保持稳定是今年的主题。`;
    } else if (yearIdx === (dmIdx + 4) % 5) {
      analysis += `\n\n流年五行生助日主（${yearWx}生${dm}），今年运势上扬，贵人运旺！这是近三年来最好的运程之一，宜积极进取、大胆尝试。事业和感情方面都可能迎来突破。把握住上半年的机会窗口，会有意想不到的收获。`;
    } else if (yearIdx === (dmIdx + 3) % 5) {
      analysis += `\n\n流年五行克制日主（${yearWx}克${dm}），今年可能会遇到一些挑战和压力。但这并非坏事——克你者也是成就你者。今年适合"修炼内功"，提升自己的专业能力和心理素质。稳扎稳打可以安然度过，甚至化压力为动力。`;
    } else if (yearIdx === (dmIdx + 1) % 5) {
      analysis += `\n\n日主生流年（${dm}生${yearWx}），今年是你"输出"的一年——适合展现才华、分享知识、拓展人脉。但注意不要过度消耗自己，要留出时间休息和充电。创意和表达类的项目今年特别容易出成果。`;
    } else {
      analysis += `\n\n日主克流年（${dm}克${yearWx}），今年你在很多方面都有主动权。适合主动出击、掌控局面。财运方面可能有意外之喜，但也要注意控制风险。总体来说是"付出就有回报"的一年。`;
    }

    // 用神与流年
    if (yearWx === yongShen.element) {
      analysis += `\n\n今年流年恰好走你的用神（${yongShen.element}）运，是好运加倍的一年！各项运势都有明显提升，尤其在事业和财运方面，把握好机会可以上一个台阶。`;
    }

    analysis += `\n\n关键月份：${this._keyMonths(dm, yearWx)}。`;

    return analysis;
  },

  _keyMonths(dm, yearWx) {
    const monthZhi = ['寅(2月)', '卯(3月)', '辰(4月)', '巳(5月)', '午(6月)', '未(7月)', '申(8月)', '酉(9月)', '戌(10月)', '亥(11月)', '子(12月)', '丑(1月)'];
    const monthWx = ['木', '木', '土', '火', '火', '土', '金', '金', '土', '水', '水', '土'];

    const wxOrder = ['金', '木', '水', '火', '土'];
    const dmIdx = wxOrder.indexOf(dm);
    const goodMonths = [];

    for (let i = 0; i < 12; i++) {
      const mIdx = wxOrder.indexOf(monthWx[i]);
      if (mIdx === (dmIdx + 4) % 5 || mIdx === dmIdx) { // 生我或同我
        goodMonths.push(monthZhi[i]);
      }
    }

    if (goodMonths.length > 0) {
      return `运势较好的月份：${goodMonths.slice(0, 4).join('、')}`;
    }
    return '全年运势相对平稳，无明显的高峰低谷';
  },

  _summaryAdvice(dm, strength, missWx, yongShen, gender, sx) {
    const summaries = {
      '金': `总的来说，你的命局日主为${dm}，是一个重情重义、刚毅果断的人。你的人生关键词是"淬炼"——每一次挑战都是让金更加纯净的机会。建议在事业上大胆追求自己的目标，在感情中多表达柔软的一面。用神为${yongShen.element}，日常生活中多接触${yongShen.element}属性的事物有助于运势提升。记住：精金百炼，方能成器。`,
      '木': `总的来说，你的命局日主为${dm}，是一个仁厚善良、生命力旺盛的人。你的人生关键词是"生长"——不急不躁，扎好根基，自然会枝繁叶茂。建议在事业上选好主攻方向持续深耕，在感情中保持真诚和温柔。用神为${yongShen.element}，多亲近大自然有助于身心平衡。记住：十年树木，百年树人。`,
      '水': `总的来说，你的命局日主为${dm}，是一个聪慧灵活、智慧深沉的人。你的人生关键词是"流动"——顺势而为，不拘一格。建议在事业上发挥你的智慧和沟通优势，在感情中学会表达和分享。用神为${yongShen.element}，保持开放和学习的心态是最好的开运方式。记住：上善若水，水善利万物而不争。`,
      '火': `总的来说，你的命局日主为${dm}，是一个热情奔放、充满活力的人。你的人生关键词是"发光"——不要压抑自己的光芒，世界需要你的热和光。建议在事业上追逐你真正热爱的事，在感情中保持激情但也学会细水长流。用神为${yongShen.element}，适当运动保持身体"热度"有助于运势。记住：星星之火，可以燎原。`,
      '土': `总的来说，你的命局日主为${dm}，是一个稳重诚信、值得信赖的人。你的人生关键词是"积累"——厚积薄发，大器晚成。建议在事业上保持耐心和定力，在感情中多增加些浪漫和情趣。用神为${yongShen.element}，稳定的生活节奏是你的最佳开运方式。记住：地势坤，君子以厚德载物。`
    };

    return (summaries[dm] || summaries['土']) + `\n\n作为属${sx}的${gender}命，你拥有独特的命理优势和人生课题。命由天定，运由己造。了解自己的命局是为了更好地发挥优势、规避风险，而真正决定人生高度的，永远是自己的选择和努力。🌈`;
  },

  // ========== 辅助方法 ==========

  _dmYinYang(ganIdx) {
    return TG_YINYANG[ganIdx] ? '阳' : '阴';
  },

  _formatCangGan(cgStr) {
    if (!cgStr) return '-';
    // 给藏干中的每个字上色
    let html = '';
    for (const char of cgStr) {
      const tgIdx = TIAN_GAN.indexOf(char);
      if (tgIdx >= 0) {
        html += `<span style="color:${WUXING_COLORS[TG_WUXING[tgIdx]]};font-size:0.82rem">${char}</span>`;
      } else {
        html += char;
      }
    }
    return html || '-';
  },

  _getNaYin(gan, zhi) {
    const naYinTable = [
      '海中金','炉中火','大林木','路旁土','剑锋金','山头火',
      '涧下水','城头土','白蜡金','杨柳木','泉中水','屋上土',
      '霹雳火','松柏木','流年水','砂石金','山下火','平地木',
      '壁上土','金箔金','覆灯火','天河水','大驿土','钗钏金',
      '桑柘木','柘溪水','沙中土','天上火','石榴木','大海水'
    ];
    const idx = ((gan * 6 + zhi * 5) % 60) % 30;
    return naYinTable[idx] || '';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  BaziModule.init();
});
