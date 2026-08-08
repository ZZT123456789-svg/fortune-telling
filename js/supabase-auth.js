/**
 * 道问登录系统 — Supabase Auth
 * 改进版：会话校验 / Token 刷新 / 邮箱验证 / 密码找回 / 恢复登录状态
 *
 * 说明：浏览器中的 anon/publishable key 本身可以公开；真正的数据安全必须由 RLS/服务端权限保证。
 * 积分余额由服务端数据库决定；浏览器仅缓存显示值，所有敏感 API 需要当前登录会话。
 */
var DaoWenAuth = {
  SUPABASE_URL: 'https://ebdnkgfilnvfkkdvqrzu.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZG5rZ2ZpbG52ZmtrZHZxcnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTAxODEsImV4cCI6MjA5OTc4NjE4MX0.l3saO79tS6KOjI1w78QWWrkamO0OY8IGh38i1Yjy2Ro',
  STORAGE_KEY: 'daowen_session_v2',
  LEGACY_STORAGE_KEY: 'daowen_session',
  user: null,
  session: null,
  _busy: false,
  _recoveryMode: false,
  _refreshTimer: null,
  _initialized: false,
  _fetchGuardInstalled: false,
  _nativeFetch: null,
  _apiDedupe: {},
  _initPromise: null,
  _lifecycleBound: false,
  _accountUIReady: false,

  init: function() {
    if (this._initPromise) return this._initPromise;
    var self = this;
    this._initPromise = (async function() {
      self._enhanceLoginUI();
      self._ensureAccountUI();
      self._bindLifecycle();

      try {
        var callback = await self._consumeAuthCallback();
        if (!callback) {
          self._loadStoredSession();
          // 本地缓存只用于恢复 token，页面启动后必须向 Supabase 验证用户身份。
          if (self.session) await self._ensureSession(true);
        }
      } catch (e) {
        console.warn('[DaoWenAuth] 初始化失败:', e);
        self._clearSession(false);
      }

      self._initialized = true;
      self._updateUI();
      self._startRefreshTimer();
      self._emitAuthChanged();
      return !!self.user;
    })();
    return this._initPromise;
  },

  /**
   * 为站内敏感 API 自动附加当前 Supabase Access Token。
   * 仅拦截同源 allowlist，不触碰 Supabase / DeepSeek / ZPay 等外部请求。
   */
  _installProtectedFetch: function() {
    if (this._fetchGuardInstalled || typeof window === 'undefined' || typeof window.fetch !== 'function') return;
    this._fetchGuardInstalled = true;
    this._nativeFetch = window.fetch.bind(window);
    var self = this;
    var protectedPaths = [
      '/api/ai-chat',
      '/api/ai-reading',
      '/api/alipay',
      '/api/check-order',
      '/api/balance',
      '/api/redeem',
      '/api/consume-credit'
    ];

    window.fetch = async function(input, init) {
      var rawUrl = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      var url;
      try { url = new URL(rawUrl, window.location.href); } catch (e) { return self._nativeFetch(input, init); }
      var isSameOrigin = url.origin === window.location.origin;
      var needsAuth = isSameOrigin && protectedPaths.indexOf(url.pathname) !== -1;
      if (!needsAuth) return self._nativeFetch(input, init);

      if (!self._initialized) await self.init();
      var token = await self.getAccessToken();
      if (!token) {
        var err = new Error('AUTH_REQUIRED');
        err.code = 'AUTH_REQUIRED';
        throw err;
      }

      var requestInit = Object.assign({}, init || {});
      var headers = new Headers(
        requestInit.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined) || {}
      );
      headers.set('Authorization', 'Bearer ' + token);
      requestInit.headers = headers;

      // 八字旧前端会在同一次渲染中重复调用两次相同的 AI 深度解读，
      // 并在两次调用之间执行一次 Paywall.deduct()。这里兼容旧模块：
      // 1) AI 接口本身服务端扣 1 次；2) 本地 deduct 仅刷新显示；3) 5 秒内相同请求复用同一响应。
      if (url.pathname === '/api/ai-reading') {
        if (window.Paywall) window.Paywall._suppressNextDeduct = true;
        var rawBody = typeof requestInit.body === 'string' ? requestInit.body : '';
        var key = url.pathname + '|' + rawBody;
        var now = Date.now();
        var cached = self._apiDedupe[key];
        if (cached && now - cached.time < 5000) {
          return cached.promise.then(function(resp) { return resp.clone(); });
        }
        var base = self._nativeFetch(input, requestInit);
        self._apiDedupe[key] = { time: now, promise: base };
        base.then(function() {
          if (window.Paywall && Paywall.syncBalance) {
            setTimeout(function() { Paywall.syncBalance(true).catch(function() {}); }, 80);
          }
        }).catch(function() {});
        setTimeout(function() {
          if (self._apiDedupe[key] && self._apiDedupe[key].promise === base) delete self._apiDedupe[key];
        }, 5000);
        return base.then(function(resp) { return resp.clone(); });
      }

      return self._nativeFetch(input, requestInit);
    };
  },

  _request: async function(path, options) {
    options = options || {};
    var headers = options.headers || {};
    headers.apikey = this.SUPABASE_KEY;
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    options.headers = headers;
    var resp = await fetch(this.SUPABASE_URL + path, options);
    var data = null;
    try { data = await resp.json(); } catch (e) { data = {}; }
    return { ok: resp.ok, status: resp.status, data: data || {} };
  },

  _loadStoredSession: function() {
    var raw = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem(this.LEGACY_STORAGE_KEY);
    if (!raw) return false;
    try {
      var parsed = JSON.parse(raw);
      this.session = parsed.session || null;
      this.user = parsed.user || null;
      if (localStorage.getItem(this.LEGACY_STORAGE_KEY)) {
        localStorage.removeItem(this.LEGACY_STORAGE_KEY);
        this._saveSession();
      }
      return !!this.session;
    } catch (e) {
      this._clearSession(false);
      return false;
    }
  },

  _saveSession: function() {
    if (!this.session || !this.session.access_token) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      session: this.session,
      user: this.user,
      saved_at: Date.now()
    }));
  },

  _clearSession: function(emit) {
    this.user = null;
    this.session = null;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.LEGACY_STORAGE_KEY);
    if (emit !== false) this._emitAuthChanged();
  },

  _jwtExpiry: function(token) {
    if (!token || token.split('.').length < 2) return 0;
    try {
      var payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      var obj = JSON.parse(decodeURIComponent(escape(atob(payload))));
      return Number(obj.exp || 0);
    } catch (e) {
      return 0;
    }
  },

  _needsRefresh: function() {
    if (!this.session || !this.session.access_token) return true;
    var exp = Number(this.session.expires_at || this._jwtExpiry(this.session.access_token));
    if (!exp) return false;
    return exp <= Math.floor(Date.now() / 1000) + 90;
  },

  _refreshSession: async function() {
    if (!this.session || !this.session.refresh_token) return false;
    var result = await this._request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: this.session.refresh_token })
    });
    if (!result.ok || !result.data.access_token) return false;
    this.session = result.data;
    if (!this.session.expires_at && this.session.expires_in) {
      this.session.expires_at = Math.floor(Date.now() / 1000) + Number(this.session.expires_in);
    }
    var user = await this._fetchUser(this.session.access_token);
    if (!user) return false;
    this.user = user;
    this._saveSession();
    this._emitAuthChanged();
    return true;
  },

  _fetchUser: async function(token) {
    if (!token) return null;
    var result = await this._request('/auth/v1/user', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token }
    });
    return result.ok && result.data && result.data.id ? result.data : null;
  },

  _ensureSession: async function(forceVerify) {
    if (!this.session || !this.session.access_token) {
      this._clearSession(false);
      return false;
    }

    if (this._needsRefresh()) {
      var refreshed = await this._refreshSession();
      if (!refreshed) {
        this._clearSession();
        this._updateUI();
        return false;
      }
      return true;
    }

    if (forceVerify || !this.user || !this.user.id) {
      var user = await this._fetchUser(this.session.access_token);
      if (!user) {
        if (this.session.refresh_token && await this._refreshSession()) return true;
        this._clearSession();
        this._updateUI();
        return false;
      }
      this.user = user;
      this._saveSession();
    }
    return true;
  },

  getAccessToken: async function() {
    if (!await this._ensureSession(false)) return null;
    return this.session ? this.session.access_token : null;
  },

  signUp: async function(email, password) {
    email = String(email || '').trim().toLowerCase();
    if (!this._validEmail(email)) return { success: false, msg: '请输入有效的邮箱地址' };
    if (!password || password.length < 8) return { success: false, msg: '新账号密码建议至少 8 位' };

    try {
      var redirectTo = this._baseRedirectUrl();
      var result = await this._request('/auth/v1/signup?redirect_to=' + encodeURIComponent(redirectTo), {
        method: 'POST',
        body: JSON.stringify({ email: email, password: password, data: { source: 'daowen-web' } })
      });
      var data = result.data;

      if (!result.ok) return { success: false, msg: this._friendlyError(data, '注册失败，请稍后重试') };

      // 开启邮箱确认时，Supabase 会返回 user 但没有 access_token。
      if (data.user && !data.access_token) {
        this._clearSession(false);
        this._updateUI();
        return { success: true, pending: true, msg: '注册申请已提交，请到邮箱完成验证后再登录。' };
      }

      if (data.access_token) {
        this.session = data;
        this.user = data.user || await this._fetchUser(data.access_token);
        this._saveSession();
        this._updateUI();
        this._emitAuthChanged();
        return { success: true, msg: '注册并登录成功' };
      }
      return { success: false, msg: '注册返回异常，请稍后重试' };
    } catch (e) {
      return { success: false, msg: '网络错误，请检查网络后重试' };
    }
  },

  signIn: async function(email, password) {
    email = String(email || '').trim().toLowerCase();
    if (!this._validEmail(email)) return { success: false, msg: '请输入有效的邮箱地址' };
    if (!password) return { success: false, msg: '请输入密码' };

    try {
      var result = await this._request('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({ email: email, password: password })
      });
      if (!result.ok || !result.data.access_token) {
        return { success: false, msg: this._friendlyError(result.data, '邮箱或密码错误') };
      }

      this.session = result.data;
      if (!this.session.expires_at && this.session.expires_in) {
        this.session.expires_at = Math.floor(Date.now() / 1000) + Number(this.session.expires_in);
      }
      this.user = result.data.user || await this._fetchUser(result.data.access_token);
      if (!this.user) {
        this._clearSession(false);
        return { success: false, msg: '登录凭证验证失败，请重新登录' };
      }
      this._saveSession();
      this._updateUI();
      this._emitAuthChanged();
      this._startRefreshTimer();
      return { success: true, msg: '登录成功' };
    } catch (e) {
      return { success: false, msg: '网络错误，请稍后重试' };
    }
  },

  resetPassword: async function() {
    var emailEl = document.getElementById('loginEmail');
    var email = emailEl ? emailEl.value.trim().toLowerCase() : '';
    if (!this._validEmail(email)) {
      this._setStatus('请先输入有效邮箱地址', 'error');
      return;
    }

    this._setBusy(true);
    this._setStatus('正在发送重置邮件…', 'info');
    try {
      var redirectTo = this._baseRedirectUrl();
      var result = await this._request('/auth/v1/recover?redirect_to=' + encodeURIComponent(redirectTo), {
        method: 'POST',
        body: JSON.stringify({ email: email })
      });
      if (!result.ok) {
        this._setStatus(this._friendlyError(result.data, '发送失败，请稍后重试'), 'error');
      } else {
        // 不暴露账号是否存在，避免用户枚举。
        this._setStatus('如果该邮箱已注册，你会收到密码重置邮件。', 'success');
      }
    } catch (e) {
      this._setStatus('网络错误，请稍后重试', 'error');
    } finally {
      this._setBusy(false);
    }
  },

  updatePassword: async function() {
    var p1 = document.getElementById('loginNewPassword');
    var p2 = document.getElementById('loginConfirmPassword');
    var password = p1 ? p1.value : '';
    var confirm = p2 ? p2.value : '';
    if (password.length < 8) {
      this._setStatus('新密码至少 8 位', 'error');
      return;
    }
    if (password !== confirm) {
      this._setStatus('两次输入的密码不一致', 'error');
      return;
    }

    var token = await this.getAccessToken();
    if (!token) {
      this._setStatus('重置链接已失效，请重新发送密码重置邮件', 'error');
      return;
    }

    this._setBusy(true);
    try {
      var result = await this._request('/auth/v1/user', {
        method: 'PUT',
        headers: { Authorization: 'Bearer ' + token },
        body: JSON.stringify({ password: password })
      });
      if (!result.ok) {
        this._setStatus(this._friendlyError(result.data, '密码更新失败'), 'error');
        return;
      }
      if (result.data && result.data.id) this.user = result.data;
      this._saveSession();
      this._recoveryMode = false;
      this._showRecoveryMode(false);
      this._setStatus('密码已更新，可以继续使用当前账号。', 'success');
      this._updateUI();
      this._emitAuthChanged();
    } catch (e) {
      this._setStatus('网络错误，请稍后重试', 'error');
    } finally {
      this._setBusy(false);
    }
  },

  signOut: async function(scope) {
    scope = scope === 'global' ? 'global' : 'local';
    var token = this.session && this.session.access_token;
    this.closeAccount();
    this._clearSession(false);
    this._updateUI();
    this._emitAuthChanged();
    if (typeof Paywall !== 'undefined' && Paywall._setBalance) Paywall._setBalance(0);
    if (token) {
      try {
        await this._request('/auth/v1/logout?scope=' + encodeURIComponent(scope), {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token }
        });
      } catch (e) {
        // 客户端已经安全清理本地 token；服务端注销失败不恢复本地登录态。
        console.warn('[DaoWenAuth] 服务端注销未完成:', e);
      }
    }
  },

  openLogin: function() {
    this.closeAccount();
    this._enhanceLoginUI();
    var overlay = document.getElementById('loginOverlay');
    if (!overlay) return;
    overlay.classList.add('active');
    this._showRecoveryMode(this._recoveryMode);
    var target = this._recoveryMode ? document.getElementById('loginNewPassword') : document.getElementById('loginEmail');
    if (target) setTimeout(function() { target.focus(); }, 80);
  },

  closeLogin: function() {
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.remove('active');
    if (!this._recoveryMode) this._setStatus('', 'info');
  },

  doLogin: async function(mode) {
    if (this._busy) return;
    var email = (document.getElementById('loginEmail') || {}).value || '';
    var password = (document.getElementById('loginPassword') || {}).value || '';
    this._setStatus('', 'info');
    this._setBusy(true);

    try {
      var result = mode === 'signup' ? await this.signUp(email, password) : await this.signIn(email, password);
      if (result.success && !result.pending) {
        this._setStatus(result.msg || '操作成功', 'success');
        var self = this;
        setTimeout(function() { self.closeLogin(); }, 450);
        if (typeof Paywall !== 'undefined' && Paywall.refreshWalls) Paywall.refreshWalls();
      } else if (result.success && result.pending) {
        this._setStatus(result.msg, 'success');
      } else {
        this._setStatus(result.msg || '操作失败', 'error');
      }
    } finally {
      this._setBusy(false);
    }
  },

  _consumeAuthCallback: async function() {
    if (!window.location.hash || window.location.hash.length < 2) return false;
    var params = new URLSearchParams(window.location.hash.slice(1));
    var access = params.get('access_token');
    var refresh = params.get('refresh_token');
    var type = params.get('type');
    if (!access) return false;

    this.session = {
      access_token: access,
      refresh_token: refresh || '',
      token_type: params.get('token_type') || 'bearer',
      expires_in: Number(params.get('expires_in') || 3600),
      expires_at: Math.floor(Date.now() / 1000) + Number(params.get('expires_in') || 3600)
    };
    this.user = await this._fetchUser(access);
    if (!this.user) {
      this._clearSession(false);
      return false;
    }
    this._saveSession();
    this._updateUI();
    this._emitAuthChanged();

    try { history.replaceState(null, document.title, window.location.pathname + window.location.search); } catch (e) {}

    if (type === 'recovery') {
      this._recoveryMode = true;
      this.openLogin();
      this._setStatus('验证成功，请设置新的登录密码。', 'success');
    } else {
      this._setStatus('邮箱验证完成，已自动登录。', 'success');
    }
    return true;
  },

  _bindLifecycle: function() {
    if (this._lifecycleBound || typeof window === 'undefined') return;
    this._lifecycleBound = true;
    var self = this;

    // 多标签页同步：一个标签退出后，其他标签立即同步，不继续显示过期登录态。
    window.addEventListener('storage', function(e) {
      if (e.key !== self.STORAGE_KEY && e.key !== self.LEGACY_STORAGE_KEY) return;
      if (!e.newValue) {
        self.user = null;
        self.session = null;
        self._updateUI();
        self._emitAuthChanged();
        if (typeof Paywall !== 'undefined' && Paywall._setBalance) Paywall._setBalance(0);
        return;
      }
      self._loadStoredSession();
      self._ensureSession(true).then(function(ok) {
        self._updateUI();
        self._emitAuthChanged();
        if (ok && typeof Paywall !== 'undefined' && Paywall.syncBalance) Paywall.syncBalance(true).catch(function() {});
      }).catch(function() {});
    });

    // 标签页重新回到前台或网络恢复时做一次服务器验证，减少“看起来已登录但 token 已失效”的时间窗口。
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden && self.session) {
        self._ensureSession(true).then(function() { self._updateUI(); }).catch(function() {});
      }
    });
    window.addEventListener('online', function() {
      if (self.session) self._ensureSession(true).then(function() { self._updateUI(); }).catch(function() {});
    });
  },

  _ensureAccountUI: function() {
    if (this._accountUIReady || document.getElementById('accountOverlay')) {
      this._accountUIReady = true;
      return;
    }
    this._accountUIReady = true;
    var overlay = document.createElement('div');
    overlay.className = 'tool-overlay';
    overlay.id = 'accountOverlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="tool-modal auth-account-modal" role="dialog" aria-modal="true" aria-labelledby="accountTitle">' +
        '<button class="modal-close" type="button" aria-label="关闭账号中心">✕</button>' +
        '<div class="auth-brand-mark" aria-hidden="true">道</div>' +
        '<h2 class="modal-title" id="accountTitle">我的账号</h2>' +
        '<p class="modal-desc">登录状态与云端解读次数</p>' +
        '<div class="auth-account-card">' +
          '<div class="auth-account-avatar" aria-hidden="true">人</div>' +
          '<div class="auth-account-copy"><strong id="accountEmail">—</strong><span id="accountState">已通过 Supabase 验证</span></div>' +
        '</div>' +
        '<div class="auth-account-stats">' +
          '<div><span>云端解读次数</span><strong data-daowen-balance>—</strong></div>' +
          '<div><span>会话状态</span><strong class="auth-ok-dot">安全</strong></div>' +
        '</div>' +
        '<button type="button" class="btn-secondary auth-refresh-balance">刷新云端余额</button>' +
        '<div class="auth-account-actions">' +
          '<button type="button" class="btn-secondary auth-signout-local">退出当前设备</button>' +
          '<button type="button" class="auth-danger-btn auth-signout-global">退出所有设备</button>' +
        '</div>' +
        '<p class="auth-security-note">安全提示：公共电脑使用后请选择“退出当前设备”。如果怀疑账号泄露，可选择“退出所有设备”并立即修改密码。</p>' +
      '</div>';
    document.body.appendChild(overlay);
    var self = this;
    overlay.querySelector('.modal-close').onclick = function() { self.closeAccount(); };
    overlay.addEventListener('click', function(e) { if (e.target === overlay) self.closeAccount(); });
    overlay.querySelector('.auth-refresh-balance').onclick = function() {
      if (window.Paywall && Paywall.syncBalance) Paywall.syncBalance(true).catch(function() {});
    };
    overlay.querySelector('.auth-signout-local').onclick = function() { self.signOut('local'); };
    overlay.querySelector('.auth-signout-global').onclick = function() {
      if (confirm('确定退出所有设备上的道问账号吗？')) self.signOut('global');
    };
  },

  openAccount: function() {
    if (!this.user || !this.user.id) return this.openLogin();
    this._ensureAccountUI();
    this._updateAccountUI();
    var overlay = document.getElementById('accountOverlay');
    if (!overlay) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    if (window.Paywall && Paywall.syncBalance) Paywall.syncBalance(false).catch(function() {});
  },

  closeAccount: function() {
    var overlay = document.getElementById('accountOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
  },

  _updateAccountUI: function() {
    var email = document.getElementById('accountEmail');
    var state = document.getElementById('accountState');
    if (email) email.textContent = this.user && this.user.email ? this.user.email : '已登录账号';
    if (state) {
      var confirmed = this.user && (this.user.email_confirmed_at || this.user.confirmed_at);
      state.textContent = confirmed ? '邮箱已验证 · Supabase 会话有效' : 'Supabase 会话有效';
    }
  },

  _baseRedirectUrl: function() {
    return window.location.origin + window.location.pathname;
  },

  _validEmail: function(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  },

  _friendlyError: function(data, fallback) {
    var raw = String((data && (data.msg || data.message || data.error_description || data.error)) || '').toLowerCase();
    if (raw.indexOf('invalid login credentials') !== -1) return '邮箱或密码错误';
    if (raw.indexOf('email not confirmed') !== -1) return '邮箱尚未验证，请先查看验证邮件';
    if (raw.indexOf('user already registered') !== -1) return '该邮箱已注册，请直接登录';
    if (raw.indexOf('password') !== -1 && raw.indexOf('least') !== -1) return '密码长度不符合要求';
    if (raw.indexOf('rate') !== -1 || raw.indexOf('too many') !== -1) return '操作过于频繁，请稍后再试';
    if (raw.indexOf('email') !== -1 && raw.indexOf('invalid') !== -1) return '邮箱格式无效';
    return fallback || '操作失败';
  },

  _setBusy: function(flag) {
    this._busy = !!flag;
    var buttons = document.querySelectorAll('#loginOverlay button');
    buttons.forEach(function(btn) {
      if (!btn.classList.contains('modal-close')) btn.disabled = !!flag;
    });
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

  _showRecoveryMode: function(flag) {
    var normal = document.getElementById('loginNormalActions');
    var recovery = document.getElementById('loginRecoveryActions');
    var email = document.getElementById('loginEmail');
    var password = document.getElementById('loginPassword');
    var forgot = document.getElementById('loginForgotWrap');
    var title = document.querySelector('#loginOverlay .modal-title');
    var desc = document.querySelector('#loginOverlay .modal-desc');
    if (normal) normal.style.display = flag ? 'none' : '';
    if (recovery) recovery.style.display = flag ? 'block' : 'none';
    if (email) email.style.display = flag ? 'none' : '';
    if (password) password.style.display = flag ? 'none' : '';
    if (forgot) forgot.style.display = flag ? 'none' : '';
    if (title) title.textContent = flag ? '设置新密码' : '账号登录';
    if (desc) desc.textContent = flag ? '为当前账号设置一个新的安全密码' : '安全登录 · 会话自动校验 · 支持邮箱找回密码';
  },

  _enhanceLoginUI: function() {
    var overlay = document.getElementById('loginOverlay');
    if (!overlay || overlay.dataset.authEnhanced === '1') return;
    overlay.dataset.authEnhanced = '1';
    var modal = overlay.querySelector('.tool-modal');
    if (!modal) return;
    modal.classList.add('auth-modal');
    var brand = document.createElement('div');
    brand.className = 'auth-brand-mark';
    brand.setAttribute('aria-hidden', 'true');
    brand.textContent = '道';
    var titleNode = modal.querySelector('.modal-title');
    if (titleNode) modal.insertBefore(brand, titleNode);

    var email = document.getElementById('loginEmail');
    var password = document.getElementById('loginPassword');
    if (email) {
      email.setAttribute('autocomplete', 'email');
      email.setAttribute('inputmode', 'email');
      email.setAttribute('aria-label', '邮箱地址');
    }
    if (password) {
      password.placeholder = '密码（注册至少 8 位）';
      password.setAttribute('autocomplete', 'current-password');
      password.setAttribute('aria-label', '密码');
      if (!password.parentElement.classList.contains('auth-password-wrap')) {
        var wrap = document.createElement('div');
        wrap.className = 'auth-password-wrap';
        password.parentNode.insertBefore(wrap, password);
        wrap.appendChild(password);
        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'auth-password-toggle';
        toggle.setAttribute('aria-label', '显示密码');
        toggle.textContent = '显示';
        toggle.onclick = function() {
          var showing = password.type === 'text';
          password.type = showing ? 'password' : 'text';
          toggle.textContent = showing ? '显示' : '隐藏';
          toggle.setAttribute('aria-label', showing ? '显示密码' : '隐藏密码');
        };
        wrap.appendChild(toggle);
      }
    }

    var title = modal.querySelector('.modal-title');
    if (title) title.textContent = '道问账号';
    var desc = modal.querySelector('.modal-desc');
    if (desc) desc.textContent = '安全登录 · 会话自动校验 · 支持邮箱找回密码';

    var row = modal.querySelector('.btn-row');
    if (row) {
      row.id = 'loginNormalActions';
      var buttons = row.querySelectorAll('button');
      if (buttons[0]) { buttons[0].textContent = '登录'; buttons[0].onclick = function() { DaoWenAuth.doLogin('signin'); }; }
      if (buttons[1]) { buttons[1].textContent = '注册账号'; buttons[1].onclick = function() { DaoWenAuth.doLogin('signup'); }; }
    }

    var oldForgot = modal.querySelector('a[href*="resetPassword"]');
    if (oldForgot && oldForgot.parentElement) {
      oldForgot.parentElement.id = 'loginForgotWrap';
      oldForgot.textContent = '忘记密码？发送重置邮件';
      oldForgot.onclick = function(e) { e.preventDefault(); DaoWenAuth.resetPassword(); };
      oldForgot.removeAttribute('href');
      oldForgot.style.cursor = 'pointer';
    }

    var status = document.createElement('div');
    status.id = 'loginStatus';
    status.className = 'auth-status info';
    status.style.display = 'none';
    if (row) modal.insertBefore(status, row);
    else modal.appendChild(status);

    var recovery = document.createElement('div');
    recovery.id = 'loginRecoveryActions';
    recovery.style.display = 'none';
    recovery.innerHTML =
      '<input type="password" id="loginNewPassword" class="form-input full" placeholder="新密码（至少8位）" autocomplete="new-password">' +
      '<input type="password" id="loginConfirmPassword" class="form-input full" placeholder="再次输入新密码" autocomplete="new-password">' +
      '<button type="button" class="btn-primary" id="loginUpdatePasswordBtn">保存新密码</button>';
    modal.appendChild(recovery);
    var updateBtn = document.getElementById('loginUpdatePasswordBtn');
    if (updateBtn) updateBtn.onclick = function() { DaoWenAuth.updatePassword(); };

    var note = document.createElement('p');
    note.className = 'auth-security-note';
    note.textContent = '账号登录已启用安全会话校验。解读次数保存在云端账号余额中，兑换、购买和扣费均以服务端校验结果为准。';
    modal.appendChild(note);

    [email, password].forEach(function(el) {
      if (!el) return;
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') DaoWenAuth.doLogin('signin');
      });
    });

    this._injectStyles();
  },

  _injectStyles: function() {
    // 登录/账号中心样式已并入 css/style.css，避免运行时注入样式造成闪烁。
  },

  _updateUI: function() {
    var btn = document.getElementById('loginBtn');
    if (!btn) return;
    if (this.user && this.user.id) {
      var name = (this.user.email || '已登录').split('@')[0];
      btn.textContent = '◉ ' + name;
      btn.setAttribute('title', '打开账号中心 · ' + (this.user.email || ''));
      btn.onclick = function() { DaoWenAuth.openAccount(); };
      btn.classList.add('is-logged-in');
      this._updateAccountUI();
    } else {
      btn.textContent = '账号登录';
      btn.removeAttribute('title');
      btn.onclick = function() { DaoWenAuth.openLogin(); };
      btn.classList.remove('is-logged-in');
    }
  },

  _emitAuthChanged: function() {
    try {
      window.dispatchEvent(new CustomEvent('daowen:auth-changed', {
        detail: { user: this.user, session: this.session }
      }));
    } catch (e) {}
  },

  _startRefreshTimer: function() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
    var self = this;
    this._refreshTimer = setInterval(function() {
      if (self.session) self._ensureSession(false).catch(function() {});
    }, 10 * 60 * 1000);
  }
};

DaoWenAuth._installProtectedFetch();

document.addEventListener('DOMContentLoaded', function() {
  DaoWenAuth.init();
});
