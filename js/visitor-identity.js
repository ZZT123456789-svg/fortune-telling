/** 无登录匿名身份：只等待服务端设置签名访客 Cookie。 */
var DaoWenIdentity = {
  user: null,
  _initPromise: null,

  init: function() {
    if (this._initPromise) return this._initPromise;
    var self = this;
    this._initPromise = fetch('/api/session', { method: 'GET', credentials: 'same-origin', cache: 'no-store' })
      .then(function(resp) {
        if (!resp.ok) throw new Error('访客身份初始化失败 (' + resp.status + ')');
        return resp.json();
      })
      .then(function(data) {
        self.user = data.user || null;
        window.dispatchEvent(new CustomEvent('daowen:identity-changed', { detail: { user: self.user } }));
        return self.user;
      })
      .catch(function(err) {
        console.warn('[DaoWenIdentity]', err.message);
        return null;
      });
    return this._initPromise;
  },

  ready: function() { return this.init(); }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { DaoWenIdentity.init(); });
} else {
  DaoWenIdentity.init();
}
