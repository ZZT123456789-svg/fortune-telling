/**
 * AI命理助手 — 安全版浮窗对话
 * 每次请求由 /api/ai-chat 按当前匿名浏览器身份在服务端扣 2 次。
 */
var AIChat = {
  messages: [],
  open: false,
  contextReady: false,

  openWithContext: function(resultContainerId) {
    this.messages = [];
    this.contextReady = false;
    var el = document.getElementById(resultContainerId);
    if (el) {
      var text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 2000);
      if (text.length > 100) {
        this.messages.push({ role: 'user', content: '以下是我的命盘/占卜结果，请只依据这些数据回答后续问题：\n\n' + text });
        this.contextReady = true;
      }
    }
    this._show();
  },

  toggle: function() {
    if (this.contextReady || this.messages.length > 0) this._show();
    else alert('请先完成排盘或占卜，再从结果区点击“问 AI”。');
  },

  _show: function() {
    this.open = true;
    var win = document.getElementById('aiChatWindow');
    var fab = document.getElementById('aiFab');
    if (win) win.classList.add('open');
    if (fab) fab.style.display = 'none';
    if (this.messages.length === 0) {
      this._addMsg('assistant', '你好！我是道问 AI 助手。请先完成排盘或占卜，再从结果区带着数据来提问。每次对话会由服务端扣除 2 次解读额度。');
    }
    var input = document.getElementById('aiChatInput');
    if (input) input.focus();
  },

  close: function() {
    this.open = false;
    var win = document.getElementById('aiChatWindow');
    var fab = document.getElementById('aiFab');
    if (win) win.classList.remove('open');
    if (fab) fab.style.display = 'flex';
  },

  send: async function() {
    var input = document.getElementById('aiChatInput');
    if (!input) return;
    var question = input.value.trim();
    if (!question) return;

    if (window.DaoWenIdentity && DaoWenIdentity.ready) await DaoWenIdentity.ready();

    if (window.Paywall && Paywall._balanceLoaded && Paywall.getBalance() < 2) {
      this._addMsg('assistant', '当前解读次数不足。AI 助手每次需要 2 次额度。');
      Paywall.openShop();
      return;
    }

    input.value = '';
    input.disabled = true;
    this._addMsg('user', question);
    this.messages.push({ role: 'user', content: question });
    var loadId = this._addMsg('assistant', '正在生成解读…');

    try {
      var resp = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.messages.slice(-10) })
      });
      var data = {};
      try { data = await resp.json(); } catch (e) {}

      var loadEl = document.getElementById(loadId);
      if (loadEl) loadEl.remove();

      if (resp.status === 401 || data.code === 'IDENTITY_REQUIRED') {
        this._addMsg('assistant', '游客身份初始化失败，请刷新页面后重试。');
      } else if (resp.status === 402 || data.code === 'INSUFFICIENT') {
        this._addMsg('assistant', '解读次数不足。AI 助手每次需要 2 次额度。');
        if (window.Paywall) {
          Paywall._setBalance(Number(data.balance || 0));
          Paywall.openShop();
        }
      } else if (resp.ok && data.success) {
        this._addMsg('assistant', data.content);
        this.messages.push({ role: 'assistant', content: data.content });
        if (window.Paywall) {
          if (data.balance != null) Paywall._setBalance(Number(data.balance));
          else Paywall.syncBalance(true).catch(function() {});
        }
      } else {
        this._addMsg('assistant', '未能完成：' + (data.error || 'AI 服务暂不可用，本次不会重复扣费。'));
        if (window.Paywall) Paywall.syncBalance(true).catch(function() {});
      }
    } catch (e) {
      var pending = document.getElementById(loadId);
      if (pending) pending.remove();
      if (e && e.code === 'IDENTITY_REQUIRED') {
        this._addMsg('assistant', '游客身份初始化失败，请刷新页面后重试。');
      } else {
        this._addMsg('assistant', '网络错误，请稍后重试。');
      }
      if (window.Paywall) Paywall.syncBalance(true).catch(function() {});
    } finally {
      input.disabled = false;
      input.focus();
      var body = document.getElementById('aiChatBody');
      if (body) body.scrollTop = body.scrollHeight;
    }
  },

  _addMsg: function(role, text) {
    var body = document.getElementById('aiChatBody');
    if (!body) return '';
    var id = 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    var div = document.createElement('div');
    div.id = id;
    div.className = 'ai-msg ' + role;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return id;
  }
};
