/**
 * 道问轻量身份系统
 *
 * - 首次访问自动获得游客身份，不阻塞任何基础功能。
 * - “保存数据”把当前游客身份绑定到邮箱和密码，用户 ID 不变。
 * - 会话由服务端 HttpOnly Cookie 管理，浏览器不保存密码或访问令牌。
 */
var DaoWenIdentity = {
  user: null,
  _initPromise: null,
  _busy: false,
  _mode: 'save',
  _resetToken: '',

  init: function() {
    if (this._initPromise) return this._initPromise;
    var self = this;
    this._initPromise = this._request('/api/session', { method: 'GET' })
      .then(function(data) {
        self.user = data.user || null;
        self._updateUI();
        self._emitChanged();
        self._consumeResetLink();
        return self.user;
      })
      .catch(function(err) {
        console.warn('[DaoWenIdentity] 身份初始化失败:', err.message);
        self._updateUI();
        self._consumeResetLink();
        return null;
      });
    return this._initPromise;
  },

  ready: function() {
    return this.init();
  },

  _request: async function(url, options) {
    var request = Object.assign({ credentials: 'same-origin', cache: 'no-store' }, options || {});
    if (request.body && !request.headers) request.headers = { 'Content-Type': 'application/json' };
    var resp = await fetch(url, request);
    var data = {};
    try { data = await resp.json(); } catch (_) {}
    if (!resp.ok || data.success === false) {
      var err = new Error(data.error || data.message || ('请求失败 (' + resp.status + ')'));
      err.status = resp.status;
      err.code = data.code;
      err.data = data;
      throw err;
    }
    return data;
  },

  _accountAction: function(action, values) {
    return this._request('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ action: action }, values || {}))
    });
  },

  openSave: function(mode) {
    if (this.user && !this.user.isGuest && mode !== 'login') return this.openAccount();
    this._mode = mode === 'login' ? 'login' : 'save';
    this._showMode(this._mode);
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.add('active');
    var target = document.getElementById('loginEmail');
    if (target) setTimeout(function() { target.focus(); }, 40);
  },

  openLogin: function() {
    this.openSave('login');
  },

  closeLogin: function() {
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.remove('active');
    this._setStatus('');
  },

  switchMode: function(mode) {
    this._mode = mode;
    this._showMode(mode);
  },

  _showMode: function(mode) {
    var credentials = document.getElementById('accountCredentials');
    var normal = document.getElementById('loginNormalActions');
    var forgot = document.getElementById('loginForgotWrap');
    var requestReset = document.getElementById('loginResetRequestActions');
    var completeReset = document.getElementById('loginResetCompleteActions');
    var title = document.getElementById('loginTitle');
    var desc = document.getElementById('loginDesc');
    if (credentials) credentials.style.display = (mode === 'save' || mode === 'login') ? '' : 'none';
    if (normal) normal.style.display = (mode === 'save' || mode === 'login') ? '' : 'none';
    if (forgot) forgot.style.display = (mode === 'login') ? '' : 'none';
    if (requestReset) requestReset.style.display = mode === 'forgot' ? '' : 'none';
    if (completeReset) completeReset.style.display = mode === 'reset' ? '' : 'none';
    if (mode === 'save') {
      if (title) title.textContent = '保存我的数据';
      if (desc) desc.textContent = '设置邮箱和密码，当前命盘、积分与订单会继续绑定在同一身份下';
      var primary = document.getElementById('accountPrimaryBtn');
      var secondary = document.getElementById('accountSecondaryBtn');
      if (primary) primary.textContent = '保存账号';
      if (secondary) secondary.textContent = '已有账号，恢复数据';
    } else if (mode === 'login') {
      if (title) title.textContent = '恢复我的数据';
      if (desc) desc.textContent = '输入已保存账号的邮箱和密码';
      var loginPrimary = document.getElementById('accountPrimaryBtn');
      var loginSecondary = document.getElementById('accountSecondaryBtn');
      if (loginPrimary) loginPrimary.textContent = '恢复数据';
      if (loginSecondary) loginSecondary.textContent = '返回保存账号';
    } else if (mode === 'forgot') {
      if (title) title.textContent = '找回密码';
      if (desc) desc.textContent = '我们会向已保存账号发送一次性重设链接';
      var sourceEmail = document.getElementById('loginEmail');
      var resetEmail = document.getElementById('loginResetEmail');
      if (sourceEmail && resetEmail && !resetEmail.value) resetEmail.value = sourceEmail.value;
    } else if (mode === 'reset') {
      if (title) title.textContent = '设置新密码';
      if (desc) desc.textContent = '链接使用后立即失效，其他设备上的旧会话也会退出';
    }
    this._setStatus('');
  },

  doPrimary: function() {
    return this.doAccount(this._mode === 'login' ? 'login' : 'save');
  },

  doSecondary: function() {
    this.switchMode(this._mode === 'login' ? 'save' : 'login');
  },

  doAccount: async function(action) {
    if (this._busy) return;
    var email = (document.getElementById('loginEmail') || {}).value || '';
    var password = (document.getElementById('loginPassword') || {}).value || '';
    this._setBusy(true);
    this._setStatus(action === 'save' ? '正在保存当前数据…' : '正在恢复数据…', 'info');
    try {
      if (window.DaoWenUserData) await DaoWenUserData.flush(true);
      var data = await this._accountAction(action, { email: email, password: password });
      this.user = data.user || this.user;
      if (window.DaoWenUserData) await DaoWenUserData.hydrate();
      this._updateUI();
      this._emitChanged();
      this._setStatus(data.message || (action === 'save' ? '数据已保存' : '数据已恢复'), 'success');
      var self = this;
      setTimeout(function() { self.closeLogin(); }, 650);
    } catch (err) {
      this._setStatus(err.message, 'error');
      if (err.code === 'PASSWORD_RESET_REQUIRED') this._showForgotSuggestion();
    } finally {
      this._setBusy(false);
    }
  },

  _showForgotSuggestion: function() {
    var forgot = document.getElementById('loginForgotWrap');
    if (forgot) forgot.style.display = '';
  },

  resetPassword: function() {
    this.switchMode('forgot');
  },

  requestReset: async function() {
    if (this._busy) return;
    var email = (document.getElementById('loginResetEmail') || {}).value || '';
    this._setBusy(true);
    this._setStatus('正在发送重设链接…', 'info');
    try {
      var data = await this._accountAction('request-reset', { email: email });
      this._setStatus(data.message, 'success');
    } catch (err) {
      this._setStatus(err.message, 'error');
    } finally {
      this._setBusy(false);
    }
  },

  completeReset: async function() {
    if (this._busy) return;
    var email = (document.getElementById('loginResetTargetEmail') || {}).value || '';
    var p1 = (document.getElementById('loginNewPassword') || {}).value || '';
    var p2 = (document.getElementById('loginConfirmPassword') || {}).value || '';
    if (p1 !== p2) return this._setStatus('两次输入的密码不一致', 'error');
    this._setBusy(true);
    this._setStatus('正在更新密码…', 'info');
    try {
      var data = await this._accountAction('reset', { email: email, token: this._resetToken, password: p1 });
      this.user = data.user || null;
      this._clearResetUrl();
      if (window.DaoWenUserData) await DaoWenUserData.hydrate();
      this._updateUI();
      this._emitChanged();
      this._setStatus(data.message || '密码已更新', 'success');
      var self = this;
      setTimeout(function() { self.closeLogin(); }, 800);
    } catch (err) {
      this._setStatus(err.message, 'error');
    } finally {
      this._setBusy(false);
    }
  },

  _consumeResetLink: function() {
    var params;
    try { params = new URLSearchParams(location.search); } catch (_) { return; }
    var token = params.get('reset_token') || '';
    var email = params.get('reset_email') || '';
    if (!token || !email) return;
    this._resetToken = token;
    var target = document.getElementById('loginResetTargetEmail');
    if (target) target.value = email;
    this._mode = 'reset';
    this._showMode('reset');
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.add('active');
  },

  _clearResetUrl: function() {
    this._resetToken = '';
    try {
      var url = new URL(location.href);
      url.searchParams.delete('reset_token');
      url.searchParams.delete('reset_email');
      history.replaceState({}, document.title, url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash);
    } catch (_) {}
  },

  signOut: async function() {
    if (this._busy) return;
    this._setBusy(true);
    try {
      var data = await this._accountAction('logout');
      this.user = data.user || null;
      this.closeAccount();
      this._updateUI();
      this._emitChanged();
      if (window.Paywall) Paywall.syncBalance(true).catch(function() {});
    } catch (err) {
      alert(err.message);
    } finally {
      this._setBusy(false);
    }
  },

  openAccount: function() {
    if (!this.user || this.user.isGuest) return this.openSave('save');
    this._ensureAccountUI();
    var overlay = document.getElementById('accountOverlay');
    if (overlay) overlay.classList.add('active');
    this._updateAccountUI();
  },

  closeAccount: function() {
    var overlay = document.getElementById('accountOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  sendRecoveryForCurrent: function() {
    var email = this.user && this.user.email ? this.user.email : '';
    this.closeAccount();
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.add('active');
    this._showMode('forgot');
    var target = document.getElementById('loginResetEmail');
    if (target) target.value = email;
  },

  _ensureAccountUI: function() {
    if (document.getElementById('accountOverlay')) return;
    var overlay = document.createElement('div');
    overlay.className = 'tool-overlay';
    overlay.id = 'accountOverlay';
    overlay.innerHTML = '<div class="tool-modal auth-account-modal" role="dialog" aria-modal="true">' +
      '<button class="modal-close" onclick="DaoWenIdentity.closeAccount()">✕</button>' +
      '<div class="auth-brand-mark" aria-hidden="true">道</div>' +
      '<h2 class="modal-title">数据保存账号</h2>' +
      '<p class="modal-desc">命盘资料、积分与支付记录已绑定</p>' +
      '<div class="auth-account-card"><div class="auth-account-avatar">人</div><div class="auth-account-copy"><strong id="accountEmail">—</strong><span>本站账号 · 无验证码登录</span></div></div>' +
      '<div class="auth-account-stats"><div><span>解读次数</span><strong data-daowen-balance>—</strong></div><div><span>数据状态</span><strong class="auth-ok-dot">已保存</strong></div></div>' +
      '<button type="button" class="btn-secondary auth-refresh-balance" onclick="Paywall.syncBalance(true)">刷新余额</button>' +
      '<div class="auth-account-actions"><button type="button" class="btn-secondary" onclick="DaoWenUserData.flush(true)">立即保存数据</button><button type="button" class="btn-secondary" onclick="DaoWenIdentity.sendRecoveryForCurrent()">找回 / 修改密码</button><button type="button" class="auth-danger-btn" style="grid-column:1/-1" onclick="DaoWenIdentity.signOut()">退出并切换为新游客</button></div>' +
      '<p class="auth-security-note">退出后本设备会生成新的游客身份。原账号数据仍可使用邮箱和密码恢复。</p></div>';
    document.body.appendChild(overlay);
  },

  _updateAccountUI: function() {
    var email = document.getElementById('accountEmail');
    if (email) email.textContent = this.user && this.user.email ? this.user.email : '—';
    if (window.Paywall) Paywall._renderBalance();
  },

  _updateUI: function() {
    var btn = document.getElementById('loginBtn');
    if (!btn) return;
    if (this.user && !this.user.isGuest) {
      var email = this.user.email || '我的数据';
      btn.textContent = '✓ ' + (email.length > 20 ? email.slice(0, 17) + '…' : email);
      btn.classList.add('is-logged-in');
      btn.onclick = this.openAccount.bind(this);
    } else {
      btn.textContent = '☁ 保存数据';
      btn.classList.remove('is-logged-in');
      btn.onclick = this.openSave.bind(this, 'save');
    }
  },

  _setBusy: function(flag) {
    this._busy = !!flag;
    document.querySelectorAll('#loginOverlay button').forEach(function(button) { button.disabled = !!flag; });
    var modal = document.querySelector('#loginOverlay .tool-modal');
    if (modal) modal.classList.toggle('auth-busy', !!flag);
  },

  _setStatus: function(message, type) {
    var el = document.getElementById('loginStatus');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'auth-status ' + (type || 'info');
    el.style.display = message ? 'block' : 'none';
  },

  _emitChanged: function() {
    try { window.dispatchEvent(new CustomEvent('daowen:identity-changed', { detail: { user: this.user } })); } catch (_) {}
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { DaoWenIdentity.init(); });
} else {
  DaoWenIdentity.init();
}
