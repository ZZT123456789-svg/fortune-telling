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
    'DAOWEN-G9S6':20,'DAOWEN-H4T1':20,'DAOWEN-J8U5':20,'DAOWEN-K3V9':20,'DAOWEN-L7W4':20,
    // 在线购买生成的码
    'DW-A1K3':3,'DW-B2M9':3,'DW-C5N8':3,'DW-D1P6':3,'DW-E4Q2':3,
    'DW-F8R1':3,'DW-G3S5':3,'DW-H7T9':3,'DW-J2U4':3,'DW-K6V8':3,
    'DW-R3B9':10,'DW-S7C4':10,'DW-T2D8':10,'DW-U6E1':10,'DW-V1F5':10,
    'DW-B5M4':20,'DW-C8N9':20,'DW-D2P3':20,'DW-E6Q7':20,'DW-F1R2':20
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

  /** 强力遮盖：无余额完全黑掉内容，只显示购买按钮 */
  blockAll: function(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (this.hasBalance()) { this.deduct(); return true; }

    // 先清掉旧遮盖
    var old = el.querySelector('.paywall-block');
    if (old) old.remove();

    var block = document.createElement('div');
    block.className = 'paywall-block';
    block.innerHTML =
      '<div style="text-align:center;padding:0.6rem 2rem 2rem 2rem;">' +
        '<div style="font-size:3rem;">🔒</div>' +
        '<p style="color:#fff;font-weight:bold;font-size:1.1rem;margin:0.3rem 0;">付费解读内容</p>' +
        '<p style="color:#aaa;font-size:0.85rem;">购买次数后解锁完整内容</p>' +
        '<button class="btn-primary" onclick="Paywall.openShop()" style="width:auto;padding:0.6rem 2rem;margin-top:0.5rem;font-size:1rem;">🎫 购买解读次数</button>' +
        '<p style="color:#999;font-size:0.76rem;margin-top:0.4rem;">已有兑换码？<a href="javascript:Paywall.openRedeem()" style="color:var(--gold);">点此兑换</a></p>' +
      '</div>';
    el.style.position = 'relative';
    el.style.minHeight = '180px';
    el.appendChild(block);
    return false;
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
    if (this.hasBalance()) {
      document.querySelectorAll('.paywall-bar').forEach(function(b) { b.remove(); });
      document.querySelectorAll('.paywall-block').forEach(function(b) { b.remove(); });
      document.querySelectorAll('.analysis-card').forEach(function(c) { c.style.display = ''; });
    }
  },

  /** 兑换后刷新已打开模块 */
  _refreshModules: function() {
    // 刷新所有已缓存的结果
    if (typeof BaziModule !== 'undefined' && BaziModule._lastResult) {
      BaziModule._renderSingle(BaziModule._lastResult);
    }
    if (typeof ZiweiModule !== 'undefined' && ZiweiModule._lastChart && ZiweiModule._renderSVG) {
      ZiweiModule._renderSVG(ZiweiModule._lastChart, ZiweiModule._lastSiHua, ZiweiModule._lastY, ZiweiModule._lastM, ZiweiModule._lastD, ZiweiModule._lastH, ZiweiModule._lastGender, ZiweiModule._lastYGZ, ZiweiModule._lastJu);
    }
    this.refreshWalls();
    // 重新检查所有模块的付费墙
    document.querySelectorAll('.paywall-block').forEach(function(b){b.remove();});
    document.querySelectorAll('.paywall-bar').forEach(function(b){b.remove();});
  },

  openShop: function() {
    var o = document.getElementById('paywallShopOverlay');
    if (o) { this._closeAllOthers(o); o.style.zIndex = '9999'; o.classList.add('active'); }
  },
  closeShop: function() {
    var o = document.getElementById('paywallShopOverlay');
    if (o) { o.classList.remove('active'); o.style.zIndex = ''; }
  },
  openRedeem: function() {
    var o = document.getElementById('paywallRedeemOverlay');
    if (o) { this._closeAllOthers(o); o.style.zIndex = '9999'; o.classList.add('active'); }
    var b = document.getElementById('pwTopBalance'); if (b) b.textContent = this.getBalance();
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

  doRedeem: function() {
    var input = document.getElementById('redeemCodeInput'); if (!input) return;
    var code = input.value.trim(); if (!code) { alert('请输入兑换码'); return; }
    var result = this.redeemCode(code);
    if (result.success) {
      document.getElementById('redeemResult').innerHTML = '<p style="color:#3cb371;font-weight:bold;">✅ ' + result.msg + '</p><p style="color:var(--text-secondary);">当前剩余：<b>' + this.getBalance() + '</b> 次</p>';
      input.value = '';
      this.refreshWalls();
      this._refreshModules();
    } else {
      document.getElementById('redeemResult').innerHTML = '<p style="color:#c44;">❌ ' + result.msg + '</p>';
    }
  }
};

// 手动检查支付（PC端扫码后点击）
Paywall._checkPayment = function() {
  var code = localStorage.getItem('daowen_pending_code');
  var order = localStorage.getItem('daowen_pending_order');
  if (!code) { alert('未找到待兑换码，请先选择套餐支付。'); return; }

  var stEl = document.getElementById('alipayStatus');
  if (stEl) stEl.innerHTML = '<p style="color:var(--gold);margin:0;">⏳ 正在验证支付状态...</p>';

  // 如果有订单号，先查ZPay验证
  if (order) {
    var self = this;
    fetch('/api/check-order?order=' + order)
      .then(function(r){return r.json();})
      .then(function(d){
        if (d.paid) {
          self._doAutoRedeem(code);
        } else {
          if (stEl) stEl.innerHTML = '<p style="color:#e80;margin:0;">⏳ 暂未检测到支付，请确认已付款后重试</p><button class="btn-primary" onclick="Paywall._checkPayment()" style="width:auto;padding:0.4rem 1.5rem;margin-top:0.4rem;font-size:0.9rem;">🔄 重新检查</button>';
          else alert('暂未检测到支付记录。请确认已付款后重试。');
        }
      })
      .catch(function(){
        if (stEl) stEl.innerHTML = '<p style="color:#e80;margin:0;">⏳ 支付验证暂不可用，请稍后重试</p><button class="btn-primary" onclick="Paywall._checkPayment()" style="width:auto;padding:0.4rem 1.5rem;margin-top:0.4rem;font-size:0.9rem;">🔄 重新验证</button>';
      });
  } else {
    this._doAutoRedeem(code);
  }
};

Paywall._doAutoRedeem = function(code) {
  var result = this.redeemCode(code.trim());
  var stEl = document.getElementById('alipayStatus');
  if (result.success) {
    localStorage.removeItem('daowen_pending_code');
    localStorage.removeItem('daowen_pending_order');
    this.refreshWalls();
    this._refreshModules();
    if (typeof BaziModule !== 'undefined' && BaziModule._lastResult) BaziModule._renderSingle(BaziModule._lastResult);
    if (stEl) stEl.innerHTML = '<p style="color:#3cb371;font-weight:bold;font-size:1rem;">✅ 支付已验证！' + result.amount + '次解读已到账，内容已解锁</p>';
    else alert('✅ 支付成功！' + result.amount + ' 次解读已到账。');
  } else {
    if (result.msg.indexOf('已被使用') !== -1) {
      if (stEl) stEl.innerHTML = '<p style="color:#3cb371;font-weight:bold;">✅ 次数已到账！</p>';
      else alert('✅ 次数已到账！');
    } else {
      if (stEl) stEl.innerHTML = '<p style="color:#c44;">❌ '+result.msg+'</p>';
      else alert('❌ ' + result.msg);
    }
  }
};

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

    // 存储待验证的订单信息
    localStorage.setItem('daowen_pending_code', data.code);
    localStorage.setItem('daowen_pending_order', data.outTradeNo);

    var qrImgUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(data.payUrl);
    var payBtn = isMobile
      ? '<a href="' + data.payUrl + '" class="btn-primary" style="display:inline-block;width:auto;padding:0.6rem 2rem;text-decoration:none;font-size:1.1rem;">📱 点击支付 ¥' + data.amount + '</a>'
      : '<img src="' + qrImgUrl + '" style="width:220px;height:220px;border-radius:8px;border:2px solid var(--border-subtle);">';

    qrDiv.innerHTML =
      '<p style="color:var(--gold);font-weight:bold;font-size:1.1rem;">' + (isMobile ? '📱 点击支付 ¥' + data.amount : '📱 扫码支付 ¥' + data.amount) + '</p>' +
      payBtn +
      '<p style="font-size:0.9rem;color:var(--text-secondary);margin:0.3rem 0;">' + data.count + '次解读 · ¥' + data.amount + '</p>' +
      '<p style="font-size:0.82rem;color:var(--text-muted);">支付完成后<b>无需任何操作</b>，次数自动到账</p>' +
      '<div id="alipayStatus" style="margin-top:0.6rem;padding:0.5rem;background:rgba(201,169,110,0.08);border-radius:8px;text-align:center;">' +
        '<p style="font-size:0.85rem;color:var(--gold);margin:0;">⏳ 等待支付完成...</p>' +
        '<button class="btn-primary" onclick="Paywall._checkPayment()" style="width:auto;padding:0.4rem 1.5rem;margin-top:0.4rem;font-size:0.9rem;">✅ 我已完成支付</button>' +
      '</div>';

    if (isMobile) setTimeout(function() { window.location.href = data.payUrl; }, 800);

    qrDiv.innerHTML += '<button class="btn-secondary" onclick="var e=document.getElementById(\'alipayQR\');if(e)e.remove();document.querySelector(\'#paywallShopOverlay .shop-grid\').style.display=\'flex\';" style="margin-top:0.3rem;">🔙 返回</button>';
    shopContent.appendChild(qrDiv);
  })
  .catch(function(err) { if (loadEl) loadEl.remove(); alert('支付服务暂不可用，请稍后重试'); });
}

// ===== 支付返回自动兑换 =====
(function() {
  var code = localStorage.getItem('daowen_pending_code');
  if (code) {
    // 页面加载时检测到待兑换码，自动尝试兑换
    setTimeout(function() {
      var result = Paywall.redeemCode(code.trim());
      if (result.success) {
        localStorage.removeItem('daowen_pending_code');
        localStorage.removeItem('daowen_pending_order');
        Paywall.refreshWalls();
        Paywall._refreshModules();
        if (typeof BaziModule !== 'undefined' && BaziModule._lastResult) BaziModule._renderSingle(BaziModule._lastResult);
        alert('✅ 支付成功！' + result.amount + ' 次解读已到账。');
      }
      // 如果兑换失败（码已被使用），说明之前已兑换过，删除残留
      if (result.msg && result.msg.indexOf('已被使用') !== -1) {
        localStorage.removeItem('daowen_pending_code');
        localStorage.removeItem('daowen_pending_order');
      }
    }, 1000);
  }
})();
