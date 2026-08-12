/**
 * 道问 — 主应用控制器
 * 中国水墨 / 八卦视觉版
 *
 * 保留原文件对外 API：StarBackground、AppController、typewriter、
 * typewriterHTML、showEl、hideEl、randomInt、randomPick、shuffle、
 * todayStr、createRipple、initAddressCascade、toggleContact、copyContact。
 * 不改支付、命理排盘或 AI 业务逻辑。
 */

// ============ 水墨八卦动态背景 ============
class StarBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.running = !document.hidden;
    this.lastFrame = 0;
    this.frameId = null;
    this.resize();
    this._initInkDrops();
    this.animate(0);
    window.addEventListener('resize', () => this.resize(), { passive: true });
    document.addEventListener('visibilitychange', () => {
      this.running = !document.hidden;
      if (this.running && !this.reduceMotion) this.animate(performance.now());
    });
  }

  resize() {
    if (!this.canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.width = w;
    this.height = h;
    this.cx = w * 0.5;
    this.cy = h * 0.48;
  }

  _initInkDrops() {
    const count = window.innerWidth < 620 ? 10 : 18;
    this.inkDrops = Array.from({ length: count }, (_, i) => ({
      x: ((i * 73) % 101) / 101,
      y: ((i * 41 + 17) % 97) / 97,
      r: 0.8 + (i % 5) * 0.55,
      a: 0.018 + (i % 4) * 0.009,
      drift: 0.12 + (i % 6) * 0.035
    }));
  }

  _drawPaperWash(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(244, 238, 225, 0.13)';
    ctx.fillRect(0, 0, w, h);

    const washes = [
      [w * 0.10, h * 0.22, w * 0.34, h * 0.13, 0.030],
      [w * 0.88, h * 0.52, w * 0.31, h * 0.16, 0.026],
      [w * 0.46, h * 0.90, w * 0.42, h * 0.11, 0.022]
    ];
    washes.forEach(([x, y, rx, ry, alpha], i) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      g.addColorStop(0, `rgba(33, 35, 30, ${alpha + Math.sin(this.time * 0.32 + i) * 0.006})`);
      g.addColorStop(0.55, `rgba(54, 52, 45, ${alpha * 0.52})`);
      g.addColorStop(1, 'rgba(54, 52, 45, 0)');
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, ry / rx);
      ctx.translate(-x, -y);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  _drawMountains(ctx, w, h) {
    const base = h * 0.88;
    const layers = [
      { y: base, amp: h * 0.095, alpha: 0.055, blur: 0 },
      { y: base + h * 0.035, amp: h * 0.070, alpha: 0.038, blur: 0 }
    ];

    layers.forEach((layer, li) => {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, layer.y);
      const step = Math.max(34, w / 18);
      for (let x = 0; x <= w + step; x += step) {
        const n1 = Math.sin(x * 0.009 + li * 1.4) * 0.45;
        const n2 = Math.sin(x * 0.021 + 0.8 + li) * 0.20;
        const peak = Math.max(0, Math.sin(x * 0.0048 + li * 2.2));
        const y = layer.y - layer.amp * (0.45 + peak * 0.78 + n1 + n2);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = `rgba(29, 31, 27, ${layer.alpha})`;
      ctx.fill();
      ctx.restore();
    });
  }

  _drawTaiChi(ctx, cx, cy, r, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.34;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#20221d';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = '#eee7d8';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -r / 2, r / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#eee7d8';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r / 2, r / 7, 0, Math.PI * 2);
    ctx.fillStyle = '#20221d';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, r / 2, r / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#20221d';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, r / 2, r / 7, 0, Math.PI * 2);
    ctx.fillStyle = '#eee7d8';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(44, 43, 37, .50)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  _drawTrigram(ctx, cx, cy, trigram, angle, baguaR) {
    const barWidth = Math.max(13, baguaR * 0.17);
    const barHeight = Math.max(2, baguaR * 0.020);
    const gapY = barHeight * 2.9;
    const dist = baguaR * 1.20;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.translate(0, -dist);
    ctx.fillStyle = 'rgba(43, 41, 34, .40)';

    for (let i = 0; i < 3; i++) {
      const y = (i - 1) * gapY;
      if (trigram[i]) {
        ctx.fillRect(-barWidth / 2, y, barWidth, barHeight);
      } else {
        const segW = barWidth * 0.38;
        ctx.fillRect(-barWidth / 2, y, segW, barHeight);
        ctx.fillRect(barWidth / 2 - segW, y, segW, barHeight);
      }
    }
    ctx.restore();
  }

  _drawBagua(ctx, cx, cy, r) {
    const rotation = this.time * 0.055;
    const trigrams = [
      [1, 1, 1], [0, 1, 1], [1, 0, 1], [0, 0, 1],
      [0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 0]
    ];

    ctx.save();
    ctx.globalAlpha = 0.46;
    [0.86, 1.06, 1.36].forEach((m, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * m, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(65, 55, 41, ${0.18 - i * 0.035})`;
      ctx.lineWidth = i === 1 ? 1.2 : 0.65;
      if (i === 2) ctx.setLineDash([3, 9]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
    ctx.restore();

    this._drawTaiChi(ctx, cx, cy, r * 0.58, -rotation * 0.66);
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI / 2 + i * Math.PI / 4 + rotation;
      this._drawTrigram(ctx, cx, cy, trigrams[i], angle, r);
    }
  }

  _drawInkDrops(ctx, w, h) {
    ctx.save();
    this.inkDrops.forEach((p, i) => {
      const x = (p.x * w + Math.sin(this.time * p.drift + i) * 10 + w) % w;
      const y = (p.y * h + Math.cos(this.time * p.drift * 0.7 + i) * 7 + h) % h;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(45, 43, 37, ${p.a})`;
      ctx.fill();
    });
    ctx.restore();
  }

  animate(timestamp) {
    if (!this.ctx || !this.canvas || !this.running) return;
    timestamp = Number(timestamp || 0);
    // 背景是氛围层，不需要 60fps；约 30fps 足够，降低手机耗电与发热。
    if (!this.reduceMotion && timestamp && this.lastFrame && timestamp - this.lastFrame < 33) {
      this.frameId = requestAnimationFrame(t => this.animate(t));
      return;
    }
    this.lastFrame = timestamp;
    this.time += this.reduceMotion ? 0 : 0.014;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);
    this._drawPaperWash(ctx, w, h);
    this._drawMountains(ctx, w, h);
    this._drawInkDrops(ctx, w, h);

    const r = Math.min(w, h) * (w < 620 ? 0.16 : 0.195);
    this._drawBagua(ctx, this.cx, this.cy, r);

    if (this.reduceMotion) return;
    this.frameId = requestAnimationFrame(t => this.animate(t));
  }
}

// ============ 主应用 ============
class AppController {
  constructor() {
    this.init();
  }
  init() {
    new StarBackground('starCanvas');
  }
}

// ============ 全局工具函数 ============
function typewriter(element, text, speed = 50, callback) {
  let i = 0;
  element.textContent = '';
  const timer = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i++);
    } else {
      clearInterval(timer);
      if (callback) callback();
    }
  }, speed);
  return timer;
}

function typewriterHTML(element, htmlParts, speed = 50, callback) {
  let partIdx = 0;
  let charIdx = 0;
  element.innerHTML = '';
  const timer = setInterval(() => {
    if (partIdx >= htmlParts.length) {
      clearInterval(timer);
      if (callback) callback();
      return;
    }
    const part = htmlParts[partIdx];
    if (part.type === 'text') {
      if (charIdx < part.content.length) {
        element.appendChild(document.createTextNode(part.content.charAt(charIdx++)));
      } else {
        partIdx++;
        charIdx = 0;
      }
    } else {
      element.insertAdjacentHTML('beforeend', part.content);
      partIdx++;
      charIdx = 0;
    }
  }, speed);
  return timer;
}

function showEl(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) el.style.display = 'block';
}

function hideEl(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) el.style.display = 'none';
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ============ 水墨点击涟漪 ============
function createRipple(x, y) {
  const colors = [
    'rgba(134, 98, 43, .42)',
    'rgba(157, 48, 41, .25)',
    'rgba(50, 48, 41, .15)'
  ];
  colors.forEach((color, i) => {
    setTimeout(() => {
      const ripple = document.createElement('div');
      ripple.className = 'ripple-effect';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.border = `1px solid ${color}`;
      ripple.style.boxShadow = `0 0 ${4 + i * 2}px ${color}`;
      document.body.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
      setTimeout(() => ripple.remove(), 1200);
    }, i * 70);
  });
}

document.addEventListener('click', (e) => {
  const target = e.target;
  const isInteractive = target.closest('button, .tool-card, .nav-tab, .mini-card, .slot-card, .quiz-option-btn, .stick-tube, select, input[type="submit"]');
  if (isInteractive) createRipple(e.clientX, e.clientY);

  if (target.classList && target.classList.contains('tool-overlay') && !target.id.includes('paywall')) {
    target.classList.remove('active');
  }
});

// ============ 地址三级联动 ============
function initAddressCascade(prefix) {
  const provinceSel = document.getElementById(prefix + 'Province');
  const citySel = document.getElementById(prefix + 'City');
  const districtSel = document.getElementById(prefix + 'District');
  if (!provinceSel || !citySel || !districtSel || typeof CHINA_ADDRESS === 'undefined') return;

  Object.keys(CHINA_ADDRESS).forEach(p => {
    if ([...provinceSel.options].some(o => o.value === p)) return;
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    provinceSel.appendChild(opt);
  });

  provinceSel.addEventListener('change', () => {
    const province = provinceSel.value;
    citySel.innerHTML = '<option value="">市/区</option>';
    districtSel.innerHTML = '<option value="">县/区</option>';
    if (!province || !CHINA_ADDRESS[province]) return;
    Object.keys(CHINA_ADDRESS[province]).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      citySel.appendChild(opt);
    });
  });

  citySel.addEventListener('change', () => {
    const province = provinceSel.value;
    const city = citySel.value;
    districtSel.innerHTML = '<option value="">县/区</option>';
    if (!province || !city || !CHINA_ADDRESS[province] || !CHINA_ADDRESS[province][city]) return;
    CHINA_ADDRESS[province][city].forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      districtSel.appendChild(opt);
    });
  });
}

// ============ 联系我们 ============
function toggleContact(e) {
  const popup = document.getElementById('contactPopup');
  if (popup) popup.classList.toggle('show');
  if (e) e.stopPropagation();
}

function copyContact(text, btn) {
  const feedback = () => {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = '✓ 已复制';
    btn.classList.add('copy-success');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('copy-success');
    }, 1500);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(feedback).catch(() => fallbackCopy(text, feedback));
  } else {
    fallbackCopy(text, feedback);
  }
}

function fallbackCopy(text, callback) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  ta.remove();
  if (callback) callback();
}

// ============ 入场动画与整体微交互 ============
function enhanceDaoSplash() {
  const splash = document.getElementById('splashOverlay');
  if (!splash || splash.dataset.daoEnhanced === '1') return;
  splash.dataset.daoEnhanced = '1';
  splash.setAttribute('role', 'button');
  splash.setAttribute('tabindex', '0');
  splash.setAttribute('aria-label', '进入道问');

  const center = splash.querySelector('.splash-center');
  if (center) {
    const ring = document.createElement('div');
    ring.className = 'dao-splash-trigrams';
    ring.setAttribute('aria-hidden', 'true');
    const symbols = ['☰', '☱', '☲', '☳', '☷', '☵', '☶', '☴'];
    symbols.forEach((symbol, index) => {
      const item = document.createElement('span');
      item.className = 'dao-splash-trigram';
      item.textContent = symbol;
      item.style.setProperty('--dao-angle', `${index * 45}deg`);
      item.style.setProperty('--dao-angle-neg', `${index * -45}deg`);
      ring.appendChild(item);
    });
    center.insertBefore(ring, center.firstChild);
  }

  const seal = document.createElement('div');
  seal.className = 'dao-splash-seal';
  seal.setAttribute('aria-hidden', 'true');
  seal.innerHTML = '道<br>问';
  splash.appendChild(seal);

  const progress = document.createElement('div');
  progress.className = 'dao-splash-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  splash.appendChild(progress);

  const hint = splash.querySelector('.splash-hint');
  if (hint) hint.textContent = '轻触进入 · 将自动开启';

  splash.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.dismissSplash();
    }
  });

  let seen = false;
  try { seen = sessionStorage.getItem('daowen_splash_seen') === '1'; } catch (e) {}
  if (seen) {
    splash.classList.add('dao-splash-returning');
    setTimeout(() => window.dismissSplash(true), 90);
  } else {
    // 保留品牌入场感，但不强迫用户必须点击；约 2.6 秒自动进入。
    window.__daoSplashTimer = setTimeout(() => window.dismissSplash(), 2600);
  }
}

function installDaoDismissSplash() {
  window.dismissSplash = function (fast) {
    const el = document.getElementById('splashOverlay');
    if (!el || el.classList.contains('fade-out')) return;
    if (window.__daoSplashTimer) {
      clearTimeout(window.__daoSplashTimer);
      window.__daoSplashTimer = null;
    }
    try { sessionStorage.setItem('daowen_splash_seen', '1'); } catch (e) {}
    if (fast) el.classList.add('dao-splash-fast');
    el.classList.add('fade-out');
    const canvas = document.getElementById('starCanvas');
    if (canvas) canvas.style.zIndex = '0';
    const delay = fast ? 120 : 760;
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      document.body.classList.add('dao-entered');
    }, delay);
  };
}

function makeToolCardsAccessible() {
  document.querySelectorAll('.tool-card[onclick]').forEach(card => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

function addRevealMotion() {
  const targets = document.querySelectorAll('.section-header, .tool-card, .disclaimer-box');
  if (!targets.length) return;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('dao-reveal-visible'));
    return;
  }
  targets.forEach(el => el.classList.add('dao-reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('dao-reveal-visible');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(el => io.observe(el));
}

function initDaoUI() {
  installDaoDismissSplash();
  enhanceDaoSplash();
  makeToolCardsAccessible();
  addRevealMotion();
  document.documentElement.classList.add('dao-ink-theme-ready');
}

// ============ 启动应用 ============
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  initDaoUI();
});

// ============ 黑金首页、弹窗滚动锁与支付返回状态 ============
(function installDaoWenInteractiveShell() {
  const PAYMENT_STATE_KEY = 'daowen_payment_return_state_v1';

  function activeToolOverlay() {
    return Array.from(document.querySelectorAll('.tool-overlay.active'))
      .find(el => !/^paywall/.test(el.id || '')) || null;
  }

  function saveCurrentToolState() {
    const overlay = activeToolOverlay();
    const state = {
      overlayId: overlay ? overlay.id : '',
      pageScrollY: window.scrollY || 0,
      modalScrollTop: overlay && overlay.querySelector('.tool-modal') ? overlay.querySelector('.tool-modal').scrollTop : 0,
      fields: []
    };
    if (overlay) {
      overlay.querySelectorAll('input,select,textarea').forEach((field, index) => {
        if (field.type === 'file' || field.type === 'password') return;
        state.fields.push({
          key: field.id || field.name || String(index),
          index,
          type: field.type,
          value: field.value,
          checked: !!field.checked
        });
      });
    }
    try { sessionStorage.setItem(PAYMENT_STATE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function restoreToolState() {
    if (!/[?&]restore=1(?:&|$)/.test(location.search)) return;
    let state = null;
    try { state = JSON.parse(sessionStorage.getItem(PAYMENT_STATE_KEY) || 'null'); } catch (e) {}
    if (!state) return;
    const overlay = state.overlayId ? document.getElementById(state.overlayId) : null;
    if (overlay) {
      const fields = overlay.querySelectorAll('input,select,textarea');
      (state.fields || []).forEach(saved => {
        let field = saved.key && !/^\d+$/.test(saved.key) ? document.getElementById(saved.key) || overlay.querySelector('[name="' + CSS.escape(saved.key) + '"]') : fields[saved.index];
        if (!field) return;
        if (/^(checkbox|radio)$/.test(saved.type || '')) field.checked = saved.checked;
        else field.value = saved.value == null ? '' : saved.value;
        field.dispatchEvent(new Event('change', { bubbles: true }));
      });
      overlay.classList.add('active');
      const modal = overlay.querySelector('.tool-modal');
      if (modal) requestAnimationFrame(() => { modal.scrollTop = Number(state.modalScrollTop || 0); });
    } else {
      window.scrollTo(0, Number(state.pageScrollY || 0));
    }
    try { sessionStorage.removeItem(PAYMENT_STATE_KEY); } catch (e) {}
    history.replaceState(null, '', location.pathname + location.hash);
  }

  function syncBodyModalLock() {
    document.body.classList.toggle('dw-modal-open', !!activeToolOverlay() || !!document.querySelector('.tool-overlay.active'));
  }

  window.DaoWenUI = {
    PAYMENT_STATE_KEY,
    saveCurrentToolState,
    enter() {
      const hero = document.getElementById('daoHero');
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (hero && !reduced) hero.classList.add('dao-entering');
      setTimeout(() => {
        window.location.href = '/app';
      }, reduced ? 0 : 520);
    },
    openAI() {
      if (window.AIChat && typeof AIChat._show === 'function') AIChat._show();
    },
    toggleMore(event) {
      if (event) event.stopPropagation();
      const menu = document.getElementById('daoMoreMenu');
      if (!menu) return;
      const open = menu.classList.toggle('open');
      const trigger = document.querySelector('.dao-more-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', String(open));
    }
  };

  document.addEventListener('click', event => {
    const menu = document.getElementById('daoMoreMenu');
    if (menu && !event.target.closest('.dao-more-wrap')) menu.classList.remove('open');
  });
  const observer = new MutationObserver(syncBodyModalLock);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tool-overlay').forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['class'] }));
    syncBodyModalLock();
    setTimeout(restoreToolState, 180);
  });
})();
