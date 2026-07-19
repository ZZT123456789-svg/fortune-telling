/**
 * 道问登录系统 — Supabase Auth
 */
var DaoWenAuth = {
  SUPABASE_URL: 'https://ebdnkgfilnvfkkdvqrzu.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZG5rZ2ZpbG52ZmtrZHZxcnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTAxODEsImV4cCI6MjA5OTc4NjE4MX0.l3saO79tS6KOjI1w78QWWrkamO0OY8IGh38i1Yjy2Ro',
  user: null,
  session: null,

  init: async function() {
    var saved = localStorage.getItem('daowen_session');
    if (saved) {
      try {
        var parsed = JSON.parse(saved);
        this.session = parsed.session;
        this.user = parsed.user;
        this._updateUI();
        return true;
      } catch(e) { localStorage.removeItem('daowen_session'); }
    }
    return false;
  },

  signUp: async function(email, password) {
    try {
      var resp = await fetch(this.SUPABASE_URL + '/auth/v1/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': this.SUPABASE_KEY },
        body: JSON.stringify({ email: email, password: password })
      });
      var data = await resp.json();
      // Supabase v1 signup returns access_token + user, not session
      if (data.user) {
        this.user = data.user;
        if (data.access_token) this.session = { access_token: data.access_token };
        localStorage.setItem('daowen_session', JSON.stringify({ user: data.user, session: this.session }));
        this._updateUI();
        return { success: true, msg: '注册成功！' };
      }
      return { success: false, msg: data.msg || ('注册失败 HTTP' + resp.status + ': ' + JSON.stringify(data).substr(0,100)) };
    } catch(e) {
      return { success: false, msg: '网络错误: ' + e.message };
    }
  },

  signIn: async function(email, password) {
    try {
      var resp = await fetch(this.SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': this.SUPABASE_KEY },
        body: JSON.stringify({ email: email, password: password })
      });
      var data = await resp.json();
    if (data.access_token) {
      var userResp = await fetch(this.SUPABASE_URL + '/auth/v1/user', {
        headers: { 'apikey': this.SUPABASE_KEY, 'Authorization': 'Bearer ' + data.access_token }
      });
      var userData = await userResp.json();
      this.user = userData; this.session = data;
      localStorage.setItem('daowen_session', JSON.stringify({ user: userData, session: data }));
      this._updateUI();
      return { success: true, msg: '登录成功！' };
    }
    return { success: false, msg: data.error_description || '邮箱或密码错误' };
    } catch(e) {
      return { success: false, msg: '网络错误，请稍后重试' };
    }
  },

  signOut: function() {
    this.user = null; this.session = null;
    localStorage.removeItem('daowen_session');
    this._updateUI();
  },

  openLogin: function() {
    var overlay = document.getElementById('loginOverlay');
    if (!overlay) { alert('登录弹窗未加载，请刷新页面'); return; }
    overlay.classList.add('active');
  },
  closeLogin: function() {
    var overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  doLogin: async function(mode) {
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) { alert('请输入邮箱和密码'); return; }
    if (password.length < 6) { alert('密码至少6位'); return; }
    var result = mode === 'signup' ? await this.signUp(email, password) : await this.signIn(email, password);
    if (result.success) {
      this.closeLogin();
      if (typeof Paywall !== 'undefined') Paywall.refreshWalls();
      alert(result.msg);
    } else { alert('注册失败：' + (result.msg || '未知错误') + '\n\n如果是"Failed to fetch"，请检查网络连接。\n邮箱：' + email); }
  },

  _updateUI: function() {
    var btn = document.getElementById('loginBtn');
    if (!btn) return;
    if (this.user) {
      btn.textContent = '👤 ' + (this.user.email || '').split('@')[0];
      btn.style.color = '#3cb371';
      btn.onclick = function() { if (confirm('确定退出登录？')) DaoWenAuth.signOut(); };
    } else {
      btn.textContent = '👤 登录';
      btn.style.color = '';
      btn.onclick = function() { DaoWenAuth.openLogin(); };
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() { DaoWenAuth.init(); }, 500);
});
