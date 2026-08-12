/** 自动保存命理工具输入和少量本地记录；不保存兑换码或支付字段。 */
var DaoWenUserData = {
  _dirty: false,
  _timer: null,
  _bound: false,
  _hydrating: false,
  LOCAL_KEYS: ['dailyFortuneDate', 'dailyFortuneResult'],

  _safeField: function(el) {
    if (!el || !el.id || el.disabled) return false;
    if (!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName || '')) return false;
    var type = String(el.type || '').toLowerCase();
    if (['password', 'hidden', 'submit', 'button', 'file'].indexOf(type) !== -1) return false;
    if (/(password|email|redeem|code|token|order|payment|pay|contact|aiChat)/i.test(el.id)) return false;
    var overlay = el.closest ? el.closest('.tool-overlay') : null;
    if (overlay && /^(paywallShopOverlay|paywallRedeemOverlay)$/.test(overlay.id || '')) return false;
    return true;
  },

  collect: function() {
    var fields = {};
    var count = 0;
    document.querySelectorAll('input[id],select[id],textarea[id]').forEach(function(el) {
      if (count >= 250 || !DaoWenUserData._safeField(el)) return;
      var type = String(el.type || '').toLowerCase();
      if (type === 'radio' && !el.checked) return;
      var value = (type === 'checkbox') ? !!el.checked : String(el.value == null ? '' : el.value).slice(0, 500);
      fields[el.id] = { type: type || String(el.tagName || '').toLowerCase(), value: value };
      count += 1;
    });
    var local = {};
    this.LOCAL_KEYS.forEach(function(key) {
      try {
        var value = localStorage.getItem(key);
        if (value != null && value.length <= 12000) local[key] = value;
      } catch (_) {}
    });
    return { version: 1, fields: fields, local: local, savedAt: new Date().toISOString() };
  },

  apply: function(data) {
    if (!data || typeof data !== 'object') return;
    this._hydrating = true;
    try {
      Object.keys(data.fields || {}).forEach(function(id) {
        var el = document.getElementById(id);
        var saved = data.fields[id];
        if (!DaoWenUserData._safeField(el) || !saved) return;
        var type = String(el.type || '').toLowerCase();
        if (type === 'checkbox') el.checked = !!saved.value;
        else if (type === 'radio') el.checked = String(el.value) === String(saved.value);
        else el.value = String(saved.value == null ? '' : saved.value);
      });
      Object.keys(data.local || {}).forEach(function(key) {
        if (DaoWenUserData.LOCAL_KEYS.indexOf(key) === -1) return;
        try { localStorage.setItem(key, String(data.local[key]).slice(0, 12000)); } catch (_) {}
      });
    } finally {
      this._hydrating = false;
    }
  },

  hydrate: async function() {
    try {
      var resp = await fetch('/api/user-data', { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
      var body = await resp.json();
      if (resp.ok && body.success && body.data) this.apply(body.data);
      return body.data || null;
    } catch (err) {
      console.warn('[DaoWenUserData] 数据恢复失败:', err.message);
      return null;
    }
  },

  flush: async function(force) {
    if (!force && !this._dirty) return true;
    var payload = this.collect();
    try {
      var resp = await fetch('/api/user-data', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });
      if (!resp.ok) throw new Error('保存失败 (' + resp.status + ')');
      this._dirty = false;
      return true;
    } catch (err) {
      console.warn('[DaoWenUserData] 自动保存失败:', err.message);
      return false;
    }
  },

  markDirty: function() {
    if (this._hydrating) return;
    this._dirty = true;
    clearTimeout(this._timer);
    this._timer = setTimeout(function() { DaoWenUserData.flush(false); }, 1200);
  },

  init: function() {
    if (this._bound) return;
    this._bound = true;
    document.addEventListener('change', function(e) { if (DaoWenUserData._safeField(e.target)) DaoWenUserData.markDirty(); }, true);
    document.addEventListener('input', function(e) { if (DaoWenUserData._safeField(e.target)) DaoWenUserData.markDirty(); }, true);
    window.addEventListener('daowen:identity-changed', function() { DaoWenUserData.hydrate(); });
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) DaoWenUserData.flush(false);
    });
    if (window.DaoWenIdentity && DaoWenIdentity.ready) {
      DaoWenIdentity.ready().then(function() { DaoWenUserData.hydrate(); });
    } else {
      this.hydrate();
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { DaoWenUserData.init(); });
} else {
  DaoWenUserData.init();
}
