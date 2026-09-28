/* ============================================================
   Muhammad Junaid Hafeez — Premium Portfolio Scripts
   Features: Particle system, smooth animations, theme engine
   ============================================================ */
(function () {
  'use strict';

  // ---- DOM ----
  const navbar = document.getElementById('navbar');
  const navLinks = document.getElementById('navLinks');
  const navHamburger = document.getElementById('navHamburger');
  const themeToggle = document.getElementById('themeToggle');
  const typedText = document.getElementById('typedText');
  const currentYear = document.getElementById('currentYear');
  const canvas = document.getElementById('particleCanvas');
  const downloadsSectionEl = document.getElementById('downloads');
  let downloadsNavVisible = !!document.querySelector('#navLinks a[href="#downloads"]');

  function applyDownloadsSectionVisibility() {
    if (!downloadsSectionEl) return;
    downloadsSectionEl.style.display = downloadsNavVisible ? '' : 'none';
  }

  applyDownloadsSectionVisibility();

  // ---- THEME (dark/light) ----
  const THEME_KEY = 'portfolio-theme';
  function getTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
  }
  setTheme(getTheme());
  themeToggle.addEventListener('click', () => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) setTheme(e.matches ? 'dark' : 'light');
  });

  // ---- COLOR PALETTE ----
  const COLOR_KEY = 'portfolio-color';
  const COLOR_MAP = {
    violet:  { rgb: '123, 108, 246', light: '100, 80, 220' },
    ocean:   { rgb: '14, 165, 233',  light: '2, 132, 199' },
    ember:   { rgb: '249, 115, 22',  light: '234, 88, 12' },
    emerald: { rgb: '16, 185, 129',  light: '5, 150, 105' },
  };
  const colorPickerToggle = document.getElementById('colorPickerToggle');
  const colorPickerDropdown = document.getElementById('colorPickerDropdown');

  function setColor(c) {
    if (c === 'violet') document.documentElement.removeAttribute('data-color');
    else document.documentElement.setAttribute('data-color', c);
    localStorage.setItem(COLOR_KEY, c);
    document.querySelectorAll('.color-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color === c);
    });
  }

  function getColor() { return localStorage.getItem(COLOR_KEY) || 'violet'; }
  function getParticleRGB() {
    const c = getColor();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return isDark ? (COLOR_MAP[c]?.rgb || COLOR_MAP.violet.rgb) : (COLOR_MAP[c]?.light || COLOR_MAP.violet.light);
  }

  setColor(getColor());

  if (colorPickerToggle && colorPickerDropdown) {
    colorPickerToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      colorPickerDropdown.classList.toggle('open');
    });
    colorPickerDropdown.querySelectorAll('.color-swatch').forEach(s => {
      s.addEventListener('click', (e) => {
        e.stopPropagation();
        setColor(s.dataset.color);
        colorPickerDropdown.classList.remove('open');
      });
    });
    document.addEventListener('click', () => colorPickerDropdown.classList.remove('open'));
  }

  // ---- MOBILE NAV ----
  navHamburger.addEventListener('click', () => {
    navHamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
  navLinks.querySelectorAll('.nav-link').forEach((l) => {
    l.addEventListener('click', () => {
      navHamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  // ---- THROTTLE UTILITY ----
  function throttle(fn, ms) {
    let last = 0, timer;
    return function() {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn(); }
      else { clearTimeout(timer); timer = setTimeout(() => { last = Date.now(); fn(); }, ms - (now - last)); }
    };
  }

  // ---- NAVBAR SCROLL ----
  let sections = document.querySelectorAll('section[id]');
  let navLinkEls = Array.from(document.querySelectorAll('#navLinks .nav-link'));
  let navActiveIndicator = null;

  function ensureNavIndicator() {
    if (!navLinks) return;
    navActiveIndicator = navLinks.querySelector('.nav-active-indicator');
    if (!navActiveIndicator) {
      navActiveIndicator = document.createElement('span');
      navActiveIndicator.className = 'nav-active-indicator';
      navLinks.appendChild(navActiveIndicator);
    }
  }

  function updateNavIndicator() {
    if (!navLinks || !navLinkEls.length) return;
    ensureNavIndicator();
    if (!navActiveIndicator) return;

    var active = navLinkEls.find(function(l) { return l.classList.contains('active'); }) || navLinkEls[0];
    if (window.innerWidth <= 768) {
      navActiveIndicator.style.opacity = '0';
      return;
    }

    var x = Math.max(0, active.offsetLeft);
    navActiveIndicator.style.width = active.offsetWidth + 'px';
    navActiveIndicator.style.transform = 'translateX(' + x + 'px)';
    navActiveIndicator.style.opacity = '1';
  }

  const onScroll = throttle(() => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);

    const y = window.scrollY + 200;
    sections.forEach((s) => {
      const top = s.offsetTop, h = s.offsetHeight, id = s.id;
      if (y >= top && y < top + h) {
        navLinkEls.forEach((l) => {
          l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
        });
      }
    });
    updateNavIndicator();
  }, 50);

  // ---- ACTIVE LINK ----
  ensureNavIndicator();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', throttle(updateNavIndicator, 80), { passive: true });
  onScroll();

  // ---- TYPING ----
  const strings = [
    'SDET & Automation Engineer',
    'Healthcare EHR Specialist',
    'HIPAA-Certified QA Lead',
    'Selenium | Cypress | Playwright',
    'Python & FastAPI Developer',
    'Agentic AI Automation',
  ];
  window._portfolioTypedStrings = strings;
  let sIdx = 0, cIdx = 0, deleting = false, speed = 80;
  function type() {
    const cur = strings[sIdx];
    if (deleting) { typedText.textContent = cur.substring(0, --cIdx); speed = 35; }
    else { typedText.textContent = cur.substring(0, ++cIdx); speed = 75; }
    if (!deleting && cIdx === cur.length) { speed = 2200; deleting = true; }
    else if (deleting && cIdx === 0) { deleting = false; sIdx = (sIdx + 1) % strings.length; speed = 400; }
    setTimeout(type, speed);
  }
  setTimeout(type, 800);

  // ---- SCROLL ANIMATIONS ----
  const animEls = document.querySelectorAll('.animate-on-scroll');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });
    animEls.forEach((el) => obs.observe(el));
  } else {
    animEls.forEach((el) => el.classList.add('visible'));
  }

  // ---- COUNTER ANIMATION ----
  function animateCounters() {
    document.querySelectorAll('.metric-number[data-target]').forEach((counter) => {
      const target = +counter.dataset.target;
      const start = performance.now();
      const dur = 2000;
      (function update(now) {
        const p = Math.min((now - start) / dur, 1);
        counter.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(update);
      })(start);
    });
  }

  let countersRan = false;
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !countersRan) { countersRan = true; animateCounters(); cObs.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    cObs.observe(heroSection);
  }

  // ---- FOOTER YEAR ----
  if (currentYear) currentYear.textContent = new Date().getFullYear();

  // ---- SMOOTH SCROLL (delegated for dynamic nav links) ----
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var h = link.getAttribute('href');
    if (!h || h === '#') return;
    try {
      var t = document.querySelector(h);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    } catch (err) {}
  });

  // ============================================================
  // PARTICLE SYSTEM — subtle floating dots
  // ============================================================
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, particles = [], animId;
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 25 : 45;
    const MAX_SPEED = 0.25;
    const LINK_DIST = isMobile ? 100 : 140;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', throttle(resize, 200));

    function Particle() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.r = Math.random() * 1.4 + 0.4;
      this.vx = (Math.random() - 0.5) * MAX_SPEED;
      this.vy = (Math.random() - 0.5) * MAX_SPEED;
      this.alpha = Math.random() * 0.4 + 0.1;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible && !animId) draw();
    });

    function draw() {
      if (!isVisible) { animId = null; return; }
      ctx.clearRect(0, 0, w, h);
      const color = getParticleRGB();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const dist = Math.sqrt(d2);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${color}, ${0.05 * (1 - dist / LINK_DIST)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }
    draw();
  }

  // ---- BACK TO TOP ----
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', throttle(() => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, 100), { passive: true });
    backToTop.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // ---- PERFORMANCE MARK ----
  if ('performance' in window) window.performance.mark('portfolio-interactive');

  // ─── MBA Semester Accordion ───
  window.toggleSem = function(btn) {
    const sem = btn.closest('.mba-sem');
    const wasOpen = sem.classList.contains('open');
    document.querySelectorAll('.mba-sem.open').forEach(s => s.classList.remove('open'));
    if (!wasOpen) sem.classList.add('open');
  };

  // ─── PPT Preview Modal ───
  const pptModal = document.getElementById('pptModal');
  const pptIframe = document.getElementById('pptModalIframe');
  const pptTitle = document.getElementById('pptModalTitle');
  const pptDownload = document.getElementById('pptModalDownload');
  const pptLoading = document.getElementById('pptModalLoading');

  window.openPptPreview = function(card) {
    const fileUrl = card.getAttribute('data-file');
    const title = card.getAttribute('data-title');
    pptTitle.textContent = title;
    pptDownload.href = fileUrl;
    pptLoading.classList.remove('hidden');
    const viewerUrl = 'https://docs.google.com/gview?embedded=1&url=' + encodeURIComponent(fileUrl);
    pptIframe.src = viewerUrl;
    pptIframe.onload = function() { pptLoading.classList.add('hidden'); };
    pptModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closePptPreview = function() {
    pptModal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(function() { pptIframe.src = ''; }, 300);
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pptModal.classList.contains('active')) closePptPreview();
  });
})();

// ============================================================
// FIREBASE — Dynamic Content Loading
// ============================================================
(function () {
  if (typeof firebase === 'undefined') return;
  if (!window.initPortfolioFirebase || !window.initPortfolioFirebase()) return;
  var db = firebase.database();
  var DB = 'portfolio/';

  function el(id) { return document.getElementById(id); }

  function reObserveAnimations(container) {
    if (!container) return;
    var els = container.querySelectorAll('.animate-on-scroll:not(.visible)');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (e) { e.classList.add('visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });
    els.forEach(function (e) { obs.observe(e); });
  }

  function toArr(d) {
    if (!d) return [];
    var arr = Array.isArray(d) ? d : Object.values(d);
    if (arr.length && arr[0] && typeof arr[0].order !== 'undefined') {
      arr.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    }
    return arr;
  }

  var svgBriefcase = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
  var svgLocation = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  var svgGrad = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 12 3 12 0v-5"/></svg>';
  var svgMedal = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>';
  var svgGithub = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>';
  var svgExternal = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
  var svgSend = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  // ---- SETTINGS ----
  db.ref(DB + 'settings').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;

    var fullName = d.name || '';
    var parts = fullName.split(' ');
    var shortName = parts[0] || '';

    if (fullName) {
      document.title = fullName + (d.title ? ' | ' + d.title : '');
    }

    if (shortName) {
      var navLogo = document.querySelector('.navbar .logo-text');
      if (navLogo) navLogo.innerHTML = shortName + '<span class="logo-accent">.</span>';
      var footerLogo = el('footerBrand');
      if (footerLogo) {
        var fl = footerLogo.querySelector('.logo-text');
        if (fl) fl.innerHTML = shortName + '<span class="logo-accent">.</span>';
      }
    }

    var tl = el('footerTagline');
    if (tl && d.footerTagline) tl.textContent = d.footerTagline;

    // Nav phone link
    var navPhone = el('navPhoneLink');
    if (navPhone && d.phone) {
      navPhone.href = 'tel:' + d.phone.replace(/[\s\-]/g, '');
      var navPhoneText = navPhone.querySelector('.nav-phone-text');
      if (navPhoneText) navPhoneText.textContent = d.phone;
    }

    // Nav CV link
    var navCv = el('navCvLink');
    if (navCv && d.cvUrl) navCv.href = d.cvUrl;

    // Footer contact
    var fc = el('footerContactEl');
    if (fc) {
      var html = '<h4>Contact Info</h4>';
      if (d.email) html += '<a href="mailto:' + d.email + '">' + d.email + '</a>';
      if (d.phone) html += '<a href="tel:' + d.phone.replace(/[\s\-]/g, '') + '">' + d.phone + '</a>';
      if (d.linkedin) html += '<a href="' + d.linkedin + '" target="_blank" rel="noopener">LinkedIn</a>';
      fc.innerHTML = html;
    }

    // Footer copyright
    var copy = el('footerCopyright');
    if (copy && fullName) copy.textContent = '\u00A9 ' + new Date().getFullYear() + ' ' + fullName + '. All rights reserved.';

    // Footer social links
    var fSocials = el('footerSocials');
    if (fSocials) {
      var sh = '';
      if (d.github) sh += '<a href="' + d.github + '" target="_blank" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>';
      if (d.linkedin) sh += '<a href="' + d.linkedin + '" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>';
      if (d.kaggle) sh += '<a href="' + d.kaggle + '" target="_blank" rel="noopener" aria-label="Kaggle"><svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.238-.036.27l-6.555 6.344 6.836 8.507c.095.104.117.208.075.323z"/></svg></a>';
      fSocials.innerHTML = sh;
    }

    // Footer copyright
    var copyrightText = d.copyrightText;
    var copy2 = el('footerCopyright');
    if (copy2 && copyrightText) {
      copy2.textContent = copyrightText;
    }

    // Contact form email
    var contactForm = document.getElementById('contactForm');
    if (contactForm && d.formEmail) contactForm.action = 'https://formsubmit.co/' + d.formEmail;
    else if (contactForm && d.email) contactForm.action = 'https://formsubmit.co/' + d.email;
  });

  // ---- FOOTER LINKS ----
  db.ref(DB + 'footerLinks').on('value', function (snap) {
    var d = snap.val();
    var linksEl = el('footerLinksEl');
    if (!linksEl) return;
    if (!d) return;
    var arr = toArr(d);
    if (!arr.length) return;
    var html = '<h4>Quick Links</h4>';
    arr.forEach(function (link) {
      if (link.visible === false) return;
      html += '<a href="' + (link.href || '#') + '"' +
        (link.target === '_blank' ? ' target="_blank" rel="noopener"' : '') +
        (link.isAdmin ? ' class="admin-link"' : '') +
        '>' + (link.label || '') + '</a>';
    });
    linksEl.innerHTML = html;
  });

  // ---- THEME ----
  db.ref(DB + 'theme').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;
    var root = document.documentElement;
    var fieldToCss = {
      accent1: 'accent-1', accent2: 'accent-2', accent3: 'accent-3',
      bgPrimary: 'bg-primary', bgSecondary: 'bg-secondary',
      textPrimary: 'text-primary', textSecondary: 'text-secondary'
    };
    Object.keys(fieldToCss).forEach(function (key) {
      if (d[key]) root.style.setProperty('--' + fieldToCss[key], d[key]);
    });
    if (d.accent1Rgb) root.style.setProperty('--accent-rgb', d.accent1Rgb);
  });

  // ---- NAV LINKS ----
  db.ref(DB + 'navLinks').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;
    var nav = el('navLinks');
    if (!nav) return;
    var arr = toArr(d);
    var visibleLinks = arr.filter(function(link) {
      return link.visible !== false;
    });
    nav.innerHTML = visibleLinks.map(function (link) {
      return '<li><a href="' + (link.href || '#') + '" class="nav-link"' +
        (link.target === '_blank' ? ' target="_blank" rel="noopener"' : '') +
        '>' + (link.label || '') + '</a></li>';
    }).join('');
    nav.querySelectorAll('.nav-link').forEach(function (l) {
      l.addEventListener('click', function () {
        var ham = document.getElementById('navHamburger');
        if (ham) ham.classList.remove('active');
        nav.classList.remove('active');
      });
    });
    navLinkEls = Array.from(nav.querySelectorAll('.nav-link'));
    ensureNavIndicator();
    onScroll();
    downloadsNavVisible = visibleLinks.some(function(link) {
      return String(link.href || '').trim().toLowerCase() === '#downloads';
    });
    applyDownloadsSectionVisibility();
  });

  // ---- HERO ----
  db.ref(DB + 'hero').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;

    try {
      var heroImg = d.profileImage || d.image;
      if (heroImg) {
        var imgEl = el('heroImageEl');
        if (imgEl) imgEl.src = heroImg;
      }
    } catch (e) {}

    try {
      if (d.badge) {
        var badge = el('heroBadgeEl');
        if (badge) badge.innerHTML = '<span class="badge-dot"></span>' + d.badge;
      }
      if (d.firstName) {
        var fn = el('heroFirstNameEl');
        if (fn) fn.textContent = d.firstName;
      }
      if (d.lastName) {
        var ln = el('heroLastNameEl');
        if (ln) ln.textContent = d.lastName;
      }
      if (d.typedRoles && Array.isArray(d.typedRoles) && d.typedRoles.length > 0) {
        var target = window._portfolioTypedStrings;
        if (target) {
          target.length = 0;
          d.typedRoles.forEach(function (r) { target.push(r); });
        }
      }
      if (d.description) {
        var desc = el('heroDescEl');
        if (desc) desc.textContent = d.description;
      }
    } catch (e) {}

    try {
      var mc = el('heroMetricsContainer');
      if (mc) {
        var metricsArr = [];
        if (d.metrics) {
          metricsArr = toArr(d.metrics);
        } else if (d.metric1Value || d.metric2Value || d.metric3Value) {
          for (var mi = 1; mi <= 3; mi++) {
            var mv = d['metric' + mi + 'Value'] || '';
            var ml = d['metric' + mi + 'Label'] || '';
            if (mv || ml) {
              var numPart = parseInt(mv) || 0;
              var suffixPart = mv.replace(/^\d+/, '') || '+';
              metricsArr.push({ value: numPart, suffix: suffixPart, label: ml });
            }
          }
        }
        if (metricsArr.length) {
          mc.innerHTML = metricsArr.map(function (m, i) {
            var h = '';
            if (i > 0) h += '<div class="metric-divider"></div>';
            h += '<div class="metric">';
            h += '<span class="metric-number" data-target="' + (parseInt(m.value) || 0) + '">0</span>';
            h += '<span class="metric-suffix">' + (m.suffix || '+') + '</span>';
            h += '<span class="metric-label">' + (m.label || '') + '</span>';
            h += '</div>';
            return h;
          }).join('');
        mc.querySelectorAll('.metric-number[data-target]').forEach(function(numEl) {
          numEl.textContent = parseInt(numEl.dataset.target) || 0;
        });
        }
      }
    } catch (e) {}
    var wrapper = el('heroFloatingBadges');
    if (wrapper) {
      var badgesArr = [];
      if (d.floatingBadges) {
        badgesArr = toArr(d.floatingBadges);
      } else {
        [d.badge1, d.badge2, d.badge3].forEach(function(b) {
          if (b) badgesArr.push({ label: b });
        });
      }
      if (badgesArr.length) {
        wrapper.querySelectorAll('.floating-badge').forEach(function (b) { b.remove(); });
        badgesArr.forEach(function (fb, i) {
          var div = document.createElement('div');
          div.className = 'floating-badge fb-' + (i + 1);
          div.innerHTML = (fb.icon || '') + '<span>' + (fb.label || '') + '</span>';
          wrapper.appendChild(div);
        });
      }
    }
    if (d.socials) {
      var bar = el('heroSocialsEl');
      if (bar) {
        bar.innerHTML = '<div class="social-line"></div>' +
          toArr(d.socials).map(function (s) {
            return '<a href="' + (s.url || '#') + '" target="_blank" rel="noopener" aria-label="' + (s.label || '') + '" class="social-icon">' + (s.icon || '') + '</a>';
          }).join('') +
          '<div class="social-line"></div>';
      }
    }
  });

  // ---- ABOUT ----
  db.ref(DB + 'about').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;

    var statsEl = el('aboutStatsEl');
    if (statsEl) {
      var statsArr = [];
      if (d.stats) {
        statsArr = toArr(d.stats);
      } else {
        for (var si = 1; si <= 4; si++) {
          var sv = d['stat' + si + 'Value'];
          var sl = d['stat' + si + 'Label'];
          if (sv || sl) {
            var sn = parseInt(sv) || 0;
            var ss = (sv || '').replace(/^\d+/, '') || '';
            statsArr.push({ value: sn, suffix: ss, label: sl || '' });
          }
        }
      }
      if (statsArr.length) {
        statsEl.innerHTML = statsArr.map(function (s) {
          return '<div class="about-stat"><div class="about-stat-number">' + (s.value || '') +
            '<span>' + (s.suffix || '') + '</span></div>' +
            '<div class="about-stat-label">' + (s.label || '') + '</div></div>';
        }).join('');
      }
    }

    var textEl = el('aboutTextEl');
    if (textEl) {
      var paras = [];
      if (d.paragraphs) {
        paras = toArr(d.paragraphs);
      } else {
        for (var pi = 1; pi <= 5; pi++) {
          if (d['paragraph' + pi]) paras.push(d['paragraph' + pi]);
        }
      }
      if (paras.length) {
        textEl.innerHTML = paras.map(function (p, i) {
          return i === 0 ? '<p class="about-lead">' + p + '</p>' : '<p>' + p + '</p>';
        }).join('');
      }
    }

    var detEl = el('aboutDetailsEl');
    if (detEl) {
      var dets = [];
      if (d.details) {
        dets = toArr(d.details);
      } else {
        var detMap = [
          { key: 'role', icon: '💼', label: 'Role' },
          { key: 'company', icon: '🏢', label: 'Company' },
          { key: 'location', icon: '🌍', label: 'Location' },
          { key: 'city', icon: '📍', label: 'City' },
          { key: 'edu', icon: '🎓', label: 'Education' },
          { key: 'cert', icon: '📜', label: 'Certification' }
        ];
        detMap.forEach(function (dm) {
          if (d[dm.key]) {
            dets.push({ icon: dm.icon, label: dm.label, value: d[dm.key] + (d[dm.key + 'Detail'] ? ' · ' + d[dm.key + 'Detail'] : '') });
          }
        });
      }
      if (dets.length) {
        detEl.innerHTML = dets.map(function (det) {
          return '<div class="about-detail"><div class="about-detail-icon">' + (det.icon || '') +
            '</div><div><span class="about-detail-label">' + (det.label || '') +
            '</span><span class="about-detail-value">' + (det.value || '') + '</span></div></div>';
        }).join('');
      }
    }

    var hlEl = el('aboutHighlightsEl');
    if (hlEl) {
      var hls = [];
      if (d.highlights) {
        hls = toArr(d.highlights);
      } else {
        for (var hi = 1; hi <= 4; hi++) {
          if (d['hl' + hi + 'Title']) {
            hls.push({ icon: '', title: d['hl' + hi + 'Title'], description: d['hl' + hi + 'Desc'] || '' });
          }
        }
      }
      if (hls.length) {
        hlEl.innerHTML = hls.map(function (hl) {
          return '<div class="about-hl-card"><div class="about-hl-icon">' + (hl.icon || '✨') +
            '</div><h4>' + (hl.title || '') + '</h4><p>' + (hl.description || '') + '</p></div>';
        }).join('');
        reObserveAnimations(hlEl.parentElement);
      }
    }
  });

  // ---- SKILLS ----
  db.ref(DB + 'skills').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;
    var grid = el('skillsGrid');
    if (!grid) return;
    grid.innerHTML = toArr(d).map(function (cat) {
      var skillItems = [];
      if (cat.skills) {
        skillItems = toArr(cat.skills);
      } else if (cat.pills && typeof cat.pills === 'string') {
        skillItems = cat.pills.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      } else if (Array.isArray(cat.pills)) {
        skillItems = cat.pills;
      }
      var pills = skillItems.map(function (s) {
        if (typeof s === 'object') {
          return '<span class="pill' + (s.highlight ? ' pill-highlight' : '') + '">' + (s.name || '') + '</span>';
        }
        return '<span class="pill">' + s + '</span>';
      }).join('');
      var catTitle = cat.title || cat.category || '';
      return '<div class="skill-card animate-on-scroll"><div class="skill-card-glow"></div>' +
        '<div class="skill-header"><div class="skill-icon-wrap">' + (cat.icon || '🔧') + '</div>' +
        '<h3>' + catTitle + '</h3></div>' +
        '<div class="skill-pills">' + pills + '</div></div>';
    }).join('');
    reObserveAnimations(grid);
  });

  // ---- EXPERIENCE ----
  db.ref(DB + 'experience').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;
    var tl = el('timelineContainer');
    if (!tl) return;
    var arr = toArr(d);
    tl.innerHTML = arr.map(function (job, i) {
      var isLast = (i === arr.length - 1);
      var badgeHtml = job.current ? '<div class="timeline-badge">Current</div>' : '';
      var detailItems = [];
      if (job.details) {
        detailItems = toArr(job.details);
      } else if (job.description && typeof job.description === 'string') {
        detailItems = job.description.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      }
      var details = detailItems.map(function (li) { return '<li>' + li + '</li>'; }).join('');
      var techItems = [];
      if (job.tech) {
        techItems = toArr(job.tech);
      } else if (job.techTags && typeof job.techTags === 'string') {
        techItems = job.techTags.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
      } else if (Array.isArray(job.techTags)) {
        techItems = job.techTags;
      }
      var tech = techItems.map(function (t) { return '<span>' + t + '</span>'; }).join('');
      var period = job.period || job.dateRange || '';
      return '<div class="timeline-item animate-on-scroll">' +
        '<div class="timeline-marker"><div class="timeline-dot"></div>' +
        (!isLast ? '<div class="timeline-line"></div>' : '') + '</div>' +
        '<div class="timeline-card">' + badgeHtml +
        '<div class="timeline-header"><div>' +
        '<h3 class="timeline-role">' + (job.role || '') + '</h3>' +
        '<p class="timeline-company">' + svgBriefcase + ' ' + (job.company || '') +
        (job.companyNote ? ' <span class="company-note">(' + job.companyNote + ')</span>' : '') +
        '</p></div>' +
        '<span class="timeline-date">' + period + '</span></div>' +
        '<ul class="timeline-details">' + details + '</ul>' +
        '<div class="timeline-tech">' + tech + '</div></div></div>';
    }).join('');
    reObserveAnimations(tl);
  });

  // ---- EDUCATION ----
  db.ref(DB + 'education').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;
    var tl = el('eduTimeline');
    if (!tl) return;
    tl.innerHTML = toArr(d).map(function (edu) {
      var isPrimary = edu.primary ? ' edu-tl-primary' : '';
      var dotClass = edu.active ? ' edu-tl-dot-active' : '';
      var badgeHtml = '';
      var badgeLabel = edu.badge || edu.badgeText || '';
      if (badgeLabel) {
        var bclass = edu.active ? ' edu-tl-badge-active' : ' edu-tl-badge-primary';
        badgeHtml = '<span class="edu-tl-badge' + bclass + '">' + badgeLabel + '</span>';
      }
      var yearLabel = edu.years || edu.year || '';
      var yearClass = edu.active ? ' edu-tl-year-active' : '';
      var dotIcon = edu.dotIcon || svgGrad;
      var mbaHtml = edu.mbaProjects ? '<div class="mba-projects">' + edu.mbaProjects + '</div>' : '';
      return '<div class="edu-tl-item' + isPrimary + ' animate-on-scroll">' +
        '<div class="edu-tl-dot' + dotClass + '">' + dotIcon + '</div>' +
        '<div class="edu-tl-card"><div class="edu-tl-header"><div>' + badgeHtml +
        '<h3 class="edu-tl-degree">' + (edu.degree || '') + '</h3>' +
        '<p class="edu-tl-school">' + svgLocation + ' ' + (edu.school || '') + '</p></div>' +
        '<span class="edu-tl-year' + yearClass + '">' + yearLabel + '</span></div>' +
        '<p class="edu-tl-desc">' + (edu.description || '') + '</p>' + mbaHtml +
        '</div></div>';
    }).join('');
    reObserveAnimations(tl);
  });

  // ---- CERTIFICATIONS ----
  db.ref(DB + 'certs').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;
    var grid = el('certGrid');
    if (!grid) return;
    grid.innerHTML = toArr(d).map(function (cert) {
      return '<div class="cert-card"><div class="cert-icon">' + svgMedal + '</div>' +
        '<h4 class="cert-name">' + (cert.name || '') + '</h4>' +
        '<p class="cert-detail">' + (cert.detail || '') + '</p></div>';
    }).join('');
    reObserveAnimations(grid.parentElement);
  });

  // ---- PROJECTS ----
  db.ref(DB + 'projects').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;
    var grid = el('projectsGrid');
    if (!grid) return;
    grid.innerHTML = toArr(d).map(function (proj, i) {
      var num = String(i + 1).padStart(2, '0');
      var featured = proj.featured ? ' project-featured' : '';
      var techItems = [];
      if (proj.tech) { techItems = toArr(proj.tech); }
      else if (proj.techTags && typeof proj.techTags === 'string') { techItems = proj.techTags.split(',').map(function (t) { return t.trim(); }).filter(Boolean); }
      else if (Array.isArray(proj.techTags)) { techItems = proj.techTags; }
      var tech = techItems.map(function (t) { return '<span>' + t + '</span>'; }).join('');
      var ghUrl = proj.github || proj.githubUrl || '';
      var ghLink = ghUrl ? '<a href="' + ghUrl + '" target="_blank" rel="noopener" aria-label="GitHub">' + svgGithub + '</a>' : '';
      var liveUrl = proj.live || proj.liveUrl || '';
      var liveLink = liveUrl ? '<a href="' + liveUrl + '" target="_blank" rel="noopener" aria-label="Live">' + svgExternal + '</a>' : '';
      return '<article class="project-card' + featured + ' animate-on-scroll">' +
        '<div class="project-number">' + num + '</div>' +
        '<div class="project-content"><div class="project-top">' +
        '<span class="project-label">' + (proj.label || '') + '</span>' +
        '<div class="project-links">' + ghLink + liveLink + '</div></div>' +
        '<h3 class="project-title">' + (proj.title || '') + '</h3>' +
        '<p class="project-desc">' + (proj.description || '') + '</p>' +
        '<div class="project-tech">' + tech + '</div></div></article>';
    }).join('');
    reObserveAnimations(grid);
  });

  // ---- CONTACT CARDS ----
  var contactIconMap = {
    email: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    phone: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    linkedin: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    github: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    kaggle: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.281.18.046.149.034.238-.036.27l-6.555 6.344 6.836 8.507c.095.104.117.208.075.323z"/></svg>',
    website: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    other: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
  };

  db.ref(DB + 'contactCards').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;
    var grid = el('contactGrid');
    if (!grid) return;
    var ctaCard = el('contactCtaEl');
    var ctaHtml = ctaCard ? ctaCard.outerHTML : '';
    grid.innerHTML = toArr(d).map(function (card) {
      var iconSvg = card.icon || contactIconMap[card.type] || contactIconMap.other;
      if (card.type === 'jamia') {
        return '<a href="' + (card.url || '#') + '" target="_blank" rel="noopener" class="contact-card jamia-card">' +
          '<div class="jamia-card-img"><img src="' + (card.image || '') + '" alt="' + (card.value || '') + '" loading="lazy">' +
          '<div class="jamia-card-overlay"></div><div class="jamia-card-seal">' + (card.seal || '') + '</div></div>' +
          '<span class="contact-card-label" style="color:#c9a227">' + (card.label || '') + '</span>' +
          '<span class="contact-card-value">' + (card.value || '') + '</span>' +
          '<span class="jamia-card-desc">' + (card.desc || '') + '</span>' +
          '<span class="contact-card-action" style="color:#c9a227">' + (card.action || 'Visit &rarr;') + '</span></a>';
      }
      return '<a href="' + (card.url || '#') + '"' +
        (card.external ? ' target="_blank" rel="noopener"' : '') + ' class="contact-card">' +
        '<div class="contact-icon">' + iconSvg + '</div>' +
        '<span class="contact-card-label">' + (card.label || '') + '</span>' +
        '<span class="contact-card-value">' + (card.value || '') + '</span>' +
        '<span class="contact-card-action">' + (card.action || '') + '</span></a>';
    }).join('') + ctaHtml;
    reObserveAnimations(grid);
  });

  // ---- CONTACT CTA ----
  db.ref(DB + 'contactCta').on('value', function (snap) {
    var d = snap.val();
    if (!d) return;
    var cta = el('contactCtaEl');
    if (!cta) return;
    var ctaUrl = d.buttonUrl || d.url || 'mailto:junaidhafeez.cs@gmail.com';
    var ctaLabel = d.buttonText || 'Start a Conversation';
    cta.innerHTML = '<h3>' + (d.title || "Let's Work Together") + '</h3>' +
      '<p>' + (d.text || '') + '</p>' +
      '<a href="' + ctaUrl + '" class="btn btn-primary">' +
      '<span>' + ctaLabel + '</span>' + svgSend + '</a>';
  });

  // ---- DOWNLOADS ----
  var allDownloads = [];
  var downloadsLoadedFromFirebase = false;
  var downloadSearchEl = document.getElementById('downloadSearchInput');
  var downloadCategoryEl = document.getElementById('downloadCategoryFilter');
  var downloadListEl = document.getElementById('downloadList');
  var downloadEmptyEl = document.getElementById('downloadEmptyState');

  function fileIcon(type) {
    if (type === 'pdf') return '📕';
    if (type === 'ppt') return '📊';
    if (type === 'word') return '📘';
    if (type === 'excel') return '📗';
    if (type === 'image') return '🖼️';
    if (type === 'video') return '🎬';
    if (type === 'audio') return '🎵';
    if (type === 'text') return '📝';
    return '📎';
  }

  function bytesToText(bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    var units = ['KB', 'MB', 'GB', 'TB'];
    var i = -1;
    do { n = n / 1024; i++; } while (n >= 1024 && i < units.length - 1);
    return n.toFixed(n >= 100 ? 0 : 1) + ' ' + units[i];
  }

  function isDataUrl(url) {
    return String(url || '').toLowerCase().indexOf('data:') === 0;
  }

  function isHttpUrl(url) {
    return /^https?:\/\//i.test(String(url || ''));
  }

  function safeDecodeUrl(v) {
    try { return decodeURIComponent(String(v || '')); } catch (e) {}
    return String(v || '');
  }

  function normalizeFileUrl(rawUrl) {
    var raw = String(rawUrl || '').trim();
    if (!raw) return '';
    try {
      var u = new URL(raw, window.location.href);
      var host = String(u.hostname || '').toLowerCase();
      if (host.indexOf('view.officeapps.live.com') > -1) {
        raw = safeDecodeUrl(u.searchParams.get('src') || raw);
      }
    } catch (e) {}
    if (raw.indexOf('res.cloudinary.com') > -1) {
      raw = raw.replace(/\/upload\/fl_attachment:[^/]+\//i, '/upload/');
    }
    return raw;
  }

  function getRawFileUrl(item) {
    var url = item && item.downloadUrl ? String(item.downloadUrl) : '';
    if (!url) return '';
    url = normalizeFileUrl(url);
    if (isDataUrl(url)) return url;
    if (isHttpUrl(url)) return url;
    return '';
  }

  function detectOfficeType(item, url) {
    var t = String(item && item.fileType || '').toLowerCase();
    if (t === 'ppt' || t === 'word' || t === 'excel') return t;
    var mime = String(item && item.mimeType || '').toLowerCase();
    if (mime.indexOf('presentation') > -1 || mime.indexOf('powerpoint') > -1) return 'ppt';
    if (mime.indexOf('word') > -1 || mime.indexOf('officedocument.wordprocessingml') > -1) return 'word';
    if (mime.indexOf('excel') > -1 || mime.indexOf('sheet') > -1 || mime.indexOf('csv') > -1) return 'excel';
    var name = [
      item && item.fileName ? item.fileName : '',
      item && item.displayFileName ? item.displayFileName : '',
      url || ''
    ].join(' ').toLowerCase();
    if (/\.(ppt|pptx)(\?|$)/.test(name)) return 'ppt';
    if (/\.(doc|docx)(\?|$)/.test(name)) return 'word';
    if (/\.(xls|xlsx|csv)(\?|$)/.test(name)) return 'excel';
    return '';
  }

  function getDisplayFileName(item) {
    var n = item && item.displayFileName ? String(item.displayFileName).trim() : '';
    if (n) return n;
    var title = item && item.title ? String(item.title).trim() : '';
    var original = item && item.fileName ? String(item.fileName).trim() : '';
    var ext = '';
    if (original && original.indexOf('.') > -1) ext = original.split('.').pop().toLowerCase();
    if (!title) return '';
    var safe = title.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\s/g, '_');
    if (!safe) return '';
    return ext ? (safe + '.' + ext) : safe;
  }

  function getDownloadUrl(item) {
    var raw = getRawFileUrl(item);
    if (!raw) return '';
    return raw;
  }

  function getViewUrl(item) {
    var url = getRawFileUrl(item);
    if (!url) return '';
    return url;
  }

  function isPdfFile(item, url) {
    var t = String(item && item.fileType || '').toLowerCase();
    if (t === 'pdf') return true;
    var m = String(item && item.mimeType || '').toLowerCase();
    if (m.indexOf('pdf') > -1) return true;
    var n = [
      item && item.fileName ? item.fileName : '',
      item && item.displayFileName ? item.displayFileName : '',
      url || ''
    ].join(' ').toLowerCase();
    return /\.(pdf)(\?|$)/.test(n);
  }

  function openDownloadPreviewById(id) {
    var f = allDownloads.find(function(d) { return d.id === id; });
    if (!f) return;
    var url = getRawFileUrl(f);
    if (!url) return;

    var modal = document.getElementById('pptModal');
    var iframe = document.getElementById('pptModalIframe');
    var titleEl = document.getElementById('pptModalTitle');
    var downloadEl = document.getElementById('pptModalDownload');
    var loadingEl = document.getElementById('pptModalLoading');
    if (!modal || !iframe || !titleEl || !downloadEl) {
      window.open(url, '_blank');
      return;
    }

    titleEl.textContent = f.title || f.fileName || 'Preview';
    downloadEl.href = getDownloadUrl(f) || url;
    downloadEl.setAttribute('download', getDisplayFileName(f) || f.fileName || 'file');

    var officeType = detectOfficeType(f, url);
    if (officeType) {
      iframe.src = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(url);
      iframe.style.display = '';
      if (loadingEl) loadingEl.classList.remove('hidden');
      iframe.onload = function() { if (loadingEl) loadingEl.classList.add('hidden'); };
    } else if (isPdfFile(f, url)) {
      iframe.src = url;
      iframe.style.display = '';
      if (loadingEl) loadingEl.classList.add('hidden');
    } else {
      window.open(url, '_blank');
      return;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function renderDownloadCategories() {
    if (!downloadCategoryEl) return;
    var cats = {};
    allDownloads.forEach(function(d) {
      if (d.category) cats[d.category] = true;
    });
    var arr = Object.keys(cats).sort();
    var current = downloadCategoryEl.value || '';
    downloadCategoryEl.innerHTML = '<option value="">All Categories</option>' +
      arr.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    downloadCategoryEl.value = current;
  }

  function renderDownloads() {
    if (!downloadListEl) return;

    var q = (downloadSearchEl && downloadSearchEl.value || '').trim().toLowerCase();
    var cat = (downloadCategoryEl && downloadCategoryEl.value || '').trim().toLowerCase();
    var items = allDownloads.filter(function(d) {
      if (d.visible === false) return false;
      if (cat && (d.category || '').toLowerCase() !== cat) return false;
      if (!q) return true;
      var tags = Array.isArray(d.tags) ? d.tags.join(' ') : '';
      var hay = [d.title, d.fileName, d.description, d.category, tags].join(' ').toLowerCase();
      return hay.indexOf(q) > -1;
    });

    if (!items.length) {
      downloadListEl.innerHTML = '';
      if (downloadEmptyEl) downloadEmptyEl.style.display = '';
      return;
    }

    if (downloadEmptyEl) downloadEmptyEl.style.display = 'none';
    downloadListEl.innerHTML = items.map(function(d) {
      var tags = Array.isArray(d.tags) ? d.tags : [];
      var viewHref = getViewUrl(d);
      var dlHref = getDownloadUrl(d);
      var dlName = getDisplayFileName(d);
      var viewBtn = viewHref
        ? '<a class="download-btn" href="#" data-preview-id="' + d.id + '">View</a>'
        : '<a class="download-btn" href="#" onclick="return false;" title="Preview unavailable for this file type.">Unavailable</a>';
      var dlBtn = dlHref
        ? '<a class="download-btn download-btn-primary" target="_blank" rel="noopener" href="' + dlHref + '"' + (dlName ? ' download="' + dlName + '"' : ' download') + '>Download</a>'
        : '<a class="download-btn download-btn-primary" href="#" onclick="return false;" title="No valid file URL found.">Missing File</a>';
      return '<article class="download-card">' +
        '<div class="download-top">' +
          '<span class="download-icon">' + fileIcon(d.fileType) + '</span>' +
          '<span class="download-type">' + (d.fileType || 'file') + '</span>' +
        '</div>' +
        '<h3 class="download-title">' + (d.title || 'Untitled') + '</h3>' +
        '<div class="download-meta">' + (d.category || 'General') + '</div>' +
        '<p class="download-desc">' + (d.description || 'No description provided.') + '</p>' +
        '<div class="download-tags">' + tags.map(function(t) { return '<span class="download-tag">' + t + '</span>'; }).join('') + '</div>' +
        '<div class="download-actions">' + viewBtn + dlBtn + '</div>' +
      '</article>';
    }).join('');
  }

  if (downloadSearchEl) downloadSearchEl.addEventListener('input', renderDownloads);
  if (downloadCategoryEl) downloadCategoryEl.addEventListener('change', renderDownloads);
  if (downloadListEl) {
    downloadListEl.addEventListener('click', function(e) {
      var a = e.target.closest('a[data-preview-id]');
      if (!a) return;
      e.preventDefault();
      openDownloadPreviewById(a.getAttribute('data-preview-id'));
    });
  }

  function assignDownloadsFromObject(d) {
    d = d || {};
    allDownloads = Object.keys(d).map(function(k) {
      var v = d[k] || {};
      v.id = k;
      return v;
    }).sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    renderDownloadCategories();
    renderDownloads();
  }

  function loadDownloadsViaRestFallback() {
    var dbUrl = (window.PORTFOLIO_FIREBASE_CONFIG && window.PORTFOLIO_FIREBASE_CONFIG.databaseURL) || '';
    if (!dbUrl) return;
    var endpoint = dbUrl.replace(/\/$/, '') + '/' + DB + 'downloads.json?ts=' + Date.now();
    fetch(endpoint).then(function(res) {
      if (!res.ok) throw new Error('REST fallback failed with status ' + res.status);
      return res.json();
    }).then(function(data) {
      assignDownloadsFromObject(data || {});
    }).catch(function() {});
  }

  db.ref(DB + 'downloads').on('value', function(snap) {
    downloadsLoadedFromFirebase = true;
    assignDownloadsFromObject(snap.val() || {});
  }, function() {
    loadDownloadsViaRestFallback();
  });

  setTimeout(function() {
    if (!downloadsLoadedFromFirebase) loadDownloadsViaRestFallback();
  }, 2500);

})();
