/** 道问登录系统：邮箱+密码（无邮件确认）+ 信任留存码。 */
var DaoWenAuth = {
  _mode: 'login', // 'login' | 'signup'
  _lastRecoveryCode: null,

  init: function() {
    var self = this;
    window.addEventListener('daowen:identity-changed', function() { self._renderNav(); });
    if (window.DaoWenIdentity && DaoWenIdentity.ready) {
      DaoWenIdentity.ready().then(function() { self._renderNav(); }).catch(function() {});
    } else {
      self._renderNav();
    }
  },

  _renderNav: function() {
    var btn = document.getElementById('loginBtn');
    if (!btn) return;
    var user = window.DaoWenIdentity && DaoWenIdentity.user;
    if (user && user.isGuest === false && user.email) {
      var short = user.email.length > 18 ? user.email.slice(0, 18) + '…' : user.email;
      btn.textContent = short;
      btn.classList.add('is-logged-in');
      btn.title = '已登录：' + user.email + '（点击退出）';
      btn.onclick = function() { DaoWenAuth.logout(); };
    } else {
      btn.textContent = '登录';
      btn.classList.remove('is-logged-in');
      btn.removeAttribute('title');
      btn.onclick = function() { DaoWenAuth.openLogin(); };
    }
  },

  _post: async function(url, body) {
    var resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    var data = {};
    try { data = await resp.json(); } catch (e) {}
    if (!resp.ok) {
      var err = new Error(data.error || data.msg || ('请求失败 (' + resp.status + ')'));
      err.status = resp.status;
      throw err;
    }
    return data || {};
  },

  openLogin: function() {
    this._mode = 'login';
    this._showBlock('form');
    this._resetForm();
    var o = document.getElementById('loginOverlay');
    if (o) { o.style.zIndex = '11000'; o.classList.add('active'); }
  },

  closeLogin: function() {
    var o = document.getElementById('loginOverlay');
    if (o) { o.classList.remove('active'); o.style.zIndex = ''; }
  },

  _showBlock: function(name) {
    var form = document.getElementById('authFormBlock');
    var rec = document.getElementById('loginRecoveryActions');
    var code = document.getElementById('recoveryCodeBlock');
    if (form) form.style.display = name === 'form' ? '' : 'none';
    if (rec) rec.style.display = name === 'recover' ? '' : 'none';
    if (code) code.style.display = name === 'code' ? '' : 'none';
  },

  _resetForm: function() {
    this._setStatus('');
    var title = document.getElementById('authTitle');
    var desc = document.getElementById('authDesc');
    var submit = document.getElementById('authSubmitBtn');
    var toggle = document.getElementById('authToggleBtn');
    if (title) title.textContent = this._mode === 'login' ? '登录' : '注册';
    if (desc) desc.textContent = this._mode === 'login' ? '登录后可跨设备保存余额与记录' : '注册即创建账号，本站不发任何邮件';
    if (submit) submit.textContent = this._mode === 'login' ? '登录' : '注册';
    if (toggle) toggle.textContent = this._mode === 'login' ? '没有账号？去注册' : '已有账号？去登录';
  },

  toggleMode: function() {
    this._mode = this._mode === 'login' ? 'signup' : 'login';
    this._resetForm();
  },

  showLogin: function() {
    this._mode = 'login';
    this._showBlock('form');
    this._resetForm();
  },

  showRecover: function() {
    this._showBlock('recover');
    this._setStatus('', 'info', 'recoverStatus');
  },

  togglePassword: function() {
    var input = document.getElementById('authPassword');
    var btn = document.querySelector('#loginOverlay .auth-password-toggle');
    if (!input) return;
    var show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    if (btn) btn.textContent = show ? '隐藏' : '显示';
  },

  _setStatus: function(msg, type, elId) {
    var el = document.getElementById(elId || 'authStatus');
    if (!el) return;
    if (!msg) { el.style.display = 'none'; el.className = 'auth-status'; el.textContent = ''; return; }
    el.style.display = '';
    el.className = 'auth-status ' + (type || 'info');
    el.textContent = msg;
  },

  _busy: function(busy) {
    var btn = document.getElementById('authSubmitBtn');
    if (btn) { btn.disabled = busy; btn.textContent = busy ? '⏳ 处理中...' : (this._mode === 'login' ? '登录' : '注册'); }
  },

  submit: async function() {
    var emailInput = document.getElementById('authEmail');
    var passInput = document.getElementById('authPassword');
    var email = (emailInput && emailInput.value || '').trim();
    var password = passInput ? passInput.value : '';
    if (!email) { this._setStatus('请输入邮箱', 'error'); return; }
    if (!password) { this._setStatus('请输入密码', 'error'); return; }

    this._busy(true);
    this._setStatus('');
    try {
      var url = this._mode === 'login' ? '/api/auth-login' : '/api/auth-signup';
      var data = await this._post(url, { email: email, password: password });
      if (passInput) passInput.value = '';
      this._busy(false);
      this._onAuthed(data);
    } catch (err) {
      this._busy(false);
      this._setStatus(err.message || '操作失败，请稍后重试', 'error');
    }
  },

  submitRecover: async function() {
    var email = (document.getElementById('recoverEmail') && document.getElementById('recoverEmail').value || '').trim();
    var code = (document.getElementById('recoverCode') && document.getElementById('recoverCode').value || '').trim();
    if (!email) { this._setStatus('请输入邮箱', 'error', 'recoverStatus'); return; }
    if (!code) { this._setStatus('请输入留存码', 'error', 'recoverStatus'); return; }

    this._setStatus('⏳ 正在验证...', 'info', 'recoverStatus');
    try {
      var data = await this._post('/api/auth-recover', { email: email, code: code });
      this._onAuthed(data);
    } catch (err) {
      this._setStatus(err.message || '找回失败', 'error', 'recoverStatus');
    }
  },

  _onAuthed: function(data) {
    var user = data.user;
    if (window.DaoWenIdentity) DaoWenIdentity.user = user;
    window.dispatchEvent(new CustomEvent('daowen:identity-changed', { detail: { user: user } }));
    this._renderNav();

    if (data.recoveryCode) {
      this._lastRecoveryCode = data.recoveryCode;
      this._showBlock('code');
      var el = document.getElementById('recoveryCodeText');
      if (el) {
        el.style.display = '';
        el.className = 'auth-status success';
        el.innerHTML = '<b>你的留存码（请妥善保存）：</b><br>' +
          '<span style="font-size:1.06rem;letter-spacing:.05em;word-break:break-all;">' + this._esc(data.recoveryCode) + '</span>' +
          '<br><span style="font-size:.78rem;">忘记密码时，用它 + 邮箱即可找回账号。</span>';
      }
    } else {
      this.closeLogin();
    }
  },

  copyRecoveryCode: function() {
    var code = this._lastRecoveryCode;
    if (!code) return;
    var done = function() { alert('留存码已复制，请粘贴保存到安全的地方'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done, function() { done(); });
    } else {
      done();
    }
  },

  logout: async function() {
    try { await this._post('/api/auth-logout', {}); } catch (e) {}
    if (window.DaoWenIdentity) {
      DaoWenIdentity.user = null;
      DaoWenIdentity._initPromise = null;
      DaoWenIdentity.init().catch(function() {});
    }
    this._renderNav();
  },

  _esc: function(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
};

document.addEventListener('DOMContentLoaded', function() { DaoWenAuth.init(); });
