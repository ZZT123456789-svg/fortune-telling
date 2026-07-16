/**
 * AI命理助手 — 浮窗对话
 */
var AIChat = {
  messages: [],
  open: false,
  contextReady: false,

  /** 从结果区打开AI对话（由模块调用） */
  openWithContext: function(resultContainerId) {
    this.messages = [];
    this.contextReady = false;
    // 抓取结果文字
    var el = document.getElementById(resultContainerId);
    if (el) {
      var text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 2000);
      if (text.length > 100) {
        this.messages.push({ role: 'user', content: '以下是我的命盘/占卜结果，请记住这些数据，等我提问：\n\n' + text });
        this.contextReady = true;
      }
    }
    this._show();
  },

  toggle: function() {
    if (this.contextReady || this.messages.length > 0) { this._show(); }
    else { alert('💡 请先完成排盘或占卜，在结果区点击"🤖 问AI"按钮即可。'); }
  },

  _show: function() {
    this.open = true;
    document.getElementById('aiChatWindow').classList.add('open');
    document.getElementById('aiFab').style.display = 'none';
    if (this.messages.length === 0) {
      this._addMsg('assistant', '你好！我是AI命理助手。每次提问消耗2积分。请先在命理模块中排盘或占卜，然后点"🤖 问AI"来找我。');
    }
    document.getElementById('aiChatInput').focus();
  },

  close: function() {
    this.open = false;
    document.getElementById('aiChatWindow').classList.remove('open');
    document.getElementById('aiFab').style.display = 'flex';
  },

  send: function() {
    var input = document.getElementById('aiChatInput');
    var question = input.value.trim();
    if (!question) return;

    // 检查积分（2积分一次）
    if (Paywall.getBalance() < 2) {
      alert('AI助手每次提问消耗2积分。\n当前积分不足，请先购买解读次数。');
      Paywall.openShop();
      return;
    }

    input.value = '';
    input.disabled = true;

    // 扣积分
    Paywall.deduct();
    Paywall.deduct();

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
