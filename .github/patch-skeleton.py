from pathlib import Path

app_path = Path('js/app.js')
css_path = Path('css/style.css')
app = app_path.read_text(encoding='utf-8-sig')
css = css_path.read_text(encoding='utf-8-sig')

marker = '// ============ 宣纸骨架屏过渡 ============'
if marker not in app:
    skeleton_js = r'''
// ============ 宣纸骨架屏过渡 ============
const DaoSkeleton = {
  overlay: null,
  _hideTimer: null,

  ensure() {
    if (this.overlay && document.body.contains(this.overlay)) return this.overlay;
    const el = document.createElement('div');
    el.id = 'daoSkeletonOverlay';
    el.className = 'dao-skeleton-overlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="dao-skeleton-shell" role="status" aria-live="polite">
        <div class="dao-skeleton-topline">
          <span class="dao-skeleton-seal">道</span>
          <div class="dao-skeleton-heading">
            <span class="dao-skeleton-bar w-36"></span>
            <span class="dao-skeleton-bar w-22 soft"></span>
          </div>
          <span class="dao-skeleton-pill"></span>
        </div>
        <div class="dao-skeleton-nav">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div class="dao-skeleton-paper">
          <div class="dao-skeleton-title-row">
            <span class="dao-skeleton-disc"></span>
            <div>
              <span class="dao-skeleton-bar w-48"></span>
              <span class="dao-skeleton-bar w-64 soft"></span>
            </div>
          </div>
          <div class="dao-skeleton-grid">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="dao-skeleton-lines">
            <span class="w-92"></span><span class="w-76"></span><span class="w-84"></span>
          </div>
        </div>
        <p class="dao-skeleton-label">正在铺开命理卷轴…</p>
      </div>`;
    document.body.appendChild(el);
    this.overlay = el;
    return el;
  },

  show(mode, label, duration) {
    const el = this.ensure();
    if (this._hideTimer) clearTimeout(this._hideTimer);
    this._hideTimer = null;
    el.dataset.mode = mode || 'page';
    const labelEl = el.querySelector('.dao-skeleton-label');
    if (labelEl) labelEl.textContent = label || '正在准备内容…';
    el.classList.remove('is-leaving');
    el.classList.add('is-visible');
    el.setAttribute('aria-hidden', 'false');
    document.body.setAttribute('aria-busy', 'true');
    if (duration !== 0) {
      this._hideTimer = setTimeout(() => this.hide(), Number(duration || 360));
    }
    return el;
  },

  hide() {
    const el = this.overlay;
    if (!el) return;
    if (this._hideTimer) clearTimeout(this._hideTimer);
    this._hideTimer = null;
    el.classList.add('is-leaving');
    document.body.removeAttribute('aria-busy');
    setTimeout(() => {
      if (!this.overlay) return;
      this.overlay.classList.remove('is-visible', 'is-leaving');
      this.overlay.setAttribute('aria-hidden', 'true');
    }, 190);
  }
};

window.DaoSkeleton = DaoSkeleton;
window.showDaoSkeleton = (label, duration) => DaoSkeleton.show('result', label, duration || 0);
window.hideDaoSkeleton = () => DaoSkeleton.hide();

function installSkeletonTransitions() {
  if (document.documentElement.dataset.daoSkeletonReady === '1') return;
  document.documentElement.dataset.daoSkeletonReady = '1';

  // 功能卡采用“先骨架、后内容”的轻过渡。原 onclick 仍立即执行，骨架只覆盖约 0.3 秒，不阻塞业务逻辑。
  document.addEventListener('click', e => {
    const card = e.target && e.target.closest ? e.target.closest('.tool-card[onclick]') : null;
    if (!card || document.getElementById('splashOverlay')) return;
    const titleEl = card.querySelector('.tool-title, .tool-card-title, h3, strong');
    const title = titleEl ? titleEl.textContent.trim() : '';
    DaoSkeleton.show('module', title ? `正在展开「${title}」…` : '正在展开内容…', 320);
  }, true);
}
'''
    anchor = '// ============ 启动应用 ============'
    if anchor not in app:
        raise SystemExit('app.js startup anchor not found')
    app = app.replace(anchor, skeleton_js + '\n' + anchor, 1)

    app = app.replace(
        "window.__daoSplashTimer = setTimeout(() => window.dismissSplash(), 2600);",
        "window.__daoSplashTimer = setTimeout(() => window.dismissSplash(), 1500);",
        1
    )
    app = app.replace(
        "const delay = fast ? 120 : 760;",
        "const delay = fast ? 100 : 420;",
        1
    )
    old = """    setTimeout(() => {\n      if (el && el.parentNode) el.parentNode.removeChild(el);\n      document.body.classList.add('dao-entered');\n    }, delay);"""
    new = """    setTimeout(() => {\n      if (el && el.parentNode) el.parentNode.removeChild(el);\n      document.body.classList.add('dao-entered');\n      if (window.DaoSkeleton) {\n        window.DaoSkeleton.show('page', fast ? '正在恢复道问…' : '正在铺开命理卷轴…', fast ? 220 : 380);\n      }\n    }, delay);"""
    if old not in app:
        raise SystemExit('dismissSplash callback anchor not found')
    app = app.replace(old, new, 1)

    old_init = """  makeToolCardsAccessible();\n  addRevealMotion();"""
    new_init = """  makeToolCardsAccessible();\n  installSkeletonTransitions();\n  addRevealMotion();"""
    if old_init not in app:
        raise SystemExit('initDaoUI anchor not found')
    app = app.replace(old_init, new_init, 1)

css_marker = '/* ========== DAO SKELETON TRANSITIONS ========== */'
if css_marker not in css:
    css += r'''

/* ========== DAO SKELETON TRANSITIONS ========== */
.dao-skeleton-overlay {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: grid;
  place-items: start center;
  padding: clamp(1rem, 5vh, 3.4rem) 1rem 1.5rem;
  background:
    radial-gradient(circle at 18% 12%, rgba(157, 48, 41, .055), transparent 28%),
    radial-gradient(circle at 82% 76%, rgba(112, 87, 48, .065), transparent 32%),
    rgba(239, 233, 219, .965);
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity .18s ease, visibility .18s ease;
}
.dao-skeleton-overlay.is-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
.dao-skeleton-overlay.is-leaving {
  opacity: 0;
  pointer-events: none;
}
.dao-skeleton-shell {
  width: min(720px, 100%);
  color: #443a2c;
}
.dao-skeleton-topline {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  align-items: center;
  gap: .85rem;
  margin-bottom: .9rem;
}
.dao-skeleton-seal {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(151, 42, 35, .42);
  color: rgba(151, 42, 35, .72);
  font-family: var(--font-display);
  font-size: 1.35rem;
  border-radius: 8px 5px 9px 6px;
  transform: rotate(-2deg);
  background: rgba(255, 250, 240, .48);
}
.dao-skeleton-heading {
  display: flex;
  flex-direction: column;
  gap: .48rem;
}
.dao-skeleton-bar,
.dao-skeleton-pill,
.dao-skeleton-nav span,
.dao-skeleton-grid span,
.dao-skeleton-lines span,
.dao-skeleton-disc {
  position: relative;
  overflow: hidden;
  display: block;
  background: rgba(86, 75, 57, .105);
  border: 1px solid rgba(98, 82, 56, .055);
}
.dao-skeleton-bar::after,
.dao-skeleton-pill::after,
.dao-skeleton-nav span::after,
.dao-skeleton-grid span::after,
.dao-skeleton-lines span::after,
.dao-skeleton-disc::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-110%);
  background: linear-gradient(100deg, transparent 0%, rgba(255,255,255,.48) 44%, rgba(178, 151, 98, .14) 54%, transparent 100%);
  animation: daoSkeletonShimmer 1.28s ease-in-out infinite;
}
.dao-skeleton-bar { height: 11px; border-radius: 999px; }
.dao-skeleton-bar.soft { opacity: .68; height: 8px; }
.dao-skeleton-pill { width: 76px; height: 30px; border-radius: 999px; }
.dao-skeleton-nav {
  display: flex;
  gap: .5rem;
  margin: 0 0 1rem 0;
}
.dao-skeleton-nav span { width: 72px; height: 28px; border-radius: 7px; }
.dao-skeleton-paper {
  padding: clamp(1rem, 3vw, 1.65rem);
  border: 1px solid rgba(92, 74, 45, .14);
  border-radius: 18px 13px 19px 15px;
  background: rgba(255, 251, 241, .66);
  box-shadow: 0 18px 45px rgba(66, 53, 37, .075), inset 0 0 42px rgba(137, 112, 70, .035);
}
.dao-skeleton-title-row {
  display: grid;
  grid-template-columns: 54px 1fr;
  align-items: center;
  gap: .9rem;
  margin-bottom: 1.15rem;
}
.dao-skeleton-title-row > div { display: flex; flex-direction: column; gap: .55rem; }
.dao-skeleton-disc { width: 54px; height: 54px; border-radius: 50%; }
.dao-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .75rem;
}
.dao-skeleton-grid span {
  min-height: 88px;
  border-radius: 13px 9px 14px 10px;
}
.dao-skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  margin-top: 1rem;
}
.dao-skeleton-lines span { height: 8px; border-radius: 999px; }
.dao-skeleton-label {
  margin: .85rem 0 0;
  text-align: center;
  color: rgba(79, 64, 44, .66);
  font-size: .84rem;
  letter-spacing: .12em;
}
.dao-skeleton-overlay[data-mode="module"] {
  background: rgba(236, 230, 216, .91);
}
.dao-skeleton-overlay[data-mode="module"] .dao-skeleton-shell {
  transform: translateY(min(7vh, 52px));
}
.dao-skeleton-overlay[data-mode="module"] .dao-skeleton-nav {
  opacity: .52;
}
.w-22 { width: 22%; } .w-36 { width: 36%; } .w-48 { width: 48%; }
.w-64 { width: 64%; } .w-76 { width: 76%; } .w-84 { width: 84%; }
.w-92 { width: 92%; }

@keyframes daoSkeletonShimmer {
  0% { transform: translateX(-115%); }
  58%, 100% { transform: translateX(115%); }
}

@media (max-width: 620px) {
  .dao-skeleton-overlay { padding-top: 1rem; }
  .dao-skeleton-grid { grid-template-columns: repeat(2, 1fr); gap: .6rem; }
  .dao-skeleton-grid span { min-height: 76px; }
  .dao-skeleton-nav span:nth-child(n+4) { display: none; }
  .dao-skeleton-pill { width: 58px; }
}

@media (prefers-reduced-motion: reduce) {
  .dao-skeleton-bar::after,
  .dao-skeleton-pill::after,
  .dao-skeleton-nav span::after,
  .dao-skeleton-grid span::after,
  .dao-skeleton-lines span::after,
  .dao-skeleton-disc::after { animation: none; display: none; }
  .dao-skeleton-overlay { transition-duration: .01ms; }
}
'''

app_path.write_text(app, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
