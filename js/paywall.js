/**
 * 道问付费系统 — 服务端权威余额版
 *
 * 安全原则：
 * 1. 浏览器不保存权威余额，不包含兑换码数据库。
 * 2. 兑换、购买、扣费均由匿名浏览器身份 + Vercel API + 数据库原子事务完成。
 * 3. localStorage 只保存“待确认订单号”，从不作为到账或余额依据。
 */
var Paywall = {
  _balance: 0,
  _balanceLoaded: false,
  _syncPromise: null,
  _consumeQueue: Promise.resolve(),
  _suppressNextDeduct: false,
  PENDING_ORDER_KEY: 'daowen_pending_order_v2',

  _hasIdentity: function() {
    return !!(window.DaoWenIdentity && DaoWenIdentity.user && DaoWenIdentity.user.id);
  },

  _json: async function(resp) {
    var data = {};
    try { data = await resp.json(); } catch (e) {}
    if (!resp.ok) {
      var err = new Error(data.error || data.msg || ('请求失败 (' + resp.status + ')'));
      err.status = resp.status;
      err.data = data;
      throw err;
    }
    return data || {};
  },

  _setBalance: function(value) {
    var n = Number(value);
    this._balance = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    this._balanceLoaded = true;
    this._renderBalance();
    return this._balance;
  },

  _renderBalance: function() {
    var value = this._balanceLoaded ? this._balance : '—';
    var ids = ['pwTopBalance', 'navBalance', 'userBalance'];
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    });
    document.querySelectorAll('[data-daowen-balance]').forEach(function(el) {
      el.textContent = value;
    });
  },

  getBalance: function() {
    return this._balanceLoaded ? this._balance : 0;
  },

  hasBalance: function(amount) {
    amount = Math.max(1, Number(amount || 1));
    return this._balanceLoaded && this._balance >= amount;
  },

  syncBalance: function(force) {
    var self = this;
    if (this._syncPromise && !force) return this._syncPromise;

    var identityReady = window.DaoWenIdentity && DaoWenIdentity.ready ? DaoWenIdentity.ready() : Promise.resolve();
    this._syncPromise = identityReady.then(function() {
      return fetch('/api/balance', { method: 'GET', cache: 'no-store' });
    })
      .then(function(resp) { return self._json(resp); })
      .then(function(data) {
        self._setBalance(data.balance);
        self.refreshWalls();
        return self._balance;
      })
      .catch(function(err) {
        console.warn('[Paywall] 余额同步失败:', err.message);
        if (err.status === 401) self._setBalance(0);
        throw err;
      })
      .finally(function() { self._syncPromise = null; });
    return this._syncPromise;
  },

  /**
   * 兼容旧模块的同步接口。真正扣费由服务端 /api/consume-credit 完成。
   * 对“客户端本地生成的付费内容”，这只能保护余额，不能阻止高级用户改 JS 绕过界面。
   */
  deduct: function(amount, reason) {
    amount = Math.max(1, Math.floor(Number(amount || 1)));
    if (!this.hasBalance(amount)) return false;

    // 某些已迁移到“服务端自行扣费”的旧流程可使用此标记避免双扣。
    if (this._suppressNextDeduct) {
      this._suppressNextDeduct = false;
      this._setBalance(Math.max(0, this._balance - amount));
      setTimeout(function() { Paywall.syncBalance(true).catch(function() {}); }, 500);
      return true;
    }

    this._setBalance(this._balance - amount); // 只用于即时 UI，服务端仍是最终权威
    var requestId = 'web:' + Date.now() + ':' + Math.random().toString(36).slice(2, 12);
    var self = this;
    this._consumeQueue = this._consumeQueue.then(function() {
      var identityReady = window.DaoWenIdentity && DaoWenIdentity.ready ? DaoWenIdentity.ready() : Promise.resolve();
      return identityReady.then(function() { return fetch('/api/consume-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount, reason: reason || 'premium-content', requestId: requestId })
      }); }).then(function(resp) { return self._json(resp); })
        .then(function(data) {
          self._setBalance(data.balance);
          return data;
        })
        .catch(function(err) {
          console.warn('[Paywall] 服务端扣费失败:', err.message);
          self.syncBalance(true).catch(function() {});
          return null;
        });
    });
    return true;
  },

  /** 已废弃：前端不得自行增加余额。 */
  addBalance: function() {
    console.warn('[Paywall] addBalance 已禁用：余额只能由服务端支付/兑换/管理员事务增加。');
    return this.getBalance();
  },

  redeemCode: async function(code) {
    code = String(code || '').trim().toUpperCase();
    if (!code) return { success: false, msg: '请输入兑换码' };
    if (code.length > 80) return { success: false, msg: '兑换码格式不正确' };

    try {
      if (window.DaoWenIdentity && DaoWenIdentity.ready) await DaoWenIdentity.ready();
      var resp = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code })
      });
      var data = await this._json(resp);
      if (data.success) {
        this._setBalance(data.balance);
        return {
          success: true,
          msg: data.msg || ('兑换成功，获得 ' + Number(data.amount || data.credits || 0) + ' 次解读'),
          amount: Number(data.amount || data.credits || 0),
          balance: this.getBalance()
        };
      }
      return { success: false, msg: data.msg || '兑换失败' };
    } catch (err) {
      var msg = err && err.data && (err.data.msg || err.data.error);
      return { success: false, msg: msg || err.message || '兑换服务暂不可用' };
    }
  },

  showCompact: function(containerId) {
    var el = document.getElementById(containerId);
    if (!el || this.hasBalance()) return false;
    var old = document.getElementById('pw_bar');
    if (old) old.remove();
    var bar = document.createElement('div');
    bar.id = 'pw_bar';
    bar.className = 'paywall-bar';
    bar.innerHTML = '🔒 完整解读需要解读次数 &nbsp;|&nbsp; <button onclick="Paywall.openShop()" class="btn-primary" style="width:auto;padding:.4rem 1rem;font-size:.85rem;">🎫 购买次数</button> &nbsp;|&nbsp; <a href="javascript:Paywall.openRedeem()" style="color:var(--gold);font-size:.8rem;">兑换码</a>';
    el.insertBefore(bar, el.firstChild);
    return true;
  },

  blockAll: function(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return false;
    if (this.hasBalance()) { this.deduct(1, 'premium-content'); return true; }
    var old = el.querySelector('.paywall-block');
    if (old) old.remove();
    el.style.position = 'relative';
    var block = document.createElement('div');
    block.className = 'paywall-block';
    block.setAttribute('style', 'position:absolute;inset:0;background:rgba(17,17,15,.96);z-index:99999;display:flex;align-items:center;justify-content:center;text-align:center;padding:1rem;min-height:200px;');
    block.innerHTML = '<div><div style="font-size:3rem;">🔒</div>' +
      '<p style="color:#fff;font-weight:bold;font-size:1.1rem;">付费解读内容</p>' +
      '<p style="color:#aaa;font-size:.85rem;">拥有解读次数后即可解锁</p>' +
      '<button class="btn-primary" onclick="Paywall.openShop()" style="padding:.6rem 2rem;margin-top:.5rem;">🎫 购买解读次数</button>' +
      '<p style="color:#999;font-size:.76rem;margin-top:.4rem;">已有兑换码？<a href="javascript:Paywall.openRedeem()" style="color:var(--gold);">点此兑换</a></p></div>';
    el.appendChild(block);
    return false;
  },

  checkCover: function(containerId) {
    var el = document.getElementById(containerId);
    if (this.hasBalance()) {
      this.deduct(1, 'premium-content');
      if (el) el.querySelectorAll('.analysis-card').forEach(function(c) { c.style.display = ''; });
      return true;
    }
    if (el) el.querySelectorAll('.analysis-card').forEach(function(c) { c.style.display = 'none'; });
    this.showCompact(containerId);
    return false;
  },

  tryAccess: function(containerId, callback) {
    var el = document.getElementById(containerId);
    if (this.hasBalance()) {
      this.deduct(1, 'premium-content');
      if (el) el.querySelectorAll('.analysis-card').forEach(function(c) { c.style.display = ''; });
      if (callback) callback();
      return true;
    }
    if (callback) callback();
    if (el) el.querySelectorAll('.analysis-card').forEach(function(c) { c.style.display = 'none'; });
    this.showCompact(containerId);
    return false;
  },

  refreshWalls: function() {
    this._renderBalance();
    if (this.hasBalance()) {
      document.querySelectorAll('.paywall-bar,.paywall-block').forEach(function(b) { b.remove(); });
      document.querySelectorAll('.analysis-card').forEach(function(c) { c.style.display = ''; });
    }
  },

  _refreshModules: function() {
    // 只刷新付费墙，不主动重新运行 AI/排盘，避免兑换后发生额外扣费。
    this.refreshWalls();
  },

  openShop: function() {
    var o = document.getElementById('paywallShopOverlay');
    if (o) {
      this._closeAllOthers(o);
      o.style.zIndex = '9999';
      o.classList.add('active');
      this._resetShopView();
    }
    this.syncBalance().catch(function() {});
  },

  closeShop: function() {
    var o = document.getElementById('paywallShopOverlay');
    if (o) { o.classList.remove('active'); o.style.zIndex = ''; }
    this._resetShopView();
  },

  openRedeem: function() {
    var o = document.getElementById('paywallRedeemOverlay');
    if (o) { this._closeAllOthers(o); o.style.zIndex = '9999'; o.classList.add('active'); }
    var input = document.getElementById('redeemCodeInput');
    if (input) input.placeholder = '输入兑换码';
    this._renderBalance();
    this.syncBalance().catch(function() {});
  },

  closeRedeem: function() {
    var o = document.getElementById('paywallRedeemOverlay');
    if (o) { o.classList.remove('active'); o.style.zIndex = ''; }
    this.refreshWalls();
  },

  _closeAllOthers: function(except) {
    document.querySelectorAll('.tool-overlay.active').forEach(function(el) {
      if (el !== except) { el.classList.remove('active'); el.style.zIndex = ''; }
    });
  },

  doRedeem: async function() {
    var input = document.getElementById('redeemCodeInput');
    var resultEl = document.getElementById('redeemResult');
    if (!input) return;
    var code = input.value.trim();
    if (!code) { alert('请输入兑换码'); return; }

    var btn = document.querySelector('#paywallRedeemOverlay .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 验证中...'; }
    if (resultEl) resultEl.innerHTML = '';

    var result = await this.redeemCode(code);
    if (result.success) {
      if (resultEl) resultEl.innerHTML = '<p style="color:#28784f;font-weight:bold;">✅ ' + this._escape(result.msg) + '</p><p>当前剩余：<b>' + this.getBalance() + '</b> 次</p>';
      input.value = '';
      this.refreshWalls();
      this._refreshModules();
    } else {
      if (resultEl) resultEl.innerHTML = '<p style="color:#a33;">❌ ' + this._escape(result.msg) + '</p>';
    }
    if (btn) { btn.disabled = false; btn.textContent = '✅ 兑换'; }
  },

  _escape: function(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  _resetShopView: function() {
    var overlay = document.getElementById('paywallShopOverlay');
    if (!overlay) return;
    var grid = overlay.querySelector('.shop-grid');
    if (grid) grid.style.display = '';
    var ids = ['alipayPayPanel', 'alipayLoading'];
    ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.remove(); });
  },

  _postToZPay: function(action, params) {
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.target = '_self';
    form.style.display = 'none';
    Object.keys(params || {}).forEach(function(k) {
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = String(params[k]);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  },

  _checkPayment: async function(silent) {
    var order = localStorage.getItem(this.PENDING_ORDER_KEY);
    if (!order) {
      if (!silent) alert('未找到待确认订单，请重新选择套餐。');
      return false;
    }

    var stEl = document.getElementById('alipayStatus');
    if (stEl) stEl.innerHTML = '<p style="color:var(--gold);margin:0;">⏳ 正在由服务端核对支付状态...</p>';
    try {
      if (window.DaoWenIdentity && DaoWenIdentity.ready) await DaoWenIdentity.ready();
      var resp = await fetch('/api/check-order?order=' + encodeURIComponent(order), { method: 'GET', cache: 'no-store' });
      var data = await this._json(resp);
      if (data.paid) {
        localStorage.removeItem(this.PENDING_ORDER_KEY);
        await this.syncBalance(true);
        this.refreshWalls();
        if (stEl) stEl.innerHTML = '<p style="color:#28784f;font-weight:bold;">✅ 支付已验证，' + Number(data.credits || 0) + ' 次解读已到账。当前余额：' + this.getBalance() + '</p>';
        if (!silent && !stEl) alert('✅ 支付成功，次数已到账。');
        return true;
      }
      if (stEl) stEl.innerHTML = '<p style="color:#a66;">暂未检测到支付成功。</p><button class="btn-primary" onclick="Paywall._checkPayment(false)" style="width:auto;padding:.4rem 1.2rem;">🔄 重新检查</button>';
      else if (!silent) alert('暂未检测到支付成功，请确认付款后重试。');
      return false;
    } catch (err) {
      if (stEl) stEl.innerHTML = '<p style="color:#a33;">❌ ' + this._escape(err.message || '支付验证暂不可用') + '</p><button class="btn-primary" onclick="Paywall._checkPayment(false)" style="width:auto;padding:.4rem 1.2rem;">🔄 重新检查</button>';
      else if (!silent) alert('支付验证暂不可用，请稍后重试。');
      return false;
    }
  },

  _resumePendingPayment: function() {
    var order = localStorage.getItem(this.PENDING_ORDER_KEY);
    if (!order) return;
    setTimeout(function() { Paywall._checkPayment(true).catch(function() {}); }, 900);
  }
};

/** 套餐点击入口：订单绑定当前匿名浏览器身份，支付成功直接入账，不再返回兑换码。 */
async function showBuyContact(tier) {
  var overlay = document.getElementById('paywallShopOverlay');
  var shopContent = overlay && overlay.querySelector('.tool-modal');
  if (!shopContent) return;
  var grid = shopContent.querySelector('.shop-grid');
  if (grid) grid.style.display = 'none';
  var old = document.getElementById('alipayPayPanel'); if (old) old.remove();
  var loading = document.createElement('div');
  loading.id = 'alipayLoading';
  loading.innerHTML = '<p style="text-align:center;padding:1rem;">⏳ 正在创建安全订单...</p>';
  shopContent.appendChild(loading);

  try {
    if (window.DaoWenIdentity && DaoWenIdentity.ready) await DaoWenIdentity.ready();
    var resp = await fetch('/api/alipay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: tier })
    });
    var data = await Paywall._json(resp);
    if (loading) loading.remove();

    localStorage.setItem(Paywall.PENDING_ORDER_KEY, data.outTradeNo);

    var panel = document.createElement('div');
    panel.id = 'alipayPayPanel';
    panel.style.cssText = 'text-align:center;padding:1rem;';
    panel.innerHTML =
      '<p style="color:var(--gold);font-weight:bold;font-size:1.05rem;">订单已创建</p>' +
      '<p style="font-size:.9rem;color:var(--text-secondary);">' + Number(data.count || 0) + ' 次解读 · ¥' + Paywall._escape(data.amount) + '</p>' +
      '<p style="font-size:.8rem;color:var(--text-muted);">支付会绑定当前浏览器；清除网站数据后可能无法恢复，到账以服务端验签结果为准。</p>' +
      '<button id="zpaySubmitBtn" class="btn-primary" style="width:auto;padding:.65rem 2rem;">📱 前往支付宝支付</button>' +
      '<div id="alipayStatus" style="margin-top:.8rem;"></div>' +
      '<button class="btn-secondary" onclick="Paywall._checkPayment(false)" style="width:auto;padding:.45rem 1.2rem;margin-top:.5rem;">🔄 已支付，检查到账</button>' +
      '<button class="btn-secondary" onclick="Paywall._resetShopView()" style="width:auto;padding:.45rem 1.2rem;margin-top:.5rem;margin-left:.4rem;">返回套餐</button>';
    shopContent.appendChild(panel);

    var payBtn = document.getElementById('zpaySubmitBtn');
    if (payBtn) payBtn.onclick = function() {
      Paywall._postToZPay(data.payAction, data.payParams || {});
    };
  } catch (err) {
    if (loading) loading.remove();
    if (grid) grid.style.display = '';
    alert(err.message || '支付创建失败，请稍后重试');
  }
}

window.addEventListener('daowen:identity-changed', function() {
  Paywall.syncBalance(true).then(function() { Paywall._resumePendingPayment(); }).catch(function() {});
});

document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('redeemCodeInput');
  if (input) input.placeholder = '输入兑换码';
  Paywall._renderBalance();
  Paywall.syncBalance(true).then(function() { Paywall._resumePendingPayment(); }).catch(function() {});
});
