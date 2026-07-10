/**
 * 周公解梦 — 梦境关键词匹配
 */
var DreamModule = {
  dreamDB: {
    '水':{result:'吉',desc:'梦见水象征财富和情感。清水代表好运和机遇，浑水则提示需要注意情绪波动。大水或洪水预示重大变化。',psy:'水在心理学中代表潜意识和情感。梦中的水可能反映你当前的情绪状态。'},
    '蛇':{result:'中',desc:'蛇象征智慧和转变。梦见蛇可能暗示有隐藏的机遇或挑战。被蛇咬可能预示需要注意健康或人际关系中的隐患。',psy:'蛇是梦境中最常见的原型之一，代表生命力、本能和转变。'},
    '飞':{result:'吉',desc:'梦见飞翔象征自由和解脱。你在现实中可能正在突破某种限制或压力。越飞越高代表志向和抱负不断增长。',psy:'飞行梦常与成就感和控制感相关。如果飞不起来，可能反映现实的挫折感。'},
    '掉牙':{result:'中',desc:'梦见掉牙传统上被认为与家人健康有关。现代解释更倾向于反映焦虑、不安全感或对形象和沟通能力的担忧。',psy:'掉牙梦可能反映对衰老、吸引力下降或表达能力不足的焦虑。'},
    '考试':{result:'中',desc:'梦见考试通常反映现实中的压力和焦虑。即使离开学校多年，考试梦仍然常见。暗示你正在被某种标准评判。',psy:'考试梦是典型的焦虑梦，反映你感到被评价或不够好的压力。'},
    '追逐':{result:'中',desc:'梦见被追逐反映你在逃避某个问题或情感。追逐者往往是你潜意识中不想面对的事物。',psy:'被追逐是常见的焦虑梦，通常反映逃避心态。正视追逐者往往能获得解决线索。'},
    '坠落':{result:'中',desc:'坠落的梦境反映失控感。你可能在某些方面感到失去了支撑。从高处坠下暗示对地位或关系变化的恐惧。',psy:'坠落梦常与不安全感、缺乏支持或对失败的恐惧相关。'},
    '死亡':{result:'中',desc:'梦见死亡不一定代表坏事。它常象征一个阶段的结束和新生的开始。梦见自己死亡可能预示重大转变或重生。',psy:'死亡梦多代表转变、结束和新开始，而非字面上的死亡。'},
    '火':{result:'吉',desc:'火焰象征热情和能量。小火或烛光代表温暖和灵感。大火可能暗示情绪爆发或需要控制的事态。',psy:'火在梦中代表能量、激情和转变。控制火则象征自我掌控。'},
    '鱼':{result:'吉',desc:'鱼象征财富和机遇。清澈水中的鱼代表好运将至。死鱼提醒注意健康。鱼跃出水面预示突破和超越。',psy:'鱼在梦中常与潜意识、创造力和财富相关联。'},
    '结婚':{result:'吉',desc:'梦见结婚不只是关于婚姻本身。它可能预示新的联盟、合作关系或人生新阶段。也暗示你在整合自己的不同方面。',psy:'结婚梦多代表结合、整合和新的开始，不必然是关于真实婚姻。'},
    '怀孕':{result:'吉',desc:'梦见怀孕象征新的创意、项目或想法的孕育。也代表你内在的成长和准备迎接新事物的状态。',psy:'怀孕梦反映创造力、新想法和内在成长，不分性别都可能做此梦。'},
    '鬼':{result:'中',desc:'梦见鬼魂可能反映未解决的心理问题或过去的阴影。有时也暗示内心有需要面对和释放的情感。',psy:'鬼魂梦常代表未处理的情感、记忆或心理阴影。面对而非逃避是关键。'},
    '血':{result:'中',desc:'血液在梦中象征生命力和情感能量。流血可能代表精力消耗或情感受伤。献血则代表付出和奉献。',psy:'血液梦常与生命力、情感创伤和能量消耗相关。'},
    '狗':{result:'吉',desc:'梦见狗通常代表忠诚和友谊。友善的狗预示有可靠的伙伴帮助。凶猛的狗提示注意人际关系中的冲突。',psy:'狗在梦中常代表忠诚、保护和直觉。不同品种有不同象征。'},
    '猫':{result:'中',desc:'猫象征独立和直觉。温顺的猫代表好运气。攻击性的猫提醒注意身边的小人和隐情。',psy:'猫代表直觉、独立和神秘。梦境中的猫可能反映你的独立需求或直觉提醒。'},
    '洪水':{result:'中',desc:'梦见洪水预示生活中可能面临巨大压力或情绪失控。但如果能安全渡过，暗示你能克服困难。',psy:'洪水梦反映被情绪或外部压力淹没的感觉。'},
    '迷路':{result:'中',desc:'迷路的梦反映你在现实中面临方向选择的困惑。可能对某个决定犹豫不决，或感到人生缺少方向。',psy:'迷路梦反映迷失感、不确定性和对方向的需求。'},
    '裸体':{result:'中',desc:'梦见裸体常与羞耻感或暴露感有关。你可能害怕被看穿或批评。如果梦中不在意裸体，则代表真实和自由。',psy:'裸体梦反映自我暴露的焦虑或对真实自我的接纳。'},
    '孩子':{result:'吉',desc:'梦见孩子代表纯真和新开始。可能是提醒你保持童心和好奇心。新生婴儿预示新机遇和希望。',psy:'孩子梦常代表内在的小孩、纯真和新的可能性。'},
    '爱人':{result:'吉',desc:'梦见爱人通常反映你对感情的重视和思念。与爱人和睦相处预示感情稳定幸福。与爱人争吵则可能反映现实中未解决的矛盾。爱人离去可能暗示对关系变化的焦虑。',psy:'爱人梦反映你对亲密关系的情感状态和深层需求。梦境中的互动方式往往映射现实中未表达的情感。'},
    '情人':{result:'中',desc:'梦见情人（非正式伴侣）需谨慎解读。若现实中无情人，此梦可能代表你对激情和浪漫的渴望。若有情人，此梦可能反映内心的矛盾或愧疚。梦见与情人愉快相处，暗示你可能在寻求情感寄托。梦见被情人伤害，则可能反映对信任的担忧。',psy:'情人梦常与隐秘的欲望、未被满足的情感需求或道德冲突有关。也可能是你内在某个被压抑部分的投射。'},
    '朋友':{result:'吉',desc:'梦见朋友通常代表社交生活和人际支持。与朋友欢聚预示近期社交活跃或有好消息。朋友帮助你暗示现实中有贵人相助。与朋友争吵可能反映你内心的某种矛盾或疏远感。老朋友入梦可能是在提醒你联系久未联络的人。',psy:'朋友梦往往反映你的人际关系状态和社交需求。梦中的朋友有时也代表你性格中某个特质。'},
    '陌生人':{result:'中',desc:'梦见陌生人通常代表你生活中的未知因素或新机遇。友善的陌生人预示贵人即将出现。有敌意的陌生人可能反映你内心的不安全感或对未知的恐惧。与陌生人交谈暗示你需要新的社交连接。反复梦见同一个陌生人，可能是潜意识在传递重要信息。',psy:'陌生人梦常代表你尚未认识到的自我部分（阴影人格），或对未知变化的期待与恐惧。'},
    '公众人物':{result:'中',desc:'梦见公众人物（明星、名人、领袖）通常反映你对成功、影响力或某种生活方式的向往。与名人友好互动暗示你渴望被认可和关注。梦见自己是公众人物，反映你对自我价值的追求。被名人拒绝则可能暗示自卑或对失败的恐惧。',psy:'公众人物梦常与自我价值感、社会认同需求和理想自我形象有关。名人往往是你投射的理想化形象。'},
    '逝去的人':{result:'中',desc:'梦见逝去的亲人或故人，是梦境中最常见的类型之一。已故亲人面带微笑、神情安详，通常代表他们在另一个世界安好，也是对生者的一种安慰。若梦中逝者说话，请留意内容——可能是你内心深处需要关注的事情。若梦见逝者复活，暗示你对过去的怀念或未完成的心愿。梦见逝者带走某物，可能提示需要注意健康或关系。',psy:'逝者梦是哀伤处理过程中的正常现象。心理学家认为这是生者与逝者重新建立内在连接的尝试，也是自我疗愈的一部分。不必恐惧，这是心灵对失去的调适。'}
  },

  open: function() {
    var overlay = document.getElementById('dreamOverlay');
    overlay.classList.add('active');
    this._renderTags();
  },

  close: function() {
    document.getElementById('dreamOverlay').classList.remove('active');
  },

  _renderTags: function() {
    var tags = ['水','蛇','飞','掉牙','考试','追逐','坠落','死亡','火','鱼','结婚','怀孕','鬼','血','狗','猫','洪水','迷路','爱人','情人','朋友','陌生人','公众人物','逝去的人'];
    var html = '';
    for (var i = 0; i < tags.length; i++) {
      html += '<span class="dream-tag" onclick="DreamModule.quickInterpret(\'' + tags[i] + '\')">' + tags[i] + '</span>';
    }
    document.getElementById('dreamQuickTags').innerHTML = html;
  },

  quickInterpret: function(keyword) {
    document.getElementById('dreamKeyword').value = keyword;
    this.interpret();
  },

  interpret: function() {
    var keyword = document.getElementById('dreamKeyword').value.trim();
    if (!keyword) { alert('请输入梦境关键词'); return; }

    // Find best match
    var entry = null;
    var k = keyword.toLowerCase();

    // Exact match first
    if (this.dreamDB[keyword]) entry = this.dreamDB[keyword];
    else {
      // Partial match
      for (var key in this.dreamDB) {
        if (k.indexOf(key) !== -1 || key.indexOf(keyword) !== -1) {
          entry = this.dreamDB[key]; break;
        }
      }
    }

    var ctn = document.getElementById('dreamResult');
    ctn.style.display = 'block';
    if (entry) {
      ctn.innerHTML =
        '<div class="result-header">💭 梦见「' + keyword + '」</div>' +
        '<div style="text-align:center;padding:0.3rem;"><span style="font-size:1.1rem;color:var(--gold);">吉凶：' + entry.result + '</span></div>' +
        '<div style="color:var(--gold-pale);line-height:1.7;padding:0.5rem;margin-top:0.3rem;">📖 <b>传统解读：</b>' + entry.desc + '</div>' +
        '<div style="color:var(--text);line-height:1.7;padding:0.5rem;">🧠 <b>心理提示：</b>' + entry.psy + '</div>' +
        '<p style="text-align:center;color:var(--text-muted);font-size:0.76rem;">仅供娱乐参考，梦境的解释因人而异</p>' +
        '<button class="btn-secondary" onclick="DreamModule.close()">🔙 返回</button>';
    } else {
      ctn.innerHTML =
        '<div class="result-header">💭 梦见「' + keyword + '」</div>' +
        '<p style="text-align:center;color:var(--text-secondary);padding:1rem;">暂未收录此梦境关键词，建议尝试其他关键词（如水、蛇、飞、掉牙等）。</p>' +
        '<button class="btn-secondary" onclick="DreamModule.close()">🔙 返回</button>';
    }
  }
};
