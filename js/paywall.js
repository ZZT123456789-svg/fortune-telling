/**
 * 道问付费墙 — 兑换码 + 紧凑付费提示
 */
var Paywall = {
  _codeDB: {
    'DAOWEN-A3K7':3,'DAOWEN-B2M9':3,'DAOWEN-C5N8':3,'DAOWEN-D1P6':3,'DAOWEN-E4Q2':3,
    'DAOWEN-F8R1':3,'DAOWEN-G3S5':3,'DAOWEN-H7T9':3,'DAOWEN-J2U4':3,'DAOWEN-K6V8':3,
    'DAOWEN-L9W3':3,'DAOWEN-M4X7':3,'DAOWEN-N1Y5':3,'DAOWEN-P5Z2':3,'DAOWEN-Q8A6':3,
    'DAOWEN-R3B9':10,'DAOWEN-S7C4':10,'DAOWEN-T2D8':10,'DAOWEN-U6E1':10,'DAOWEN-V1F5':10,
    'DAOWEN-W9G3':10,'DAOWEN-X4H7':10,'DAOWEN-Y8J2':10,'DAOWEN-Z3K6':10,'DAOWEN-A7L1':10,
    'DAOWEN-B5M4':20,'DAOWEN-C8N9':20,'DAOWEN-D2P3':20,'DAOWEN-E6Q7':20,'DAOWEN-F1R2':20,
    'DAOWEN-G9S6':20,'DAOWEN-H4T1':20,'DAOWEN-J8U5':20,'DAOWEN-K3V9':20,'DAOWEN-L7W4':20
  },
  STORAGE_KEY: 'daowen_balance',
  USED_CODES_KEY: 'daowen_used_codes',

  getBalance: function() { var b = localStorage.getItem(this.STORAGE_KEY); return b ? parseInt(b) : 0; },
  addBalance: function(a) { var c = this.getBalance(); localStorage.setItem(this.STORAGE_KEY, c + a); return c + a; },
  deduct: function() { var c = this.getBalance(); if (c <= 0) return false; localStorage.setItem(this.STORAGE_KEY, c - 1); return true; },
  hasBalance: function() { return this.getBalance() > 0; },

  redeemCode: function(code) {
    code = code.trim().toUpperCase();
    var used = JSON.parse(localStorage.getItem(this.USED_CODES_KEY) || '[]');
    if (used.indexOf(code) !== -1) return {success:false, msg:'此兑换码已被使用'};
    var amount = this._codeDB[code];
    if (!amount) return {success:false, msg:'无效的兑换码'};
    used.push(code);
    localStorage.setItem(this.USED_CODES_KEY, JSON.stringify(used));
    this.addBalance(amount);
    return {success:true, msg:'兑换成功！获得 ' + amount + ' 次解读', amount:amount};
  },

  /** 紧凑付费条（不遮盖内容，放在结果顶部） */
  showCompact: function(containerId) {
    var el = document.getElementById(containerId);
    if (!el || this.hasBalance()) return false;
    var old = document.getElementById('pw_bar');
    if (old) old.remove();
    var bar = document.createElement('div');
    bar.id = 'pw_bar';
    bar.className = 'paywall-bar';
    bar.innerHTML = '🔒 完整解读需购买次数 &nbsp;|&nbsp; <button onclick="Paywall.openShop()" style="background:var(--gold);color:#fff;border:none;padding:0.4rem 1rem;border-radius:6px;cursor:pointer;font-weight:bold;font-size:0.85rem;">🎫 购买次数</button> &nbsp;|&nbsp; <a href="javascript:Paywall.openRedeem()" style="color:var(--gold);font-size:0.8rem;">兑换码</a>';
    el.insertBefore(bar, el.firstChild);
    return true;
  },

  /** 渲染后检查：有余额扣1+展开，无余额隐藏分析卡片+显示紧凑条 */
  checkCover: function(containerId) {
    var el = document.getElementById(containerId);
    if (this.hasBalance()) {
      this.deduct();
      // 展开所有分析卡片
      if (el) { var cards = el.querySelectorAll('.analysis-card'); cards.forEach(function(c) { c.style.display = ''; }); }
      return true;
    } else {
      // 隐藏分析卡片，只显示免费部分
      if (el) { var cards = el.querySelectorAll('.analysis-card'); cards.forEach(function(c) { c.style.display = 'none'; }); }
      this.showCompact(containerId);
      return false;
    }
  },

  tryAccess: function(containerId, callback) {
    var el = document.getElementById(containerId);
    if (this.hasBalance()) {
      this.deduct();
      if (el) { var cards = el.querySelectorAll('.analysis-card'); cards.forEach(function(c) { c.style.display = ''; }); }
      if (callback) callback();
      return true;
    } else {
      if (callback) callback();
      if (el) { var cards = el.querySelectorAll('.analysis-card'); cards.forEach(function(c) { c.style.display = 'none'; }); }
      this.showCompact(containerId);
      return false;
    }
  },

  refreshWalls: function() {
    var bars = document.querySelectorAll('.paywall-bar');
    if (this.hasBalance()) {
      bars.forEach(function(b) { b.remove(); });
      // 展开所有被隐藏的分析卡片
      document.querySelectorAll('.analysis-card').forEach(function(c) { c.style.display = ''; });
    }
  },

  openShop: function() { var o = document.getElementById('paywallShopOverlay'); if (o) o.classList.add('active'); },
  closeShop: function() { var o = document.getElementById('paywallShopOverlay'); if (o) o.classList.remove('active'); },
  openRedeem: function() {
    var o = document.getElementById('paywallRedeemOverlay'); if (o) o.classList.add('active');
    var b = document.getElementById('pwTopBalance'); if (b) b.textContent = this.getBalance();
  },
  closeRedeem: function() {
    var o = document.getElementById('paywallRedeemOverlay'); if (o) o.classList.remove('active');
    this.refreshWalls();
  },

  doRedeem: function() {
    var input = document.getElementById('redeemCodeInput'); if (!input) return;
    var code = input.value.trim(); if (!code) { alert('请输入兑换码'); return; }
    var result = this.redeemCode(code);
    if (result.success) {
      document.getElementById('redeemResult').innerHTML = '<p style="color:#3cb371;font-weight:bold;">✅ ' + result.msg + '</p><p style="color:var(--text-secondary);">当前剩余：<b>' + this.getBalance() + '</b> 次</p>';
      input.value = '';
      this.refreshWalls();
    } else {
      document.getElementById('redeemResult').innerHTML = '<p style="color:#c44;">❌ ' + result.msg + '</p>';
    }
  }
};

// ===== 支付返回自动弹兑换码 =====
(function() {
  var q = window.location.search;
  if (q.indexOf('paid=1') !== -1) {
    var m = q.match(/code=([^&]+)/);
    if (m) setTimeout(function() {
      var o = document.getElementById('paywallRedeemOverlay'); if (o) o.classList.add('active');
      var inp = document.getElementById('redeemCodeInput'); if (inp) inp.value = m[1];
      var re = document.getElementById('redeemResult'); if (re) re.innerHTML = '<p style="color:#3cb371;font-weight:bold;">✅ 支付成功！兑换码已自动填入</p><p style="color:var(--text-secondary);">点击"兑换"激活次数</p>';
      window.history.replaceState({}, '', '/');
    }, 800);
  }
})();

// ===== 购买套餐 → 调用API → 跳转/二维码 =====
function showBuyContact(tier) {
  var prices = {3:'¥4.9',10:'¥9.9',20:'¥19.9'};
  var counts = {3:3,10:10,20:20};
  var shopContent = document.querySelector('#paywallShopOverlay .tool-modal');
  shopContent.querySelector('.shop-grid').style.display = 'none';
  var old = document.getElementById('alipayQR'); if (old) old.remove();

  var loadEl = document.createElement('div'); loadEl.id = 'alipayLoading';
  loadEl.innerHTML = '<p style="text-align:center;padding:1rem;">⏳ 正在生成支付...</p>';
  shopContent.appendChild(loadEl);

  fetch('/api/alipay', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tier:tier}) })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (loadEl) loadEl.remove();
    if (data.error) { alert(data.error); return; }

    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    var qrDiv = document.createElement('div'); qrDiv.id = 'alipayQR';
    qrDiv.style.cssText = 'text-align:center;padding:1rem;';

    if (isMobile) {
      // 手机端：自动跳转支付宝
      qrDiv.innerHTML = '<p style="color:var(--gold);font-weight:bold;">📱 支付 ¥' + data.amount + '（' + data.count + '次解读）</p>' +
        '<a href="' + data.payUrl + '" class="btn-primary" style="display:inline-block;width:auto;padding:0.6rem 2rem;text-decoration:none;font-size:1.1rem;">📱 点击支付 ¥' + data.amount + '</a>' +
        '<p style="font-size:0.74rem;color:var(--text-muted);margin-top:0.3rem;">支付后截图兑换码，输入即可激活</p>' +
        '<div style="margin-top:0.6rem;padding:0.5rem;background:rgba(60,179,113,0.08);border:1px dashed #3cb371;border-radius:8px;">' +
          '<p style="font-size:0.76rem;color:#3cb371;margin:0;">🎫 兑换码（长按复制）</p>' +
          '<p style="font-size:1.1rem;font-weight:bold;color:var(--gold);margin:0.2rem 0;">' + data.code + '</p>' +
          '<button class="copy-btn" onclick="copyContact(\'' + data.code + '\',this)" style="font-size:0.85rem;">📋 复制</button></div>';
      setTimeout(function() { window.location.href = data.payUrl; }, 600);
    } else {
      // PC端：显示二维码
      var qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(data.payUrl);
      qrDiv.innerHTML = '<p style="color:var(--gold);font-weight:bold;">📱 支付宝扫码支付 ¥' + data.amount + '</p>' +
        '<img src="' + qrImgUrl + '" style="width:220px;height:220px;border-radius:8px;border:2px solid var(--border-subtle);">' +
        '<p style="font-size:0.9rem;color:var(--text-secondary);">' + data.count + '次解读 · ¥' + data.amount + '</p>' +
        '<div style="margin-top:0.6rem;padding:0.5rem;background:rgba(60,179,113,0.08);border:1px dashed #3cb371;border-radius:8px;">' +
          '<p style="font-size:0.76rem;color:#3cb371;margin:0;">🎫 兑换码（支付前先复制）</p>' +
          '<p style="font-size:1.1rem;font-weight:bold;color:var(--gold);margin:0.2rem 0;">' + data.code + '</p>' +
          '<button class="copy-btn" onclick="copyContact(\'' + data.code + '\',this)" style="font-size:0.85rem;">📋 复制</button></div>';
    }
    qrDiv.innerHTML += '<button class="btn-secondary" onclick="var e=document.getElementById(\'alipayQR\');if(e)e.remove();document.querySelector(\'#paywallShopOverlay .shop-grid\').style.display=\'flex\';" style="margin-top:0.5rem;">🔙 返回</button>';
    shopContent.appendChild(qrDiv);
  })
  .catch(function(err) { if (loadEl) loadEl.remove(); alert('支付服务暂不可用，请稍后重试'); });
}
