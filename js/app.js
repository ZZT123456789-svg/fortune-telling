/**
 * 命理大全 — 主应用控制器
 * 负责导航切换、星空背景、全局状态管理
 */

// ============ 星空粒子背景 ============
class StarBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.resize();
    this.initStars();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initStars() {
    // 降低粒子密度，减少性能压力
    const count = Math.min(80, Math.floor((this.canvas.width * this.canvas.height) / 18000));
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.015 + 0.003,
        opacity: Math.random() * 0.5 + 0.25
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const star of this.stars) {
      star.twinkle += star.speed;
      const alpha = star.opacity + Math.sin(star.twinkle) * 0.3;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(200, 180, 140, ${Math.max(0, Math.min(1, alpha))})`;
      this.ctx.fill();
    }

    // 缓慢移动星星模拟星空旋转
    for (const star of this.stars) {
      star.x += 0.03;
      if (star.x > this.canvas.width) star.x = 0;
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

// ============ 启动应用 ============
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
