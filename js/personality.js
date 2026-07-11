/**
 * 性格分析 — 10道选择题 × 3选项，综合性格解读
 */
var PersonalityModule = {
  currentQ: 0,
  answers: [],

  questions: [
    {
      q: '👥 在聚会或社交场合中，你通常会？',
      options: [
        { text: '主动与人攀谈，享受热闹氛围，结识新朋友让你充满能量', trait: '外向', score: {E:3} },
        { text: '和熟悉的人待在一起，偶尔参与但更喜欢观察和倾听', trait: '平衡', score: {M:3} },
        { text: '找一个安静的角落，能不社交就不社交，独处让你更舒服', trait: '内向', score: {I:3} }
      ]
    },
    {
      q: '🤔 做重要决定时，你更相信？',
      options: [
        { text: '数据、逻辑和理性分析，用事实说话，反复权衡利弊', trait: '理性', score: {R:3} },
        { text: '直觉和内心感受，相信第一感觉，有时说不出理由但就是觉得对', trait: '感性', score: {F:3} },
        { text: '两者结合，先听直觉再找数据验证，或先分析再凭感觉决定', trait: '平衡', score: {M:3} }
      ]
    },
    {
      q: '😰 面对突如其来的压力或变化时，你的反应是？',
      options: [
        { text: '迅速调整心态，制定应对计划，压力让你更有动力', trait: '抗压', score: {H:3} },
        { text: '先焦虑一会儿，但最终会冷静下来慢慢处理', trait: '温和', score: {M:3} },
        { text: '感到不知所措，需要较长时间消化，希望有人帮你分担', trait: '敏感', score: {S:3} }
      ]
    },
    {
      q: '❤️ 在表达情感和内心想法方面，你倾向于？',
      options: [
        { text: '直率坦诚，心里有什么就说什么，不喜欢藏着掖着', trait: '外放', score: {O:3} },
        { text: '适度表达，看场合和对象决定是否分享内心想法', trait: '平衡', score: {M:3} },
        { text: '比较内敛，不太主动表达情感，很多事情藏在心里自己消化', trait: '内敛', score: {C:3} }
      ]
    },
    {
      q: '🧠 在处理复杂问题时，你的思维方式是？',
      options: [
        { text: '系统规划型：先做整体框架，拆解成小步骤，按计划一步步执行', trait: '系统', score: {G:3} },
        { text: '灵活应变型：走一步看一步，边做边调整，不喜欢被计划束缚', trait: '灵活', score: {L:3} },
        { text: '直觉跳跃型：脑海中突然蹦出答案或灵感，然后再回头理清思路', trait: '直觉', score: {N:3} }
      ]
    },
    {
      q: '🏃 关于生活节奏和日常安排，你更接近？',
      options: [
        { text: '喜欢节奏紧凑、日历排满的感觉，无所事事会让你焦虑', trait: '积极', score: {A:3} },
        { text: '介于两者之间，有安排也可以随时调整，保持适度的弹性', trait: '平衡', score: {M:3} },
        { text: '更喜欢从容不迫的慢节奏，随遇而安，享受当下的悠闲时光', trait: '从容', score: {Y:3} }
      ]
    },
    {
      q: '⚔️ 当与亲近的人发生矛盾时，你通常？',
      options: [
        { text: '主动沟通面对，把问题摆上台面，即使争吵也要把话说清楚', trait: '直面', score: {Z:3} },
        { text: '先冷处理，等双方情绪平复后再找合适的时机沟通', trait: '冷静', score: {D:3} },
        { text: '尽量回避冲突，选择让步或转移话题，不想破坏关系', trait: '回避', score: {B:3} }
      ]
    },
    {
      q: '🎯 关于目标和梦想，你的态度是？',
      options: [
        { text: '有明确的目标和清晰的人生规划，并且每天都在为之努力', trait: '进取', score: {J:3} },
        { text: '有大方向但不设细节，顺其自然地发展，相信船到桥头自然直', trait: '随缘', score: {W:3} },
        { text: '不太想太远的事，更注重当下的快乐和眼前的每一天', trait: '当下', score: {X:3} }
      ]
    },
    {
      q: '🏠 独处的时候，你的感受通常是？',
      options: [
        { text: '充实自在，独处让你思考和充电，是你不可或缺的精神食粮', trait: '自足', score: {P:3} },
        { text: '偶尔享受独处，但时间长了会觉得孤单，需要社交来平衡', trait: '平衡', score: {M:3} },
        { text: '不太喜欢独处，一个人待着容易胡思乱想，需要有人陪伴才有安全感', trait: '依赖', score: {Y:3} }
      ]
    },
    {
      q: '🌟 你人生中最重要的价值追求是？',
      options: [
        { text: '成就与认可——希望在自己的领域有所建树，被他人肯定和尊重', trait: '成就', score: {C:3} },
        { text: '关系与爱——拥有温暖的家庭和真挚的友谊，情感连接是生命的意义', trait: '关系', score: {R:3} },
        { text: '自由与体验——探索世界、体验多样化的人生，不被任何框架束缚', trait: '自由', score: {F:3} }
      ]
    }
  ],

  open: function() {
    document.getElementById('personalityOverlay').classList.add('active');
    this.currentQ = 0;
    this.answers = [];
    document.getElementById('psStart').style.display = 'block';
    document.getElementById('psQuiz').style.display = 'none';
    document.getElementById('psResult').style.display = 'none';
  },

  close: function() {
    document.getElementById('personalityOverlay').classList.remove('active');
  },

  start: function() {
    document.getElementById('psStart').style.display = 'none';
    document.getElementById('psQuiz').style.display = 'block';
    document.getElementById('psResult').style.display = 'none';
    this.currentQ = 0;
    this.answers = [];
    this._showQuestion();
  },

  _showQuestion: function() {
    var q = this.questions[this.currentQ];
    document.getElementById('psQNum').textContent = (this.currentQ + 1) + ' / 10';
    document.getElementById('psQuestion').textContent = q.q;
    var bar = document.getElementById('psProgress');
    bar.style.width = ((this.currentQ) / 10 * 100) + '%';

    var html = '';
    for (var i = 0; i < q.options.length; i++) {
      html += '<button class="quiz-option-btn" onclick="PersonalityModule._answer(' + i + ')">' +
        q.options[i].text + '</button>';
    }
    document.getElementById('psOptions').innerHTML = html;
  },

  _answer: function(idx) {
    var q = this.questions[this.currentQ];
    this.answers.push({qIdx: this.currentQ, optionIdx: idx, trait: q.options[idx].trait, scores: q.options[idx].score});

    this.currentQ++;
    if (this.currentQ >= this.questions.length) {
      this._showResult();
    } else {
      this._showQuestion();
      var bar = document.getElementById('psProgress');
      bar.style.width = ((this.currentQ) / 10 * 100) + '%';
    }
  },

  _showResult: function() {
    document.getElementById('psQuiz').style.display = 'none';
    document.getElementById('psResult').style.display = 'block';

    // 统计特质
    var traitCount = {};
    for (var i = 0; i < this.answers.length; i++) {
      var t = this.answers[i].trait;
      traitCount[t] = (traitCount[t] || 0) + 1;
    }

    // 找到主要特质（出现次数最多的）
    var topTraits = [];
    var maxCount = 0;
    for (var key in traitCount) {
      if (traitCount[key] > maxCount) {
        maxCount = traitCount[key];
        topTraits = [key];
      } else if (traitCount[key] === maxCount) {
        topTraits.push(key);
      }
    }

    // 生成分析
    var profile = this._buildProfile(traitCount, topTraits);

    document.getElementById('psResultHeader').innerHTML = profile.title;
    document.getElementById('psResultContent').innerHTML = profile.content;
    Paywall.checkCover('psResult');
  },

  _buildProfile: function(traitCount, topTraits) {
    var title = '';
    var content = '';

    // 综合性格类型
    var balanceCount = traitCount['平衡'] || 0;

    if (balanceCount >= 5) {
      title = '🌈 平衡型人格';
      content = '<p><b>核心特质：</b>你是人群中的"调和者"。性格弹性大，能根据不同场合调整自己的状态。既不过于外向也不过于内向，既理性又感性。</p>' +
        '<p><b>优势：</b>适应力强，善于平衡不同的人和事。人际关系通常比较和谐，不容易走极端。思考全面，做出的决定往往比较稳妥。</p>' +
        '<p><b>成长方向：</b>平衡是优势但有时也会显得缺乏鲜明的个人特色。偶尔也需要有自己的棱角和坚持，不必总是做"中间派"。</p>' +
        '<p><b>适合的领域：</b>协调管理、教育辅导、公关咨询、医疗护理等需要同理心和应变力的工作。</p>';
    } else {
      // Build based on dominant traits
      var dominant = topTraits[0];

      var profiles = {
        '外向': {
          title: '🌟 外向开放型',
          content: '<p><b>核心特质：</b>你是一个充满能量的人，社交是你的充电方式。你热情开朗，善于表达，在人群中如鱼得水。</p>' +
            '<p><b>优势：</b>沟通能力出色，容易建立广泛的人脉。行动力强，想到就做，不拖泥带水。感染力强，能带动周围人的情绪。</p>' +
            '<p><b>注意：</b>有时需要注意深度而非广度，不是所有关系都需要维护。偶尔停下来独处，听听内心的声音。</p>' +
            '<p><b>适合领域：</b>销售、市场、演讲、娱乐、公关、管理、创业等需要大量社交的领域。</p>'
        },
        '内向': {
          title: '🌙 内向思考型',
          content: '<p><b>核心特质：</b>你是一个向内探索的人。独处是你恢复能量的方式，深度而非广度是你的人际原则。你善于思考和观察，内心世界丰富。</p>' +
            '<p><b>优势：</b>专注力强，能深入钻研问题。独立思考能力出色，不盲从。情感细腻，能敏锐察觉他人的情绪和需要。</p>' +
            '<p><b>注意：</b>适度社交有益于拓展视野和机会。你的想法和才华需要适时展示给外界，不要一直藏在心里。</p>' +
            '<p><b>适合领域：</b>研究、写作、编程、设计、艺术创作、数据分析、心理咨询等需要深度思考的领域。</p>'
        },
        '理性': {
          title: '🧮 理性分析型',
          content: '<p><b>核心特质：</b>你是一个用头脑而非情绪做决定的人。逻辑清晰、实事求是是你的标签。你相信数据胜过感觉，喜欢把事情弄清楚再行动。</p>' +
            '<p><b>优势：</b>决策质量高，不容易被情绪或他人左右。看问题全面深入，做事有条不紊。在危机中能保持冷静。</p>' +
            '<p><b>注意：</b>人际关系中有时过于理性会显得"冷"，多关注他人的情感需求。有些事情不需要完美的答案，过程中的感受也很重要。</p>' +
            '<p><b>适合领域：</b>科研、工程技术、金融分析、法律、医学、审计等需要严谨思维的工作。</p>'
        },
        '感性': {
          title: '💗 感性共情型',
          content: '<p><b>核心特质：</b>你是一个用心感受世界的人。情绪丰富、直觉敏锐是你的天赋。你善于理解他人，能够体会别人未曾言说的情感。</p>' +
            '<p><b>优势：</b>共情能力强，是很好的倾听者和支持者。审美和创造力出众，对美和情感有独特的感知力。直觉往往很准。</p>' +
            '<p><b>注意：</b>情绪容易受外界影响，需要学会设立情感边界。重要决定时多参考客观事实，平衡感性与理性。</p>' +
            '<p><b>适合领域：</b>艺术、音乐、文学、心理咨询、教育、社会工作、用户体验设计等需要感受力的领域。</p>'
        },
        '抗压': {
          title: '🛡️ 坚韧抗压型',
          content: '<p><b>核心特质：</b>你是一个能在风雨中前行的人。压力不会击垮你反而让你更强大。你有超常的心理韧性和自我调节能力。</p>' +
            '<p><b>优势：</b>危机处理能力强，能在混乱中保持方向。责任感强，是团队中可以依赖的定海神针。不服输的韧劲让你能坚持到最后。</p>' +
            '<p><b>注意：</b>不要一直绷得太紧，适当休息是为了走更远的路。不是所有压力都需要自己扛，学会求助也是一种能力。</p>' +
            '<p><b>适合领域：</b>创业、急救、军事、项目管理、新闻传媒、竞技体育等高压高要求的领域。</p>'
        },
        '敏感': {
          title: '🦋 敏感细致型',
          content: '<p><b>核心特质：</b>你是一个感知力超群的人。你能注意到别人忽略的细节，感受到微妙的氛围变化。你的敏感是一份天赋，让你能深度理解这个世界。</p>' +
            '<p><b>优势：</b>观察力极强，细节把控出色。有很好的审美和品味。情感丰富，能创作出触动人心的作品。</p>' +
            '<p><b>注意：</b>学会区分"别人的问题"和"自己的问题"，不要把所有事情都放在心上。建立自己的心理保护机制。</p>' +
            '<p><b>适合领域：</b>艺术创作、设计、编辑校对、质量检测、心理咨询等需要敏锐感知的工作。</p>'
        },
        '外放': {
          title: '🔥 坦率直爽型',
          content: '<p><b>核心特质：</b>你是一个真诚透明的人。心里有什么说什么，不喜欢拐弯抹角。你的坦率让身边的人感到放松，因为不用猜你的心思。</p>' +
            '<p><b>优势：</b>沟通成本低，做事干脆利落。朋友觉得你值得信赖，因为你是表里如一的人。行动力强，不内耗。</p>' +
            '<p><b>注意：</b>有时需要注意表达方式，同样的话换个说法效果完全不同。不是所有人都能接受直来直去的风格。</p>' +
            '<p><b>适合领域：</b>演讲、教练、销售、法律、管理、创业等需要直接沟通和快速决策的领域。</p>'
        },
        '内敛': {
          title: '🏔️ 沉稳内敛型',
          content: '<p><b>核心特质：</b>你是一个深藏不露的人。话不多但句句有分量，情感不轻易外露但内心热烈。你像一座山，沉默但可靠。</p>' +
            '<p><b>优势：</b>稳重可靠，是团队中不可或缺的基石。思考深入，不轻易表态，一旦开口往往切中要害。情绪稳定，不容易被外界干扰。</p>' +
            '<p><b>注意：</b>适当表达自己的需求和感受，身边的人不是读心者。有时候你需要主动站出来发声。</p>' +
            '<p><b>适合领域：</b>战略规划、工程技术、风险控制、研究分析等需要沉稳性格的工作。</p>'
        },
        '系统': {
          title: '📋 系统规划型',
          content: '<p><b>核心特质：</b>你是一个有条不紊的组织者。凡事预则立，你喜欢把一切都安排得明明白白。你的生活和工作都井井有条。</p>' +
            '<p><b>优势：</b>执行力强，一旦制定了计划就一定会完成。靠谱准时，别人可以放心把重要事情交给你。效率极高，很少浪费时间。</p>' +
            '<p><b>注意：</b>生活偶尔也需要一些意外和即兴。计划被打乱时学会灵活应变，执着的另一面是固执。</p>' +
            '<p><b>适合领域：</b>项目管理、财务规划、运营管理、工程监理等需要系统思维和计划性的工作。</p>'
        },
        '灵活': {
          title: '🌊 灵活应变型',
          content: '<p><b>核心特质：</b>你是一个如水般流动的人。随机应变是你的超能力。计划赶不上变化？对你来说变化本身就是计划的一部分。</p>' +
            '<p><b>优势：</b>适应力极强，在任何环境中都能找到生存之道。创意丰富，善于即兴发挥。心态开放，愿意尝试新事物。</p>' +
            '<p><b>注意：</b>灵活之余也需要一些定力。有些目标需要长期坚持才能看到效果，不要每件事都浅尝辄止。</p>' +
            '<p><b>适合领域：</b>创意设计、媒体公关、市场推广、演艺娱乐等变化快、需要灵活应对的行业。</p>'
        },
        '直觉': {
          title: '💡 直觉创新型',
          content: '<p><b>核心特质：</b>你是一个灵感迸发的人。答案常常在你脑海中不期而至。你的思维方式跳跃但往往能直击本质。</p>' +
            '<p><b>优势：</b>创新力强，能看到别人看不到的连接和可能性。学习速度快，能迅速抓住核心要点。有艺术和创造天赋。</p>' +
            '<p><b>注意：</b>灵感需要落地才能产生实际价值。适当的系统化思维可以帮助你把好想法变成现实。</p>' +
            '<p><b>适合领域：</b>发明创新、艺术创作、战略咨询、品牌策划等需要突破性思维的领域。</p>'
        },
        '积极': {
          title: '🚀 积极进取型',
          content: '<p><b>核心特质：</b>你是一个永远在奔跑的人。人生的赛道上你不想落后，目标感强烈，行动力超群。你相信努力可以改变命运。</p>' +
            '<p><b>优势：</b>自驱力强，不需要别人督促。事业心重，容易取得成就。正能量满满，能激励身边的人。</p>' +
            '<p><b>注意：</b>慢下来不代表退步。适当休息和反思比一直奔跑更重要。别忘了享受过程，目的地固然重要但沿途风景也很美。</p>' +
            '<p><b>适合领域：</b>创业、竞技体育、销售业务、科技行业等需要高能量驱动的工作。</p>'
        },
        '从容': {
          title: '🍃 从容淡定型',
          content: '<p><b>核心特质：</b>你是一个"慢生活"的践行者。你相信欲速则不达，从容淡定是你的处世哲学。你享受过程，不急不躁。</p>' +
            '<p><b>优势：</b>心态好，不容易焦虑。生活质量高，懂得享受和品味。人际关系松弛自然，不给别人压力。</p>' +
            '<p><b>注意：</b>有时需要给自己一些紧迫感，机会稍纵即逝。悠闲是福，但偶尔也需要一点"狼性"。</p>' +
            '<p><b>适合领域：</b>文化艺术、养生保健、教育辅导、旅游休闲等节奏较慢但需要品质感的行业。</p>'
        },
        '直面': {
          title: '⚔️ 直面冲突型',
          content: '<p><b>核心特质：</b>你是一个遇到问题不躲避的人。冲突对你来说是需要解决的问题而不是需要逃避的战场。你的勇敢让人尊敬。</p>' +
            '<p><b>优势：</b>问题解决能力强，不积攒情绪。关系透明，身边的人知道你的底线。敢于说真话，是团队中的"镜子"。</p>' +
            '<p><b>注意：</b>方式方法很重要，直面不等于"硬碰硬"。有些关系需要在温和中修复，不是所有战都必须打。</p>' +
            '<p><b>适合领域：</b>法律、仲裁、管理、谈判等需要勇气和沟通技巧的领域。</p>'
        },
        '回避': {
          title: '🕊️ 和平维护型',
          content: '<p><b>核心特质：</b>你是一个珍视和谐的人。冲突让你不舒服，你更愿意用温和的方式处理分歧。你的存在让周围更和平。</p>' +
            '<p><b>优势：</b>人际关系和谐，是团队中的"润滑剂"。为人谦和，容易相处。善于在矛盾中找到折中点。</p>' +
            '<p><b>注意：</b>长期回避冲突可能导致问题积累。学会在适当的时候温和地表达不同意见，这不是破坏关系而是维护关系的健康。</p>' +
            '<p><b>适合领域：</b>外交、客服、教育、护理等需要耐心和包容心的领域。</p>'
        },
        '进取': {
          title: '🏆 目标驱动型',
          content: '<p><b>核心特质：</b>你是一个有方向感的人。目标是你生活的指南针。你清楚自己想要什么，并且会付出持续的努力去达成。</p>' +
            '<p><b>优势：</b>方向明确不走弯路，效率高。有成就动机，容易在事业上获得成功。自律性强，是别人眼中的榜样。</p>' +
            '<p><b>注意：</b>目标的达成不等于人生的全部。偶尔也要问问自己"这是否让我快乐"，而不仅仅是"这是否有用"。</p>' +
            '<p><b>适合领域：</b>企业管理、创业、竞技体育、学术研究等需要长期专注和目标导向的领域。</p>'
        },
        '自足': {
          title: '🏡 独立自足型',
          content: '<p><b>核心特质：</b>你是一个不依赖他人也能活得很好的人。独处让你充实而非空虚。你有丰富的精神世界，一个人就是一支队伍。</p>' +
            '<p><b>优势：</b>独立性强，不依附于他人。自我认知清晰，知道自己要什么。情感上比较成熟，不把幸福寄托在别人身上。</p>' +
            '<p><b>注意：</b>独立是好事但不必过度孤立。人际关系虽然需要精力但也带来温暖和支持。适度打开自己的世界，让别人走进来。</p>' +
            '<p><b>适合领域：</b>自由职业、远程工作、研究写作等可以独立完成的工作。</p>'
        },
        '自由': {
          title: '🕊️ 自由探索型',
          content: '<p><b>核心特质：</b>你是一个灵魂不能被束缚的人。自由是你最珍视的价值。你渴望探索未知，体验丰富多彩的人生。</p>' +
            '<p><b>优势：</b>视野开阔，经历丰富。不被传统框架限制，有自己独特的人生观。充满好奇心和学习欲。</p>' +
            '<p><b>注意：</b>绝对的自由有时会带来漂泊感。找到一个你愿意为之"停靠"的人和事，也是人生的一种深度。</p>' +
            '<p><b>适合领域：</b>旅游、摄影、写作、自媒体、跨国贸易等自由度高的职业。</p>'
        },
        '成就': {
          title: '🥇 成就驱动型',
          content: '<p><b>核心特质：</b>你渴望在世界上留下自己的印记。成就和被认可是你前进的动力。你不甘于平庸，希望自己的人生有意义。</p>' +
            '<p><b>优势：</b>驱动力强，容易取得成就。自我要求高，做事有品质。在竞争环境中往往能脱颖而出。</p>' +
            '<p><b>注意：</b>内在的满足感比外在的认可更重要。偶尔问自己"如果没有人知道我的成就，我还会做这件事吗？"</p>' +
            '<p><b>适合领域：</b>科技创新、企业管理、公共事务、竞技领域等能够获得成就感的职业。</p>'
        },
        '关系': {
          title: '💝 关系导向型',
          content: '<p><b>核心特质：</b>你认为人生最重要的是人与人之间的连接。亲情、友情、爱情是你生命中最珍视的财富。你愿意为重要的人付出。</p>' +
            '<p><b>优势：</b>人际关系质量高，有一群真心相待的人。温暖善良，是他人信任的对象。能从关系中获得持久的幸福感。</p>' +
            '<p><b>注意：</b>不要为了维护关系而失去自我。健康的爱是相互滋养而非单方面付出。给自己留一些独立的空间。</p>' +
            '<p><b>适合领域：</b>教育、医疗、社工、心理咨询等以人为本的职业。</p>'
        },
        '冷静': {
          title: '❄️ 冷静克制型',
          content: '<p><b>核心特质：</b>你是一个泰山崩于前而色不变的人。情绪管理能力出众，在混乱中能保持清醒。你的冷静是周围人的定心丸。</p>' +
            '<p><b>优势：</b>决策不受情绪干扰，质量稳定。危机处理能力强。为人可靠，别人愿意在困难时寻求你的帮助。</p>' +
            '<p><b>注意：</b>过度的冷静有时会被误解为冷漠。适当地表达关心和温度，让身边的人感受到你的在乎。</p>' +
            '<p><b>适合领域：</b>医疗急救、金融交易、危机公关、战略决策等高压力决策岗位。</p>'
        },
        '随缘': {
          title: '🌿 随缘自在型',
          content: '<p><b>核心特质：</b>你相信水到渠成。不强求、不执着是你的处世之道。你有大方向但相信冥冥中自有安排。</p>' +
            '<p><b>优势：</b>心态平和，焦虑感低。生活幸福感高，懂得知足。人际关系舒适自然。</p>' +
            '<p><b>注意：</b>过度的随缘可能变成随波逐流。在关键的节点还是需要主动选择和争取。</p>' +
            '<p><b>适合领域：</b>文化艺术、禅修指导、自然教育等慢节奏有深度的领域。</p>'
        }
      };

      // If multiple top traits, use the one with highest count or first
      var profile = profiles[dominant];
      if (!profile) {
        // Fallback for traits that don't have exact match
        for (var i = 0; i < topTraits.length; i++) {
          if (profiles[topTraits[i]]) { profile = profiles[topTraits[i]]; break; }
        }
      }
      if (!profile) {
        profile = {
          title: '🌈 多元复合型',
          content: '<p><b>核心特质：</b>你的性格呈现出多元化的特点，不同类型的特点在你身上和谐共存。你不是一个简单的标签可以定义的。</p>' +
            '<p><b>优势：</b>性格丰富多元，能应对各种不同情境。思维开阔不偏执，能够理解不同的观点和立场。</p>' +
            '<p><b>成长方向：</b>多元是优势但也要有自己的核心定位。找到你最认同的特质并强化它。</p>'
        };
      }

      title = profile.title;
      content = profile.content;
    }

    // 逐题回顾
    content += '<div style="margin-top:1rem;border-top:1px solid var(--border-subtle);padding-top:0.8rem;">';
    content += '<h5 style="color:var(--gold);">📋 答题回顾</h5>';
    for (var j = 0; j < this.answers.length; j++) {
      var a = this.answers[j];
      var q = this.questions[a.qIdx];
      content += '<p style="font-size:0.82rem;margin:0.3rem 0;">' +
        '<b>Q' + (j+1) + '：</b>' + q.q.substring(0,2) + '… → ' +
        '<span style="color:var(--gold);">' + q.options[a.optionIdx].text.substring(0,30) + '...</span></p>';
    }
    content += '</div>';

    return {title: title, content: content};
  }
};
