/**
 * AI命理助手 — 浮窗对话
 */
var AIChat = {
  messages: [],
  open: false,

  toggle: function() {
    this.open ? this.close() : this._show();
  },

  _show: function() {
    this.open = true;
    document.getElementById('aiChatWindow').classList.add('open');
    document.getElementById('aiFab').style.display = 'none';
    // 自动注入当前结果上下文
    this._injectContext();
    document.getElementById('aiChatInput').focus();
  },

  close: function() {
    this.open = false;
    document.getElementById('aiChatWindow').classList.remove('open');
    document.getElementById('aiFab').style.display = 'flex';
  },

  _injectContext: function() {
    // 检测当前打开的模块，抓取其结果数据
    var ctx = '';
    var overlays = document.querySelectorAll('.tool-overlay.active');
    if (!overlays.length) return;

    // 抓取结果区域的文字
    var resultEls = document.querySelectorAll('.result-container[style*="block"], [id$="Result"]:not([style*="none"])');
    if (resultEls.length) {
      var text = resultEls[0].innerText || resultEls[0].textContent || '';
      text = text.replace(/\s+/g, ' ').trim().substring(0, 2000);
      if (text.length > 100) {
        ctx = '当前命盘/占卜结果摘要：\n' + text;
        // 注入系统消息
        if (this.messages.length === 0 || this.messages[0].role !== 'system') {
          this.messages.unshift({ role: 'user', content: ctx + '\n\n请基于以上数据回答用户后续问题。' });
        }
      }
    }
  },

  send: function() {
    var input = document.getElementById('aiChatInput');
    var question = input.value.trim();
    if (!question) return;
    input.value = '';
    input.disabled = true;

    // 添加用户消息
    this._addMsg('user', question);
    this.messages.push({ role: 'user', content: question });

    // 添加加载提示
    var loadId = this._addMsg('assistant', '⏳ 思考中...');

    var self = this;
    fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: self.messages.slice(-10) })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      // 移除加载提示
      var loadEl = document.getElementById(loadId);
      if (loadEl) loadEl.remove();

      if (data.success) {
        self._addMsg('assistant', data.content);
        self.messages.push({ role: 'assistant', content: data.content });
      } else {
        self._addMsg('assistant', '❌ AI服务暂不可用，请稍后重试。\n请确认已在 Vercel 配置 ANTHROPIC_API_KEY。');
      }
      input.disabled = false;
      input.focus();
      // 滚动到底部
      var body = document.getElementById('aiChatBody');
      if (body) body.scrollTop = body.scrollHeight;
    })
    .catch(function() {
      var loadEl = document.getElementById(loadId);
      if (loadEl) loadEl.remove();
      self._addMsg('assistant', '❌ 网络错误，请稍后重试。');
      input.disabled = false;
    });
  },

  _addMsg: function(role, text) {
    var body = document.getElementById('aiChatBody');
    var id = 'msg_' + Date.now();
    var div = document.createElement('div');
    div.id = id;
    div.className = 'ai-msg ' + role;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return id;
  }
};
