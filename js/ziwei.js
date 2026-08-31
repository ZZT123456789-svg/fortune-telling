/**
 * 道问 · 紫微斗数
 * 排盘引擎：iztro 2.6.0（浏览器 UMD）
 *
 * 设计原则：
 * 1) 不再使用“公历月份≈农历月份”和“12项循环紫微星表”的近似算法。
 * 2) 阳历/农历分别调用可靠排盘入口；农历支持闰月。
 * 3) 出生小时转换为早子时(0)～晚子时(12)，23点不再错误折回早子时。
 * 4) 保留 ZiweiModule.open/close/calculate 与 _renderSVG 兼容接口，避免影响其他模块。
 */
var ZiweiModule = {
  ENGINE_URL: '/js/vendor/iztro-2.6.0.min.js',
  STANDARD_CONFIG: {
    yearDivide: 'normal',
    horoscopeDivide: 'normal',
    ageDivide: 'normal',
    dayDivide: 'forward',
    algorithm: 'default'
  },
  _enginePromise: null,
  _engineRef: null,
  _lastChart: null,
  _lastInput: null,
  _currentHoroscope: null,
  _selectedBranch: '',
  _connectionMode: 'sanfang',
  _selectedFlow: null,
  _selectedFlowDate: null,
  _selectedFlowTimeIndex: 0,
  _flowIsManual: false,
  _uiEnhanced: false,
  _resizeBound: false,

  open: function() {
    this._enhanceUI();
    var overlay = document.getElementById('ziweiOverlay');
    var result = document.getElementById('ziweiResult');
    if (overlay) overlay.classList.add('active');
    if (result) result.style.display = 'none';
  },

  close: function() {
    var overlay = document.getElementById('ziweiOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  calculate: async function() {
    this._enhanceUI();
    var y = this._numberValue('ziweiYear');
    var m = this._numberValue('ziweiMonth');
    var d = this._numberValue('ziweiDay');
    var h = this._numberValue('ziweiHour');
    var minute = this._numberValue('ziweiMinute');
    if (isNaN(minute)) minute = 0;
    var gEl = document.getElementById('ziweiGender');
    var calEl = document.getElementById('ziweiCalType');
    var gender = gEl ? gEl.value : '男';
    var calType = calEl ? calEl.value : 'solar';
    var isLeap = !!(document.getElementById('ziweiLeapMonth') && document.getElementById('ziweiLeapMonth').checked);

    var validation = this._validateInput(y, m, d, h, minute, calType, gender);
    if (validation) {
      this._showStatus(validation, 'error');
      return;
    }

    this._showStatus('正在校正历法并排盘…', 'loading');
    this._setCalculateBusy(true);

    try {
      var engine = await this._ensureEngine();
      if (!engine || !engine.astro) throw new Error('紫微排盘引擎未正确加载');
      this._engineRef = engine;
      var schoolEl = document.getElementById('ziweiSchool');
      var school = schoolEl && schoolEl.value === 'default' ? 'default' : 'zhongzhou';
      this._configureEngine(engine, school);

      var timeIndex = this._hourToTimeIndex(h);
      var dateText = y + '-' + m + '-' + d;
      var chart = this._createChart(engine, {
        dateText: dateText,
        timeIndex: timeIndex,
        gender: gender,
        calType: calType,
        isLeapMonth: isLeap
      });

      this._assertCalendarMatch(chart, {
        year:y, month:m, day:d, calType:calType, isLeapMonth:isLeap
      });
      this._assertChartIntegrity(chart);

      var input = {
        year: y,
        month: m,
        day: d,
        hour: h,
        minute: minute,
        gender: gender,
        calType: calType,
        isLeap: isLeap,
        timeIndex: timeIndex,
        school: school,
        name: ((document.getElementById('ziweiName') || {}).value || '').trim()
      };

      this._lastChart = chart;
      this._lastInput = input;
      this._render(chart, input);
      this._showStatus('', 'info');

      // 保留现有付费墙行为；排盘数据本身已经在这里准确生成。
      // 基础命盘保持可见；付费校验只在“问 AI 解读”入口执行。
    } catch (e) {
      console.error('[ZiweiModule]', e);
      var msg = e && e.message ? e.message : '排盘失败';
      if (/load|加载|network|fetch/i.test(msg)) {
        msg = '紫微排盘引擎加载失败，请检查网络后重试。';
      } else {
        msg = '排盘失败：' + msg;
      }
      this._showStatus(msg, 'error');
    } finally {
      this._setCalculateBusy(false);
    }
  },

  _ensureEngine: function() {
    if (window.iztro && window.iztro.astro) return Promise.resolve(window.iztro);
    if (this._enginePromise) return this._enginePromise;

    var self = this;
    this._enginePromise = new Promise(function(resolve, reject) {
      var existing = document.querySelector('script[data-daowen-iztro]');
      if (existing) {
        existing.addEventListener('load', function() {
          if (window.iztro && window.iztro.astro) resolve(window.iztro);
          else reject(new Error('引擎加载后未找到 iztro.astro'));
        }, { once: true });
        existing.addEventListener('error', function() { reject(new Error('引擎加载失败')); }, { once: true });
        return;
      }

      var script = document.createElement('script');
      script.src = self.ENGINE_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-daowen-iztro', '2.6.0');
      script.onload = function() {
        if (window.iztro && window.iztro.astro) resolve(window.iztro);
        else reject(new Error('引擎加载后未找到 iztro.astro'));
      };
      script.onerror = function() { reject(new Error('引擎加载失败')); };
      document.head.appendChild(script);
    }).catch(function(err) {
      self._enginePromise = null;
      throw err;
    });

    return this._enginePromise;
  },

  _hourToTimeIndex: function(hour) {
    // iztro: 0=早子时，1=丑时 … 11=亥时，12=晚子时。
    if (hour === 23) return 12;
    return Math.floor((hour + 1) / 2);
  },

  /**
   * 固定为 iztro 官方“通行派”默认口径，避免全局配置被其他脚本静默改变。
   * 年界以农历正月初一、晚子时归次日；流派切换必须以后作为显式产品选项提供。
   */
  _configureEngine: function(engine, school) {
    if (!engine || !engine.astro || typeof engine.astro.config !== 'function' || typeof engine.astro.getConfig !== 'function') {
      throw new Error('紫微排盘引擎缺少配置接口');
    }
    var expected = Object.assign({}, this.STANDARD_CONFIG, {
      algorithm: school === 'zhongzhou' ? 'zhongzhou' : 'default'
    });
    engine.astro.config(expected);
    var actual = engine.astro.getConfig();
    Object.keys(expected).forEach(function(key) {
      if (actual[key] !== expected[key]) throw new Error('紫微排盘口径配置失败：' + key);
    });
    if (Object.keys(actual.mutagens || {}).length || Object.keys(actual.brightness || {}).length) {
      throw new Error('紫微排盘引擎存在未声明的四化或星曜亮度覆盖');
    }
    return actual;
  },

  /**
   * iztro 2.6.0 官方参数适配层。
   * bySolar(date, timeIndex, gender, fixLeap, language)
   * byLunar(date, timeIndex, gender, isLeapMonth, fixLeap, language)
   */
  _createChart: function(engine, options) {
    if (!engine || !engine.astro) throw new Error('紫微排盘引擎未正确加载');
    var dateText = options.dateText;
    var timeIndex = options.timeIndex;
    var gender = options.gender;
    if (!Number.isInteger(timeIndex) || timeIndex < 0 || timeIndex > 12) throw new Error('紫微时辰索引超出范围');
    if (gender !== '男' && gender !== '女') throw new Error('性别参数只支持男或女');
    var fixLeap = true;
    var language = 'zh-CN';

    if (options.calType === 'lunar') {
      if (typeof engine.astro.byLunar !== 'function') throw new Error('紫微农历排盘接口不可用');
      return engine.astro.byLunar(
        dateText,
        timeIndex,
        gender,
        !!options.isLeapMonth,
        fixLeap,
        language
      );
    }

    if (typeof engine.astro.bySolar !== 'function') throw new Error('紫微阳历排盘接口不可用');
    return engine.astro.bySolar(
      dateText,
      timeIndex,
      gender,
      fixLeap,
      language
    );
  },

  _validateInput: function(y, m, d, h, minute, calType, gender) {
    if ([y, m, d, h].some(function(v) { return isNaN(v); })) return '请填写完整的出生年月日和小时';
    if (y < 1900 || y > 2100) return '出生年份请填写 1900～2100';
    if (m < 1 || m > 12) return '月份应为 1～12';
    if (d < 1 || d > 31) return '日期填写有误';
    if (h < 0 || h > 23) return '出生小时应为 0～23';
    if (minute < 0 || minute > 59) return '分钟应为 0～59';
    if (gender !== undefined && gender !== '男' && gender !== '女') return '性别参数填写有误';
    if (calType !== 'solar' && calType !== 'lunar') return '日历类型填写有误';
    if (calType === 'solar') {
      var dt = new Date(Date.UTC(y, m - 1, d));
      if (dt.getUTCFullYear() !== y || dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d) return '公历日期不存在，请检查年月日';
    } else if (d > 30) {
      return '农历日期最多 30 日';
    }
    return '';
  },

  _numberValue: function(id) {
    var el = document.getElementById(id);
    if (!el || el.value === '') return NaN;
    return parseInt(el.value, 10);
  },

  _render: function(chart, input) {
    var ctn = document.getElementById('ziweiResult');
    if (!ctn) return;
    ctn.style.display = 'block';

    var branchGrid = {
      '巳': 'g1', '午': 'g2', '未': 'g3', '申': 'g4',
      '辰': 'g5', '酉': 'g8',
      '卯': 'g9', '戌': 'g12',
      '寅': 'g13', '丑': 'g14', '子': 'g15', '亥': 'g16'
    };

    var palacesByGrid = {};
    chart.palaces.forEach(function(p) {
      var key = branchGrid[p.earthlyBranch];
      if (key) palacesByGrid[key] = p;
    });

    var current = null;
    try {
      var currentDate = new Date();
      current = this._getHoroscope(chart, currentDate, this._hourToTimeIndex(currentDate.getHours()));
      this._assertCycleIntegrity(chart, current, currentDate);
    } catch (e) { console.warn('[ZiweiModule] 运限计算失败', e); }

    this._currentHoroscope = current;
    this._selectedFlow = this._flowSnapshot(current, currentDate || new Date());
    this._selectedFlowDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    this._selectedFlowTimeIndex = this._hourToTimeIndex(currentDate.getHours());
    this._flowIsManual = false;
    this._selectedBranch = chart.earthlyBranchOfSoulPalace;
    this._connectionMode = 'sanfang';

    var html = '<div class="zw-shell">';
    html += this._renderHeader(chart, input);
    html += '<div class="zw-board">';

    var slots = ['g1','g2','g3','g4','g5','center','center','g8','g9','center','center','g12','g13','g14','g15','g16'];
    var usedCenter = false;
    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      if (slot === 'center') {
        if (!usedCenter) {
          html += this._renderCenter(chart, input, current);
          usedCenter = true;
        }
        continue;
      }
      html += this._renderPalace(palacesByGrid[slot], slot, current);
    }

    html += this._renderSanFangLines(chart);
    html += '</div>';
    html += this._renderConnectionToolbar();
    html += '<section class="zw-palace-detail" id="ziweiPalaceDetail" aria-live="polite"></section>';
    html += this._renderFlowTables(chart, current, currentDate || new Date());
    html += '<section class="zw-ai-reading" id="ziweiAIReading"><div><span>紫微 AI 深度解读</span><p>读取当前选中的运限、流曜、四化与宫位关系；每次生成扣 1 次。</p></div><button class="btn-primary" type="button" onclick="ZiweiModule.generateAIReading()">生成解读（1次）</button><div class="zw-ai-reading-result" id="ziweiAIReadingResult"></div></section>';
    html += '<div class="zw-actions">' +
      '<button class="btn-secondary" type="button" onclick="ZiweiModule.close()">返回</button>' +
      '</div>';
    html += '</div>';

    ctn.innerHTML = html;
    setTimeout(function() {
      ZiweiModule._bindPalaceInteractions();
      ZiweiModule._positionSanFangLines();
      ZiweiModule._renderPalaceDetail(ZiweiModule._selectedBranch);
      ctn.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  },

  _assertCalendarMatch: function(chart, input) {
    if (!chart) throw new Error('历法转换没有返回结果');
    if (input.calType === 'lunar') {
      var raw = chart.rawDates && chart.rawDates.lunarDate;
      if (!raw || raw.lunarYear !== input.year || raw.lunarMonth !== input.month || raw.lunarDay !== input.day) {
        throw new Error('农历日期不存在，请检查年月日');
      }
      if (!!raw.isLeap !== !!input.isLeapMonth) {
        throw new Error(input.isLeapMonth ? '该年份没有这个闰月' : '农历闰月设置不一致');
      }
      return true;
    }
    var expected = input.year + '-' + input.month + '-' + input.day;
    if (String(chart.solarDate || '') !== expected) throw new Error('公历日期转换结果不一致');
    return true;
  },

  _assertChartIntegrity: function(chart) {
    if (!chart || !Array.isArray(chart.palaces) || chart.palaces.length !== 12) {
      throw new Error('排盘结果不完整：十二宫数量异常');
    }
    var expectedBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    var branches = chart.palaces.map(function(p) { return p && p.earthlyBranch; });
    if (new Set(branches).size !== 12 || expectedBranches.some(function(x) { return branches.indexOf(x) < 0; })) {
      throw new Error('排盘结果不完整：十二地支宫位重复或缺失');
    }
    var palaceNames = chart.palaces.map(function(p) { return p && p.name; });
    if (new Set(palaceNames).size !== 12 || palaceNames.indexOf('命宫') < 0) {
      throw new Error('排盘结果不完整：十二宫名称重复或命宫缺失');
    }
    var majors = [];
    var mutagens = [];
    chart.palaces.forEach(function(p) {
      ['majorStars','minorStars','adjectiveStars'].forEach(function(key) {
        (p[key] || []).forEach(function(star) {
          if (!star || !star.name) return;
          if (key === 'majorStars') majors.push(star.name);
          var values = Array.isArray(star.mutagen) ? star.mutagen : (star.mutagen ? [star.mutagen] : []);
          mutagens = mutagens.concat(values);
        });
      });
    });
    var expectedMajors = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
    if (majors.length !== 14 || new Set(majors).size !== 14 || expectedMajors.some(function(x) { return majors.indexOf(x) < 0; })) {
      throw new Error('排盘结果不完整：十四主星重复或缺失');
    }
    if (['禄','权','科','忌'].some(function(x) { return mutagens.indexOf(x) < 0; })) {
      throw new Error('排盘结果不完整：生年四化缺失');
    }
    var soulPalace = chart.palaces.find(function(p) { return p.name === '命宫'; });
    var bodyPalaces = chart.palaces.filter(function(p) { return p.isBodyPalace; });
    if (!soulPalace || soulPalace.earthlyBranch !== chart.earthlyBranchOfSoulPalace) {
      throw new Error('排盘结果不一致：命宫地支校验失败');
    }
    if (bodyPalaces.length !== 1 || bodyPalaces[0].earthlyBranch !== chart.earthlyBranchOfBodyPalace) {
      throw new Error('排盘结果不一致：身宫地支校验失败');
    }
    return true;
  },

  _dateText: function(value) {
    if (typeof value === 'string') return value;
    var date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) throw new Error('运限日期无效');
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  },

  _getHoroscope: function(chart, date, timeIndex) {
    if (!chart || typeof chart.horoscope !== 'function') throw new Error('运限接口不可用');
    if (timeIndex !== undefined && (!Number.isInteger(timeIndex) || timeIndex < 0 || timeIndex > 12)) {
      throw new Error('流时时辰索引超出范围');
    }
    var result = chart.horoscope(this._dateText(date), timeIndex === undefined ? 0 : timeIndex);
    if (!result || !result.age || !result.decadal || !result.yearly || !result.monthly || !result.daily || !result.hourly) {
      throw new Error('运限结果不完整');
    }
    if (!Number.isInteger(result.age.nominalAge)) throw new Error('小限虚岁缺失');
    ['age','decadal','yearly','monthly','daily','hourly'].forEach(function(key) {
      var item = result[key];
      if (!Number.isInteger(item.index) || item.index < 0 || item.index > 11) throw new Error(key + '宫位索引异常');
      if (!item.heavenlyStem || !item.earthlyBranch) throw new Error(key + '干支缺失');
    });
    return result;
  },

  _assertCycleIntegrity: function(chart, current, date) {
    if (!chart || typeof chart.decadalList !== 'function') throw new Error('大限列表接口不可用');
    var list = chart.decadalList();
    if (!Array.isArray(list) || list.length !== 12) throw new Error('大限列表不完整');
    var seen = new Set();
    list.forEach(function(item, i) {
      if (!item || !Number.isInteger(item.index) || seen.has(item.index)) throw new Error('大限宫位索引重复或缺失');
      seen.add(item.index);
      if (!Array.isArray(item.ageRange) || item.ageRange.length !== 2 || item.ageRange[1] - item.ageRange[0] !== 9) {
        throw new Error('大限虚岁区间异常');
      }
      if (!Array.isArray(item.yearRange) || item.yearRange.length !== 2 || item.yearRange[1] - item.yearRange[0] !== 9) {
        throw new Error('大限年份区间异常');
      }
      if (i > 0 && (item.ageRange[0] !== list[i - 1].ageRange[1] + 1 || item.yearRange[0] !== list[i - 1].yearRange[1] + 1)) {
        throw new Error('大限区间不连续');
      }
    });

    var nominalAge = current.age.nominalAge;
    var active = list.find(function(item) { return nominalAge >= item.ageRange[0] && nominalAge <= item.ageRange[1]; });
    if (!active) return true;
    if (active.index !== current.decadal.index || active.heavenlyStem !== current.decadal.heavenlyStem || active.earthlyBranch !== current.decadal.earthlyBranch) {
      throw new Error('当前大限与完整大限列表不一致');
    }

    if (typeof chart.yearlyList === 'function') {
      var decadalPosition = list.indexOf(active);
      var yearlyList = chart.yearlyList(decadalPosition);
      var currentDate = date instanceof Date ? date : new Date(date);
      var year = currentDate.getFullYear();
      var activeYear = yearlyList.find(function(item) { return item.year === year; });
      if (activeYear && (activeYear.index !== current.yearly.index || activeYear.heavenlyStem !== current.yearly.heavenlyStem || activeYear.earthlyBranch !== current.yearly.earthlyBranch)) {
        throw new Error('当前流年与大限流年列表不一致');
      }
    }
    return true;
  },

  _flowSnapshot: function(current, date) {
    if (!current) return null;
    var result = { date:this._dateText(date || new Date()), activeLevel:'hourly' };
    ['decadal','yearly','monthly','daily','hourly'].forEach(function(key) {
      var item = current[key] || {};
      result[key] = {
        index:item.index, name:item.name, heavenlyStem:item.heavenlyStem,
        earthlyBranch:item.earthlyBranch, palaceNames:item.palaceNames || [],
        mutagen:item.mutagen || [], stars:item.stars || []
      };
    });
    return result;
  },

  _renderConnectionToolbar: function() {
    return '<div class="zw-mode-toolbar" role="toolbar" aria-label="宫位关系模式">' +
      '<button type="button" data-zw-mode="fly">飞星</button>' +
      '<button type="button" class="is-active" data-zw-mode="sanfang">三合</button>' +
      '<button type="button" data-zw-mode="sihua">四化</button>' +
      '<span>点击宫位后，下方免费显示宫位详情</span></div>';
  },

  _findPalace: function(branch) {
    return this._lastChart && this._lastChart.palaces.find(function(p) { return p.earthlyBranch === branch; });
  },

  _mutagenRelations: function(originBranch, includeIncoming) {
    var chart = this._lastChart;
    var source = this._findPalace(originBranch);
    if (!chart || !source) return [];
    var types = ['禄','权','科','忌'];
    var stemMap = {
      甲:['廉贞','破军','武曲','太阳'],乙:['天机','天梁','紫微','太阴'],
      丙:['天同','天机','文昌','廉贞'],丁:['太阴','天同','天机','巨门'],
      戊:['贪狼','太阴','右弼','天机'],己:['武曲','贪狼','天梁','文曲'],
      庚:['太阳','武曲','太阴','天同'],辛:['巨门','太阳','文曲','文昌'],
      壬:['天梁','紫微','左辅','武曲'],癸:['破军','巨门','太阴','贪狼']
    };
    var locate = function(starName) {
      return chart.palaces.find(function(p) {
        return ['majorStars','minorStars','adjectiveStars'].some(function(key) {
          return (p[key] || []).some(function(star) { return star && star.name === starName; });
        });
      });
    };
    var makeOutgoing = function(palace) {
      var stars = stemMap[palace.heavenlyStem] || [];
      return stars.map(function(star, index) {
        var target = locate(star);
        return target ? { from:palace.earthlyBranch, to:target.earthlyBranch, type:types[index], star:star, direction:'out' } : null;
      }).filter(Boolean);
    };
    var relations = makeOutgoing(source);
    if (includeIncoming) {
      chart.palaces.forEach(function(palace) {
        if (palace.earthlyBranch === originBranch) return;
        makeOutgoing(palace).forEach(function(relation) {
          if (relation.to === originBranch) relations.push(Object.assign({}, relation, { direction:'in' }));
        });
      });
    }
    return relations;
  },

  _relationsForMode: function(branch) {
    if (this._connectionMode === 'fly') return this._mutagenRelations(branch, false);
    if (this._connectionMode === 'sihua') return this._mutagenRelations(branch, true);
    return this._getSanFangRelations(branch).map(function(item) {
      return { from:branch, to:item.branch, type:item.type, direction:'out' };
    });
  },

  _starExplanation: function(name) {
    var notes = {
      紫微:'主统筹、尊贵与领导意识，需结合辅弼及煞曜判断发挥层次。',天机:'主思考、变化与策划，遇吉曜利机敏，遇煞忌则易多虑反复。',
      太阳:'主公开、担当与照耀，亮度和落宫会影响外放程度。',武曲:'主执行、财务与决断，重效率和实际成果。',
      天同:'主福气、协调与享受，亦需留意安逸倾向。',廉贞:'主原则、欲望与边界，组合不同可表现为自律或竞争。',
      天府:'主守成、资源与稳定，擅长管理和积累。',太阴:'主内在、财库与细腻，亮度影响稳定和表达方式。',
      贪狼:'主欲望、才艺与社交，宜观察是否受制化。',巨门:'主语言、质疑与分析，化忌时尤其注意沟通成本。',
      天相:'主协调、制度与服务，重关系中的公平。',天梁:'主庇护、原则与化解，常带长辈或专业属性。',
      七杀:'主突破、压力与决断，宜有明确目标与约束。',破军:'主变革、重组与开创，成败取决于资源和时机。'
    };
    return notes[name] || '该星曜用于细化宫位主题，需与同宫、三方四正、四化及当前运限合参。';
  },

  _renderPalaceDetail: function(branch) {
    var panel = document.getElementById('ziweiPalaceDetail');
    var palace = this._findPalace(branch);
    if (!panel || !palace) return;
    var stars = [].concat(palace.majorStars || [], palace.minorStars || [], palace.adjectiveStars || []).filter(function(star) { return star && star.name; });
    var outgoing = this._mutagenRelations(branch, false);
    var all = this._mutagenRelations(branch, true);
    var incoming = all.filter(function(item) { return item.direction === 'in'; });
    var flow = this._selectedFlow || {};
    var level = flow.activeLevel || 'hourly';
    var current = flow[level] || {};
    var flowPalaceName = current.palaceNames && current.palaceNames[palace.index];
    var starHtml = stars.map(function(star) {
      var extra = [star.brightness, Array.isArray(star.mutagen) ? star.mutagen.join('') : star.mutagen].filter(Boolean).join(' · ');
      return '<article><h4>' + ZiweiModule._escape(star.name) + (extra ? '<small>' + ZiweiModule._escape(extra) + '</small>' : '') + '</h4><p>' + ZiweiModule._escape(ZiweiModule._starExplanation(star.name)) + '</p></article>';
    }).join('');
    var relationText = function(list, empty) {
      return list.length ? list.map(function(item) {
        var other = ZiweiModule._findPalace(item.direction === 'in' ? item.from : item.to);
        return '<li><b class="zw-transform zw-transform-' + item.type + '">' + item.type + '</b>' + ZiweiModule._escape(item.star) + ' · ' + (item.direction === 'in' ? '由' : '飞入') + ZiweiModule._escape((other && other.name) || '') + '（' + ZiweiModule._escape(item.direction === 'in' ? item.from : item.to) + '）</li>';
      }).join('') : '<li>' + empty + '</li>';
    };
    panel.innerHTML = '<header><div><span>宫位详情 · 免费</span><h3>' + this._escape(palace.name) + ' <small>' + this._escape(palace.heavenlyStem + palace.earthlyBranch) + (palace.isBodyPalace ? ' · 身宫' : '') + '</small></h3></div><p>点击其他宫位可即时切换，不消耗次数。</p></header>' +
      '<div class="zw-detail-grid"><section><h3>星曜解释</h3><div class="zw-star-notes">' + (starHtml || '<p>本宫为空宫，需重点参考对宫与三方四正。</p>') + '</div></section>' +
      '<section><h3>宫干四化飞入飞出</h3><h4>飞出</h4><ul>' + relationText(outgoing, '本宫未找到可定位的飞化星曜。') + '</ul><h4>飞入</h4><ul>' + relationText(incoming, '当前没有其他宫位四化飞入本宫。') + '</ul></section>' +
      '<section><h3>当前运限说明</h3><p><b>' + this._escape(current.name || '流时') + '：</b>' + this._escape((current.heavenlyStem || '') + (current.earthlyBranch || '')) + '，本宫在此层对应“' + this._escape(flowPalaceName || palace.name) + '”。</p><p><b>当前层四化：</b>' + this._escape((current.mutagen || []).map(function(star, i) { return ['禄','权','科','忌'][i] + '→' + star; }).join(' · ') || '无') + '</p><p>应同时参考本宫本命星曜、当前层流曜与所选连线模式；本说明为结构化命盘信息，不替代 AI 深度解读。</p></section></div>';
  },

  _aiPayload: function() {
    var chart = this._lastChart;
    var input = this._lastInput;
    var palace = this._findPalace(this._selectedBranch);
    if (!chart || !input) return null;
    return {
      school:input.school, birth:{ year:input.year,month:input.month,day:input.day,hour:input.hour,minute:input.minute,gender:input.gender,calendar:input.calType,isLeap:input.isLeap },
      summary:{ solarDate:chart.solarDate,lunarDate:chart.lunarDate,chineseDate:chart.chineseDate,fiveElementsClass:chart.fiveElementsClass,soul:chart.soul,body:chart.body,soulPalace:chart.earthlyBranchOfSoulPalace,bodyPalace:chart.earthlyBranchOfBodyPalace },
      selectedPalace:palace ? { name:palace.name,stem:palace.heavenlyStem,branch:palace.earthlyBranch,majorStars:palace.majorStars,minorStars:palace.minorStars,adjectiveStars:palace.adjectiveStars } : null,
      flow:this._selectedFlow,
      palaces:chart.palaces.map(function(p) { return { index:p.index,name:p.name,stem:p.heavenlyStem,branch:p.earthlyBranch,isBodyPalace:p.isBodyPalace,majorStars:p.majorStars,minorStars:p.minorStars,adjectiveStars:p.adjectiveStars,changsheng12:p.changsheng12,boshi12:p.boshi12,jiangqian12:p.jiangqian12,suiqian12:p.suiqian12 }; })
    };
  },

  _aiCacheKey: function(payload) {
    var text = JSON.stringify({ birth:payload.birth,school:payload.school,flow:payload.flow,selectedPalace:payload.selectedPalace && payload.selectedPalace.branch });
    var hash = 2166136261;
    for (var i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24); }
    return 'zw-' + (hash >>> 0).toString(36);
  },

  _renderAIContent: function(content, cached) {
    var target = document.getElementById('ziweiAIReadingResult');
    if (!target) return;
    var html = this._escape(content || '').replace(/^###?\s+(.+)$/gm, '<h3>$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    target.innerHTML = '<div class="zw-ai-result-card" data-ai-complete="true"><div class="zw-ai-result-meta">' + (cached ? '已读取本机保存的解读，本次未扣费' : '本次已扣 1 次并自动保存') + '</div><div>' + html + '</div></div>';
  },

  generateAIReading: async function() {
    var payload = this._aiPayload();
    var target = document.getElementById('ziweiAIReadingResult');
    if (!payload || !target) return;
    var key = this._aiCacheKey(payload);
    var cache = {};
    try { cache = JSON.parse(localStorage.getItem('daowen_ziwei_ai_cache_v1') || '{}'); } catch (_) {}
    if (cache[key] && cache[key].content) { this._renderAIContent(cache[key].content, true); return; }
    if (window.Paywall && Paywall._balanceLoaded && Paywall.getBalance() < 1) { Paywall.openShop(); return; }
    target.innerHTML = '<div class="zw-ai-loading">正在读取当前运限、流曜与四化关系…</div>';
    try {
      var response = await fetch('/api/ai-ziwei-reading', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ chart:payload, cacheKey:key }) });
      var data = await response.json();
      if (!data.success) {
        if (data.code === 'INSUFFICIENT' && window.Paywall) Paywall.openShop();
        throw new Error(data.error || '紫微 AI 解读失败');
      }
      if (window.Paywall && data.balance != null) Paywall._setBalance(Number(data.balance));
      cache[key] = { content:data.content, savedAt:new Date().toISOString() };
      var keys = Object.keys(cache).sort(function(a,b) { return String(cache[b].savedAt).localeCompare(String(cache[a].savedAt)); });
      keys.slice(30).forEach(function(oldKey) { delete cache[oldKey]; });
      try { localStorage.setItem('daowen_ziwei_ai_cache_v1', JSON.stringify(cache)); } catch (_) {}
      this._renderAIContent(data.content, false);
    } catch (error) {
      target.innerHTML = '<div class="zw-ai-error">' + this._escape(error.message || 'AI 服务暂不可用') + '</div>';
      if (window.Paywall) Paywall.syncBalance(true).catch(function() {});
    }
  },

  _getSanFangBranches: function(originBranch) {
    return this._getSanFangRelations(originBranch).map(function(item) { return item.branch; });
  },

  _getSanFangRelations: function(originBranch) {
    var branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    var originIndex = branches.indexOf(originBranch);
    if (originIndex < 0) return [];
    return [{offset:4,type:'三合'},{offset:8,type:'三合'},{offset:6,type:'对宫'}].map(function(item) {
      return {branch:branches[(originIndex + item.offset) % 12], type:item.type};
    });
  },

  _renderSanFangLines: function(chart) {
    var origin = chart && chart.earthlyBranchOfSoulPalace;
    var targets = this._getSanFangRelations(origin);
    if (!origin || targets.length !== 3) return '';
    return '<svg class="zw-sanfang-lines" aria-hidden="true" data-origin-branch="' + this._escape(origin) + '">' +
      targets.map(function(item) {
        return '<line data-target-branch="' + ZiweiModule._escape(item.branch) + '" data-relation="' + ZiweiModule._escape(item.type) + '" x1="0" y1="0" x2="0" y2="0"></line>';
      }).join('') +
      '<circle class="zw-sanfang-origin" cx="0" cy="0" r="4"></circle>' +
      '</svg>';
  },

  _positionSanFangLines: function() {
    var board = document.querySelector('#ziweiResult .zw-board');
    var svg = board && board.querySelector('.zw-sanfang-lines');
    if (!board || !svg || svg.offsetParent === null) return;
    var boardRect = board.getBoundingClientRect();
    if (!boardRect.width || !boardRect.height) return;
    var centerOf = function(element) {
      var rect = element.getBoundingClientRect();
      return {
        x: rect.left - boardRect.left + rect.width / 2,
        y: rect.top - boardRect.top + rect.height / 2
      };
    };
    svg.setAttribute('viewBox', '0 0 ' + boardRect.width + ' ' + boardRect.height);
    svg.querySelectorAll('line[data-target-branch]').forEach(function(line) {
      var sourceBranch = line.getAttribute('data-source-branch') || svg.getAttribute('data-origin-branch');
      var branch = line.getAttribute('data-target-branch');
      var origin = board.querySelector('.zw-palace[data-branch="' + sourceBranch + '"]');
      var target = board.querySelector('.zw-palace[data-branch="' + branch + '"]');
      if (!origin || !target) return;
      var start = centerOf(origin);
      var end = centerOf(target);
      line.setAttribute('x1', start.x);
      line.setAttribute('y1', start.y);
      line.setAttribute('x2', end.x);
      line.setAttribute('y2', end.y);
    });
    var marker = svg.querySelector('.zw-sanfang-origin');
    if (marker) {
      var originBranch = svg.getAttribute('data-origin-branch');
      var origin = board.querySelector('.zw-palace[data-branch="' + originBranch + '"]');
      if (!origin) return;
      var start = centerOf(origin);
      marker.setAttribute('cx', start.x);
      marker.setAttribute('cy', start.y);
    }
  },

  _bindPalaceInteractions: function() {
    var board = document.querySelector('#ziweiResult .zw-board');
    if (!board || board.getAttribute('data-palace-interactions') === 'ready') return;
    board.setAttribute('data-palace-interactions', 'ready');

    var activate = function(palace) {
      if (!palace) return;
      ZiweiModule._activatePalace(palace.getAttribute('data-branch'));
    };
    board.querySelectorAll('.zw-palace[data-branch]').forEach(function(palace) {
      palace.addEventListener('click', function() { activate(palace); });
      palace.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(palace);
        }
      });
    });

    var toolbar = document.querySelector('#ziweiResult .zw-mode-toolbar');
    if (toolbar) toolbar.addEventListener('click', function(event) {
      var button = event.target.closest('[data-zw-mode]');
      if (!button) return;
      ZiweiModule._connectionMode = button.getAttribute('data-zw-mode');
      toolbar.querySelectorAll('[data-zw-mode]').forEach(function(item) { item.classList.toggle('is-active', item === button); });
      ZiweiModule._activatePalace(ZiweiModule._selectedBranch || ZiweiModule._lastChart.earthlyBranchOfSoulPalace);
    });
    this._bindFlowInteractions();

    var svg = board.querySelector('.zw-sanfang-lines');
    this._activatePalace(svg && svg.getAttribute('data-origin-branch'));
    if (!this._resizeBound) {
      this._resizeBound = true;
      window.addEventListener('resize', function() { ZiweiModule._positionSanFangLines(); }, { passive: true });
    }
  },

  _bindFlowInteractions: function() {
    var flowPanel = document.querySelector('#ziweiResult .zw-flow-panel');
    if (!flowPanel || flowPanel.getAttribute('data-flow-interactions') === 'ready') return;
    flowPanel.setAttribute('data-flow-interactions', 'ready');
    flowPanel.addEventListener('click', function(event) {
      var cell = event.target.closest('.zw-flow-cell[data-flow-level]');
      if (!cell) return;
      ZiweiModule._selectFlowItem(cell.getAttribute('data-flow-level'), Number(cell.getAttribute('data-flow-index')));
    });
  },

  _activatePalace: function(originBranch) {
    var board = document.querySelector('#ziweiResult .zw-board');
    var svg = board && board.querySelector('.zw-sanfang-lines');
    if (!board || !svg || !originBranch) return;
    var relations = this._relationsForMode(originBranch);
    if (!relations.length) return;

    this._selectedBranch = originBranch;

    svg.setAttribute('data-origin-branch', originBranch);
    svg.innerHTML = '<defs><marker id="zwArrowLu" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#24965c"></path></marker><marker id="zwArrowQuan" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#7846a0"></path></marker><marker id="zwArrowKe" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#2586b3"></path></marker><marker id="zwArrowJi" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#c43632"></path></marker></defs>' + relations.map(function(item) {
      return '<line class="zw-line-' + ZiweiModule._escape(item.type) + '" data-source-branch="' + ZiweiModule._escape(item.from || originBranch) + '" data-target-branch="' + ZiweiModule._escape(item.to || item.branch) + '" data-relation="' + ZiweiModule._escape(item.type) + '" x1="0" y1="0" x2="0" y2="0"></line>';
    }).join('') + '<circle class="zw-sanfang-origin" cx="0" cy="0" r="4"></circle>';

    var related = relations.reduce(function(list,item) { list.push(item.from,item.to || item.branch); return list; }, []);
    board.querySelectorAll('.zw-palace[data-branch]').forEach(function(palace) {
      var branch = palace.getAttribute('data-branch');
      palace.classList.toggle('is-selected', branch === originBranch);
      palace.classList.toggle('is-related', related.indexOf(branch) >= 0);
      palace.setAttribute('aria-pressed', branch === originBranch ? 'true' : 'false');
    });

    var selected = board.querySelector('.zw-palace[data-branch="' + originBranch + '"]');
    var label = board.querySelector('.zw-link-hint');
    if (label && selected) {
      var name = selected.getAttribute('data-palace-name') || originBranch + '宫';
      var modeLabel = ZiweiModule._connectionMode === 'fly' ? '宫干飞星' : (ZiweiModule._connectionMode === 'sihua' ? '四化飞入飞出' : '三方四正');
      label.textContent = '当前：' + name + ' · ' + modeLabel;
    }
    this._renderPalaceDetail(originBranch);
    requestAnimationFrame(function() { ZiweiModule._positionSanFangLines(); });
  },

  _renderHeader: function(chart, input) {
    var timeText = String(input.hour).padStart(2, '0') + ':' + String(input.minute).padStart(2, '0');
    var calText = input.calType === 'lunar' ? '农历' + (input.isLeap ? '·闰月' : '') : '公历';
    return '<div class="zw-summary">' +
      '<div class="zw-summary-title">紫微斗数命盘</div>' +
      '<div class="zw-summary-sub">' + this._escape(input.name || '未命名') + ' · ' + this._escape(input.gender) + ' · ' + calText + ' ' + input.year + '-' + input.month + '-' + input.day + ' ' + timeText + '</div>' +
      '<div class="zw-chips">' +
        this._chip('阳历', chart.solarDate || '—') +
        this._chip('农历', chart.lunarDate || '—') +
        this._chip('四柱', chart.chineseDate || '—') +
        this._chip('五行局', chart.fiveElementsClass || '—') +
        this._chip('命主', chart.soul || '—') +
        this._chip('身主', chart.body || '—') +
        this._chip('流派', input.school === 'zhongzhou' ? '中州派' : '通行派') +
      '</div>' +
      '</div>';
  },

  _renderCenter: function(chart, input, current) {
    var yearly = current && current.yearly ? (current.yearly.heavenlyStem || '') + (current.yearly.earthlyBranch || '') : '—';
    var decadal = current && current.decadal ? (current.decadal.heavenlyStem || '') + (current.decadal.earthlyBranch || '') : '—';
    var monthly = current && current.monthly ? (current.monthly.heavenlyStem || '') + (current.monthly.earthlyBranch || '') : '—';
    var daily = current && current.daily ? (current.daily.heavenlyStem || '') + (current.daily.earthlyBranch || '') : '—';
    var hourly = current && current.hourly ? (current.hourly.heavenlyStem || '') + (current.hourly.earthlyBranch || '') : '—';
    var age = current && current.age && Number.isInteger(current.age.nominalAge) ? '虚岁' + current.age.nominalAge + ' · ' : '';
    var flowLabel = this._flowIsManual ? '所选' : '当前';
    return '<div class="zw-center">' +
      '<div class="zw-center-seal">紫微斗数</div>' +
      '<div class="zw-link-hint">点击任意宫位查看三方四正</div>' +
      '<div class="zw-center-name">' + this._escape(input.name || '道问命盘') + '</div>' +
      '<div class="zw-center-line">生肖 ' + this._escape(chart.zodiac || '—') + ' · ' + this._escape(chart.sign || '—') + '</div>' +
      '<div class="zw-center-line">' + this._escape(chart.time || '—') + ' · ' + this._escape(chart.timeRange || '—') + '</div>' +
      '<div class="zw-center-line">命宫 ' + this._escape(chart.earthlyBranchOfSoulPalace || '—') + ' · 身宫 ' + this._escape(chart.earthlyBranchOfBodyPalace || '—') + '</div>' +
      '<div class="zw-center-line zw-yearly">' + flowLabel + ' ' + this._escape(age) + '大限 ' + this._escape(decadal) + ' · 流年 ' + this._escape(yearly) + ' · 流月 ' + this._escape(monthly) + '</div>' +
      '<div class="zw-center-line zw-daily">流日 ' + this._escape(daily) + ' · 流时 ' + this._escape(hourly) + '</div>' +
      '<div class="zw-center-note">排盘采用标准历法数据；“当地钟表时间”不等同于真太阳时。</div>' +
      '</div>';
  },

  _renderFlowTables: function(chart, current, date) {
    if (!chart || !current || typeof chart.decadalList !== 'function') return '';
    var decadal = chart.decadalList();
    var active = decadal.find(function(item) {
      return item.index === current.decadal.index && item.heavenlyStem === current.decadal.heavenlyStem && item.earthlyBranch === current.decadal.earthlyBranch;
    });
    var activePosition = active ? decadal.indexOf(active) : -1;
    var yearly = activePosition >= 0 && typeof chart.yearlyList === 'function' ? chart.yearlyList(activePosition) : [];
    var targetDate = date instanceof Date ? date : new Date(date);
    var selectedYear = yearly.find(function(item) {
      return item.heavenlyStem === current.yearly.heavenlyStem && item.earthlyBranch === current.yearly.earthlyBranch;
    });
    var year = selectedYear && selectedYear.year || targetDate.getFullYear();
    var monthly = typeof chart.monthlyList === 'function' ? chart.monthlyList(year, true) : [];
    var selectedMonth = this._monthlyItemForFlow(chart, year, current, targetDate);
    var daily = this._dailyListForFlow(chart, year, current, targetDate);
    var hourly = [
      { timeIndex:0, branch:'子', label:'早子' }, { timeIndex:1, branch:'丑', label:'丑时' },
      { timeIndex:2, branch:'寅', label:'寅时' }, { timeIndex:3, branch:'卯', label:'卯时' },
      { timeIndex:4, branch:'辰', label:'辰时' }, { timeIndex:5, branch:'巳', label:'巳时' },
      { timeIndex:6, branch:'午', label:'午时' }, { timeIndex:7, branch:'未', label:'未时' },
      { timeIndex:8, branch:'申', label:'申时' }, { timeIndex:9, branch:'酉', label:'酉时' },
      { timeIndex:10, branch:'戌', label:'戌时' }, { timeIndex:11, branch:'亥', label:'亥时' },
      { timeIndex:12, branch:'子', label:'晚子' }
    ];
    this._flowLists = { decadal:decadal, yearly:yearly, monthly:monthly, daily:daily, hourly:hourly };

    return '<section class="zw-flow-panel" aria-label="紫微运限表">' +
      '<div class="zw-flow-panel-title">运限推演</div>' +
      this._renderFlowRow('大限', decadal, function(item) {
        return '<b>' + item.ageRange[0] + '～' + item.ageRange[1] + '</b><span>' + item.heavenlyStem + item.earthlyBranch + '限</span>';
      }, function(item) { return active && item.index === active.index; }, 'decadal') +
      this._renderFlowRow('流年', yearly, function(item) {
        return '<b>' + item.year + '年</b><span>' + item.heavenlyStem + item.earthlyBranch + ' · ' + item.age + '岁</span>';
      }, function(item) { return selectedYear && item.year === selectedYear.year; }, 'yearly') +
      this._renderFlowRow('流月', monthly, function(item) {
        var leap = item.isLeapMonth ? '闰' : '';
        var part = item.part === 'first' ? '上' : (item.part === 'second' ? '下' : '');
        return '<b>' + leap + item.month + '月' + part + '</b><span>' + item.heavenlyStem + item.earthlyBranch + '</span>';
      }, function(item) { return selectedMonth === item || (!!selectedMonth && item.year === selectedMonth.year && item.month === selectedMonth.month && !!item.isLeapMonth === !!selectedMonth.isLeapMonth && item.part === selectedMonth.part); }, 'monthly') +
      this._renderFlowRow('流日', daily, function(item) {
        return '<b>' + item.label + '</b><span>' + item.heavenlyStem + item.earthlyBranch + '</span>';
      }, function(item) { return item.dateText === ZiweiModule._dateText(targetDate); }, 'daily') +
      this._renderFlowRow('流时', hourly, function(item) {
        return '<b>' + item.label + '</b>';
      }, function(item) { return item.timeIndex === ZiweiModule._selectedFlowTimeIndex; }, 'hourly') +
      '</section>';
  },

  _solarTextFromLunar: function(year, month, day, isLeapMonth) {
    if (typeof DaoCalendar !== 'undefined' && DaoCalendar.lunarToSolar) {
      var solar = DaoCalendar.lunarToSolar(year, month, day, !!isLeapMonth);
      return solar.year + '-' + solar.month + '-' + solar.day;
    }
    if (this._engineRef && this._engineRef.astro && this._lastChart) {
      return this._engineRef.astro.byLunar(
        year + '-' + month + '-' + day, 0, this._lastChart.gender, !!isLeapMonth, true, 'zh-CN'
      ).solarDate;
    }
    throw new Error('农历转换引擎不可用');
  },

  _monthlyItemForFlow: function(chart, year, flow, selectedDate) {
    var list = typeof chart.monthlyList === 'function' ? chart.monthlyList(year, true) : [];
    if (selectedDate && typeof DaoCalendar !== 'undefined' && DaoCalendar.solarDetails) {
      try {
        var dateParts = this._dateText(selectedDate).split('-').map(Number);
        var lunar = DaoCalendar.solarDetails(dateParts[0], dateParts[1], dateParts[2], 0).lunar;
        var calendarMatch = list.find(function(item) {
          return item.year === lunar.year && item.month === lunar.month && !!item.isLeapMonth === !!lunar.isLeap &&
            Array.isArray(item.dayRange) && lunar.day >= item.dayRange[0] && lunar.day <= item.dayRange[1];
        });
        if (calendarMatch) return calendarMatch;
      } catch (_) {}
    }
    return list.find(function(item) {
      return item.index === flow.monthly.index && item.heavenlyStem === flow.monthly.heavenlyStem && item.earthlyBranch === flow.monthly.earthlyBranch;
    });
  },

  _dailyListForFlow: function(chart, year, flow, selectedDate) {
    var month = this._monthlyItemForFlow(chart, year, flow, selectedDate);
    if (!month || !Array.isArray(month.dayRange)) return [];
    var result = [];
    for (var day = month.dayRange[0]; day <= month.dayRange[1]; day++) {
      try {
        var dateText = this._solarTextFromLunar(month.year, month.month, day, month.isLeapMonth);
        var dailyStem = '';
        var dailyBranch = '';
        if (typeof DaoCalendar !== 'undefined' && DaoCalendar.solarDetails) {
          var solarParts = dateText.split('-').map(Number);
          var details = DaoCalendar.solarDetails(solarParts[0], solarParts[1], solarParts[2], this._selectedFlowTimeIndex || 0);
          var dayPillar = details && details.dayPillar && details.dayPillar.ganZhi || '';
          dailyStem = dayPillar.charAt(0);
          dailyBranch = dayPillar.charAt(1);
        } else {
          var actual = this._getHoroscope(chart, dateText, this._selectedFlowTimeIndex || 0);
          dailyStem = actual.daily.heavenlyStem;
          dailyBranch = actual.daily.earthlyBranch;
        }
        result.push({
          dateText:dateText,
          label:this._lunarDayLabel(day),
          heavenlyStem:dailyStem,
          earthlyBranch:dailyBranch
        });
      } catch (_) {}
    }
    return result;
  },

  _renderFlowRow: function(title, items, renderItem, isActive, level) {
    if (!Array.isArray(items) || !items.length) return '';
    return '<div class="zw-flow-row"><div class="zw-flow-label">' + this._escape(title) + '</div><div class="zw-flow-grid">' +
      items.map(function(item, index) {
        var active = isActive && isActive(item) ? ' is-active' : '';
        return '<button type="button" class="zw-flow-cell' + active + '" data-flow-level="' + ZiweiModule._escape(level || '') + '" data-flow-index="' + index + '">' + renderItem(item) + '</button>';
      }).join('') + '</div></div>';
  },

  _selectFlowItem: function(level, index) {
    var list = this._flowLists && this._flowLists[level];
    var item = list && list[index];
    if (item == null || !this._lastChart || !this._selectedFlowDate) return;
    try {
      var target = this._resolveFlowTarget(level, item);
      this._selectedFlowDate = target.date;
      this._selectedFlowTimeIndex = target.timeIndex;
      this._flowIsManual = true;
      this._refreshSelectedFlow(level);
    } catch (error) {
      console.error('[ZiweiModule] 运限切换失败', error);
      this._showStatus('运限切换失败：' + (error.message || '日期无效'), 'error');
    }
  },

  _resolveFlowTarget: function(level, item) {
    var date = new Date(this._selectedFlowDate.getFullYear(), this._selectedFlowDate.getMonth(), this._selectedFlowDate.getDate());
    var timeIndex = this._selectedFlowTimeIndex;
    if (level === 'decadal') {
      if (!item.yearRange || !Number.isInteger(item.yearRange[0])) throw new Error('大限年份缺失');
      date = new Date(item.yearRange[0], 6, 1);
      timeIndex = 0;
    } else if (level === 'yearly') {
      if (!Number.isInteger(item.year)) throw new Error('流年年份缺失');
      date = new Date(item.year, 6, 1);
      timeIndex = 0;
    } else if (level === 'monthly') {
      var selectedYear = Number.isInteger(item.year) ? item.year : date.getFullYear();
      var startDay = item.dayRange && item.dayRange[0] || 1;
      var solarText = this._solarTextFromLunar(selectedYear, item.month, startDay, item.isLeapMonth);
      var parts = solarText.split('-').map(Number);
      date = new Date(parts[0], parts[1] - 1, parts[2]);
      timeIndex = 0;
    } else if (level === 'daily') {
      if (!item.dateText) throw new Error('流日日期缺失');
      var values = item.dateText.split('-').map(Number);
      date = new Date(values[0], values[1] - 1, values[2]);
      timeIndex = 0;
    } else if (level === 'hourly') {
      if (!Number.isInteger(item.timeIndex)) throw new Error('流时时辰缺失');
      timeIndex = item.timeIndex;
    } else {
      throw new Error('未知运限层级');
    }
    return { date:date, timeIndex:timeIndex };
  },

  _refreshSelectedFlow: function(activeLevel) {
    var chart = this._lastChart;
    var date = this._selectedFlowDate;
    var current = this._getHoroscope(chart, date, this._selectedFlowTimeIndex);
    this._assertCycleIntegrity(chart, current, date);
    this._currentHoroscope = current;
    this._selectedFlow = this._flowSnapshot(current, date);
    this._selectedFlow.activeLevel = activeLevel;
    this._selectedFlow.timeIndex = this._selectedFlowTimeIndex;

    var center = document.querySelector('#ziweiResult .zw-center');
    if (center) center.outerHTML = this._renderCenter(chart, this._lastInput, current);
    var panel = document.querySelector('#ziweiResult .zw-flow-panel');
    if (panel) panel.outerHTML = this._renderFlowTables(chart, current, date);
    this._bindFlowInteractions();

    var active = current[activeLevel];
    document.querySelectorAll('#ziweiResult .zw-palace[data-branch]').forEach(function(palace) {
      var model = ZiweiModule._findPalace(palace.getAttribute('data-branch'));
      palace.classList.toggle('is-current-decadal', !!model && model.index === current.decadal.index);
      palace.classList.toggle('is-current-yearly', !!model && model.index === current.yearly.index);
      palace.classList.toggle('is-flow-selected', !!model && active && model.index === active.index);
    });
    var result = document.getElementById('ziweiAIReadingResult');
    if (result) result.innerHTML = '<div class="zw-ai-loading">运限已更新，请按需重新生成对应解读。</div>';
    this._renderPalaceDetail(this._selectedBranch);
    this._positionSanFangLines();
    this._showStatus('', 'info');
  },

  _lunarDayLabel: function(day) {
    var labels = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
    return labels[day - 1] || String(day);
  },

  _renderPalace: function(p, gridClass, current) {
    if (!p) return '<section class="zw-palace ' + gridClass + '"></section>';
    var isDecadal = !!(current && current.decadal && current.decadal.index === p.index);
    var isYearly = !!(current && current.yearly && current.yearly.index === p.index);
    var html = '<section class="zw-palace ' + gridClass + (p.name === '命宫' ? ' is-soul' : '') + (isDecadal ? ' is-current-decadal' : '') + (isYearly ? ' is-current-yearly' : '') + '" data-branch="' + this._escape(p.earthlyBranch || '') + '" data-palace-name="' + this._escape(p.name || '') + '" role="button" tabindex="0" aria-label="查看' + this._escape(p.name || '') + '三方四正" aria-pressed="false">';
    html += '<div class="zw-palace-head"><span class="zw-palace-name">' + this._escape(p.name) + '</span>' +
      (p.isBodyPalace ? '<span class="zw-body-badge">身宫</span>' : '') +
      (isDecadal ? '<span class="zw-flow-badge">大限</span>' : '') +
      (isYearly ? '<span class="zw-flow-badge yearly">流年</span>' : '') +
      '<span class="zw-palace-gz">' + this._escape((p.heavenlyStem || '') + (p.earthlyBranch || '')) + '</span></div>';

    if (p.decadal && p.decadal.range) {
      html += '<div class="zw-stage">大限 ' + this._escape(p.decadal.range[0]) + '～' + this._escape(p.decadal.range[1]) + ' 岁 · ' + this._escape((p.decadal.heavenlyStem || '') + (p.decadal.earthlyBranch || '')) + '</div>';
    }
    if (Array.isArray(p.ages) && p.ages.length) html += '<div class="zw-ages">小限 ' + p.ages.map(this._escape).join(' · ') + '</div>';

    var majors = (p.majorStars || []).filter(function(s) { return s && s.name; });
    if (majors.length) {
      html += '<div class="zw-major-list">';
      for (var i = 0; i < majors.length; i++) html += this._renderStar(majors[i], true);
      html += '</div>';
    } else {
      html += '<div class="zw-empty">空宫</div>';
    }

    var minors = (p.minorStars || []).filter(function(s) { return s && s.name; });
    if (minors.length) {
      html += '<div class="zw-minor-list">';
      for (var j = 0; j < minors.length; j++) html += this._renderStar(minors[j], false);
      html += '</div>';
    }

    var adjectives = (p.adjectiveStars || []).filter(function(s) { return s && s.name; });
    if (adjectives.length) {
      html += '<div class="zw-adjective">' + adjectives.map(function(s) { return ZiweiModule._escape(s.name); }).join(' · ') + '</div>';
    }

    var gods = [p.changsheng12, p.boshi12, p.jiangqian12, p.suiqian12].filter(Boolean);
    if (gods.length) html += '<div class="zw-gods">' + gods.map(this._escape).join(' · ') + '</div>';
    html += '</section>';
    return html;
  },

  _renderStar: function(star, major) {
    var mutagen = '';
    if (Array.isArray(star.mutagen)) mutagen = star.mutagen.join('');
    else if (star.mutagen) mutagen = String(star.mutagen);
    var cls = (major ? 'zw-star major ' : 'zw-star minor ') + this._starElementClass(star.name);
    var extra = '';
    if (star.brightness) extra += '<span class="zw-bright">' + this._escape(star.brightness) + '</span>';
    if (mutagen) extra += '<span class="zw-mutagen ' + this._mutagenClass(mutagen) + '">' + this._escape(mutagen) + '</span>';
    return '<span class="' + cls + '"><b>' + this._escape(star.name) + '</b>' + extra + '</span>';
  },

  _starElementClass: function(name) {
    var groups = {
      wood:['天机','贪狼'], fire:['太阳','廉贞'], earth:['紫微','天府','天梁'],
      metal:['武曲','七杀'], water:['天同','太阴','巨门','天相','破军']
    };
    var found = Object.keys(groups).find(function(key) { return groups[key].indexOf(name) >= 0; });
    return found ? 'element-' + found : 'element-neutral';
  },

  _mutagenClass: function(value) {
    return value.indexOf('禄') >= 0 ? 'is-lu' : value.indexOf('权') >= 0 ? 'is-quan' : value.indexOf('科') >= 0 ? 'is-ke' : value.indexOf('忌') >= 0 ? 'is-ji' : '';
  },

  _chip: function(label, value) {
    return '<span class="zw-chip"><small>' + this._escape(label) + '</small><b>' + this._escape(value) + '</b></span>';
  },

  _escape: function(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  },

  _renderSVG: function() {
    // 兼容 paywall.js 旧接口：兑换后可重绘最近一次命盘。
    if (this._lastChart && this._lastInput) this._render(this._lastChart, this._lastInput);
  },

  _enhanceUI: function() {
    if (this._uiEnhanced) return;
    var overlay = document.getElementById('ziweiOverlay');
    if (!overlay) return;
    this._uiEnhanced = true;

    var modal = overlay.querySelector('.tool-modal');
    if (modal) modal.classList.add('ziwei-modal');

    var title = overlay.querySelector('.modal-title');
    if (title) title.textContent = '☯ 紫微斗数';
    var desc = overlay.querySelector('.modal-desc');
    if (desc) desc.textContent = '十二宫 · 十四主星 · 辅煞星 · 四化与运限（阳历输入优先）';

    var hour = document.getElementById('ziweiHour');
    if (hour) {
      hour.placeholder = '0-23';
      var group = hour.closest ? hour.closest('.form-group') : null;
      var row = group && group.parentElement;
      if (row && !document.getElementById('ziweiMinute')) {
        var minuteGroup = document.createElement('div');
        minuteGroup.className = 'form-group';
        minuteGroup.innerHTML = '<label>出生分钟</label><input type="number" id="ziweiMinute" placeholder="0-59" min="0" max="59" value="0">';
        row.appendChild(minuteGroup);
      }
    }

    var calType = document.getElementById('ziweiCalType');
    if (calType) {
      var calGroup = calType.closest ? calType.closest('.form-group') : null;
      if (calGroup && !document.getElementById('ziweiLeapWrap')) {
        var wrap = document.createElement('label');
        wrap.id = 'ziweiLeapWrap';
        wrap.className = 'zw-leap-toggle';
        wrap.innerHTML = '<input type="checkbox" id="ziweiLeapMonth"> <span>这是闰月</span>';
        calGroup.appendChild(wrap);
      }
      calType.addEventListener('change', function() { ZiweiModule._syncCalendarUI(); });
    }

    if (!document.getElementById('ziweiSchool')) {
      var gender = document.getElementById('ziweiGender');
      var genderGroup = gender && gender.closest ? gender.closest('.form-group') : null;
      var schoolGroup = document.createElement('div');
      schoolGroup.className = 'form-group zw-school-group';
      schoolGroup.innerHTML = '<label for="ziweiSchool">排盘流派</label><select id="ziweiSchool"><option value="zhongzhou">中州派（推荐）</option><option value="default">通行派</option></select><small>中州派更接近专业盘；两种流派均使用 iztro 官方算法。</small>';
      if (genderGroup && genderGroup.parentElement) genderGroup.parentElement.appendChild(schoolGroup);
      var savedSchool = '';
      try { savedSchool = localStorage.getItem('daowen_ziwei_school') || ''; } catch (_) {}
      document.getElementById('ziweiSchool').value = savedSchool === 'default' ? 'default' : 'zhongzhou';
      document.getElementById('ziweiSchool').addEventListener('change', function() {
        try { localStorage.setItem('daowen_ziwei_school', this.value); } catch (_) {}
      });
    }

    var button = null;
    var buttons = overlay.querySelectorAll('.btn-primary');
    for (var i = 0; i < buttons.length; i++) {
      if ((buttons[i].getAttribute('onclick') || '').indexOf('ZiweiModule.calculate') !== -1) { button = buttons[i]; break; }
    }
    if (button) {
      button.id = 'ziweiCalculateBtn';
      button.textContent = '☯ 生成命盘';
    }

    if (!document.getElementById('ziweiStatus') && button) {
      var status = document.createElement('div');
      status.id = 'ziweiStatus';
      status.className = 'zw-status';
      status.style.display = 'none';
      button.parentElement.insertBefore(status, button.nextSibling);
    }

    if (modal && !document.getElementById('ziweiEngineNote')) {
      var note = document.createElement('p');
      note.id = 'ziweiEngineNote';
      note.className = 'zw-engine-note';
      note.textContent = '提示：公历更不容易因闰月输入错误。农历出生请确认是否为闰月；本模块不再把普通出生时间误标为“真太阳时”。';
      var result = document.getElementById('ziweiResult');
      if (result) modal.insertBefore(note, result);
    }

    this._injectStyles();
    this._syncCalendarUI();
  },

  _syncCalendarUI: function() {
    var type = document.getElementById('ziweiCalType');
    var wrap = document.getElementById('ziweiLeapWrap');
    if (wrap) wrap.style.display = type && type.value === 'lunar' ? 'flex' : 'none';
    if (type && type.value !== 'lunar') {
      var cb = document.getElementById('ziweiLeapMonth');
      if (cb) cb.checked = false;
    }
  },

  _setCalculateBusy: function(flag) {
    var btn = document.getElementById('ziweiCalculateBtn');
    if (!btn) return;
    btn.disabled = !!flag;
    btn.textContent = flag ? '正在排盘…' : '☯ 生成命盘';
  },

  _showStatus: function(message, type) {
    var el = document.getElementById('ziweiStatus');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'zw-status ' + (type || 'info');
    el.style.display = message ? 'block' : 'none';
  },

  _injectStyles: function() {
    if (document.getElementById('daowenZiweiStyles')) return;
    var style = document.createElement('style');
    style.id = 'daowenZiweiStyles';
    style.textContent = `
      #ziweiOverlay{background:rgba(225,225,225,.72)}
      #ziweiOverlay .ziwei-modal{max-width:1120px;width:min(98vw,1120px);background:#fff!important;color:#242424!important;border-color:#b9b9b9!important}
      #ziweiOverlay .modal-title,#ziweiOverlay .modal-desc,#ziweiOverlay label{color:#242424!important}
      #ziweiOverlay input,#ziweiOverlay select,#ziweiOverlay textarea{background:#fff!important;color:#222!important;border-color:#b8b8b8!important}
      #ziweiOverlay .form-row{align-items:flex-start}
      .zw-leap-toggle{display:none;align-items:center;gap:.35rem;margin-top:.45rem;font-size:.78rem;color:var(--text-secondary,#6f6657);cursor:pointer}
      .zw-leap-toggle input{width:auto;margin:0}
      .zw-engine-note{margin:.75rem 0;padding:.65rem .8rem;border-left:3px solid #9e3f2d;background:rgba(158,63,45,.055);color:var(--text-secondary,#6f6657);font-size:.78rem;line-height:1.6}
      .zw-status{margin:.7rem 0;padding:.65rem .8rem;border-radius:8px;font-size:.85rem;text-align:center}
      .zw-status.loading{background:rgba(149,119,60,.08);color:#856a32}
      .zw-status.error{background:rgba(160,54,42,.08);color:#a0362a}
      #ziweiCalculateBtn:disabled{opacity:.58;cursor:wait}
      .zw-shell{color:#302e29}
      .zw-summary{margin:1rem 0 .8rem;padding:1rem;border:1px solid rgba(109,88,53,.22);border-radius:14px;background:linear-gradient(145deg,rgba(255,253,246,.96),rgba(244,238,222,.86));box-shadow:0 12px 34px rgba(50,42,30,.08)}
      .zw-summary-title{text-align:center;font-family:KaiTi,STKaiti,serif;font-size:1.45rem;font-weight:700;letter-spacing:.18em;color:#2e2a23}
      .zw-summary-sub{text-align:center;margin:.35rem 0 .8rem;color:#7a6c58;font-size:.82rem}
      .zw-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:.42rem}
      .zw-chip{display:inline-flex;align-items:center;gap:.36rem;padding:.34rem .55rem;border:1px solid rgba(125,100,59,.18);border-radius:999px;background:rgba(255,255,255,.58);font-size:.74rem}
      .zw-chip small{color:#907f67}.zw-chip b{font-weight:600;color:#3b342b}
      .zw-board{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(4,minmax(188px,auto));gap:1px;background:#777;border:1px solid #777;border-radius:4px;overflow:hidden;box-shadow:0 14px 38px rgba(45,37,25,.12)}
      .zw-palace{position:relative;min-width:0;padding:.58rem 2.35rem .58rem .58rem;background:#fff;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;transition:background-color .18s ease,box-shadow .18s ease,filter .18s ease}
      .zw-palace:hover{background:#fffaf0}.zw-palace:focus-visible{outline:2px solid #b68a38;outline-offset:-3px;z-index:4}
      .zw-palace.is-soul{background:#fffdf7}
      .zw-palace.is-selected{background:linear-gradient(145deg,#fff4d7,#f3dfaa);box-shadow:inset 0 0 0 3px #a87925;z-index:3}
      .zw-palace.is-related{background:linear-gradient(145deg,#fffdfa,#f9eee4);box-shadow:inset 0 0 0 2px rgba(191,47,39,.38)}
      .zw-palace-head{position:absolute;right:.28rem;bottom:.35rem;display:flex;flex-direction:column-reverse;align-items:center;gap:.2rem;margin:0;border:0;padding:0;z-index:1}
      .zw-palace-name{font-family:KaiTi,STKaiti,serif;font-size:1.02rem;font-weight:800;color:#2d2822;writing-mode:vertical-rl;letter-spacing:.08em}
      .zw-palace-gz{margin:0;font-family:KaiTi,STKaiti,serif;font-size:1.12rem;font-weight:800;color:#151515;writing-mode:vertical-rl}
      .zw-body-badge{font-size:.64rem;background:#8d3427;color:#fff;border-radius:4px;padding:.08rem .28rem}
      .zw-flow-badge{font-size:.62rem;background:#8b6f31;color:#fff;border-radius:4px;padding:.08rem .28rem}.zw-flow-badge.yearly{background:#b54031}
      .zw-stage{order:4;margin-top:auto;font-family:KaiTi,STKaiti,serif;font-size:.78rem;color:#4d443a;text-align:center}
      .zw-ages{order:3;font-size:.65rem;color:#5f584f;margin:.28rem 0;line-height:1.45}
      .zw-major-list,.zw-minor-list{display:flex;flex-wrap:wrap;gap:.28rem .4rem}
      .zw-minor-list{margin-top:.34rem;padding-top:.32rem;border-top:1px dashed rgba(110,91,62,.13)}
      .zw-star{display:inline-flex;align-items:center;gap:.15rem;white-space:nowrap}
      .zw-star.major{font-family:KaiTi,STKaiti,serif;font-size:1.12rem;font-weight:800}
      .zw-star.minor{color:#5e5548;font-size:.72rem}
      .zw-star.element-wood{color:#268d6b}.zw-star.element-fire{color:#b9342d}.zw-star.element-earth{color:#8a5d26}.zw-star.element-metal{color:#7150a0}.zw-star.element-water{color:#237b9a}.zw-star.element-neutral{color:#403b35}
      .zw-bright{font-family:system-ui,sans-serif;font-size:.58rem;color:#927c59;border:1px solid rgba(146,124,89,.22);border-radius:3px;padding:0 .14rem}
      .zw-mutagen{font-family:system-ui,sans-serif;font-size:.66rem;color:#fff;border-radius:3px;padding:.02rem .2rem}.zw-mutagen.is-lu{background:#28965f}.zw-mutagen.is-quan{background:#7448a0}.zw-mutagen.is-ke{background:#2786aa}.zw-mutagen.is-ji{background:#c13a32}
      .zw-empty{font-size:.76rem;color:#aaa096;font-style:italic}
      .zw-adjective{margin-top:.35rem;font-size:.68rem;line-height:1.45;color:#48433d}
      .zw-gods{order:5;margin-top:.3rem;font-size:.66rem;color:#26917f}
      .zw-palace.is-current-decadal{box-shadow:inset 0 0 0 2px rgba(139,111,49,.65)}.zw-palace.is-current-yearly{background:linear-gradient(145deg,#fff8ee,#f7e6d5)}
      .zw-center{grid-column:2/4;grid-row:2/4;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:1rem;background:#fff;position:relative;overflow:hidden}
      .zw-center-seal{font-family:KaiTi,STKaiti,serif;font-size:1.8rem;font-weight:800;letter-spacing:.16em;color:#292520}
      .zw-link-hint{margin-top:.45rem;padding:.28rem .6rem;border:1px solid rgba(182,138,56,.45);border-radius:999px;background:#fffaf0;color:#8c6021;font-size:.7rem;font-weight:700}
      .zw-center-name{font-family:KaiTi,STKaiti,serif;font-size:1.25rem;font-weight:700;margin:.7rem 0 .4rem;color:#3b3228}
      .zw-center-line{font-size:.78rem;line-height:1.7;color:#554e44}
      .zw-center-line.zw-yearly{color:#9a412e;font-weight:600}
      .zw-center-note{max-width:80%;margin-top:.45rem;font-size:.65rem;line-height:1.5;color:#9a907f}
      .zw-flow-panel{margin-top:.8rem;border:1px solid #aaa;background:#fff;color:#302e29;border-radius:4px;overflow:hidden}
      .zw-flow-panel-title{padding:.58rem .8rem;font-family:KaiTi,STKaiti,serif;font-size:1.1rem;font-weight:800;border-bottom:1px solid #aaa;background:#f7f7f7}
      .zw-flow-row{display:grid;grid-template-columns:64px minmax(0,1fr);border-bottom:1px solid #c9c9c9}.zw-flow-row:last-child{border-bottom:0}
      .zw-flow-label{display:flex;align-items:center;justify-content:center;padding:.5rem .25rem;border-right:1px solid #c9c9c9;font-family:KaiTi,STKaiti,serif;font-size:1rem;font-weight:800;background:#fafafa}
      .zw-flow-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(76px,1fr))}
      .zw-flow-cell{appearance:none;width:100%;border:0;border-radius:0;background:#fff;color:#302e29;min-height:48px;padding:.4rem .26rem;border-right:1px solid #e0e0e0;border-bottom:1px solid #e8e8e8;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.12rem;cursor:pointer}
      .zw-flow-cell b{font-family:KaiTi,STKaiti,serif;font-size:.8rem}.zw-flow-cell span{font-size:.66rem;color:#6b6258}.zw-flow-cell.is-active{background:#efe1bb;box-shadow:inset 0 0 0 2px #b68a38}.zw-flow-cell.is-active b{color:#8c2d25}
      .zw-palace.is-flow-selected{outline:2px solid #2586b3;outline-offset:-3px}
      #ziweiResult .zw-sanfang-lines{position:absolute;inset:0;width:100%;height:100%;max-width:none;margin:0;z-index:2;pointer-events:none;overflow:visible;filter:none;background:transparent;border-radius:0;box-shadow:none}
      .zw-sanfang-lines line{stroke:#bf2f27;stroke-width:1.8;stroke-linecap:round;opacity:.72;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 2px rgba(255,255,255,.8));stroke-dasharray:7 4;animation:zwLineFlow 1.1s linear infinite}
      .zw-sanfang-lines .zw-line-禄{stroke:#24965c;marker-end:url(#zwArrowLu)}.zw-sanfang-lines .zw-line-权{stroke:#7846a0;marker-end:url(#zwArrowQuan)}.zw-sanfang-lines .zw-line-科{stroke:#2586b3;marker-end:url(#zwArrowKe)}.zw-sanfang-lines .zw-line-忌{stroke:#c43632;marker-end:url(#zwArrowJi)}
      .zw-sanfang-origin{fill:#bf2f27;stroke:rgba(255,250,238,.9);stroke-width:1.4;opacity:.8;vector-effect:non-scaling-stroke}
      @keyframes zwLineFlow{to{stroke-dashoffset:-22}}
      .g1{grid-column:1;grid-row:1}.g2{grid-column:2;grid-row:1}.g3{grid-column:3;grid-row:1}.g4{grid-column:4;grid-row:1}
      .g5{grid-column:1;grid-row:2}.g8{grid-column:4;grid-row:2}.g9{grid-column:1;grid-row:3}.g12{grid-column:4;grid-row:3}
      .g13{grid-column:1;grid-row:4}.g14{grid-column:2;grid-row:4}.g15{grid-column:3;grid-row:4}.g16{grid-column:4;grid-row:4}
      .zw-mode-toolbar{display:flex;align-items:center;justify-content:center;gap:.35rem;margin:.65rem 0;padding:.5rem;border:1px solid #c7c7c7;background:#f5f5f5}.zw-mode-toolbar button{width:auto;padding:.42rem 1.25rem;border:1px solid #999;background:#fff;color:#333;border-radius:4px}.zw-mode-toolbar button.is-active{background:#6b55b7;color:#fff;border-color:#6b55b7}.zw-mode-toolbar>span{margin-left:.5rem;color:#777;font-size:.75rem}
      .zw-palace-detail{margin:.75rem 0;border:1px solid #bcbcbc;background:#fff;color:#252525}.zw-palace-detail>header{display:flex;justify-content:space-between;align-items:center;padding:.8rem 1rem;background:#f4f4f4;border-bottom:1px solid #ccc}.zw-palace-detail>header span{font-size:.7rem;color:#987b38}.zw-palace-detail h3{margin:.15rem 0;font-family:KaiTi,STKaiti,serif;font-size:1.25rem;color:#181818}.zw-palace-detail h3 small{font-size:.8rem;color:#777}.zw-palace-detail>header p{font-size:.72rem;color:#777}.zw-detail-grid{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:1px;background:#ddd}.zw-detail-grid>section{padding:.9rem;background:#fff}.zw-detail-grid p,.zw-detail-grid li{font-size:.78rem;line-height:1.7;color:#444}.zw-detail-grid ul{margin:.25rem 0 .65rem;padding-left:1.15rem}.zw-star-notes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem}.zw-star-notes article{padding:.5rem;border:1px solid #e2e2e2;background:#fafafa}.zw-star-notes h4{margin:0 0 .2rem;color:#222}.zw-star-notes h4 small{margin-left:.35rem;color:#947d50;font-weight:400}.zw-star-notes p{margin:0}.zw-transform{display:inline-block;margin-right:.25rem;padding:.02rem .22rem;border-radius:3px;color:#fff}.zw-transform-禄{background:#24965c}.zw-transform-权{background:#7846a0}.zw-transform-科{background:#2586b3}.zw-transform-忌{background:#c43632}
      .zw-ai-reading{margin:.8rem 0;padding:1rem;border:1px solid #bcbcbc;background:#fff;color:#222}.zw-ai-reading>div:first-child{display:flex;align-items:baseline;justify-content:space-between;gap:1rem}.zw-ai-reading>div>span{font-family:KaiTi,STKaiti,serif;font-size:1.25rem;font-weight:800}.zw-ai-reading p{color:#666;font-size:.78rem}.zw-ai-reading>button{width:auto;margin:.65rem auto;display:block}.zw-ai-reading-result{margin-top:.65rem}.zw-ai-loading,.zw-ai-error,.zw-ai-result-card{padding:.85rem;border:1px solid #ddd;background:#fafafa;line-height:1.85}.zw-ai-error{color:#a0362a}.zw-ai-result-meta{margin-bottom:.65rem;color:#8a6b2d;font-size:.72rem}.zw-ai-result-card h3{margin:1rem 0 .3rem;color:#222}
      .zw-school-group small{display:block;margin-top:.3rem;color:#777;font-size:.68rem;line-height:1.4}
      .zw-actions{display:flex;justify-content:center;gap:.65rem;margin:1rem 0 .2rem}.zw-actions button{width:auto}
      @media(max-width:760px){
        #ziweiOverlay .ziwei-modal{width:100vw;max-width:none;height:100dvh;max-height:none;border-radius:0;padding-left:.35rem;padding-right:.35rem;overflow-y:auto}
        .zw-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(4,minmax(116px,auto));background:#777;border:1px solid #777;gap:1px;box-shadow:none;border-radius:3px}
        #ziweiResult .zw-sanfang-lines{display:block}
        .zw-center{min-height:0;border:0;border-radius:0;padding:.42rem}
        .zw-center-seal{font-size:1.05rem;letter-spacing:.08em}.zw-center-name{font-size:.82rem;margin:.28rem 0}.zw-center-line{font-size:.56rem;line-height:1.45}.zw-center-note{display:none}.zw-link-hint{font-size:.52rem;margin-top:.24rem;padding:.16rem .3rem}
        .zw-palace{min-height:0;border:0;border-radius:0;padding:.3rem 1.4rem .3rem .28rem;display:flex}
        .zw-palace-head{right:.12rem;bottom:.18rem;gap:.08rem}.zw-palace-name{font-size:.72rem}.zw-palace-gz{font-size:.76rem}
        .zw-major-list,.zw-minor-list{gap:.12rem .2rem}.zw-star.major{font-size:.78rem}.zw-star.minor{font-size:.5rem}.zw-bright{display:none}.zw-mutagen{font-size:.48rem}.zw-minor-list{margin-top:.15rem;padding-top:.15rem}.zw-adjective,.zw-gods,.zw-ages{font-size:.48rem;line-height:1.25}.zw-stage{font-size:.5rem}.zw-body-badge,.zw-flow-badge{font-size:.44rem;padding:.02rem .12rem}
        .zw-summary{padding:.8rem}.zw-summary-title{font-size:1.2rem}.zw-chip{font-size:.69rem}
        .zw-mode-toolbar{gap:.2rem;padding:.35rem}.zw-mode-toolbar button{padding:.36rem .85rem}.zw-mode-toolbar>span{display:none}.zw-detail-grid{grid-template-columns:1fr}.zw-palace-detail>header{align-items:flex-start;gap:.5rem}.zw-palace-detail>header p{max-width:42%;text-align:right}.zw-star-notes{grid-template-columns:1fr}.zw-ai-reading>div:first-child{display:block}
        .zw-flow-row{grid-template-columns:46px minmax(0,1fr)}.zw-flow-grid{grid-template-columns:repeat(5,minmax(0,1fr))}.zw-flow-label{font-size:.76rem}.zw-flow-cell{min-height:42px;padding:.25rem .08rem}.zw-flow-cell b{font-size:.58rem}.zw-flow-cell span{font-size:.46rem}
        .zw-actions{position:sticky;bottom:.3rem;z-index:3;padding:.45rem;background:rgba(248,244,232,.9);backdrop-filter:blur(8px);border-radius:10px}
      }
    `;
    document.head.appendChild(style);
  }
};
