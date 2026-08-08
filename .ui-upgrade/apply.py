from pathlib import Path
import re, sys

ROOT = Path('.')
index_path = ROOT / 'index.html'
css_path = ROOT / 'css/style.css'
app_path = ROOT / 'js/app.js'
auth_path = ROOT / 'js/supabase-auth.js'

index = index_path.read_text(encoding='utf-8-sig')
css = css_path.read_text(encoding='utf-8-sig')
app = app_path.read_text(encoding='utf-8-sig')
auth = auth_path.read_text(encoding='utf-8-sig')

# ---------- HTML: clean old inline styles / old copy / inconsistent colorful emoji ----------
index = index.replace(
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n  <meta name="theme-color" content="#f2f0ea">\n  <meta name="color-scheme" content="light">'
)
index = re.sub(
    r'<button id="loginBtn" onclick="DaoWenAuth\.openLogin\(\)"[^>]*>.*?</button>',
    '<button id="loginBtn" class="dao-header-action" onclick="DaoWenAuth.openLogin()">登录</button>',
    index,
    count=1,
    flags=re.S,
)

replacements = {
    '>🎫 兑换码<': '>兑换码<',
    '>📧 联系我们<': '>联系我们<',
    '>📋 复制<': '>复制<',
    '<span>💬 微信：': '<span>微信：',
    '<span>🐧 QQ：': '<span>QQ：',
    '<h2 class="section-h2">🔮 卜筮占卜</h2>': '<h2 class="section-h2">卜筮占卜</h2>',
    '<h2 class="section-h2">📅 日用查询</h2>': '<h2 class="section-h2">日用查询</h2>',
    '<h2 class="section-h2">🧠 自我分析</h2>': '<h2 class="section-h2">自我分析</h2>',
    '<h2 class="modal-title">👤 登录 / 注册</h2>': '<h2 class="modal-title">道问账号</h2>',
    'placeholder="密码（至少6位）"': 'placeholder="密码（至少8位）"',
    '>🔑 登录<': '>登录<',
    '>📝 注册<': '>注册账号<',
    '<h2 class="modal-title">🎫 购买解读次数</h2>': '<h2 class="modal-title">购买解读次数</h2>',
    '<h2 class="modal-title">🎫 兑换码</h2>': '<h2 class="modal-title">兑换码</h2>',
    '>✅ 兑换<': '>确认兑换<',
    '>🧑 单人排盘<': '>单人排盘<',
    '>👫 双人合盘<': '>双人合盘<',
    '>☯️ 排盘测算<': '>开始排盘<',
    '>🔮 排盘<': '>开始排盘<',
    '>🌸 起卦<': '>数字起卦<',
    '>⏰ 时间起卦<': '>时间起卦<',
    '>🪙 开始摇卦<': '>开始摇卦<',
    '>🪙 摇第 1 次<': '>摇第 1 次<',
    '>🖐️ 掐指一算<': '>开始起课<',
    '>⏰ 当前时间<': '>使用当前时间<',
    '>📜 查签<': '>开始查签<',
    '>🔍 按签号查询<': '>按签号查询<',
    '>✍️ 测字<': '>开始测字<',
    '>📆 查看黄历<': '>查看黄历<',
    '>📅 今日黄历<': '>今日黄历<',
    '>🌿 查询节气<': '>查询节气<',
    '>📅 今日节气<': '>今日节气<',
    '>🗓️ 择日查询<': '>择日查询<',
    '>💭 解梦<': '>开始解梦<',
    '>🧩 开始测试<': '>开始测试<',
    '>📛 分析姓名<': '>分析姓名<',
    '>🪔 摇签<': '>开始摇签<',
    '>🪔 明日再来<': '>明日再来<',
    '>🌙 开始测试<': '>开始测试<',
    '>✨ 开始洗牌<': '>开始洗牌<',
    '>🔄 重新占卜<': '>重新占卜<',
    '>🔄 重新测试<': '>重新测试<',
}
for old, new in replacements.items():
    index = index.replace(old, new)

# Monochrome symbolic icon language — avoids platform-dependent colored emoji rendering.
icon_map = {
    '☯️': '☯', '🔮': '✦', '🌸': '◇', '🪙': '☰', '🖐️': '✧', '📜': '卦',
    '✍️': '字', '🎴': '◈', '🪔': '签', '📆': '历', '☰': '☷', '🌿': '◌',
    '🗓️': '日', '💭': '梦', '🌙': '○', '🧩': '心', '📛': '名'
}
def icon_repl(match):
    raw = match.group(1).strip()
    return '<div class="tc-icon">' + icon_map.get(raw, raw) + '</div>'
index = re.sub(r'<div class="tc-icon">(.*?)</div>', icon_repl, index)

# Remove old marketing emoji in selected modal titles only; keep close glyph and content symbols where meaningful.
index = re.sub(r'(<h2 class="modal-title">)[\U0001F300-\U0001FAFF\u2600-\u27BF]\ufe0f?\s*', r'\1', index)

# ---------- Auth toolbar: stable label prevents long account names from colliding ----------
auth = re.sub(
    r"var name = \(this\.user\.email \|\| '已登录'\)\.split\('@'\)\[0\];\s*btn\.textContent = '◉ ' \+ name;",
    "btn.textContent = '我的账号';",
    auth,
    count=1,
)
auth = auth.replace("btn.setAttribute('title', '打开账号中心 · ' + (this.user.email || ''));", "btn.setAttribute('title', '打开账号中心 · ' + (this.user.email || ''));\n      btn.setAttribute('aria-label', '打开我的账号');")
auth = auth.replace("btn.textContent = '账号登录';", "btn.textContent = '登录';")

# ---------- App: premium material layer + card spotlight, kept lightweight ----------
premium_js_marker = '// ============ Premium material micro-interactions ============'
if premium_js_marker not in app:
    premium_js = r'''

// ============ Premium material micro-interactions ============
function initPremiumMaterialUI() {
  document.documentElement.classList.add('dao-premium-ui');

  if (!document.getElementById('daoTextureLayer')) {
    const texture = document.createElement('div');
    texture.id = 'daoTextureLayer';
    texture.setAttribute('aria-hidden', 'true');
    document.body.appendChild(texture);
  }

  const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) {
    document.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--spot-x');
        card.style.removeProperty('--spot-y');
      }, { passive: true });
    });
  }

  document.querySelectorAll('button').forEach(btn => {
    if (!btn.hasAttribute('type') && !btn.closest('form')) btn.setAttribute('type', 'button');
  });
}
'''
    app = app.replace('// ============ 启动应用 ============', premium_js + '\n// ============ 启动应用 ============')
    app = app.replace('  initDaoUI();\n});', '  initDaoUI();\n  initPremiumMaterialUI();\n});')

# ---------- CSS: one final design-system layer to override legacy conflicts ----------
marker = '/* ============================================================\n   道问 · Premium System V3 — Apple-level order × Oriental material'
if marker not in css:
    css += r'''

/* ============================================================
   道问 · Premium System V3 — Apple-level order × Oriental material
   Purpose: unify legacy styles, solve overlap, add grain/material/impact.
   ============================================================ */
:root {
  --ui-bg: #f1efe9;
  --ui-bg-2: #e9e5dc;
  --ui-surface: rgba(255,255,255,.58);
  --ui-surface-strong: rgba(250,249,245,.84);
  --ui-surface-solid: #f8f6f0;
  --ui-ink: #191a18;
  --ui-ink-2: #4c4d48;
  --ui-muted: #77776f;
  --ui-line: rgba(45,44,39,.11);
  --ui-line-strong: rgba(45,44,39,.18);
  --ui-accent: #8d312b;
  --ui-accent-2: #b36a36;
  --ui-jade: #42685a;
  --ui-gold: #927544;
  --ui-blue: #486a86;
  --ui-radius-xs: 10px;
  --ui-radius-sm: 14px;
  --ui-radius-md: 20px;
  --ui-radius-lg: 28px;
  --ui-radius-xl: 36px;
  --ui-shadow-1: 0 1px 1px rgba(20,20,18,.04), 0 8px 24px rgba(33,31,26,.055);
  --ui-shadow-2: 0 2px 2px rgba(20,20,18,.035), 0 18px 55px rgba(33,31,26,.095);
  --ui-shadow-float: 0 24px 80px rgba(29,27,23,.16), 0 3px 9px rgba(29,27,23,.06);
  --ui-ease: cubic-bezier(.2,.75,.2,1);
  --font-body: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  --font-display: "Songti SC", "STSong", "Noto Serif CJK SC", "Source Han Serif SC", serif;
}

html { background: var(--ui-bg); color-scheme: light; }
body {
  background:
    radial-gradient(1000px 620px at 9% -4%, rgba(255,255,255,.95), transparent 62%),
    radial-gradient(850px 550px at 93% 12%, rgba(166,130,77,.10), transparent 64%),
    radial-gradient(760px 620px at 55% 88%, rgba(79,111,95,.075), transparent 66%),
    linear-gradient(180deg, #f4f2ed 0%, #eeebe4 46%, #e9e5dd 100%) !important;
  color: var(--ui-ink) !important;
  font-family: var(--font-body) !important;
  font-weight: 400;
  letter-spacing: -.006em;
  text-rendering: optimizeLegibility;
}
body, button, input, select, textarea { -webkit-font-smoothing: antialiased; }
body > *:not(#starCanvas):not(#daoTextureLayer):not(.splash-overlay) { position: relative; }

#daoTextureLayer {
  position: fixed;
  inset: 0;
  z-index: 99990;
  pointer-events: none;
  opacity: .095;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.23'/%3E%3C/svg%3E");
  background-size: 180px 180px;
}
:where(button, .tc-name, .tc-desc, .modal-title, .modal-desc, .form-group, .contact-item, .ai-msg, .result-container) { min-width: 0; overflow-wrap: anywhere; }
button, input, select, textarea { font: inherit; }
button { -webkit-tap-highlight-color: transparent; }

.header {
  width: min(1120px, calc(100% - 32px));
  margin: 18px auto 0 !important;
  padding: 82px 28px 38px !important;
  border: 1px solid rgba(255,255,255,.62);
  border-radius: var(--ui-radius-xl);
  background: radial-gradient(380px 180px at 50% 8%, rgba(255,255,255,.78), transparent 72%), linear-gradient(145deg, rgba(255,255,255,.62), rgba(244,241,233,.43));
  box-shadow: var(--ui-shadow-2), inset 0 1px 0 rgba(255,255,255,.8);
  backdrop-filter: saturate(132%) blur(26px);
  -webkit-backdrop-filter: saturate(132%) blur(26px);
  overflow: visible;
}
.header::before {
  content: "☰  ☷" !important;
  position: absolute; left: 50%; top: 36px; transform: translateX(-50%);
  margin: 0 !important; color: rgba(37,37,33,.24) !important;
  font-size: .78rem !important; letter-spacing: .62em !important;
}
.site-title {
  color: var(--ui-ink) !important;
  font-size: clamp(3rem, 7vw, 5.2rem) !important;
  font-weight: 760 !important; line-height: 1 !important;
  letter-spacing: .17em !important;
  text-shadow: 0 1px 0 rgba(255,255,255,.95), 0 16px 42px rgba(38,34,27,.10) !important;
}
.site-subtitle { color: var(--ui-muted) !important; font-size: .9rem !important; font-weight: 500; letter-spacing: .22em !important; margin-top: 13px !important; }

.header-top-right {
  position: absolute !important; top: 16px !important; right: 16px !important; left: auto !important;
  display: grid !important; grid-auto-flow: column; grid-auto-columns: max-content; gap: 6px !important;
  padding: 6px !important; border: 1px solid rgba(255,255,255,.70) !important; border-radius: 18px !important;
  background: rgba(247,245,239,.66) !important;
  box-shadow: 0 10px 30px rgba(34,32,27,.08), inset 0 1px 0 rgba(255,255,255,.8) !important;
  backdrop-filter: blur(24px) saturate(145%) !important; -webkit-backdrop-filter: blur(24px) saturate(145%) !important;
}
.header-top-right > button, .header-top-right .redeem-btn, .header-top-right .contact-btn, #loginBtn {
  min-width: 0 !important; min-height: 38px !important; height: 38px; margin: 0 !important; padding: 0 13px !important;
  display: inline-flex !important; align-items: center; justify-content: center;
  border: 1px solid transparent !important; border-radius: 12px !important;
  background: transparent !important; color: var(--ui-ink-2) !important; box-shadow: none !important;
  font-size: .78rem !important; font-weight: 650 !important; line-height: 1 !important; white-space: nowrap;
  transition: transform .18s var(--ui-ease), background .18s ease, color .18s ease !important;
}
.header-top-right > button:hover, #loginBtn:hover { transform: none !important; background: rgba(255,255,255,.68) !important; color: var(--ui-ink) !important; }
.header-top-right > button:active, #loginBtn:active { transform: scale(.96) !important; }
.redeem-btn { background: var(--ui-ink) !important; color: #fff !important; }
.redeem-btn:hover { background: #292a27 !important; color: #fff !important; }
#loginBtn, #loginBtn.dao-header-action, #loginBtn.is-logged-in {
  background: rgba(65,101,86,.12) !important; color: #315247 !important; border-color: rgba(66,104,89,.10) !important;
  max-width: 116px; overflow: hidden; text-overflow: ellipsis;
}
.contact-popup {
  top: calc(100% + 10px) !important; right: 0 !important; width: min(320px, calc(100vw - 32px)); min-width: 0 !important;
  padding: 14px !important; border: 1px solid rgba(255,255,255,.75) !important; border-radius: 20px !important;
  background: rgba(248,247,243,.88) !important; box-shadow: var(--ui-shadow-float) !important;
  backdrop-filter: blur(30px) saturate(145%) !important; -webkit-backdrop-filter: blur(30px) saturate(145%) !important;
}
.contact-item { gap: 10px !important; font-size: .82rem !important; }
.copy-btn { min-height: 32px !important; padding: 0 10px !important; border-radius: 10px !important; background: rgba(255,255,255,.58) !important; }

.section-header { max-width: 1100px !important; margin: 54px auto 17px !important; padding: 0 18px !important; text-align: left !important; }
.section-header::after { display: none !important; }
.section-h2 { display: block !important; color: var(--ui-ink) !important; font-family: var(--font-body) !important; font-size: clamp(1.5rem, 3vw, 2.05rem) !important; font-weight: 760 !important; letter-spacing: -.025em !important; line-height: 1.15; }
.section-h2::before, .section-h2::after { display: none !important; }
.section-lead { color: var(--ui-muted) !important; margin-top: 6px !important; font-size: .84rem !important; letter-spacing: .02em !important; }

.tools-grid {
  width: min(1120px, 100%) !important; max-width: 1120px !important; margin: 0 auto !important; padding: 0 16px !important;
  display: grid !important; grid-template-columns: repeat(4, minmax(0,1fr)) !important; gap: 14px !important;
}
.tool-card {
  --spot-x: 50%; --spot-y: 20%; min-height: 214px !important; padding: 20px 19px 18px !important;
  border: 1px solid rgba(255,255,255,.72) !important; border-radius: 24px !important;
  background: radial-gradient(260px circle at var(--spot-x) var(--spot-y), rgba(255,255,255,.92), transparent 42%), linear-gradient(145deg, rgba(255,255,255,.64), rgba(243,240,232,.48)) !important;
  box-shadow: var(--ui-shadow-1), inset 0 1px 0 rgba(255,255,255,.88) !important;
  backdrop-filter: blur(20px) saturate(120%) !important; -webkit-backdrop-filter: blur(20px) saturate(120%) !important;
  text-align: left !important; contain: layout paint;
  transition: transform .32s var(--ui-ease), box-shadow .32s var(--ui-ease), border-color .25s ease !important;
}
.tool-card::before {
  content: "" !important; position: absolute !important; inset: 0 !important; width: auto !important; height: auto !important; right: auto !important; top: auto !important;
  border: 0 !important; border-radius: inherit !important; box-shadow: inset 0 0 0 1px rgba(255,255,255,.22) !important;
  background: linear-gradient(125deg, rgba(255,255,255,.24), transparent 30%, transparent 72%, rgba(142,102,57,.035)) !important; pointer-events: none;
}
.tool-card::after {
  content: "" !important; left: 18px !important; right: 18px !important; bottom: 0 !important; width: auto !important; height: 2px !important;
  transform: scaleX(.26) !important; transform-origin: left !important;
  background: linear-gradient(90deg, var(--ui-accent), var(--ui-gold), transparent) !important; opacity: .36;
}
@media (hover:hover) and (pointer:fine) {
  .tool-card:hover { transform: translateY(-6px) scale(1.012) !important; border-color: rgba(255,255,255,.95) !important; box-shadow: 0 22px 55px rgba(38,35,29,.12), inset 0 1px 0 rgba(255,255,255,.95) !important; }
  .tool-card:hover::after { transform: scaleX(1) !important; opacity: .72; }
}
.tool-card:active { transform: scale(.985) !important; }
.tc-icon {
  width: 46px !important; height: 46px !important; display: grid !important; place-items: center !important; margin: 0 0 19px !important;
  border: 1px solid rgba(44,44,39,.09) !important; border-radius: 14px !important;
  background: linear-gradient(145deg, rgba(255,255,255,.72), rgba(229,224,213,.48)) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.85), 0 5px 15px rgba(40,36,29,.05) !important;
  color: var(--ui-ink) !important; font-family: var(--font-display) !important; font-size: 1.26rem !important; font-weight: 700 !important; filter: none !important;
}
.tc-name { color: var(--ui-ink) !important; font-size: 1.03rem !important; font-weight: 720 !important; letter-spacing: -.012em !important; line-height: 1.25; }
.tc-desc { color: var(--ui-muted) !important; min-height: 3.7em !important; margin-top: 8px !important; font-size: .76rem !important; line-height: 1.6 !important; }
.tc-tag { display: inline-flex !important; align-items: center; width: auto !important; margin-top: 14px !important; padding: 4px 8px !important; border: 1px solid rgba(49,49,44,.08) !important; border-radius: 999px !important; background: rgba(255,255,255,.46) !important; color: #6b6254 !important; font-size: .64rem !important; font-weight: 650 !important; }

:where(.btn-primary, .btn-secondary, .bazi-mode-btn, .quiz-option-btn, .ai-chat-input button, .auth-danger-btn) {
  min-height: 44px; border-radius: 13px !important; line-height: 1.1; font-weight: 670 !important;
  transition: transform .16s var(--ui-ease), box-shadow .2s ease, background .2s ease, border-color .2s ease !important;
}
.btn-primary { width: auto !important; min-width: 132px; padding: 0 18px !important; color: #fff !important; background: linear-gradient(180deg, #2d2e2a 0%, #1b1c19 100%) !important; border: 1px solid rgba(0,0,0,.22) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 8px 18px rgba(27,27,24,.14) !important; }
.btn-primary:hover { transform: translateY(-1px) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 12px 24px rgba(27,27,24,.18) !important; }
.btn-primary:active { transform: scale(.975) !important; }
.btn-secondary { width: auto !important; margin-top: 0 !important; min-width: 120px; padding: 0 16px !important; color: var(--ui-ink-2) !important; background: rgba(255,255,255,.52) !important; border: 1px solid rgba(52,51,46,.10) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.75), 0 4px 12px rgba(38,35,29,.04) !important; }
.btn-secondary:hover { background: rgba(255,255,255,.76) !important; border-color: rgba(52,51,46,.15) !important; }
.btn-secondary:active { transform: scale(.975) !important; }
.btn-row { display: flex !important; flex-wrap: wrap !important; justify-content: center !important; align-items: stretch !important; gap: 10px !important; margin-top: 16px !important; }
.btn-row > button { flex: 1 1 150px; max-width: 280px; }

.bazi-mode-tabs { display: grid !important; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 4px !important; padding: 4px; margin: 0 auto 18px !important; border: 1px solid rgba(47,46,41,.08); border-radius: 15px; background: rgba(43,42,38,.05); }
.bazi-mode-btn { min-width: 0; padding: 0 14px !important; border: 0 !important; background: transparent !important; color: var(--ui-muted) !important; box-shadow: none !important; }
.bazi-mode-btn.active { color: var(--ui-ink) !important; background: rgba(255,255,255,.82) !important; box-shadow: 0 2px 8px rgba(36,34,29,.07), inset 0 1px 0 rgba(255,255,255,.9) !important; }

.form-row { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 12px !important; width: 100%; }
.form-group { min-width: 0 !important; gap: 6px !important; }
.form-group label { color: #686860 !important; font-size: .74rem !important; font-weight: 620 !important; letter-spacing: .01em; }
:where(.form-input, .fortune-form input, .fortune-form select, .fortune-form textarea, .tool-modal input, .tool-modal select, .tool-modal textarea) {
  width: 100% !important; min-width: 0 !important; min-height: 46px; padding: 0 13px !important;
  border: 1px solid rgba(48,47,42,.10) !important; border-radius: 13px !important; background: rgba(255,255,255,.57) !important; color: var(--ui-ink) !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.78), 0 1px 1px rgba(30,29,25,.025) !important; outline: none !important;
}
textarea.form-input, .tool-modal textarea { padding-top: 12px !important; min-height: 94px; }
:where(.form-input, .fortune-form input, .fortune-form select, .fortune-form textarea, .tool-modal input, .tool-modal select, .tool-modal textarea):focus {
  border-color: rgba(72,106,134,.42) !important; background: rgba(255,255,255,.78) !important;
  box-shadow: 0 0 0 4px rgba(72,106,134,.10), inset 0 1px 0 rgba(255,255,255,.9) !important;
}
select option, .fortune-form select option { background: #f7f5ef !important; color: #22231f !important; }

.tool-overlay { padding: max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom)) !important; background: rgba(36,35,31,.28) !important; backdrop-filter: blur(18px) saturate(110%) !important; -webkit-backdrop-filter: blur(18px) saturate(110%) !important; }
.tool-modal {
  width: min(760px, 96vw) !important; max-width: 760px !important; max-height: min(90dvh, 900px) !important; overflow: auto !important; overscroll-behavior: contain;
  padding: 28px 26px 26px !important; border: 1px solid rgba(255,255,255,.76) !important; border-radius: 28px !important;
  background: radial-gradient(500px 240px at 20% 0%, rgba(255,255,255,.72), transparent 60%), rgba(246,244,238,.88) !important;
  box-shadow: var(--ui-shadow-float), inset 0 1px 0 rgba(255,255,255,.9) !important;
  backdrop-filter: blur(34px) saturate(125%) !important; -webkit-backdrop-filter: blur(34px) saturate(125%) !important;
}
.modal-close {
  position: sticky !important; float: right; top: 0 !important; right: 0 !important; z-index: 8;
  width: 34px !important; height: 34px !important; min-height: 34px !important; display: grid !important; place-items: center !important; padding: 0 !important;
  border: 1px solid rgba(44,43,39,.08) !important; border-radius: 50% !important; background: rgba(255,255,255,.64) !important; color: #686860 !important;
  box-shadow: 0 3px 12px rgba(35,33,28,.06) !important; font-size: .86rem !important;
}
.modal-close:hover { background: rgba(255,255,255,.9) !important; color: var(--ui-ink) !important; }
.modal-title { color: var(--ui-ink) !important; font-family: var(--font-body) !important; font-size: clamp(1.45rem, 3vw, 1.9rem) !important; font-weight: 760 !important; letter-spacing: -.025em !important; line-height: 1.2; }
.modal-desc { color: var(--ui-muted) !important; font-size: .82rem !important; letter-spacing: 0 !important; }

.shop-grid { display: grid !important; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px !important; }
.shop-card { max-width: none !important; min-width: 0 !important; padding: 18px 14px !important; border: 1px solid rgba(255,255,255,.75) !important; border-radius: 18px !important; background: rgba(255,255,255,.52) !important; box-shadow: var(--ui-shadow-1) !important; }
.shop-card:hover { transform: translateY(-2px) !important; }
.shop-card.best { border-color: rgba(146,117,68,.24) !important; background: rgba(255,250,238,.72) !important; }
.shop-card.best::after { background: var(--ui-ink) !important; }
.result-container, .disclaimer-box, .true-solar-display, .auth-account-card, .balance-bar { border-color: rgba(255,255,255,.62) !important; background: rgba(255,255,255,.42) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.72) !important; }
.disclaimer-section { max-width: 1120px !important; padding: 0 16px !important; }
.disclaimer-box { border-radius: 20px !important; }

.ai-chat-fab { width: 54px !important; height: 54px !important; right: max(18px, env(safe-area-inset-right)) !important; bottom: max(18px, env(safe-area-inset-bottom)) !important; border: 1px solid rgba(255,255,255,.72) !important; background: linear-gradient(145deg, #4f7566, #2f5044) !important; box-shadow: 0 15px 35px rgba(39,70,57,.22), inset 0 1px 0 rgba(255,255,255,.2) !important; }
.ai-chat-window { width: min(390px, calc(100vw - 24px)) !important; height: min(610px, calc(100dvh - 80px)) !important; right: max(12px, env(safe-area-inset-right)) !important; bottom: max(12px, env(safe-area-inset-bottom)) !important; border: 1px solid rgba(255,255,255,.74) !important; border-radius: 24px !important; background: rgba(247,246,241,.91) !important; box-shadow: var(--ui-shadow-float) !important; backdrop-filter: blur(30px) saturate(125%) !important; -webkit-backdrop-filter: blur(30px) saturate(125%) !important; }
.ai-chat-header { background: rgba(38,39,35,.94) !important; color: #fff !important; }
.ai-chat-body { background: rgba(242,240,234,.75) !important; }
.ai-msg.user { background: #31584a !important; }
.ai-msg.assistant { background: rgba(255,255,255,.72) !important; border-color: rgba(40,39,35,.08) !important; }
.ai-chat-input { background: rgba(250,249,245,.88) !important; border-top-color: rgba(40,39,35,.08) !important; }
.ai-chat-input button { background: #252622 !important; color: #fff !important; }

.dao-skeleton-overlay { background: radial-gradient(600px 300px at 50% 6%, rgba(255,255,255,.85), transparent 68%), rgba(239,236,228,.88) !important; backdrop-filter: blur(20px) saturate(118%) !important; }
.dao-skeleton-paper { border-color: rgba(255,255,255,.75) !important; border-radius: 24px !important; background: rgba(255,255,255,.50) !important; box-shadow: var(--ui-shadow-1) !important; }
.dao-skeleton-bar, .dao-skeleton-pill, .dao-skeleton-nav span, .dao-skeleton-grid span, .dao-skeleton-lines span, .dao-skeleton-disc { background: rgba(54,53,48,.075) !important; }

.splash-overlay { z-index: 20000 !important; }
.tool-overlay { z-index: 12000 !important; }
.ai-chat-window { z-index: 13000 !important; }
.ai-chat-fab { z-index: 11000 !important; }
#daoTextureLayer { z-index: 15000; }
.tool-overlay.active ~ #daoTextureLayer { opacity: .055; }

@media (max-width: 980px) {
  .tools-grid { grid-template-columns: repeat(3,minmax(0,1fr)) !important; }
  .header { width: min(94vw, 900px); }
}
@media (max-width: 720px) {
  .header { width: calc(100% - 20px); margin-top: 10px !important; padding: 28px 18px 30px !important; border-radius: 28px !important; }
  .header::before { position: static !important; display: block !important; transform: none !important; margin: 0 auto 22px !important; }
  .header-top-right { position: relative !important; top: auto !important; right: auto !important; left: auto !important; width: 100%; margin: 0 0 28px !important; grid-auto-flow: row; grid-template-columns: repeat(3,minmax(0,1fr)); }
  .header-top-right > button, #loginBtn { width: 100%; max-width: none !important; padding-inline: 6px !important; font-size: .72rem !important; }
  .contact-popup { position: fixed !important; top: 14px !important; right: 10px !important; left: 10px !important; width: auto !important; }
  .site-title { font-size: clamp(2.8rem, 15vw, 4.2rem) !important; }
  .site-title::before, .site-title::after { display: none !important; }
  .tools-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; gap: 10px !important; padding: 0 10px !important; }
  .tool-card { min-height: 190px !important; padding: 17px 15px 15px !important; border-radius: 20px !important; }
  .section-header { margin-top: 42px !important; padding-inline: 14px !important; }
  .form-row { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .tool-modal { width: 100% !important; max-width: none !important; }
}
@media (max-width: 520px) {
  .tool-overlay { align-items: flex-end !important; padding: 0 !important; }
  .tool-modal { max-height: 92dvh !important; padding: 20px 16px max(20px, env(safe-area-inset-bottom)) !important; border-radius: 26px 26px 0 0 !important; border-bottom: 0 !important; }
  .modal-close { margin-bottom: 4px; }
  .tools-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
  .tool-card { min-height: 176px !important; }
  .tc-desc { min-height: 4.5em !important; }
  .form-row { grid-template-columns: 1fr !important; gap: 10px !important; }
  .address-row { grid-template-columns: 1fr !important; }
  .btn-row { display: grid !important; grid-template-columns: 1fr !important; }
  .btn-row > button { width: 100% !important; max-width: none !important; }
  .shop-grid { grid-template-columns: 1fr !important; }
  #loginOverlay .btn-row { grid-template-columns: 1fr !important; }
  .ai-chat-window { width: calc(100vw - 12px) !important; right: 6px !important; bottom: 6px !important; height: min(76dvh, 620px) !important; border-radius: 22px !important; }
}
@media (max-width: 390px) {
  .header-top-right { gap: 4px !important; padding: 4px !important; }
  .header-top-right > button, #loginBtn { min-height: 36px !important; height: 36px; font-size: .66rem !important; }
  .tools-grid { grid-template-columns: 1fr !important; }
  .tool-card { min-height: 158px !important; }
  .tc-desc { min-height: auto !important; }
}
@media (prefers-reduced-motion: reduce) {
  .tool-card, button, .tool-modal, .ai-chat-window { transition: none !important; }
  #daoTextureLayer { opacity: .055; }
}
'''

index_path.write_text(index, encoding='utf-8', newline='\n')
css_path.write_text(css, encoding='utf-8', newline='\n')
app_path.write_text(app, encoding='utf-8', newline='\n')
auth_path.write_text(auth, encoding='utf-8', newline='\n')

text_ext = {'.html','.css','.js','.json','.md','.sql','.yml','.yaml','.txt'}
mojibake = ('\ufffd', '锟斤拷', 'Ã', 'Â', 'â€', 'ðŸ')
problems = []
for p in ROOT.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in text_ext or '.git' in p.parts:
        continue
    try:
        s = p.read_text(encoding='utf-8')
    except UnicodeDecodeError as e:
        problems.append(f'{p}: invalid UTF-8: {e}')
        continue
    for token in mojibake:
        if token in s:
            problems.append(f'{p}: suspicious mojibake token {token!r}')
            break
if problems:
    print('\n'.join(problems), file=sys.stderr)
    raise SystemExit(2)

css_now = css_path.read_text(encoding='utf-8')
if css_now.count('{') != css_now.count('}'):
    raise SystemExit('CSS brace mismatch')
idx_now = index_path.read_text(encoding='utf-8')
for item in ['placeholder="密码（至少8位）"','id="loginBtn" class="dao-header-action"','meta name="theme-color"']:
    if item not in idx_now:
        raise SystemExit(f'missing expected HTML fix: {item}')
if 'padding:0.6rem 1.2rem;background:#3cb371' in idx_now:
    raise SystemExit('legacy inline green login style still present')
print('premium UI + UTF-8 audit: OK')
