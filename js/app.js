/**
 * 命理大全 — 主应用控制器
 * 负责导航切换、星空背景、全局状态管理
 */

// ============ 银河旋涡动态背景 ============
class StarBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.stars = [];
    this.time = 0;
    this.resize();
    this.initParticles();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cx = this.canvas.width / 2;
    this.cy = this.canvas.height / 2;
  }

  initParticles() {
    // 旋涡粒子（沿螺旋轨道运动）
    const count = Math.min(300, Math.floor((this.canvas.width * this.canvas.height) / 6000));
    this.particles = [];
    for (let i = 0; i < count; i++) {
      // 每个粒子有一个轨道半径和初始角度
      const orbitR = Math.random() * Math.min(this.canvas.width, this.canvas.height) * 0.55 + 20;
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        orbitR: orbitR,
        angle: angle,
        speed: (0.0003 + Math.random() * 0.0008) * (1 + orbitR / 300), // 内圈快外圈慢
        size: Math.random() * 2.2 + 0.4,
        brightness: Math.random() * 0.6 + 0.25,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        // 颜色：大部分金色，少数银白
        color: Math.random() < 0.7
          ? { r: 200 + Math.random() * 55, g: 160 + Math.random() * 40, b: 100 + Math.random() * 30 }
          : { r: 220 + Math.random() * 35, g: 220 + Math.random() * 35, b: 240 + Math.random() * 15 }
      });
    }

    // 亮星（固定位置闪烁）
    const starCount = 40;
    this.stars = [];
    for (let i = 0; i < starCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.min(this.canvas.width, this.canvas.height) * 0.5;
      this.stars.push({
        x: this.cx + Math.cos(angle) * dist,
        y: this.cy + Math.sin(angle) * dist,
        baseR: Math.random() * 1.3 + 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.025 + 0.008
      });
    }
  }

  animate() {
    this.time += 0.01;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = this.cx;
    const cy = this.cy;

    // 半透明覆盖产生拖尾效果
    ctx.fillStyle = 'rgba(10, 8, 20, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // === 旋涡光晕 ===
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.45);
    glowGrad.addColorStop(0, 'rgba(180, 140, 80, 0.08)');
    glowGrad.addColorStop(0.3, 'rgba(140, 100, 50, 0.04)');
    glowGrad.addColorStop(0.7, 'rgba(60, 30, 60, 0.02)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // === 旋涡粒子 ===
    for (const p of this.particles) {
      // 沿螺旋轨道运动
      p.angle += p.speed;
      // 轨道缓慢收缩和扩张
      const breath = 1 + Math.sin(this.time * 0.3 + p.orbitR * 0.01) * 0.08;
      const r = p.orbitR * breath;
      const x = cx + Math.cos(p.angle) * r;
      const y = cy + Math.sin(p.angle) * r * 0.7; // 稍微压扁形成椭圆

      // 闪烁
      p.twinklePhase += p.twinkleSpeed;
      const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);
      const alpha = p.brightness * (0.6 + twinkle * 0.4);

      // 越靠近中心越亮
      const distFactor = 1 - Math.min(1, r / (Math.min(w, h) * 0.45));
      const finalAlpha = alpha * (0.7 + distFactor * 0.3);

      if (x < -10 || x > w + 10 || y < -10 || y > h + 10) continue;

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${finalAlpha})`;
      ctx.fill();

      // 大粒子加辉光
      if (p.size > 1.4) {
        ctx.beginPath();
        ctx.arc(x, y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${finalAlpha * 0.12})`;
        ctx.fill();
      }
    }

    // === 旋臂结构（几条隐约的旋臂） ===
    const armCount = 3;
    for (let arm = 0; arm < armCount; arm++) {
      const baseAngle = this.time * 0.15 + (Math.PI * 2 / armCount) * arm;
      ctx.beginPath();
      for (let i = 0; i < 120; i++) {
        const t = i / 120;
        const r = t * Math.min(w, h) * 0.45;
        const spiralAngle = baseAngle + t * Math.PI * 1.8;
        const x = cx + Math.cos(spiralAngle) * r;
        const y = cy + Math.sin(spiralAngle) * r * 0.7;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(180,150,100,${0.04 + Math.sin(this.time * 0.2 + arm) * 0.02})`;
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // === 亮星 ===
    for (const star of this.stars) {
      star.phase += star.speed;
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(star.phase));
      // 十字光芒
      const size = star.baseR * (1 + Math.sin(star.phase) * 0.5);

      ctx.beginPath();
      ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,240,220,${alpha})`;
      ctx.fill();

      // 光芒
      ctx.beginPath();
      ctx.arc(star.x, star.y, size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,200,160,${alpha * 0.15})`;
      ctx.fill();

      // 十字光线
      if (alpha > 0.7) {
        ctx.strokeStyle = `rgba(255,240,220,${alpha * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(star.x - size * 6, star.y);
        ctx.lineTo(star.x + size * 6, star.y);
        ctx.moveTo(star.x, star.y - size * 6);
        ctx.lineTo(star.x, star.y + size * 6);
        ctx.stroke();
      }
    }

    // === 中心亮点 ===
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    coreGrad.addColorStop(0, 'rgba(240,210,160,0.7)');
    coreGrad.addColorStop(0.3, 'rgba(200,160,100,0.25)');
    coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();

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

// ============ 启动应用 ============
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
