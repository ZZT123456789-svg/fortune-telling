/**
 * 道问命盘档案
 * - 仅保存在当前浏览器（IndexedDB，localStorage 作为降级方案）
 * - 自动捕获指定工具的完整结果与后续 AI 解读更新
 * - 历史查看不调用排盘、AI 或扣费接口
 */
(function () {
  'use strict';

  var DB_NAME = 'daowen_chart_archive';
  var DB_VERSION = 1;
  var STORE_NAME = 'charts';
  var FALLBACK_KEY = 'daowen_chart_archive_v1';
  var MIGRATION_KEY = 'daowen_chart_archive_migrated_v1';
  var SAVE_DELAY = 850;

  var CONFIGS = [
    { overlay: 'baziOverlay', result: 'baziResult', type: 'bazi', label: '八字', nameIds: ['baziName1'], dateIds: ['baziYear1', 'baziMonth1', 'baziDay1', 'baziHour1'], min: 80 },
    { overlay: 'ziweiOverlay', result: 'ziweiResult', type: 'ziwei', label: '紫微', nameIds: ['ziweiName'], dateIds: ['ziweiYear', 'ziweiMonth', 'ziweiDay', 'ziweiHour'], min: 60 },
    { overlay: 'meihuaOverlay', result: 'meihuaResult', type: 'meihua', label: '梅花', nameIds: [], dateIds: ['meihuaNum1', 'meihuaNum2', 'meihuaNum3'], min: 35 },
    { overlay: 'liuyaoOverlay', result: 'liuyaoResult', type: 'liuyao', label: '六爻', nameIds: ['liuyaoQuestion'], dateIds: [], min: 50, uniqueResult: true },
    { overlay: 'zhugeOverlay', result: 'zhugeResult', type: 'zhuge', label: '诸葛神数', nameIds: ['zhugeWord1', 'zhugeWord2', 'zhugeWord3'], dateIds: ['zhugeNumber'], min: 30 },
    { overlay: 'tarotOverlay', result: 'tarotReading', type: 'tarot', label: '塔罗', nameIds: [], dateIds: [], min: 40, uniqueResult: true },
    { overlay: 'qimenOverlay', result: 'qimenResult', type: 'qimen', label: '奇门', nameIds: ['qimenQuestion'], dateIds: ['qimenDate', 'qimenTime'], min: 60 },
    { overlay: 'astroOverlay', result: 'astroResult', type: 'astro', label: '星盘', nameIds: [], dateIds: ['astroDate', 'astroTime'], min: 60 }
  ];

  var state = {
    db: null,
    fallback: false,
    timers: {},
    attached: {},
    records: [],
    query: '',
    type: 'all',
    favoriteOnly: false,
    sort: 'viewed',
    detailId: '',
    menuId: '',
    sourceOverlayId: '',
    suppressCaptureUntil: 0
  };

  function nowIso() { return new Date().toISOString(); }
  function byId(id) { return document.getElementById(id); }
  function textOf(el) { return String(el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }
  function formatTime(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'dw-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function hash(value) {
    var h = 2166136261;
    value = String(value || '');
    for (var i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (h >>> 0).toString(36);
  }

  function openDb() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) {
        state.fallback = true;
        resolve(null);
        return;
      }
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          var store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('fingerprint', 'fingerprint', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
      request.onsuccess = function () { state.db = request.result; resolve(state.db); };
      request.onerror = function () { state.fallback = true; resolve(null); };
    });
  }

  function fallbackRead() {
    try { return JSON.parse(localStorage.getItem(FALLBACK_KEY) || '[]'); } catch (_) { return []; }
  }
  function fallbackWrite(records) {
    try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(records)); return true; } catch (_) { return false; }
  }
  function getAll() {
    if (state.fallback || !state.db) return Promise.resolve(fallbackRead());
    return new Promise(function (resolve) {
      var request = state.db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = function () { resolve(request.result || []); };
      request.onerror = function () { resolve([]); };
    });
  }
  function put(record) {
    if (state.fallback || !state.db) {
      var rows = fallbackRead();
      var index = rows.findIndex(function (item) { return item.id === record.id; });
      if (index >= 0) rows[index] = record; else rows.push(record);
      return Promise.resolve(fallbackWrite(rows));
    }
    return new Promise(function (resolve, reject) {
      var request = state.db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record);
      request.onsuccess = function () { resolve(true); };
      request.onerror = function () { reject(request.error); };
    });
  }
  function remove(id) {
    if (state.fallback || !state.db) {
      return Promise.resolve(fallbackWrite(fallbackRead().filter(function (item) { return item.id !== id; })));
    }
    return new Promise(function (resolve, reject) {
      var request = state.db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
      request.onsuccess = function () { resolve(true); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function configForOverlay(overlayId) {
    return CONFIGS.find(function (item) { return item.overlay === overlayId; }) || null;
  }
  function configForRecord(record) {
    return CONFIGS.find(function (item) { return item.type === record.toolType || (record.toolType === 'bazi-dual' && item.type === 'bazi'); }) || null;
  }
  function resolveConfig(base) {
    if (base.type !== 'bazi') return base;
    var dual = byId('baziDualPanel');
    if (!dual || getComputedStyle(dual).display === 'none') return base;
    var copy = Object.assign({}, base);
    copy.type = 'bazi-dual';
    copy.label = '双人排盘';
    copy.nameIds = ['baziNameA', 'baziNameB'];
    copy.dateIds = ['baziYearA', 'baziMonthA', 'baziDayA', 'baziHourA', 'baziYearB', 'baziMonthB', 'baziDayB', 'baziHourB'];
    return copy;
  }

  function collectFields(overlay) {
    var fields = {};
    overlay.querySelectorAll('input[id],select[id],textarea[id]').forEach(function (field) {
      var type = String(field.type || '').toLowerCase();
      if (['password', 'file', 'button', 'submit', 'hidden'].indexOf(type) !== -1) return;
      if (type === 'radio' && !field.checked) return;
      fields[field.id] = { type: type || field.tagName.toLowerCase(), value: type === 'checkbox' ? !!field.checked : String(field.value == null ? '' : field.value).slice(0, 1000) };
    });
    return fields;
  }
  function fieldValue(id) {
    var el = byId(id);
    return el ? String(el.value || '').trim() : '';
  }
  function makeTitle(config) {
    var names = (config.nameIds || []).map(fieldValue).filter(Boolean);
    if (config.type === 'bazi-dual' && names.length) return names.join(' × ') + ' · 双人排盘';
    if (names.length) return names.join(' · ') + ' · ' + config.label;
    var dates = (config.dateIds || []).map(fieldValue).filter(Boolean);
    if (dates.length) return config.label + ' · ' + dates.slice(0, 2).join(' ');
    return config.label + ' · ' + formatTime(nowIso()).slice(0, 10);
  }
  function makeSubtitle(config, fields) {
    var values = (config.dateIds || []).map(function (id) { return fields[id] && fields[id].value; }).filter(Boolean);
    if (config.type === 'zhuge') {
      var words = ['zhugeWord1', 'zhugeWord2', 'zhugeWord3'].map(function (id) { return fields[id] && fields[id].value; }).filter(Boolean).join('');
      return words ? '起字：' + words : (values.length ? '签号：' + values[0] : '诸葛神数');
    }
    return values.join('-').replace(/-(\d{2}:\d{2})$/, ' $1') || config.label + '记录';
  }
  function sanitizeResult(resultEl) {
    var clone = resultEl.cloneNode(true);
    clone.querySelectorAll('script,style,iframe,form,.dw-archive-inline,.dw-archive-restored-note').forEach(function (el) { el.remove(); });
    clone.querySelectorAll('button,input,select,textarea').forEach(function (el) { el.remove(); });
    clone.querySelectorAll('*').forEach(function (el) {
      Array.from(el.attributes || []).forEach(function (attr) {
        if (/^on/i.test(attr.name) || attr.name === 'id') el.removeAttribute(attr.name);
      });
    });
    return clone.innerHTML;
  }
  function hasAiContent(resultEl) {
    if (resultEl.querySelector('[class*="ai-reading-result"],[class*="ai-result"],[data-ai-complete="true"]')) return true;
    var text = textOf(resultEl);
    return /AI.{0,8}(完整|深度)解读[\s\S]{80,}/i.test(text) && !/余额不足|购买解读|解锁内容/.test(text.slice(-160));
  }
  function resultSummary(resultEl) {
    return textOf(resultEl).replace(/已保存到命盘档案/g, '').slice(0, 150);
  }

  async function capture(base, options) {
    options = options || {};
    if (!options.draft && Date.now() < state.suppressCaptureUntil) return false;
    var config = resolveConfig(base);
    var overlay = byId(config.overlay);
    var resultEl = byId(config.result);
    if (!overlay || !resultEl) return false;
    var text = textOf(resultEl);
    if (!options.draft && (text.length < config.min || getComputedStyle(resultEl).display === 'none')) return false;
    var fields = collectFields(overlay);
    var source = config.type + '|' + JSON.stringify(fields);
    if (config.uniqueResult && !options.draft) source += '|' + text.slice(0, 500);
    var fingerprint = hash(source);
    var rows = await getAll();
    var current = rows.filter(function (item) { return item.fingerprint === fingerprint && !item.favorite; }).sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); })[0];
    var time = nowIso();
    var record = current || {
      id: uid(), fingerprint: fingerprint, createdAt: time, favorite: false, customTitle: '', note: ''
    };
    record.toolType = config.type;
    record.toolLabel = config.label;
    record.title = record.customTitle || makeTitle(config);
    record.subtitle = makeSubtitle(config, fields);
    record.fields = fields;
    record.resultHtml = options.draft ? '<div class="dw-archive-draft"><h3>已恢复旧输入资料</h3><p>旧版本未保存完整排盘结果，请进入原功能重新测算。</p></div>' : sanitizeResult(resultEl);
    record.summary = options.draft ? '旧输入快照，需重新测算' : resultSummary(resultEl);
    record.hasAI = options.draft ? false : hasAiContent(resultEl);
    record.isDraft = !!options.draft;
    record.updatedAt = time;
    record.viewedAt = record.viewedAt || time;
    await put(record);
    if (!options.silent) showToast('已保存到命盘档案');
    return true;
  }

  function scheduleCapture(config) {
    clearTimeout(state.timers[config.overlay]);
    state.timers[config.overlay] = setTimeout(function () { capture(config).catch(function (err) { console.warn('[命盘档案] 保存失败', err); }); }, SAVE_DELAY);
  }
  function attachConfig(base) {
    var resultEl = byId(base.result);
    if (!resultEl || state.attached[base.result]) return;
    state.attached[base.result] = true;
    new MutationObserver(function () { scheduleCapture(base); }).observe(resultEl, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class'] });
  }
  function attachAll() {
    CONFIGS.forEach(attachConfig);
    injectInlineButtons();
  }

  function showToast(message) {
    var toast = byId('dwArchiveToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }

  function createShell() {
    if (byId('chartArchiveOverlay')) return;
    var overlay = document.createElement('div');
    overlay.className = 'tool-overlay dw-archive-overlay';
    overlay.id = 'chartArchiveOverlay';
    overlay.innerHTML = '<div class="tool-modal dw-archive-modal" role="dialog" aria-modal="true" aria-labelledby="dwArchiveTitle">' +
      '<button class="modal-close" type="button" data-archive-action="close" aria-label="关闭">✕</button>' +
      '<header class="dw-archive-header"><div><span class="dw-archive-eyebrow">LOCAL ARCHIVE</span><h2 id="dwArchiveTitle">命盘档案</h2><p>记录仅保存在当前浏览器与当前设备</p></div><span class="dw-archive-count" id="dwArchiveCount">0 条</span></header>' +
      '<div class="dw-archive-toolbar">' +
        '<label class="dw-archive-search"><span aria-hidden="true">⌕</span><input id="dwArchiveSearch" type="search" placeholder="搜索姓名、档案名称或备注"></label>' +
        '<select id="dwArchiveType" aria-label="按功能筛选"><option value="all">全部类型</option></select>' +
        '<select id="dwArchiveSort" aria-label="排序"><option value="viewed">最近查看</option><option value="created">创建时间</option></select>' +
        '<button type="button" class="dw-archive-filter" id="dwArchiveFavorite">仅看收藏</button>' +
      '</div>' +
      '<div class="dw-archive-content" id="dwArchiveContent"></div>' +
    '</div>';
    document.body.appendChild(overlay);
    var toast = document.createElement('div');
    toast.id = 'dwArchiveToast';
    toast.className = 'dw-archive-toast';
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);

    var typeSelect = byId('dwArchiveType');
    var seen = {};
    CONFIGS.forEach(function (item) {
      if (seen[item.type] || item.type === 'bazi') return;
      seen[item.type] = true;
      var option = document.createElement('option');
      option.value = item.type;
      option.textContent = item.label;
      typeSelect.appendChild(option);
    });
    ['bazi', 'bazi-dual'].forEach(function (type, index) {
      var option = document.createElement('option');
      option.value = type;
      option.textContent = index ? '双人排盘' : '八字';
      typeSelect.insertBefore(option, typeSelect.children[index + 1] || null);
    });
    bindShellEvents();
  }

  function injectInlineButtons() {
    CONFIGS.forEach(function (config) {
      var modal = byId(config.overlay);
      if (!modal || modal.querySelector('.dw-archive-inline')) return;
      var title = modal.querySelector('.modal-title');
      if (!title) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'dw-archive-inline';
      button.innerHTML = '<span aria-hidden="true">▣</span> 命盘档案';
      button.addEventListener('click', function () { api.open(); });
      title.insertAdjacentElement('afterend', button);
    });
  }

  function bindShellEvents() {
    byId('dwArchiveSearch').addEventListener('input', function (event) { state.query = event.target.value.trim().toLowerCase(); renderList(); });
    byId('dwArchiveType').addEventListener('change', function (event) { state.type = event.target.value; renderList(); });
    byId('dwArchiveSort').addEventListener('change', function (event) { state.sort = event.target.value; renderList(); });
    byId('dwArchiveFavorite').addEventListener('click', function () { state.favoriteOnly = !state.favoriteOnly; this.classList.toggle('active', state.favoriteOnly); renderList(); });
    byId('chartArchiveOverlay').addEventListener('click', function (event) {
      var actionEl = event.target.closest('[data-archive-action]');
      if (!actionEl) {
        if (event.target.id === 'chartArchiveOverlay') api.close();
        return;
      }
      var action = actionEl.getAttribute('data-archive-action');
      var id = actionEl.getAttribute('data-id') || '';
      if (action === 'close') api.close();
      else if (action === 'back') { state.detailId = ''; renderList(); }
      else if (action === 'open') openDetail(id);
      else if (action === 'favorite') toggleFavorite(id);
      else if (action === 'menu') { state.menuId = state.menuId === id ? '' : id; renderList(); }
      else if (action === 'rename') renameRecord(id);
      else if (action === 'note') editNote(id);
      else if (action === 'delete') deleteRecord(id);
      else if (action === 'continue') continueInTool(id);
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && byId('chartArchiveOverlay').classList.contains('active')) api.close(); });
  }

  function filteredRows() {
    var rows = state.records.slice();
    if (state.type !== 'all') rows = rows.filter(function (item) { return item.toolType === state.type; });
    if (state.favoriteOnly) rows = rows.filter(function (item) { return item.favorite; });
    if (state.query) rows = rows.filter(function (item) { return [item.title, item.subtitle, item.note, item.summary, item.toolLabel].join(' ').toLowerCase().indexOf(state.query) !== -1; });
    rows.sort(function (a, b) {
      if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1;
      var key = state.sort === 'created' ? 'createdAt' : 'viewedAt';
      return String(b[key] || b.updatedAt).localeCompare(String(a[key] || a.updatedAt));
    });
    return rows;
  }

  function cardHtml(record) {
    var menuOpen = state.menuId === record.id;
    return '<article class="dw-archive-card" data-id="' + escapeHtml(record.id) + '">' +
      '<button class="dw-archive-card-main" type="button" data-archive-action="open" data-id="' + escapeHtml(record.id) + '">' +
        '<span class="dw-archive-type">' + escapeHtml(record.toolLabel) + '</span>' +
        '<strong>' + escapeHtml(record.title) + '</strong>' +
        '<span class="dw-archive-subtitle">' + escapeHtml(record.subtitle || '') + '</span>' +
        '<span class="dw-archive-summary">' + escapeHtml(record.summary || '') + '</span>' +
        '<span class="dw-archive-meta">' + (record.hasAI ? '<i>含 AI 解读</i>' : '<i>基础排盘</i>') + '<time>最近查看 ' + escapeHtml(formatTime(record.viewedAt || record.updatedAt)) + '</time></span>' +
        (record.note ? '<span class="dw-archive-note">备注：' + escapeHtml(record.note) + '</span>' : '') +
      '</button>' +
      '<div class="dw-archive-card-actions">' +
        '<button type="button" class="dw-archive-star' + (record.favorite ? ' active' : '') + '" data-archive-action="favorite" data-id="' + escapeHtml(record.id) + '" aria-label="' + (record.favorite ? '取消收藏' : '收藏') + '">☆</button>' +
        '<button type="button" class="dw-archive-more" data-archive-action="menu" data-id="' + escapeHtml(record.id) + '" aria-label="更多操作">•••</button>' +
        (menuOpen ? '<div class="dw-archive-menu"><button data-archive-action="rename" data-id="' + escapeHtml(record.id) + '">重命名</button><button data-archive-action="note" data-id="' + escapeHtml(record.id) + '">编辑备注</button><button class="danger" data-archive-action="delete" data-id="' + escapeHtml(record.id) + '">删除</button></div>' : '') +
      '</div>' +
    '</article>';
  }

  function renderList() {
    state.detailId = '';
    var rows = filteredRows();
    byId('dwArchiveCount').textContent = rows.length + ' 条';
    var content = byId('dwArchiveContent');
    if (!rows.length) {
      content.innerHTML = '<div class="dw-archive-empty"><span>▣</span><h3>暂时没有匹配的档案</h3><p>完成排盘后会自动保存在这里。</p></div>';
      return;
    }
    content.innerHTML = '<div class="dw-archive-grid">' + rows.map(cardHtml).join('') + '</div>';
  }

  async function refresh() {
    state.records = await getAll();
    renderList();
  }
  function findRecord(id) { return state.records.find(function (item) { return item.id === id; }); }

  async function openDetail(id) {
    var record = findRecord(id);
    if (!record) return;
    record.viewedAt = nowIso();
    await put(record);
    state.detailId = id;
    var content = byId('dwArchiveContent');
    byId('dwArchiveCount').textContent = record.toolLabel;
    content.innerHTML = '<article class="dw-archive-detail">' +
      '<div class="dw-archive-detail-bar"><button type="button" data-archive-action="back">← 返回档案</button><button type="button" class="dw-archive-continue" data-archive-action="continue" data-id="' + escapeHtml(id) + '">进入原功能继续操作</button></div>' +
      '<header><span class="dw-archive-type">' + escapeHtml(record.toolLabel) + '</span><h3>' + escapeHtml(record.title) + '</h3><p>' + escapeHtml(record.subtitle || '') + '</p>' + (record.note ? '<div class="dw-archive-detail-note">备注：' + escapeHtml(record.note) + '</div>' : '') + '</header>' +
      '<div class="dw-archive-snapshot">' + (record.resultHtml || '<p>没有可显示的历史结果。</p>') + '</div>' +
    '</article>';
  }

  async function toggleFavorite(id) {
    var record = findRecord(id);
    if (!record) return;
    record.favorite = !record.favorite;
    record.updatedAt = nowIso();
    await put(record);
    await refresh();
  }
  async function renameRecord(id) {
    var record = findRecord(id);
    if (!record) return;
    var value = window.prompt('输入新的档案名称', record.title || '');
    if (value == null) return;
    value = value.trim().slice(0, 80);
    if (!value) return;
    record.customTitle = value;
    record.title = value;
    record.updatedAt = nowIso();
    state.menuId = '';
    await put(record);
    await refresh();
  }
  async function editNote(id) {
    var record = findRecord(id);
    if (!record) return;
    var value = window.prompt('填写档案备注（可留空）', record.note || '');
    if (value == null) return;
    record.note = value.trim().slice(0, 500);
    record.updatedAt = nowIso();
    state.menuId = '';
    await put(record);
    await refresh();
  }
  async function deleteRecord(id) {
    var record = findRecord(id);
    if (!record || !window.confirm('确定永久删除“' + record.title + '”吗？删除后无法恢复。')) return;
    await remove(id);
    state.menuId = '';
    await refresh();
    showToast('档案已永久删除');
  }

  function restoreFields(record, overlay) {
    Object.keys(record.fields || {}).forEach(function (id) {
      var field = byId(id);
      var saved = record.fields[id];
      if (!field || !overlay.contains(field)) return;
      var type = String(field.type || '').toLowerCase();
      if (type === 'checkbox') field.checked = !!saved.value;
      else if (type === 'radio') field.checked = String(field.value) === String(saved.value);
      else field.value = String(saved.value == null ? '' : saved.value);
      field.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  function continueInTool(id) {
    var record = findRecord(id);
    var config = configForRecord(record || {});
    if (!record || !config) return;
    state.sourceOverlayId = '';
    // 恢复只读快照会触发结果区 DOM 变化；它不是一次新排盘，禁止因此重复建档。
    state.suppressCaptureUntil = Date.now() + 2200;
    api.close();
    var overlay = byId(config.overlay);
    if (!overlay) return;
    if (record.toolType === 'bazi-dual' && window.BaziModule && typeof BaziModule.switchMode === 'function') BaziModule.switchMode('dual');
    else if (record.toolType === 'bazi' && window.BaziModule && typeof BaziModule.switchMode === 'function') BaziModule.switchMode('single');
    restoreFields(record, overlay);
    overlay.classList.add('active');
    var resultEl = byId(config.result);
    if (resultEl && record.resultHtml) {
      resultEl.innerHTML = '<div class="dw-archive-restored-note">这是档案中的只读结果。修改资料后请重新测算，已保存的历史内容不会被覆盖。</div>' + record.resultHtml;
      resultEl.style.display = 'block';
    }
    document.body.classList.add('dw-modal-open');
    var modal = overlay.querySelector('.tool-modal');
    if (modal) modal.scrollTop = 0;
  }

  function migrationCandidate(config) {
    var overlay = byId(config.overlay);
    if (!overlay) return false;
    // 动态工具会在初始化时自动填入当前日期，不能把这些默认值误判为旧记录。
    if (['qimen', 'astro', 'tarot'].indexOf(config.type) !== -1) return false;
    var fields = collectFields(overlay);
    var meaningful = Object.keys(fields).filter(function (id) {
      var value = fields[id] && fields[id].value;
      if (value === false || value == null || value === '') return false;
      return /name|question|word|year|date|num/i.test(id);
    });
    if (config.type === 'bazi') return !!fieldValue('baziYear1') || (!!fieldValue('baziYearA') && !!fieldValue('baziYearB'));
    if (config.type === 'ziwei') return !!fieldValue('ziweiYear');
    return meaningful.length >= 1;
  }
  async function migrateOldInputs() {
    try { if (localStorage.getItem(MIGRATION_KEY) === '1') return; } catch (_) {}
    var existing = await getAll();
    if (!existing.length) {
      for (var i = 0; i < CONFIGS.length; i += 1) {
        if (migrationCandidate(CONFIGS[i])) await capture(CONFIGS[i], { draft: true, silent: true });
      }
    }
    try { localStorage.setItem(MIGRATION_KEY, '1'); } catch (_) {}
  }

  var api = {
    open: async function () {
      createShell();
      state.menuId = '';
      state.detailId = '';
      var currentTool = Array.from(document.querySelectorAll('.tool-overlay.active')).find(function (item) {
        return item.id !== 'chartArchiveOverlay' && !/^paywall/.test(item.id || '');
      });
      state.sourceOverlayId = currentTool ? currentTool.id : '';
      if (currentTool) currentTool.classList.remove('active');
      await refresh();
      byId('chartArchiveOverlay').classList.add('active');
      document.body.classList.add('dw-modal-open');
      var modal = byId('chartArchiveOverlay').querySelector('.tool-modal');
      if (modal) modal.scrollTop = 0;
    },
    close: function () {
      var overlay = byId('chartArchiveOverlay');
      if (overlay) overlay.classList.remove('active');
      if (state.sourceOverlayId) {
        var source = byId(state.sourceOverlayId);
        if (source) source.classList.add('active');
        state.sourceOverlayId = '';
      }
      if (!document.querySelector('.tool-overlay.active')) document.body.classList.remove('dw-modal-open');
      state.menuId = '';
    },
    capture: function (overlayId) {
      var config = configForOverlay(overlayId);
      return config ? capture(config) : Promise.resolve(false);
    },
    refresh: refresh
  };
  window.DaoWenArchive = api;

  async function init() {
    await openDb();
    createShell();
    attachAll();
    new MutationObserver(attachAll).observe(document.body, { childList: true, subtree: true });
    setTimeout(migrateOldInputs, 2600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
