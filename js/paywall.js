/**
 * 道问付费墙 — 兑换码 + 次数管理
 */
var Paywall = {
  // 预生成兑换码库（本地校验）
  _codeDB: {
    // 3次卡
    'DAOWEN-A3K7':3, 'DAOWEN-B2M9':3, 'DAOWEN-C5N8':3, 'DAOWEN-D1P6':3, 'DAOWEN-E4Q2':3,
    'DAOWEN-F8R1':3, 'DAOWEN-G3S5':3, 'DAOWEN-H7T9':3, 'DAOWEN-J2U4':3, 'DAOWEN-K6V8':3,
    'DAOWEN-L9W3':3, 'DAOWEN-M4X7':3, 'DAOWEN-N1Y5':3, 'DAOWEN-P5Z2':3, 'DAOWEN-Q8A6':3,
    // 10次卡
    'DAOWEN-R3B9':10, 'DAOWEN-S7C4':10, 'DAOWEN-T2D8':10, 'DAOWEN-U6E1':10, 'DAOWEN-V1F5':10,
    'DAOWEN-W9G3':10, 'DAOWEN-X4H7':10, 'DAOWEN-Y8J2':10, 'DAOWEN-Z3K6':10, 'DAOWEN-A7L1':10,
    // 20次卡
    'DAOWEN-B5M4':20, 'DAOWEN-C8N9':20, 'DAOWEN-D2P3':20, 'DAOWEN-E6Q7':20, 'DAOWEN-F1R2':20,
    'DAOWEN-G9S6':20, 'DAOWEN-H4T1':20, 'DAOWEN-J8U5':20, 'DAOWEN-K3V9':20, 'DAOWEN-L7W4':20
  },

  STORAGE_KEY: 'daowen_balance',
  USED_CODES_KEY: 'daowen_used_codes',
  TIER_PRICES: {3:'¥4.9', 10:'¥9.9', 20:'¥19.9'},

  /** 获取剩余次数 */
  getBalance: function() {
    var bal = localStorage.getItem(this.STORAGE_KEY);
    return bal ? parseInt(bal) : 0;
  },

  /** 增加次数 */
  addBalance: function(amount) {
    var cur = this.getBalance();
    localStorage.setItem(this.STORAGE_KEY, cur + amount);
    return cur + amount;
  },

  /** 扣减1次 */
  deduct: function() {
    var cur = this.getBalance();
    if (cur <= 0) return false;
    localStorage.setItem(this.STORAGE_KEY, cur - 1);
    return true;
  },

  /** 检查是否有剩余次数 */
  hasBalance: function() {
    return this.getBalance() > 0;
  },

  /** 兑换码验证 */
  redeemCode: function(code) {
    code = code.trim().toUpperCase();
    // 检查是否已使用
    var used = JSON.parse(localStorage.getItem(this.USED_CODES_KEY) || '[]');
    if (used.indexOf(code) !== -1) {
      return {success:false, msg:'此兑换码已被使用'};
    }
    // 检查是否有效
    var amount = this._codeDB[code];
    if (!amount) {
      return {success:false, msg:'无效的兑换码，请检查是否输入正确'};
    }
    // 标记已使用
    used.push(code);
    localStorage.setItem(this.USED_CODES_KEY, JSON.stringify(used));
    // 增加次数
    this.addBalance(amount);
    return {success:true, msg:'兑换成功！获得 ' + amount + ' 次解读机会', amount:amount};
  },

  /** 显示付费墙 */
  showWall: function(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (this.hasBalance()) return false;

    // 创建遮盖层
    var wall = document.createElement('div');
    wall.className = 'paywall-cover';
    wall.id = 'pw_' + containerId;
    wall.innerHTML =
      '<div class="paywall-inner">' +
        '<div class="paywall-icon">🔒</div>' +
        '<h3>付费解读内容</h3>' +
        '<p>剩余次数：<b id="pwBalance">' + this.getBalance() + '</b> 次</p>' +
        '<button class="btn-primary" onclick="Paywall.openShop()" style="width:auto;padding:0.5rem 1.5rem;">🎫 购买次数</button>' +
        '<p style="font-size:0.76rem;color:var(--text-muted);margin-top:0.5rem;">已有兑换码？<a href="javascript:Paywall.openRedeem()" style="color:var(--gold);">点此兑换</a></p>' +
      '</div>';
    el.style.position = 'relative';
    el.appendChild(wall);
    return true;
  },

  /** 刷新付费墙状态 */
  refreshWalls: function() {
    var walls = document.querySelectorAll('.paywall-cover');
    // Remove all walls if balance > 0
    if (this.hasBalance()) {
      walls.forEach(function(w) { w.remove(); });
    }
    // Update balance display
    var balEls = document.querySelectorAll('#pwBalance');
    balEls.forEach(function(el) { el.textContent = Paywall.getBalance(); });
  },

  /** 打开购买弹窗 */
  openShop: function() {
    var overlay = document.getElementById('paywallShopOverlay');
    if (overlay) overlay.classList.add('active');
  },

  closeShop: function() {
    var overlay = document.getElementById('paywallShopOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  /** 打开兑换弹窗 */
  openRedeem: function() {
    var overlay = document.getElementById('paywallRedeemOverlay');
    if (overlay) overlay.classList.add('active');
  },

  closeRedeem: function() {
    var overlay = document.getElementById('paywallRedeemOverlay');
    if (overlay) overlay.classList.remove('active');
    // 刷新付费墙
    this.refreshWalls();
  },

  /** 执行兑换 */
  doRedeem: function() {
    var input = document.getElementById('redeemCodeInput');
    if (!input) return;
    var code = input.value.trim();
    if (!code) { alert('请输入兑换码'); return; }

    var result = this.redeemCode(code);
    if (result.success) {
      document.getElementById('redeemResult').innerHTML =
        '<p style="color:#3cb371;font-weight:bold;">✅ ' + result.msg + '</p>' +
        '<p style="color:var(--text-secondary);">当前剩余：<b>' + this.getBalance() + '</b> 次</p>';
      input.value = '';
      this.refreshWalls();
    } else {
      document.getElementById('redeemResult').innerHTML =
        '<p style="color:#c44;">❌ ' + result.msg + '</p>';
    }
  },

  /** 渲染后检查：有余额扣1次，无余额遮盖内容 */
  checkCover: function(containerId) {
    if (this.hasBalance()) {
      this.deduct();
      this.showBalanceBar(containerId);
      return true;
    } else {
      this.showWall(containerId);
      return false;
    }
  },

  /** 尝试访问解读内容：有余额扣1次返回true并执行回调，无余额遮盖并返回false */
  tryAccess: function(containerId, callback) {
    if (this.hasBalance()) {
      this.deduct();
      this.refreshWalls();
      if (callback) callback();
      return true;
    } else {
      if (callback) callback();
      this.showWall(containerId);
      return false;
    }
  },

  /** 给结果容器加余额提示条 */
  showBalanceBar: function(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var bar = document.createElement('div');
    bar.className = 'balance-bar';
    bar.innerHTML = '🎫 剩余解读次数：<b>' + this.getBalance() + '</b> 次 &nbsp;|&nbsp; <a href="javascript:Paywall.openShop()" style="color:var(--gold);">购买</a>';
    el.insertBefore(bar, el.firstChild);
  }
};

// 购买流程 — 调用支付宝API生成二维码
function showBuyContact(tier) {
  var shopModal = document.getElementById('paywallShopOverlay');
  var shopContent = shopModal.querySelector('.tool-modal');

  // 显示加载
  shopContent.querySelector('.shop-grid').style.display = 'none';
  var existingQR = document.getElementById('alipayQR');
  if (existingQR) existingQR.remove();

  var loadingEl = document.createElement('div');
  loadingEl.id = 'alipayLoading';
  loadingEl.innerHTML = '<p style="text-align:center;padding:1rem;">⏳ 正在生成支付二维码...</p>';
  shopContent.appendChild(loadingEl);

  // 调用API
  fetch('/api/alipay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: tier })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (loadingEl) loadingEl.remove();
    if (data.error) { alert(data.error); return; }

    var qrDiv = document.createElement('div');
    qrDiv.id = 'alipayQR';
    qrDiv.style.textAlign = 'center';
    qrDiv.style.padding = '1rem';
    var qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(data.payUrl);
    qrDiv.innerHTML =
      '<p style="color:var(--gold);font-weight:bold;margin-bottom:0.5rem;">📱 支付宝扫码支付 ¥' + data.amount + '</p>' +
      '<img src="' + qrImgUrl + '" alt="支付宝二维码" style="width:200px;height:200px;border-radius:8px;border:2px solid var(--border-subtle);">' +
      '<p style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-secondary);">' + (tier==3?'3次':tier==10?'10次':'20次') + '解读 · ¥' + data.amount + '</p>' +
      '<a href="' + data.payUrl + '" target="_blank" class="btn-primary" style="display:inline-block;width:auto;padding:0.5rem 1.5rem;text-decoration:none;margin-top:0.3rem;">📱 打开支付宝支付</a>' +
      '<p style="font-size:0.74rem;color:var(--text-muted);margin-top:0.5rem;">支付后截图联系客服获取兑换码</p>' +
      '<p style="font-size:0.74rem;color:var(--text-muted);">💬 微信：ZZT-2004-12</p>' +
      '<button class="btn-secondary" onclick="var e=document.getElementById(\'alipayQR\');if(e)e.remove();document.querySelector(\'#paywallShopOverlay .shop-grid\').style.display=\'flex\';" style="margin-top:0.3rem;">🔙 返回</button>';
    shopContent.appendChild(qrDiv);
  })
  .catch(function(err) {
    if (loadingEl) loadingEl.remove();
    alert('支付服务暂不可用，请联系客服：微信 ZZT-2004-12');
  });
}
