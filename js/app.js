/**
 * 命理大全 — 主应用控制器
 * 负责导航切换、星空背景、全局状态管理
 */


// ============ 混沌太极 · 水墨泼溅 · 巨物感 ============
class StarBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.time = 0;
    this.ripples = []; // 鼠标涟漪
    this.mouseX = -100;
    this.mouseY = -100;
    this.resize();
    this.animate();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => { this.mouseX = e.clientX; this.mouseY = e.clientY; });
    window.addEventListener('click', (e) => { this.ripples.push({ x: e.clientX, y: e.clientY, r: 0, life: 1 }); });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cx = this.canvas.width / 2;
    this.cy = this.canvas.height / 2;
  }

  /** 水墨太极 — 边缘柔化、水中漂浮感 */
  _drawInkTaiChi(ctx, cx, cy, r, angle) {
    var self = this;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // 水中漂浮微动
    var wobbleY = Math.sin(this.time * 0.6) * 3;
    ctx.translate(0, wobbleY);

    // 阴阳鱼大圆 — 水墨毛边效果
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    var grad = ctx.createRadialGradient(0, -r*0.1, r*0.3, 0, 0, r);
    grad.addColorStop(0, 'rgba(40,40,40,0.95)');
    grad.addColorStop(0.5, 'rgba(20,20,20,0.85)');
    grad.addColorStop(1, 'rgba(10,10,10,0.6)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,100,100,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 白色鱼（右半）— 柔光白
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI/2, Math.PI/2);
    ctx.fillStyle = 'rgba(200,200,200,0.3)';
    ctx.fill();

    // 黑色鱼（左半）— 深黑
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI/2, -Math.PI/2);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fill();

    // 上鱼眼（黑中白）— 白光晕
    var eyeR = r * 0.08;
    ctx.beginPath();
    ctx.arc(0, -r/2, r*0.45, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(220,220,220,0.25)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -r/2, eyeR, 0, Math.PI*2);
    var eyeGrad = ctx.createRadialGradient(0, -r/2, 0, 0, -r/2, eyeR);
    eyeGrad.addColorStop(0, '#fff');
    eyeGrad.addColorStop(0.5, '#ddd');
    eyeGrad.addColorStop(1, 'rgba(200,200,200,0.3)');
    ctx.fillStyle = eyeGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 下鱼眼（白中黑）— 黑光晕
    ctx.beginPath();
    ctx.arc(0, r/2, r*0.45, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, r/2, eyeR, 0, Math.PI*2);
    var eyeGrad2 = ctx.createRadialGradient(0, r/2, 0, 0, r/2, eyeR);
    eyeGrad2.addColorStop(0, '#000');
    eyeGrad2.addColorStop(0.5, '#111');
    eyeGrad2.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = eyeGrad2;
    ctx.fill();

    ctx.restore();
  }

  animate() {
    this.time += 0.012;
    var ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    var cx = this.cx, cy = this.cy, minD = Math.min(w, h);

    // 水墨纸纹 — 灰白基底+不规则墨迹
    ctx.fillStyle = 'rgba(245,240,232,0.25)';
    ctx.fillRect(0, 0, w, h);

    // === 水墨泼溅 — 随机大块墨迹 ===
    ctx.save();
    for (var s = 0; s < 5; s++) {
      var sx = cx + Math.sin(this.time*0.3 + s*2.1) * minD*0.4;
      var sy = cy + Math.cos(this.time*0.25 + s*1.7) * minD*0.3;
      var sr = minD * (0.08 + s*0.04);
      var grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      grad.addColorStop(0, 'rgba(0,0,0,' + (0.04 + Math.sin(this.time+s)*0.02) + ')');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.02)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    // === 旋转气流层（黑白双旋） ===
    for (var l = 0; l < 3; l++) {
      var spiralR = minD * (0.25 + l*0.15);
      ctx.beginPath();
      for (var a = 0; a < Math.PI*2; a += 0.05) {
        var r = spiralR + Math.sin(a*3 + this.time*0.5 + l) * minD*0.1;
        var px = cx + Math.cos(a + this.time*0.15) * r;
        var py = cy + Math.sin(a + this.time*0.15) * r;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(' + (l===0?0:40) + ',' + (l===0?0:40) + ',' + (l===0?0:40) + ',' + (0.04-l*0.01) + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // === 巨物太极（大尺寸、强对比） ===
    var taiChiR = minD * 0.22;
    var rotAngle = this.time * 0.1;
    this._drawInkTaiChi(ctx, cx, cy, taiChiR, rotAngle);

    // === 外围双环（水墨笔触） ===
    for (var j = 0; j < 4; j++) {
      var gr = taiChiR * (1.15 + j*0.2);
      ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(0,0,0,' + (0.12-j*0.025) + ')';
      ctx.lineWidth = 2 - j*0.3;
      ctx.setLineDash([12+j*6, 16+j*8]);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // === 飞溅墨点 ===
    for (var k = 0; k < 60; k++) {
      var seed = k * 137.5;
      var orbR = taiChiR * 1.2 + (seed % minD * 0.3);
      var pAngle = this.time * 0.06 + seed;
      var px = cx + Math.cos(pAngle)*orbR + Math.sin(this.time*0.4+k)*minD*0.05;
      var py = cy + Math.sin(pAngle)*orbR*0.6 + Math.cos(this.time*0.35+k)*minD*0.04;
      var pSize = 0.5 + (k%5)*0.7;
      var alpha = 0.08 + Math.sin(this.time*0.5+k)*0.04;
      ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,' + Math.max(0,alpha) + ')';
      ctx.fill();
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ============ 导航控制器 (简化版) ============
class AppController {
  constructor() {
    this.init();
  }

  init() {
    // 星空背景
    new StarBackground('starCanvas');
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
  // 点击覆盖层背景关闭（排除paywall弹窗）
  if (target.classList.contains('tool-overlay') && !target.id.includes('paywall')) {
    target.classList.remove('active');
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

// ============ 联系我们 ============
function toggleContact(e) {
  var popup = document.getElementById('contactPopup');
  if (popup) popup.classList.toggle('show');
  if (e) e.stopPropagation();
}
function copyContact(text, btn) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      var orig = btn.textContent;
      btn.textContent = '✅ 复制成功';
      btn.style.color = '#3cb371';
      setTimeout(function() { btn.textContent = orig; btn.style.color = ''; }, 1500);
    });
  } else {
    // Fallback
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
    var orig = btn.textContent;
    btn.textContent = '✅ 复制成功';
    btn.style.color = '#3cb371';
    setTimeout(function() { btn.textContent = orig; btn.style.color = ''; }, 1500);
  }
}

// ============ 鼠标跟随卡片光效 ============
document.addEventListener('mousemove', function(e) {
  document.querySelectorAll('.tool-card').forEach(function(card) {
    var rect = card.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    card.style.setProperty('--mx', x + 'px');
    card.style.setProperty('--my', y + 'px');
  });
});

// ============ 启动应用 ============
document.addEventListener('DOMContentLoaded', () => {
  // 主应用 - 星空背景
  window.app = new AppController();
});
