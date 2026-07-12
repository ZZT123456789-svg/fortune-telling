/**
 * 姓名分析 — 分析中文名字的五行、音韵、气质
 */
var NameModule = {
  // 姓氏来源参考
  wuXingChars: {
    '木':'林森林桐柏树杨李柳桂梁梅朴',
    '火':'明辉星晨昊景晶照炎炜',
    '土':'山岚岩峰田地城圣坚',
    '金':'鑫铭钰钧锐锋剑铁银',
    '水':'海涛洋波澜渊江汉浩浩'
  },

  open: function() {
    document.getElementById('nameOverlay').classList.add('active');
  },
  close: function() {
    document.getElementById('nameOverlay').classList.remove('active');
    document.getElementById('nameResult').style.display = 'none';
  },

  _getElement: function(ch) {
    for (var elem in this.wuXingChars) {
      if (this.wuXingChars[elem].indexOf(ch) !== -1) return elem;
    }
    // Default based on char code
    var elements = ['木','火','土','金','水'];
    return elements[ch.charCodeAt(0) % 5];
  },

  _analyzeVoice: function(name) {
    // Simple phonetic analysis
    var vowels = 0, consonants = 0;
    var vowelSet = 'aeiouü';
    for (var i = 0; i < name.length; i++) {
      var py = this._getPinyinApprox(name[i]);
      for (var j = 0; j < py.length; j++) {
        if (vowelSet.indexOf(py[j].toLowerCase()) !== -1) vowels++;
        else consonants++;
      }
    }
    if (vowels > consonants) return '柔和悠扬，听感舒适';
    if (consonants > vowels * 1.5) return '铿锵有力，有气势';
    return '抑扬顿挫，节奏感好';
  },

  _getPinyinApprox: function(ch) {
    var map = {
      '安':'an','邦':'bang','超':'chao','德':'de','恩':'en','飞':'fei','国':'guo','华':'hua',
      '建':'jian','康':'kang','龙':'long','明':'ming','宁':'ning','平':'ping','强':'qiang',
      '睿':'rui','思':'si','涛':'tao','伟':'wei','文':'wen','祥':'xiang','宇':'yu','志':'zhi',
      '子':'zi','怡':'yi','婷':'ting','琳':'lin','嘉':'jia','晨':'chen','皓':'hao','博':'bo',
      '雅':'ya','静':'jing','慧':'hui','敏':'min','燕':'yan','雪':'xue','欣':'xin','然':'ran',
      '丽':'li','芳':'fang','玲':'ling','晓':'xiao','倩':'qian','珊':'shan','玉':'yu','秀':'xiu',
      '杰':'jie','豪':'hao','毅':'yi','勇':'yong','鹏':'peng','峰':'feng','海':'hai','波':'bo'
    };
    return map[ch] || ch;
  },

  analyze: function() {
    var name = document.getElementById('nameInput').value.trim();
    if (!name || name.length < 2 || name.length > 4) {
      alert('请输入2-4个字的姓名');
      return;
    }

    var chars = name.split('');
    var elements = chars.map(this._getElement.bind(this));
    var voiceQuality = this._analyzeVoice(name);

    // Element balance
    var elemCount = {};
    elements.forEach(function(e) { elemCount[e] = (elemCount[e] || 0) + 1; });

    var balanceDesc = '';
    var uniqueElements = Object.keys(elemCount).length;
    if (uniqueElements >= 3) balanceDesc = '五行元素分布较均衡，名字能量多元。';
    else if (uniqueElements === 2) balanceDesc = '五行集中在' + Object.keys(elemCount).join('和') + '，能量偏向较为集中。';
    else balanceDesc = '五行元素单一，能量偏纯，适合特定方向。';

    // Name style
    var style = '';
    var totalScore = name.length;
    if (totalScore <= 2) style = '简洁有力，直截了当。适合性格爽朗的人。';
    else if (totalScore === 3) style = '结构完整，张弛有度。是比较常见的姓名结构。';
    else style = '名字较长，有古风韵味。'

    var ctn = document.getElementById('nameResult');
    ctn.style.display = 'block';
    ctn.innerHTML =
      '<div class="result-header">📛 姓名分析：「' + name + '」</div>' +
      '<div style="text-align:center;padding:0.5rem;">' +
        '<span style="font-size:1.5rem;letter-spacing:0.3em;">' + name + '</span>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;padding:0.5rem;">' +
        chars.map(function(ch, i) {
          return '<div style="flex:1;min-width:70px;text-align:center;padding:0.5rem;background:var(--bg-card);border-radius:var(--radius-sm);">' +
            '<div style="font-size:1.5rem;">' + ch + '</div>' +
            '<div style="font-size:0.72rem;color:var(--text-secondary);">五行属' + elements[i] + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="padding:0.5rem;line-height:1.7;color:var(--text);">' +
        '<b>音韵分析：</b>' + voiceQuality + '<br/>' +
        '<b>五行分布：</b>' + balanceDesc + '<br/>' +
        '<b>名字风格：</b>' + style +
      '</div>' +
      '<p style="text-align:center;color:var(--text-muted);font-size:0.74rem;">姓名分析为娱乐参考，一个好名字最重要的是你喜欢</p>' +
      '<button class="btn-secondary" onclick="NameModule.close()">🔙 返回</button>';
    Paywall.blockAll('nameResult');
  }
};
