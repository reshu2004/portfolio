// ── Navbar scroll ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  highlightNav();
});

// ── Hamburger ──
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// ── Sliding pill ──
const pill = document.getElementById('nav-pill');

function movePill(el) {
  if (!pill || !el) return;
  const listRect = navLinks.getBoundingClientRect();
  const linkRect = el.getBoundingClientRect();
  pill.style.left   = (linkRect.left - listRect.left) + 'px';
  pill.style.width  = linkRect.width + 'px';
  pill.style.top    = (linkRect.top  - listRect.top)  + 'px';
  pill.style.height = linkRect.height + 'px';
  pill.style.opacity = '1';
}

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('mouseenter', () => movePill(a));
});

navLinks.addEventListener('mouseleave', () => {
  const active = navLinks.querySelector('a.active');
  if (active) movePill(active);
  else pill.style.opacity = '0';
});

// ── Active nav highlight ──
function highlightNav() {
  let current = '';
  document.querySelectorAll('section[id]').forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    const isActive = a.getAttribute('href') === `#${current}`;
    a.classList.toggle('active', isActive);
    if (isActive) movePill(a);
  });
}

// ── Photo: hide placeholder if image loads ──
const img = document.getElementById('profile-img');
const placeholder = document.getElementById('photo-placeholder');
if (img) {
  img.onload  = () => { placeholder.style.display = 'none'; img.style.display = 'block'; };
  img.onerror = () => { img.style.display = 'none'; placeholder.style.display = 'flex'; };
  if (img.complete && img.naturalWidth) {
    placeholder.style.display = 'none';
  } else {
    img.style.display = 'none';
  }
}

// ── Scroll reveal ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('section, .project-card, .cert-card, .edu-card, .contact-card, .skill-card, .about-card, .training-card').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

// ── Contact Form → mailto ──
const form       = document.getElementById('contact-form');
const sendBtn    = document.getElementById('send-btn');
const formStatus = document.getElementById('form-status');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const name    = form.from_name.value.trim();
  const email   = form.reply_to.value.trim();
  const subject = form.subject.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !subject || !message) {
    formStatus.textContent = '⚠ Please fill in all fields.';
    formStatus.className = 'form-status error';
    return;
  }

  const body   = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
  const gmailURL = `https://mail.google.com/mail/?view=cm&to=kumarreshu663@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.open(gmailURL, '_blank');

  formStatus.textContent = '✓ Your email app is opening — just hit Send!';
  formStatus.className = 'form-status success';
  form.reset();
});

// ── Chain Theme Toggle ──
const chainCanvas  = document.getElementById('chain-canvas');
const chainCtx     = chainCanvas.getContext('2d');
const celestialBtn = document.getElementById('celestial-btn');
const chainAnchor  = document.getElementById('chain-anchor');

function resizeChainCanvas() {
  chainCanvas.width  = window.innerWidth;
  chainCanvas.height = window.innerHeight;
}
resizeChainCanvas();
window.addEventListener('resize', () => { resizeChainCanvas(); resetHandle(); });

let isLight = localStorage.getItem('theme') === 'light';
if (isLight) { document.body.classList.add('light'); celestialBtn.textContent = '☀️'; }

// anchor = further left of the celestial button
function getAnchor() {
  const r = chainAnchor.getBoundingClientRect();
  return { x: r.left - 18, y: r.top + r.height / 2 };
}

const REST_DROP  = 130; // how far down the handle rests
const SEGMENTS   = 16;
const TRIGGER_DOWN = 70; // downward pull to trigger

let hx, hy, vx = 0, vy = 0;
function resetHandle() {
  const a = getAnchor();
  hx = a.x;
  hy = a.y + REST_DROP;
}
resetHandle();

let dragging = false, offX = 0, offY = 0;
let toggledThisDrag = false;
let raf;

// ── sparkle particles on toggle ──
let sparks = [];
function spawnSparks() {
  const a = getAnchor();
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    sparks.push({
      x: hx, y: hy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, decay: 0.03 + Math.random() * 0.03,
      r: 2 + Math.random() * 3,
      color: document.body.classList.contains('light')
        ? `hsl(${40 + Math.random()*30},100%,${60+Math.random()*20}%)`
        : `hsl(${200 + Math.random()*60},100%,${70+Math.random()*20}%)`
    });
  }
}

function drawChain() {
  chainCtx.clearRect(0, 0, chainCanvas.width, chainCanvas.height);
  const a     = getAnchor();
  const light = document.body.classList.contains('light');

  // metallic colors
  const hi   = light ? '#ffe066' : '#c8d8f0';
  const mid  = light ? '#c8860a' : '#5a7a9a';
  const lo   = light ? '#8a5a00' : '#2a4a6a';
  const glow = light ? 'rgba(255,210,50,0.6)' : 'rgba(100,160,255,0.5)';

  // ── draw chain links ──
  for (let i = 0; i < SEGMENTS; i++) {
    const t0 = i / SEGMENTS, t1 = (i + 1) / SEGMENTS;
    // catenary curve — sags naturally
    const sag0 = Math.sin(t0 * Math.PI) * Math.abs(hx - a.x) * 0.35;
    const sag1 = Math.sin(t1 * Math.PI) * Math.abs(hx - a.x) * 0.35;
    const x0 = a.x + (hx - a.x) * t0;
    const y0 = a.y + (hy - a.y) * t0 + sag0;
    const x1 = a.x + (hx - a.x) * t1;
    const y1 = a.y + (hy - a.y) * t1 + sag1;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const angle = Math.atan2(y1 - y0, x1 - x0);
    const isOdd = i % 2 === 0;

    chainCtx.save();
    chainCtx.translate(mx, my);
    chainCtx.rotate(isOdd ? angle : angle + Math.PI / 2);

    const lw = 14, lh = 8;
    // metallic gradient
    const lg = chainCtx.createLinearGradient(-lw/2, -lh/2, lw/2, lh/2);
    lg.addColorStop(0,    hi);
    lg.addColorStop(0.35, mid);
    lg.addColorStop(0.65, hi);
    lg.addColorStop(1,    lo);

    // outer oval
    chainCtx.beginPath();
    chainCtx.ellipse(0, 0, lw/2, lh/2, 0, 0, Math.PI*2);
    chainCtx.fillStyle = lg;
    chainCtx.fill();
    chainCtx.strokeStyle = lo;
    chainCtx.lineWidth = 0.8;
    chainCtx.stroke();

    // inner hole (gives 3D link look)
    chainCtx.beginPath();
    chainCtx.ellipse(0, 0, lw/2 - 4, lh/2 - 2.8, 0, 0, Math.PI*2);
    chainCtx.fillStyle = light ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.5)';
    chainCtx.fill();

    // shine highlight
    chainCtx.beginPath();
    chainCtx.ellipse(-lw/5, -lh/4, lw/6, lh/6, -0.4, 0, Math.PI*2);
    chainCtx.fillStyle = 'rgba(255,255,255,0.45)';
    chainCtx.fill();

    chainCtx.restore();
  }

  // ── handle: ornate pull ring ──
  // outer glow
  const og = chainCtx.createRadialGradient(hx, hy, 4, hx, hy, 28);
  og.addColorStop(0, glow);
  og.addColorStop(1, 'transparent');
  chainCtx.beginPath();
  chainCtx.arc(hx, hy, 28, 0, Math.PI*2);
  chainCtx.fillStyle = og;
  chainCtx.fill();

  // outer decorative ring
  const rg = chainCtx.createRadialGradient(hx-3, hy-3, 1, hx, hy, 13);
  rg.addColorStop(0, hi);
  rg.addColorStop(0.5, mid);
  rg.addColorStop(1, lo);
  chainCtx.beginPath();
  chainCtx.arc(hx, hy, 13, 0, Math.PI*2);
  chainCtx.fillStyle = rg;
  chainCtx.fill();
  chainCtx.strokeStyle = lo;
  chainCtx.lineWidth = 1;
  chainCtx.stroke();

  // inner gem
  const gemColor = light
    ? chainCtx.createRadialGradient(hx-2, hy-2, 1, hx, hy, 7)
    : chainCtx.createRadialGradient(hx-2, hy-2, 1, hx, hy, 7);
  gemColor.addColorStop(0, light ? '#fff9c0' : '#b0d4ff');
  gemColor.addColorStop(0.6, light ? '#ffd700' : '#4488cc');
  gemColor.addColorStop(1, light ? '#c8860a' : '#1a3a6a');
  chainCtx.beginPath();
  chainCtx.arc(hx, hy, 7, 0, Math.PI*2);
  chainCtx.fillStyle = gemColor;
  chainCtx.fill();

  // gem sparkle
  chainCtx.beginPath();
  chainCtx.arc(hx - 2, hy - 2, 2.5, 0, Math.PI*2);
  chainCtx.fillStyle = 'rgba(255,255,255,0.75)';
  chainCtx.fill();

  // tiny star on gem
  chainCtx.save();
  chainCtx.translate(hx + 3, hy + 3);
  chainCtx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let s = 0; s < 4; s++) {
    chainCtx.rotate(Math.PI / 2);
    chainCtx.beginPath();
    chainCtx.moveTo(0, 0); chainCtx.lineTo(0.5, 2.5); chainCtx.lineTo(0, 1.5);
    chainCtx.fill();
  }
  chainCtx.restore();

  // ── sparkles ──
  sparks = sparks.filter(s => s.life > 0);
  sparks.forEach(s => {
    chainCtx.save();
    chainCtx.globalAlpha = s.life;
    chainCtx.beginPath();
    chainCtx.arc(s.x, s.y, s.r * s.life, 0, Math.PI*2);
    chainCtx.fillStyle = s.color;
    chainCtx.fill();
    chainCtx.restore();
    s.x += s.vx; s.y += s.vy;
    s.vy += 0.08; // gravity
    s.life -= s.decay;
  });
}

function physics() {
  if (!dragging) {
    const a  = getAnchor();
    const rx = a.x, ry = a.y + REST_DROP;
    vx += (rx - hx) * 0.1;
    vy += (ry - hy) * 0.1;
    vx *= 0.72; vy *= 0.72;
    hx += vx;   hy += vy;
    const settled = Math.abs(vx) < 0.04 && Math.abs(vy) < 0.04 &&
                    Math.abs(hx - rx) < 0.2 && Math.abs(hy - ry) < 0.2 &&
                    sparks.length === 0;
    if (settled) { hx = rx; hy = ry; drawChain(); return; }
  }
  drawChain();
  raf = requestAnimationFrame(physics);
}

// ── Canvas Sky Animation ──
const skyCanvas = document.getElementById('sky-overlay');
const skyCtx    = skyCanvas.getContext('2d');
let skyRaf      = null;

function resizeSky() {
  skyCanvas.width  = window.innerWidth;
  skyCanvas.height = window.innerHeight;
}
resizeSky();
window.addEventListener('resize', resizeSky);

function playSunrise() {
  if (skyRaf) cancelAnimationFrame(skyRaf);
  resizeSky();
  const W = skyCanvas.width, H = skyCanvas.height;
  const DURATION = 2600;
  const start = performance.now();
  let stars = Array.from({length: 80}, () => ({
    x: Math.random() * W, y: Math.random() * H * 0.7,
    r: Math.random() * 1.5 + 0.3, a: Math.random()
  }));

  function frame(now) {
    const p = Math.min((now - start) / DURATION, 1); // 0→1
    skyCtx.clearRect(0, 0, W, H);

    // sky gradient: night → dawn → day
    const sky = skyCtx.createLinearGradient(0, 0, 0, H);
    if (p < 0.4) {
      const t = p / 0.4;
      sky.addColorStop(0,   lerpColor('#0a0a1a', '#1a1040', t));
      sky.addColorStop(0.4, lerpColor('#1a1040', '#6b2d6b', t));
      sky.addColorStop(0.7, lerpColor('#2a1a3a', '#e8622a', t));
      sky.addColorStop(1,   lerpColor('#1a0a0a', '#f4a460', t));
    } else {
      const t = (p - 0.4) / 0.6;
      sky.addColorStop(0,   lerpColor('#1a1040', '#87ceeb', t));
      sky.addColorStop(0.4, lerpColor('#6b2d6b', '#add8e6', t));
      sky.addColorStop(0.7, lerpColor('#e8622a', '#ffd580', t));
      sky.addColorStop(1,   lerpColor('#f4a460', '#ffe4b5', t));
    }
    skyCtx.fillStyle = sky;
    skyCtx.fillRect(0, 0, W, H);

    // stars fading out
    stars.forEach(s => {
      skyCtx.beginPath();
      skyCtx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      skyCtx.fillStyle = `rgba(255,255,255,${s.a * (1 - p * 2)})`;
      skyCtx.fill();
    });

    // sun rising from bottom
    const sunY = H * 1.1 - p * H * 1.25;
    const sunR = 38 + p * 20;
    // sun glow layers
    [[sunR*4, 0.06],[sunR*2.8, 0.12],[sunR*1.8, 0.22],[sunR*1.2, 0.5]].forEach(([r, a]) => {
      const g = skyCtx.createRadialGradient(W/2, sunY, 0, W/2, sunY, r);
      g.addColorStop(0, `rgba(255,200,50,${a})`);
      g.addColorStop(1, 'transparent');
      skyCtx.beginPath();
      skyCtx.arc(W/2, sunY, r, 0, Math.PI*2);
      skyCtx.fillStyle = g;
      skyCtx.fill();
    });
    // sun disc
    const sd = skyCtx.createRadialGradient(W/2-sunR*0.2, sunY-sunR*0.2, 2, W/2, sunY, sunR);
    sd.addColorStop(0, '#fff9c0');
    sd.addColorStop(0.4, '#ffe066');
    sd.addColorStop(1, '#ff8c00');
    skyCtx.beginPath();
    skyCtx.arc(W/2, sunY, sunR, 0, Math.PI*2);
    skyCtx.fillStyle = sd;
    skyCtx.fill();

    // horizon glow
    const hg = skyCtx.createLinearGradient(0, H*0.6, 0, H);
    hg.addColorStop(0, 'transparent');
    hg.addColorStop(0.5, `rgba(255,120,30,${0.35 * Math.sin(p * Math.PI)})`);
    hg.addColorStop(1, `rgba(255,80,0,${0.2 * Math.sin(p * Math.PI)})`);
    skyCtx.fillStyle = hg;
    skyCtx.fillRect(0, H*0.6, W, H*0.4);

    // rays
    if (p > 0.3) {
      const rp = (p - 0.3) / 0.7;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + p * 0.5;
        skyCtx.save();
        skyCtx.translate(W/2, sunY);
        skyCtx.rotate(angle);
        skyCtx.beginPath();
        skyCtx.moveTo(sunR, 0);
        skyCtx.lineTo(sunR + 80 * rp, -8 * rp);
        skyCtx.lineTo(sunR + 80 * rp,  8 * rp);
        skyCtx.closePath();
        skyCtx.fillStyle = `rgba(255,230,80,${0.18 * rp})`;
        skyCtx.fill();
        skyCtx.restore();
      }
    }

    // fade out at end
    if (p > 0.75) {
      skyCtx.fillStyle = `rgba(255,255,255,${(p - 0.75) / 0.25 * 0.6})`;
      skyCtx.fillRect(0, 0, W, H);
    }

    if (p < 1) skyRaf = requestAnimationFrame(frame);
    else skyCtx.clearRect(0, 0, W, H);
  }
  skyRaf = requestAnimationFrame(frame);
}

function playSunset() {
  if (skyRaf) cancelAnimationFrame(skyRaf);
  resizeSky();
  const W = skyCanvas.width, H = skyCanvas.height;
  const DURATION = 2600;
  const start = performance.now();
  let stars = Array.from({length: 80}, () => ({
    x: Math.random() * W, y: Math.random() * H * 0.7,
    r: Math.random() * 1.5 + 0.3
  }));

  function frame(now) {
    const p = Math.min((now - start) / DURATION, 1);
    skyCtx.clearRect(0, 0, W, H);

    // sky: day → dusk → night
    const sky = skyCtx.createLinearGradient(0, 0, 0, H);
    if (p < 0.5) {
      const t = p / 0.5;
      sky.addColorStop(0,   lerpColor('#87ceeb', '#1a1040', t));
      sky.addColorStop(0.4, lerpColor('#add8e6', '#6b2d6b', t));
      sky.addColorStop(0.7, lerpColor('#ffd580', '#e8622a', t));
      sky.addColorStop(1,   lerpColor('#ffe4b5', '#f4a460', t));
    } else {
      const t = (p - 0.5) / 0.5;
      sky.addColorStop(0,   lerpColor('#1a1040', '#0a0a1a', t));
      sky.addColorStop(0.4, lerpColor('#6b2d6b', '#0d0d2b', t));
      sky.addColorStop(0.7, lerpColor('#e8622a', '#1a0a0a', t));
      sky.addColorStop(1,   lerpColor('#f4a460', '#0a0505', t));
    }
    skyCtx.fillStyle = sky;
    skyCtx.fillRect(0, 0, W, H);

    // sun setting
    const sunY = H * 0.1 + p * H * 1.1;
    const sunR = 58 - p * 20;
    if (sunR > 0) {
      [[sunR*4, 0.06],[sunR*2.8, 0.12],[sunR*1.8, 0.22],[sunR*1.2, 0.5]].forEach(([r, a]) => {
        const g = skyCtx.createRadialGradient(W/2, sunY, 0, W/2, sunY, r);
        g.addColorStop(0, `rgba(255,140,30,${a * (1-p)})`);
        g.addColorStop(1, 'transparent');
        skyCtx.beginPath();
        skyCtx.arc(W/2, sunY, r, 0, Math.PI*2);
        skyCtx.fillStyle = g;
        skyCtx.fill();
      });
      const sd = skyCtx.createRadialGradient(W/2, sunY, 0, W/2, sunY, sunR);
      sd.addColorStop(0, '#fff0a0');
      sd.addColorStop(0.5, '#ff8c00');
      sd.addColorStop(1, '#cc3300');
      skyCtx.beginPath();
      skyCtx.arc(W/2, sunY, sunR, 0, Math.PI*2);
      skyCtx.fillStyle = sd;
      skyCtx.fill();
    }

    // horizon glow fading
    const hg = skyCtx.createLinearGradient(0, H*0.5, 0, H);
    hg.addColorStop(0, 'transparent');
    hg.addColorStop(0.5, `rgba(255,80,20,${0.4 * (1 - p)})`);
    hg.addColorStop(1, `rgba(200,40,0,${0.25 * (1 - p)})`);
    skyCtx.fillStyle = hg;
    skyCtx.fillRect(0, H*0.5, W, H*0.5);

    // stars appearing
    stars.forEach(s => {
      skyCtx.beginPath();
      skyCtx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      skyCtx.fillStyle = `rgba(255,255,255,${Math.max(0, (p - 0.4) / 0.6) * s.r * 0.7})`;
      skyCtx.fill();
    });

    // moon appearing top right
    if (p > 0.5) {
      const mp = (p - 0.5) / 0.5;
      const mx = W * 0.8, my = H * 0.15;
      const mr = 22 * mp;
      const mg = skyCtx.createRadialGradient(mx-mr*0.2, my-mr*0.2, 1, mx, my, mr*2);
      mg.addColorStop(0, `rgba(200,220,255,${0.3*mp})`);
      mg.addColorStop(1, 'transparent');
      skyCtx.beginPath();
      skyCtx.arc(mx, my, mr*2, 0, Math.PI*2);
      skyCtx.fillStyle = mg;
      skyCtx.fill();
      const md = skyCtx.createRadialGradient(mx-mr*0.3, my-mr*0.3, 1, mx, my, mr);
      md.addColorStop(0, '#ffffff');
      md.addColorStop(0.5, '#e8eeff');
      md.addColorStop(1, '#b0c4de');
      skyCtx.beginPath();
      skyCtx.arc(mx, my, mr, 0, Math.PI*2);
      skyCtx.fillStyle = md;
      skyCtx.fill();
      // crescent shadow
      skyCtx.beginPath();
      skyCtx.arc(mx + mr*0.3, my - mr*0.1, mr*0.85, 0, Math.PI*2);
      skyCtx.fillStyle = `rgba(10,10,30,${0.75*mp})`;
      skyCtx.fill();
    }

    // fade to dark at end
    if (p > 0.8) {
      skyCtx.fillStyle = `rgba(5,5,20,${(p-0.8)/0.2 * 0.7})`;
      skyCtx.fillRect(0, 0, W, H);
    }

    if (p < 1) skyRaf = requestAnimationFrame(frame);
    else skyCtx.clearRect(0, 0, W, H);
  }
  skyRaf = requestAnimationFrame(frame);
}

// color lerp helper
function lerpColor(a, b, t) {
  const ah = a.replace('#',''), bh = b.replace('#','');
  const ar = parseInt(ah.slice(0,2),16), ag = parseInt(ah.slice(2,4),16), ab = parseInt(ah.slice(4,6),16);
  const br = parseInt(bh.slice(0,2),16), bg = parseInt(bh.slice(2,4),16), bb = parseInt(bh.slice(4,6),16);
  const rr = Math.round(ar + (br-ar)*t).toString(16).padStart(2,'0');
  const rg = Math.round(ag + (bg-ag)*t).toString(16).padStart(2,'0');
  const rb = Math.round(ab + (bb-ab)*t).toString(16).padStart(2,'0');
  return `#${rr}${rg}${rb}`;
}

function triggerToggle() {
  spawnSparks();
  isLight = !isLight;
  document.body.classList.toggle('light', isLight);
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  celestialBtn.style.transition = 'transform 0.35s cubic-bezier(.4,0,.2,1)';
  celestialBtn.style.transform  = 'rotate(360deg) scale(1.5)';
  setTimeout(() => {
    celestialBtn.textContent    = isLight ? '☀️' : '🌙';
    celestialBtn.style.transform = 'scale(1)';
  }, 300);
  isLight ? playSunrise() : playSunset();
}

document.addEventListener('pointerdown', e => {
  if (chainAnchor.contains(e.target)) return;
  if (Math.hypot(e.clientX - hx, e.clientY - hy) > 26) return;
  dragging = true; toggledThisDrag = false;
  offX = e.clientX - hx; offY = e.clientY - hy;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(physics);
  e.preventDefault();
}, { passive: false });

document.addEventListener('pointermove', e => {
  if (!dragging) return;
  hx = e.clientX - offX;
  hy = e.clientY - offY;
  const a = getAnchor();
  // trigger only on downward pull
  if ((hy - a.y) > (REST_DROP + TRIGGER_DOWN) && !toggledThisDrag) {
    toggledThisDrag = true;
    triggerToggle();
  }
});

document.addEventListener('pointerup', () => {
  if (!dragging) return;
  dragging = false; vx = 0; vy = 0;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(physics);
});

celestialBtn.addEventListener('click', triggerToggle);
drawChain();

// ── Cryptic name — cinematic glitch + RGB split + scanline + matrix decode ──
const heroName  = document.getElementById('hero-name');
const scanline  = document.getElementById('scanline');
const finalText = heroName.getAttribute('data-text');
const glitchChars = '!<>-_\\/[]{}—=+*^?#@$%&|~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// wrap each char
heroName.innerHTML = finalText.split('').map((c, i) =>
  c === ' '
    ? '<span class="char space"> </span>'
    : `<span class="char" data-final="${c}" data-index="${i}"> </span>`
).join('') + '<span class="scanline" id="scanline"></span>';

const spans = [...heroName.querySelectorAll('.char:not(.space)')];

function rndChar() { return glitchChars[Math.floor(Math.random() * glitchChars.length)]; }

function runCryptic() {
  // 1. glitch RGB split on the whole name
  heroName.classList.add('glitching');
  setTimeout(() => heroName.classList.remove('glitching'), 420);

  // 2. scanline sweep
  const sl = heroName.querySelector('.scanline');
  if (sl) {
    sl.classList.remove('sweeping');
    void sl.offsetWidth; // reflow
    sl.classList.add('sweeping');
    setTimeout(() => sl.classList.remove('sweeping'), 650);
  }

  // 3. scramble all chars
  spans.forEach(span => {
    span.classList.remove('revealed');
    span.classList.add('scrambling');
    span.textContent = rndChar();
  });

  // 4. rapid random scramble phase
  const scrambleIvs = spans.map(span => {
    return setInterval(() => {
      span.textContent = rndChar();
    }, 55);
  });

  // 5. reveal each char one by one with stagger
  spans.forEach((span, i) => {
    const revealTime = 350 + i * 75 + Math.random() * 40;
    setTimeout(() => {
      clearInterval(scrambleIvs[i]);
      span.classList.remove('scrambling');
      span.classList.add('revealed');
      span.textContent = span.getAttribute('data-final');

      // tiny glitch burst on reveal
      let bursts = 0;
      const burstIv = setInterval(() => {
        if (bursts++ > 3) { clearInterval(burstIv); span.textContent = span.getAttribute('data-final'); return; }
        span.textContent = Math.random() > 0.5 ? rndChar() : span.getAttribute('data-final');
      }, 40);
      setTimeout(() => { clearInterval(burstIv); span.textContent = span.getAttribute('data-final'); }, 200);

    }, revealTime);
  });

  // 6. final glitch flash after all revealed
  const totalTime = 350 + spans.length * 75 + 300;
  setTimeout(() => {
    heroName.classList.add('glitching');
    setTimeout(() => heroName.classList.remove('glitching'), 300);
  }, totalTime);
}

// run on load with a short delay
setTimeout(runCryptic, 500);

// re-trigger on hover with cooldown
let crypticCooldown = false;
heroName.addEventListener('mouseenter', () => {
  if (crypticCooldown) return;
  crypticCooldown = true;
  runCryptic();
  setTimeout(() => { crypticCooldown = false; }, 2500);
});

// ── Scroll fade in/out + 3D tilt cards ──
(function () {

  // ── 1. Scroll fade — fades in on scroll down, fades out on scroll up ──
  const fadeSelectors = [
    '#about .section-title',
    '#about .about-card',
    '#skills .section-title',
    '.skill-card',
    '#projects .section-title',
    '.project-card',
    '#training .section-title',
    '.training-card',
    '#certificates .section-title',
    '.cert-card',
    '#achievements .section-title',
    '#achievements .edu-card',
    '#extracurricular .section-title',
    '#extracurricular .training-card',
    '#education .section-title',
    '.edu-card',
    '#contact .section-title',
    '.contact-card',
    '.mail-box',
  ];

  // add stagger parent class to grids
  document.querySelectorAll('.skills-grid, .projects-grid, .cert-grid, .edu-list, .contact-grid').forEach(el => {
    el.classList.add('scroll-fade-stagger');
  });

  const fadeEls = [];
  fadeSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('scroll-fade');
      fadeEls.push(el);
    });
  });

  function checkFade() {
    const vh = window.innerHeight;
    fadeEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      // fade in when entering from bottom, fade out only when fully above viewport
      const inView = rect.top < vh * 0.88 && rect.bottom > -60;
      el.classList.toggle('visible', inView);
    });
  }

  window.addEventListener('scroll', checkFade, { passive: true });
  window.addEventListener('resize', checkFade);
  checkFade();

  // ── 2. 3D tilt on all cards ──
  const tiltSelectors = '.project-card, .cert-card, .edu-card, .contact-card, .skill-card, .training-card, .about-card, .mail-box';
  const MAX_TILT = 13;

  document.querySelectorAll(tiltSelectors).forEach(card => {
    card.classList.add('tilt-card');

    // inject glow div
    const glow = document.createElement('div');
    glow.className = 'card-glow';
    card.appendChild(glow);

    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const x   = e.clientX - r.left;
      const y   = e.clientY - r.top;
      const cx  = r.width  / 2;
      const cy  = r.height / 2;
      const rY  =  ((x - cx) / cx) * MAX_TILT;
      const rX  = -((y - cy) / cy) * MAX_TILT;

      card.style.transition = 'box-shadow 0.15s, border-color 0.15s';
      card.style.transform  = `perspective(800px) rotateX(${rX}deg) rotateY(${rY}deg) translateY(0px) scale(1.03)`;

      // spotlight follows cursor
      glow.style.background = `radial-gradient(circle at ${(x/r.width)*100}% ${(y/r.height)*100}%, rgba(46,160,67,0.22) 0%, transparent 65%)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.55s cubic-bezier(.4,0,.2,1), box-shadow 0.3s, border-color 0.2s';
      card.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
    });
  });

})();
