/**
 * 命理大全 — 主应用控制器
 * 负责导航切换、星空背景、全局状态管理
 */

// ============ 开场动画 ============
class SplashAnimation {
  constructor() {
    this.canvas = document.getElementById('splashCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.particles = [];
    this.resize();
    this.initParticles();
    this.animate();
    window.addEventListener('resize', () => this.resize());

    // 点击进入
    const splash = document.getElementById('splashScreen');
    splash.addEventListener('click', () => {
      splash.classList.add('fade-out');
      setTimeout(() => splash.remove(), 800);
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cx = this.canvas.width / 2;
    this.cy = this.canvas.height / 2;
  }

  initParticles() {
    const count = 200;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.min(this.canvas.width, this.canvas.height) * 0.5;
      this.particles.push({
        x: this.cx + Math.cos(angle) * dist,
        y: this.cy + Math.sin(angle) * dist,
        baseX: this.cx + Math.cos(angle) * dist,
        baseY: this.cy + Math.sin(angle) * dist,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() < 0.5 ? '200,180,140' : '220,220,230'
      });
    }
  }

  /** 绘制太极图 - 快速旋转 */
  _drawTaiChi(ctx, cx, cy, r, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // 外圈光晕
    const glowGrad = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.25);
    glowGrad.addColorStop(0, 'rgba(201,169,110,0)');
    glowGrad.addColorStop(0.5, 'rgba(201,169,110,0.25)');
    glowGrad.addColorStop(1, 'rgba(201,169,110,0)');
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // 外圈环
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(201,169,110,0.7)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 白色半圆（右）
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = '#f0ede0';
    ctx.fill();

    // 黑色半圆（左）
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2);
    ctx.fillStyle = '#0a0a14';
    ctx.fill();

    // 上半太极眼
    ctx.beginPath();
    ctx.arc(0, -r / 2, r / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#f0ede0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r / 2, r / 7, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a14';
    ctx.fill();

    // 下半太极眼
    ctx.beginPath();
    ctx.arc(0, r / 2, r / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a14';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, r / 2, r / 7, 0, Math.PI * 2);
    ctx.fillStyle = '#f0ede0';
    ctx.fill();

    ctx.restore();
  }

  /** 绘制卦爻 */
  _drawTrigram(ctx, cx, cy, trigram, angle, baguaR) {
    const barW = baguaR * 0.08;
    const barH = baguaR * 0.018;
    const gap = baguaR * 0.03;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const dist = baguaR * 0.72;
    ctx.translate(0, -dist);

    for (let i = 0; i < 3; i++) {
      const y = (i - 1) * (barH + gap + barH);
      ctx.fillStyle = 'rgba(220,210,180,0.8)';
      if (trigram[i] === 1) {
        ctx.fillRect(-barW / 2, y, barW, barH);
      } else {
        const seg = barW * 0.36;
        ctx.fillRect(-barW / 2, y, seg, barH);
        ctx.fillRect(barW / 2 - seg, y, seg, barH);
      }
    }
    ctx.restore();
  }

  animate() {
    // 快速旋转
    this.time += 0.04;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = this.cx;
    const cy = this.cy;
    const minDim = Math.min(w, h);

    // 半透明覆盖产生拖尾
    ctx.fillStyle = 'rgba(6, 6, 15, 0.3)';
    ctx.fillRect(0, 0, w, h);

    const baguaR = minDim * 0.2;
    const rotationSpeed = this.time * 1.5; // 快速旋转

    // === 外层扩散光环 ===
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ringPhase = (this.time * 0.6 + i * 2.1) % 2.1;
      const ringR = baguaR * 1.4 + ringPhase * baguaR * 1.3;
      const alpha = (1 - ringPhase / 2.1) * 0.35;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(201,169,110,${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // === 旋转太极 ===
    this._drawTaiChi(ctx, cx, cy, baguaR, rotationSpeed);

    // === 八卦 ===
    const trigrams = [
      [1,1,1],[0,1,1],[1,0,1],[0,0,1],
      [1,1,0],[0,1,0],[1,0,0],[0,0,0]
    ];
    const names = ['乾','兑','离','震','巽','坎','艮','坤'];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i - Math.PI / 2 + rotationSpeed * 0.5;
      this._drawTrigram(ctx, cx, cy, trigrams[i], angle, baguaR);

      // 卦名
      const labelR = baguaR * 0.88;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      ctx.fillStyle = 'rgba(200,180,140,0.6)';
      ctx.font = `${baguaR * 0.1}px "KaiTi","STKaiti",serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(names[i], lx, ly);
    }

    // === 旋转粒子环 ===
    const particleRingCount = 60;
    for (let i = 0; i < particleRingCount; i++) {
      const pAngle = (Math.PI * 2 / particleRingCount) * i + this.time * 1.2;
      const pDist = baguaR * 1.1 + Math.sin(this.time * 1.8 + i) * baguaR * 0.15;
      const px = cx + Math.cos(pAngle) * pDist;
      const py = cy + Math.sin(pAngle) * pDist;
      const alpha = 0.4 + Math.sin(this.time * 2 + i) * 0.3;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,200,150,${alpha})`;
      ctx.fill();
    }

    // === 漂浮粒子 ===
    for (const p of this.particles) {
      p.phase += p.speed;
      const floatAngle = this.time * 0.4 + p.phase;
      const floatR = 3 + Math.sin(floatAngle) * 2;
      p.x = p.baseX + Math.cos(floatAngle) * floatR;
      p.y = p.baseY + Math.sin(floatAngle) * floatR * 0.7;

      const alpha = 0.2 + Math.sin(p.phase) * 0.15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${Math.max(0, alpha)})`;
      ctx.fill();
    }

    // === 中心光点 ===
    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baguaR * 0.15);
    coreGlow.addColorStop(0, 'rgba(240,210,160,0.8)');
    coreGlow.addColorStop(0.5, 'rgba(200,160,100,0.2)');
    coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, baguaR * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // === 光线射线 ===
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const rayAngle = (Math.PI * 2 / rayCount) * i + this.time * 0.5;
      const rayLen = baguaR * 1.6 + Math.sin(this.time * 0.7 + i) * baguaR * 0.3;
      const rayAlpha = 0.06 + Math.sin(this.time + i) * 0.03;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rayAngle) * baguaR * 0.95, cy + Math.sin(rayAngle) * baguaR * 0.95);
      ctx.lineTo(cx + Math.cos(rayAngle) * rayLen, cy + Math.sin(rayAngle) * rayLen);
      ctx.strokeStyle = `rgba(201,169,110,${rayAlpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ============ 旋转八卦 + 水流动态背景 ============
class StarBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.resize();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cx = this.canvas.width / 2;
    this.cy = this.canvas.height / 2;
  }

  /** 绘制阴阳太极 */
  _drawTaiChi(ctx, cx, cy, r, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // 大圆
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,180,180,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 白色半圆（右）
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = '#e8e8e8';
    ctx.fill();

    // 黑色半圆（左）
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    // 上小圆（黑）+ 黑中白点
    ctx.beginPath();
    ctx.arc(0, -r / 2, r / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#e8e8e8';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r / 2, r / 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();

    // 下小圆（白）+ 白中黑点
    ctx.beginPath();
    ctx.arc(0, r / 2, r / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, r / 2, r / 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e8e8e8';
    ctx.fill();

    ctx.restore();
  }

  /** 绘制一个卦爻 */
  _drawTrigram(ctx, cx, cy, trigram, angle, baguaR) {
    // trigram: 3-element array, 1=yang(solid), 0=yin(broken)
    const barWidth = baguaR * 0.12;
    const barHeight = baguaR * 0.025;
    const gap = baguaR * 0.04;
    const totalH = barHeight * 3 + gap * 2 + barHeight * 4; // 3 bars + gaps

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // 移动到八卦圈位置
    const dist = baguaR * 0.68;
    ctx.translate(0, -dist);

    for (let i = 0; i < 3; i++) {
      const y = (i - 1) * (barHeight + gap + barHeight);
      if (trigram[i] === 1) {
        // 阳爻：实线
        ctx.fillStyle = 'rgba(220,220,220,0.6)';
        ctx.fillRect(-barWidth / 2, y, barWidth, barHeight);
      } else {
        // 阴爻：两段短线
        const segW = barWidth * 0.35;
        ctx.fillStyle = 'rgba(220,220,220,0.6)';
        ctx.fillRect(-barWidth / 2, y, segW, barHeight);
        ctx.fillRect(barWidth / 2 - segW, y, segW, barHeight);
      }
    }

    ctx.restore();
  }

  animate() {
    this.time += 0.008;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = this.cx;
    const cy = this.cy;
    const minDim = Math.min(w, h);

    // 深色半透明覆盖产生拖尾
    ctx.fillStyle = 'rgba(8, 8, 12, 0.22)';
    ctx.fillRect(0, 0, w, h);

    // === 水流波纹 ===
    ctx.save();
    for (let layer = 0; layer < 3; layer++) {
      const amp = 18 + layer * 12;
      const freq = 0.012 + layer * 0.004;
      const speed = this.time * (0.6 + layer * 0.3);
      const alpha = 0.04 + layer * 0.02;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w; x += 4) {
        const y1 = cy + Math.sin(x * freq + speed) * amp + Math.sin(x * 0.02 + speed * 1.3) * amp * 0.5;
        if (x === 0) ctx.moveTo(x, 0);
        ctx.lineTo(x, y1);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = `rgba(180,180,190,${alpha})`;
      ctx.fill();

      // 反向波纹
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const y2 = cy + Math.sin(x * freq - speed * 0.7) * amp * 0.8 + Math.cos(x * 0.015 - speed) * amp * 0.4;
        ctx.lineTo(x, y2);
      }
      ctx.lineTo(w, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = `rgba(160,160,170,${alpha * 0.7})`;
      ctx.fill();
    }
    ctx.restore();

    // === 环形水波 ===
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
      const baseR = minDim * 0.18 + i * minDim * 0.1;
      const waveR = baseR + Math.sin(this.time * 0.5 + i) * 15;
      ctx.beginPath();
      ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,180,190,${0.06 - i * 0.01})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // === 旋转太极图 ===
    const baguaR = minDim * 0.2; // 八卦半径
    const rotationAngle = this.time * 0.3; // 缓慢旋转
    this._drawTaiChi(ctx, cx, cy, baguaR, rotationAngle);

    // === 八卦外圈 ===
    ctx.beginPath();
    ctx.arc(cx, cy, baguaR * 1.05, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180,180,190,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, baguaR * 0.68, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(180,180,190,0.2)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // === 八个卦象 ===
    // 先天八卦：乾兑离震 巽坎艮坤
    const trigrams = [
      [1, 1, 1], // ☰ 乾 (top)
      [0, 1, 1], // ☱ 兑
      [1, 0, 1], // ☲ 离
      [0, 0, 1], // ☳ 震
      [1, 1, 0], // ☴ 巽
      [0, 1, 0], // ☵ 坎
      [1, 0, 0], // ☶ 艮
      [0, 0, 0]  // ☷ 坤
    ];

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i - Math.PI / 2 + rotationAngle * 0.3;
      this._drawTrigram(ctx, cx, cy, trigrams[i], angle, baguaR);
    }

    // === 卦名小字 ===
    const names = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i - Math.PI / 2 + rotationAngle * 0.3;
      const labelR = baguaR * 0.85;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      ctx.fillStyle = 'rgba(200,200,210,0.4)';
      ctx.font = `${baguaR * 0.12}px "KaiTi","STKaiti",serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(names[i], lx, ly);
    }
    ctx.restore();

    // === 散落粒子（水墨感） ===
    const particleCount = 35;
    for (let i = 0; i < particleCount; i++) {
      const seed = i * 137.5;
      const orbitR = baguaR * 1.2 + (seed % minDim * 0.3);
      const pAngle = this.time * 0.15 + seed;
      const px = cx + Math.cos(pAngle) * orbitR;
      const py = cy + Math.sin(pAngle) * orbitR * 0.7;
      const pSize = 1 + (i % 3) * 0.8;
      const alpha = 0.15 + Math.sin(this.time * 0.8 + i) * 0.1;

      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${180 + (i % 40)},${180 + (i % 40)},${190 + (i % 30)},${Math.max(0, alpha)})`;
      ctx.fill();
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ============ 导航控制器 ============
class AppController {
  constructor() {
    this.currentTab = 'ai';
    this.init();
  }

  init() {
    // 星空背景
    new StarBackground('starCanvas');

    // 导航点击事件
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // 显示默认模块
    this.switchTab('ai');
  }

  switchTab(tabName) {
    // 更新导航高亮
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    // 隐藏所有模块
    document.querySelectorAll('.module').forEach(m => m.style.display = 'none');

    // 显示目标模块
    const moduleEl = document.getElementById(`module-${tabName}`);
    if (moduleEl) {
      moduleEl.style.display = 'block';
      moduleEl.style.animation = 'fadeIn 0.4s ease';
    }

    this.currentTab = tabName;

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ============ 全局工具函数 ============

/** 打字机效果 */
function typewriter(element, text, speed = 50, callback) {
  let i = 0;
  element.textContent = '';
  const timer = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(timer);
      if (callback) callback();
    }
  }, speed);
  return timer;
}

/** HTML 安全的打字机效果 */
function typewriterHTML(element, htmlParts, speed = 50, callback) {
  // htmlParts: [{type:'text', content:'...'}, {type:'html', content:'...'}]
  let partIdx = 0, charIdx = 0;
  const container = element;
  container.innerHTML = '';

  const timer = setInterval(() => {
    if (partIdx >= htmlParts.length) {
      clearInterval(timer);
      if (callback) callback();
      return;
    }

    const part = htmlParts[partIdx];
    if (part.type === 'text') {
      if (charIdx < part.content.length) {
        container.textContent += part.content.charAt(charIdx);
        charIdx++;
      } else {
        partIdx++;
        charIdx = 0;
      }
    } else if (part.type === 'html') {
      container.innerHTML += part.content;
      partIdx++;
      charIdx = 0;
    }
  }, speed);
  return timer;
}

/** 显示元素 */
function showEl(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) el.style.display = 'block';
}

/** 隐藏元素 */
function hideEl(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (el) el.style.display = 'none';
}

/** 随机整数 [min, max] */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 随机选择数组元素 */
function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Fisher-Yates 洗牌 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 获取今天的日期字符串 YYYY-MM-DD */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ============ 滴水涟漪点击反馈 ============
function createRipple(x, y) {
  // 创建3层涟漪，模拟水滴效果
  const colors = ['rgba(201,169,110,0.7)', 'rgba(212,165,116,0.5)', 'rgba(180,150,110,0.35)'];
  const delays = [0, 80, 160]; // 每层间隔出现

  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const ripple = document.createElement('div');
      ripple.className = 'ripple-effect';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.border = `2px solid ${colors[i]}`;
      ripple.style.boxShadow = `0 0 ${6 + i * 3}px ${colors[i]}`;
      document.body.appendChild(ripple);

      // 动画结束后移除
      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    }, delays[i]);
  }
}

// 监听所有可交互元素的点击
document.addEventListener('click', (e) => {
  const target = e.target;
  // 检查是否为可交互元素
  const isInteractive = target.closest('button, .nav-tab, .mini-card, .slot-card, .quiz-option-btn, .stick-tube, select, input[type="submit"]');
  if (isInteractive) {
    createRipple(e.clientX, e.clientY);
  }
});

// ============ 地址三级联动 ============
function initAddressCascade(prefix) {
  const provinceSel = document.getElementById(prefix + 'Province');
  const citySel = document.getElementById(prefix + 'City');
  const districtSel = document.getElementById(prefix + 'District');
  if (!provinceSel || !citySel || !districtSel) return;

  // 填充省份
  const provinces = Object.keys(CHINA_ADDRESS);
  provinces.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    provinceSel.appendChild(opt);
  });

  // 省份变化 -> 更新城市
  provinceSel.addEventListener('change', () => {
    const province = provinceSel.value;
    citySel.innerHTML = '<option value="">市/区</option>';
    districtSel.innerHTML = '<option value="">县/区</option>';

    if (province && CHINA_ADDRESS[province]) {
      const cities = Object.keys(CHINA_ADDRESS[province]);
      cities.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        citySel.appendChild(opt);
      });
    }
  });

  // 城市变化 -> 更新区县
  citySel.addEventListener('change', () => {
    const province = provinceSel.value;
    const city = citySel.value;
    districtSel.innerHTML = '<option value="">县/区</option>';

    if (province && city && CHINA_ADDRESS[province] && CHINA_ADDRESS[province][city]) {
      const districts = CHINA_ADDRESS[province][city];
      districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        districtSel.appendChild(opt);
      });
    }
  });
}

// ============ 启动应用 ============
document.addEventListener('DOMContentLoaded', () => {
  // 开场动画
  new SplashAnimation();
  // 主应用
  window.app = new AppController();
  initAddressCascade('ai');
  initAddressCascade('bazi');
});
