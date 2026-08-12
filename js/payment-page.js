/* 独立支付页：不嵌套任何工具弹窗，订单与当前匿名游客身份绑定。 */
var PaymentPage = (function () {
  var PENDING_ORDER_KEY = 'daowen_pending_order_v2';
  var plans = document.getElementById('paymentPlans');
  var panel = document.getElementById('paymentOrderPanel');
  var status = document.getElementById('paymentStatus');

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  async function json(resp) {
    var data = {};
    try { data = await resp.json(); } catch (e) {}
    if (!resp.ok) {
      var err = new Error(data.error || data.msg || ('请求失败 (' + resp.status + ')'));
      err.status = resp.status;
      throw err;
    }
    return data;
  }

  async function syncBalance() {
    try {
      if (window.DaoWenIdentity && DaoWenIdentity.ready) await DaoWenIdentity.ready();
      var data = await json(await fetch('/api/balance', { cache: 'no-store' }));
      var el = document.getElementById('paymentBalance');
      if (el) el.textContent = Math.max(0, Number(data.balance || 0));
    } catch (e) {}
  }

  function postToPay(action, params) {
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    form.target = '_self';
    form.style.display = 'none';
    Object.keys(params || {}).forEach(function (key) {
      var input = document.createElement('input');
      input.type = 'hidden'; input.name = key; input.value = String(params[key]);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }

  async function createOrder(tier) {
    if (plans) plans.classList.add('is-busy');
    if (panel) { panel.hidden = false; panel.innerHTML = '<p>正在创建安全订单…</p>'; }
    if (status) status.innerHTML = '';
    try {
      if (window.DaoWenIdentity && DaoWenIdentity.ready) await DaoWenIdentity.ready();
      var data = await json(await fetch('/api/alipay', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier: tier })
      }));
      localStorage.setItem(PENDING_ORDER_KEY, data.outTradeNo);
      panel.innerHTML =
        '<h2>订单已创建</h2>' +
        '<p>' + Number(data.count || 0) + ' 次解读 · ¥' + escapeHtml(data.amount) + '</p>' +
        '<p class="dw-order-note">支付结果以服务端验签为准；请勿重复点击创建订单。</p>' +
        '<div class="dw-order-actions"><button class="btn-primary" id="goAlipayBtn">前往支付宝支付</button>' +
        '<button class="btn-secondary" onclick="PaymentPage.checkPayment(false)">已支付，检查到账</button>' +
        '<button class="btn-secondary" onclick="PaymentPage.resetPlans()">重新选择</button></div>';
      document.getElementById('goAlipayBtn').onclick = function () { postToPay(data.payAction, data.payParams || {}); };
    } catch (err) {
      panel.innerHTML = '<h2>订单创建失败</h2><p>' + escapeHtml(err.message || '支付创建失败，请稍后重试') + '</p><button class="btn-secondary" onclick="PaymentPage.resetPlans()">返回重试</button>';
    } finally {
      if (plans) plans.classList.remove('is-busy');
    }
  }

  async function checkPayment(silent) {
    var order = localStorage.getItem(PENDING_ORDER_KEY);
    if (!order) {
      if (!silent && status) status.innerHTML = '<p class="error">未找到待确认订单，请重新选择套餐。</p>';
      return false;
    }
    if (status) status.innerHTML = '<p>正在由服务端核对支付状态…</p>';
    try {
      if (window.DaoWenIdentity && DaoWenIdentity.ready) await DaoWenIdentity.ready();
      var data = await json(await fetch('/api/check-order?order=' + encodeURIComponent(order), { cache: 'no-store' }));
      if (data.paid) {
        localStorage.removeItem(PENDING_ORDER_KEY);
        if (status) status.innerHTML = '<p class="success">支付成功，' + Number(data.credits || 0) + ' 次解读已到账。</p><button class="btn-primary" onclick="PaymentPage.returnToTool()">返回原功能</button>';
        await syncBalance();
        return true;
      }
      if (status) status.innerHTML = '<p>暂未检测到支付成功，请确认付款后重试。</p><button class="btn-secondary" onclick="PaymentPage.checkPayment(false)">重新检查</button>';
      return false;
    } catch (err) {
      if (status) status.innerHTML = '<p class="error">' + escapeHtml(err.message || '支付验证暂不可用') + '</p><button class="btn-secondary" onclick="PaymentPage.checkPayment(false)">重新检查</button>';
      return false;
    }
  }

  function resetPlans() {
    if (panel) { panel.hidden = true; panel.innerHTML = ''; }
    if (status) status.innerHTML = '';
  }

  function returnToTool() { window.location.href = 'index.html?restore=1'; }

  document.addEventListener('DOMContentLoaded', function () {
    syncBalance();
    if (/[?&]returned=1(?:&|$)/.test(location.search) || localStorage.getItem(PENDING_ORDER_KEY)) checkPayment(true);
  });

  return { createOrder: createOrder, checkPayment: checkPayment, resetPlans: resetPlans, returnToTool: returnToTool };
})();
