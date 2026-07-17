/**
 * 道问登录系统 — Supabase Auth
 */
var DaoWenAuth = {
  SUPABASE_URL: 'https://ebdnkgfilnvfkkdvqrzu.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZG5rZ2ZpbG52ZmtrZHZxcnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTAxODEsImV4cCI6MjA5OTc4NjE4MX0.l3saO79tS6KOjI1w78QWWrkamO0OY8IGh38i1Yjy2Ro',
  user: null,
  session: null,

  /** 初始化：检查是否已登录 */
  init: async function() {
    var saved = localStorage.getItem('daowen_session');
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        this.session = parsed.session;
        this.user = parsed.user;
        console.log('已登录:', this.user.email);
        this._updateUI();
        return true;
      } catch(e) {
        localStorage.removeItem('daowen_session');
      }
    }
    return false;
  },

  /** 注册 */
  signUp: async function(email, password) {
    var resp = await fetch(this.SUPABASE_URL + '/auth/v1/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.SUPABASE_KEY,
        'Authorization': 'Bearer ' + this.SUPABASE_KEY
      },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await resp.json();
    if (resp.ok && data.user) {
      this.user = data.user;
      this.session = data.session;
      localStorage.setItem('daowen_session', JSON.stringify({ user: data.user, session: data.session }));
      this._updateUI();
      return { success: true, msg: '注册成功！' };
    }
    return { success: false, msg: data.msg || data.error_description || '注册失败' };
  },

  /** 登录 */
  signIn: async function(email, password) {
    var resp = await fetch(this.SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.SUPABASE_KEY,
        'Authorization': 'Bearer ' + this.SUPABASE_KEY
      },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await resp.json();
    if (resp.ok && data.access_token) {
      // 获取用户信息
      var userResp = await fetch(this.SUPABASE_URL + '/auth/v1/user', {
        headers: { 'apikey': this.SUPABASE_KEY, 'Authorization': 'Bearer ' + data.access_token }
      });
      var userData = await userResp.json();
      this.user = userData;
      this.session = data;
      localStorage.setItem('daowen_session', JSON.stringify({ user: userData, session: data }));
      this._updateUI();
      // 同步云余额到本地
      await this._syncBalanceFromCloud();
      return { success: true, msg: '登录成功！' };
    }
    return { success: false, msg: data.error_description || '邮箱或密码错误' };
  },

  /** 退出 */
  signOut: function() {
    this.user = null;
    this.session = null;
    localStorage.removeItem('daowen_session');
    this._updateUI();
  },

  /** 同步云端余额到本地 */
  _syncBalanceFromCloud: async function() {
    if (!this.session || !this.session.access_token) return;
    try {
      var userId = this.user.id;
      var resp = await fetch(this.SUPABASE_URL + '/rest/v1/user_balances?user_id=eq.' + userId + '&select=balance', {
        headers: { 'apikey': this.SUPABASE_KEY, 'Authorization': 'Bearer ' + this.session.access_token }
      });
      var data = await resp.json();
      if (data && data.length > 0) {
        localStorage.setItem('daowen_balance', data[0].balance || 0);
      }
    } catch(e) {}
  },

  /** 保存余额到云端 */
  saveBalance: async function(balance) {
    if (!this.session || !this.session.access_token) return;
    var userId = this.user.id;
    try {
      // 先查是否存在
      var resp = await fetch(this.SUPABASE_URL + '/rest/v1/user_balances?user_id=eq.' + userId + '&select=id', {
        headers: { 'apikey': this.SUPABASE_KEY, 'Authorization': 'Bearer ' + this.session.access_token }
      });
      var data = await resp.json();

      if (data && data.length > 0) {
        // 更新
        await fetch(this.SUPABASE_URL + '/rest/v1/user_balances?id=eq.' + data[0].id, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.SUPABASE_KEY,
            'Authorization': 'Bearer ' + this.session.access_token,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ balance: balance })
        });
      } else {
        // 插入
        await fetch(this.SUPABASE_URL + '/rest/v1/user_balances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.SUPABASE_KEY,
            'Authorization': 'Bearer ' + this.session.access_token,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ user_id: userId, balance: balance })
        });
      }
    } catch(e) {
      console.log('云同步失败，保留本地余额');
    }
  },

  /** 打开登录弹窗 */
  openLogin: function() {
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.add('active');
  },

  closeLogin: function() {
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  /** 执行登录/注册 */
  doLogin: async function(mode) {
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) { alert('请输入邮箱和密码'); return; }
    if (password.length < 6) { alert('密码至少6位'); return; }

    var result = mode === 'signup' ? await this.signUp(email, password) : await this.signIn(email, password);
    if (result.success) {
      this.closeLogin();
      // 更新付费墙
      if (typeof Paywall !== 'undefined') Paywall.refreshWalls();
      alert(result.msg);
    } else {
      alert(result.msg);
    }
  },

  _updateUI: function() {
    var btn = document.getElementById('loginBtn');
    if (!btn) return;
    if (this.user) {
      btn.textContent = '👤 ' + (this.user.email || '').split('@')[0];
      btn.onclick = function() {
        if (confirm('确定退出登录？')) DaoWenAuth.signOut();
      };
      btn.style.color = '#3cb371';
    } else {
      btn.textContent = '👤 登录';
      btn.onclick = function() { DaoWenAuth.openLogin(); };
      btn.style.color = '';
    }
  }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() { DaoWenAuth.init(); }, 500);
});
