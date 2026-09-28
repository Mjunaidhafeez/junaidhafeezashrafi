(function() {
  'use strict';

  if (!window.initPortfolioFirebase || !window.initPortfolioFirebase()) {
    function showFirebaseMissing() {
      var errEl = document.getElementById('loginError');
      if (!errEl) return;
      errEl.textContent = 'Firebase project missing. Open firebase-config.js, paste your new Firebase web keys, then redeploy.';
      errEl.classList.add('show');
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showFirebaseMissing);
    else showFirebaseMissing();
    return;
  }
  var db = firebase.database();
  var storage = firebase.storage();
  var auth = firebase.auth();

  var DB_PREFIX = 'portfolio/';
  var DEFAULT_CLOUDINARY_CLOUD_NAME = 'dveiwpxcr';
  var DEFAULT_CLOUDINARY_UPLOAD_PRESET = 'portfolio_uploads';

  var pendingImages = {};

  /* ═══════════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════════ */

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'success');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 24px;border-radius:8px;color:#fff;font-size:14px;font-weight:500;z-index:99999;opacity:0;transform:translateY(12px);transition:all .3s ease;box-shadow:0 4px 12px rgba(0,0,0,.15);max-width:360px;';
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    document.body.appendChild(toast);
    requestAnimationFrame(function() {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
  }

  function $(id) { return document.getElementById(id); }
  function val(id) { return ($(id) || {}).value || ''; }
  function setVal(id, v) { var el = $(id); if (el) el.value = v || ''; }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v || ''; }

  /* ═══════════════════════════════════════════════════════════
     IMAGE COMPRESSION
     ═══════════════════════════════════════════════════════════ */

  function compressImage(file, maxWidth, quality) {
    maxWidth = maxWidth || 800;
    quality = quality || 0.7;
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var w = img.width;
          var h = img.height;
          if (w > maxWidth) {
            h = Math.round(h * (maxWidth / w));
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     REUSABLE IMAGE UPLOAD HANDLER
     ═══════════════════════════════════════════════════════════ */

  function setupImageUpload(inputId, previewId, key, maxWidth) {
    var input = $(inputId);
    if (!input) return;
    input.addEventListener('change', function() {
      var file = input.files[0];
      if (!file) return;
      compressImage(file, maxWidth || 800, 0.7).then(function(base64) {
        pendingImages[key] = base64;
        renderImagePreview(inputId, previewId, base64, key);
      });
    });
  }

  function renderImagePreview(inputId, previewId, base64, key) {
    var preview = $(previewId);
    if (!preview) return;
    preview.innerHTML =
      '<div style="position:relative;display:inline-block">' +
        '<img src="' + base64 + '" style="max-width:200px;max-height:140px;border-radius:8px;object-fit:cover">' +
        '<button type="button" class="remove-img-btn" data-key="' + esc(key) + '" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center">&times;</button>' +
      '</div>';
    preview.querySelector('.remove-img-btn').addEventListener('click', function() {
      delete pendingImages[key];
      preview.innerHTML = '';
      var inp = $(inputId);
      if (inp) inp.value = '';
    });
  }

  /* ═══════════════════════════════════════════════════════════
     AUTH
     ═══════════════════════════════════════════════════════════ */

  auth.onAuthStateChanged(function(user) {
    if (user) {
      $('loginScreen').style.display = 'none';
      $('adminApp').style.display = 'grid';
      setText('adminEmail', user.email);
      initAdmin();
    } else {
      $('loginScreen').style.display = '';
      $('adminApp').style.display = 'none';
    }
  });

  $('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var email = val('loginEmail');
    var pass = val('loginPassword');
    var errEl = $('loginError');
    var btn = $('loginBtn');
    errEl.textContent = '';
    errEl.classList.remove('show');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    auth.signInWithEmailAndPassword(email, pass)
      .then(function() {})
      .catch(function(err) {
        var code = err.code || '';
        if (code === 'auth/api-key-not-found' || code === 'auth/invalid-api-key' || code === 'auth/project-not-found') {
          errEl.textContent = 'This Firebase API key is invalid because the old project was deleted. Create a new Firebase project and paste its keys into firebase-config.js.';
        } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          errEl.textContent = 'Wrong email or password. After creating a new Firebase project you must also create a new admin user in Authentication.';
        } else {
          errEl.textContent = err.message;
        }
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      });
  });

  $('logoutBtn').addEventListener('click', function() {
    auth.signOut();
  });

  /* ═══════════════════════════════════════════════════════════
     SIDEBAR & TAB NAVIGATION
     ═══════════════════════════════════════════════════════════ */

  var sidebar = $('sidebar');
  var sidebarToggle = $('sidebarToggle');
  var sidebarOverlay = $('sidebarOverlay');
  var sidebarLinks = document.querySelectorAll('.sidebar-link');

  function switchTab(tabName) {
    sidebarLinks.forEach(function(l) {
      l.classList.toggle('active', l.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(function(p) {
      p.classList.remove('active');
    });
    var panel = $('tab-' + tabName);
    if (panel) panel.classList.add('active');
    closeSidebar();
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('show');
  }

  sidebarLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      switchTab(link.dataset.tab);
    });
  });

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('show');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  document.querySelectorAll('.qa-btn[data-goto]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchTab(btn.dataset.goto);
    });
  });

  /* ═══════════════════════════════════════════════════════════
     INIT — called after auth success
     ═══════════════════════════════════════════════════════════ */

  var adminInitialized = false;

  function initAdmin() {
    if (adminInitialized) return;
    adminInitialized = true;

    setupImageUpload('heroImageInput', 'heroImagePreview', 'hero_img', 1200);

    loadDashboard();
    loadSettings();
    loadNavLinks();
    loadTheme();
    loadHero();
    loadAbout();
    loadSkills();
    loadExperience();
    loadEducation();
    loadCerts();
    loadProjects();
    loadDownloadCategories();
    loadDownloads();
    loadContacts();
    loadContactCta();
    loadKb();
    loadFooterLinks();

    if (typeof CVBuilder !== 'undefined') {
      CVBuilder.init('cvBuilderRoot');
    }

    initAccountSecurity();

    themeColorFields.forEach(syncColorPickerWithHex);

    bindSaveButtons();
    bindCrudButtons();

    var contactTypeSelect = $('contactType');
    if (contactTypeSelect) {
      contactTypeSelect.addEventListener('change', function() {
        var jf = $('jamiaFields');
        if (jf) jf.style.display = contactTypeSelect.value === 'jamia' ? '' : 'none';
      });
    }

    var dlSearch = $('downloadsSearchAdmin');
    if (dlSearch) dlSearch.addEventListener('input', loadDownloads);
    var dlFilter = $('downloadsCategoryAdmin');
    if (dlFilter) dlFilter.addEventListener('change', loadDownloads);
  }

  /* ═══════════════════════════════════════════════════════════
     DASHBOARD STATS
     ═══════════════════════════════════════════════════════════ */

  function loadDashboard() {
    db.ref(DB_PREFIX + 'projects').on('value', function(s) { setText('projCount', s.numChildren()); });
    db.ref(DB_PREFIX + 'skills').on('value', function(s) { setText('skillCount', s.numChildren()); });
    db.ref(DB_PREFIX + 'experience').on('value', function(s) { setText('expCount', s.numChildren()); });
    db.ref(DB_PREFIX + 'education').on('value', function(s) { setText('eduCount', s.numChildren()); });
  }

  /* ═══════════════════════════════════════════════════════════
     SETTINGS
     ═══════════════════════════════════════════════════════════ */

  var settingsFields = [
    'settingName', 'settingTitle', 'settingEmail', 'settingPhone',
    'settingLocation', 'settingGithub', 'settingLinkedin', 'settingKaggle', 'settingCvUrl',
    'settingFooterTagline', 'settingFormEmail', 'settingCopyrightText',
    'settingCloudName', 'settingCloudUploadPreset'
  ];

  function loadSettings() {
    db.ref(DB_PREFIX + 'settings').once('value', function(snap) {
      var d = snap.val() || {};
      settingsFields.forEach(function(id) {
        var key = id.replace('setting', '');
        key = key.charAt(0).toLowerCase() + key.slice(1);
        setVal(id, d[key]);
      });
      if (!val('settingCloudName').trim()) setVal('settingCloudName', DEFAULT_CLOUDINARY_CLOUD_NAME);
      if (!val('settingCloudUploadPreset').trim()) setVal('settingCloudUploadPreset', DEFAULT_CLOUDINARY_UPLOAD_PRESET);
    });
  }

  function saveSettings() {
    var data = {};
    settingsFields.forEach(function(id) {
      var key = id.replace('setting', '');
      key = key.charAt(0).toLowerCase() + key.slice(1);
      data[key] = val(id).trim();
    });
    db.ref(DB_PREFIX + 'settings').set(data).then(function() {
      showToast('Settings saved successfully');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     NAVIGATION LINKS CRUD
     ═══════════════════════════════════════════════════════════ */

  function loadNavLinks() {
    db.ref(DB_PREFIX + 'navLinks').on('value', function(snap) {
      var list = $('navLinksList');
      if (!list) return;
      var data = snap.val();
      if (!data) {
        list.innerHTML = '<div class="empty-state"><p>No custom navigation links yet. Default links will be shown.</p></div>';
        return;
      }
      var items = [];
      Object.keys(data).forEach(function(k) {
        var item = data[k];
        item._id = k;
        items.push(item);
      });
      items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

      var html = '';
      items.forEach(function(item) {
        html += '<div class="data-item">' +
          '<div class="di-body">' +
            '<h4>' + esc(item.label) +
              (!item.visible ? ' <span style="color:#ef4444;font-size:.75rem;font-weight:600">HIDDEN</span>' : '') +
            '</h4>' +
            '<p style="color:#6b7280;font-size:.85rem">' + esc(item.href) + ' · Order: ' + (item.order || 0) +
              (item.target === '_blank' ? ' · Opens in new tab' : '') +
            '</p>' +
          '</div>' +
          '<div class="di-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.editNavLink(\'' + item._id + '\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteItem(\'' + esc(DB_PREFIX + 'navLinks') + '\',\'' + item._id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      });
      list.innerHTML = html;
    });
  }

  function resetNavLinkForm() {
    setVal('navLinkEditId', '');
    setVal('navLinkLabel', '');
    setVal('navLinkHref', '');
    setVal('navLinkOrder', '');
    setVal('navLinkTarget', '_self');
    var vis = $('navLinkVisible'); if (vis) vis.checked = true;
    setText('navLinkFormTitle', 'Add New Link');
    var form = $('navLinkForm'); if (form) form.style.display = 'none';
  }

  function saveNavLink() {
    var label = val('navLinkLabel').trim();
    var href = val('navLinkHref').trim();
    if (!label || !href) { showToast('Label and target are required', 'error'); return; }

    var editId = val('navLinkEditId');
    var data = {
      label: label,
      href: href,
      order: parseInt(val('navLinkOrder')) || 0,
      target: val('navLinkTarget') || '_self',
      visible: $('navLinkVisible') ? $('navLinkVisible').checked : true
    };

    var ref;
    if (editId) {
      ref = db.ref(DB_PREFIX + 'navLinks/' + editId).update(data);
    } else {
      ref = db.ref(DB_PREFIX + 'navLinks').push(data);
    }
    ref.then(function() {
      showToast(editId ? 'Link updated' : 'Link added');
      resetNavLinkForm();
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     THEME / COLORS
     ═══════════════════════════════════════════════════════════ */

  var themeDefaults = {
    accent1: '#7c3aed', accent2: '#a78bfa', accent3: '#c4b5fd',
    bgPrimary: '#0a0a0f', bgSecondary: '#111118',
    textPrimary: '#ffffff', textSecondary: '#94a3b8'
  };

  var themePresets = {
    'violet': {
      accent1: '#7c3aed', accent2: '#a78bfa', accent3: '#c4b5fd',
      bgPrimary: '#0a0a0f', bgSecondary: '#111118',
      textPrimary: '#ffffff', textSecondary: '#94a3b8'
    },
    'ocean-blue': {
      accent1: '#1e40af', accent2: '#38bdf8', accent3: '#7dd3fc',
      bgPrimary: '#0a0a0f', bgSecondary: '#0c1222',
      textPrimary: '#ffffff', textSecondary: '#94a3b8'
    },
    'ember-orange': {
      accent1: '#9a3412', accent2: '#fb923c', accent3: '#fed7aa',
      bgPrimary: '#0a0a0f', bgSecondary: '#18120c',
      textPrimary: '#ffffff', textSecondary: '#94a3b8'
    },
    'emerald-green': {
      accent1: '#065f46', accent2: '#10b981', accent3: '#6ee7b7',
      bgPrimary: '#0a0a0f', bgSecondary: '#0c1810',
      textPrimary: '#ffffff', textSecondary: '#94a3b8'
    },
    'crimson': {
      accent1: '#991b1b', accent2: '#f87171', accent3: '#fca5a5',
      bgPrimary: '#0a0a0f', bgSecondary: '#180c0c',
      textPrimary: '#ffffff', textSecondary: '#94a3b8'
    },
    'ice-blue': {
      accent1: '#0e7490', accent2: '#67e8f9', accent3: '#a5f3fc',
      bgPrimary: '#0a0a0f', bgSecondary: '#0c1618',
      textPrimary: '#ffffff', textSecondary: '#94a3b8'
    }
  };

  var themeColorFields = ['accent1', 'accent2', 'accent3', 'bgPrimary', 'bgSecondary', 'textPrimary', 'textSecondary'];

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function setThemeFieldValue(field, color) {
    var picker = $('theme' + capitalize(field));
    var hex = $('theme' + capitalize(field) + 'Hex');
    if (picker) picker.value = color;
    if (hex) hex.value = color;
  }

  function getThemeFieldValue(field) {
    return val('theme' + capitalize(field) + 'Hex') || val('theme' + capitalize(field)) || themeDefaults[field];
  }

  function updateThemePreview() {
    var a1 = getThemeFieldValue('accent1');
    var a2 = getThemeFieldValue('accent2');
    var bg = getThemeFieldValue('bgPrimary');
    var t = getThemeFieldValue('textPrimary');

    var prevA1 = $('prevAccent1'); if (prevA1) prevA1.style.background = a1;
    var prevA2 = $('prevAccent2'); if (prevA2) prevA2.style.background = a2;
    var prevBg = $('prevBgPrimary'); if (prevBg) prevBg.style.background = bg;
    var prevT = $('prevTextPrimary'); if (prevT) prevT.style.background = t;
    var prevBtn = $('prevBtnPrimary'); if (prevBtn) prevBtn.style.background = a1;
    var prevH = $('prevHeading'); if (prevH) prevH.style.color = t;
    var prevHl = $('prevHighlight'); if (prevHl) prevHl.style.color = a2;

    var previewCard = $('themePreview');
    if (previewCard) previewCard.style.background = bg;
  }

  function syncColorPickerWithHex(field) {
    var picker = $('theme' + capitalize(field));
    var hex = $('theme' + capitalize(field) + 'Hex');
    if (picker) {
      picker.addEventListener('input', function() {
        if (hex) hex.value = picker.value;
        updateThemePreview();
      });
    }
    if (hex) {
      hex.addEventListener('input', function() {
        var v = hex.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(v) && picker) {
          picker.value = v;
        }
        updateThemePreview();
      });
    }
  }

  function loadTheme() {
    db.ref(DB_PREFIX + 'theme').once('value', function(snap) {
      var d = snap.val() || {};
      themeColorFields.forEach(function(field) {
        setThemeFieldValue(field, d[field] || themeDefaults[field]);
      });
      updateThemePreview();
    });
  }

  function saveTheme() {
    var data = {};
    themeColorFields.forEach(function(field) {
      data[field] = getThemeFieldValue(field);
    });

    var r = parseInt(data.accent1.slice(1, 3), 16);
    var g = parseInt(data.accent1.slice(3, 5), 16);
    var b = parseInt(data.accent1.slice(5, 7), 16);
    data.accent1Rgb = r + ',' + g + ',' + b;

    db.ref(DB_PREFIX + 'theme').set(data).then(function() {
      showToast('Theme saved! Changes will appear on website immediately.');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  function applyPreset(presetName) {
    var preset = themePresets[presetName];
    if (!preset) return;
    themeColorFields.forEach(function(field) {
      setThemeFieldValue(field, preset[field] || themeDefaults[field]);
    });
    updateThemePreview();
    showToast('Preset applied. Click "Save Theme" to apply to website.');
  }

  /* ═══════════════════════════════════════════════════════════
     HERO SECTION
     ═══════════════════════════════════════════════════════════ */

  function loadHero() {
    db.ref(DB_PREFIX + 'hero').once('value', function(snap) {
      var d = snap.val() || {};
      setVal('heroBadge', d.badge);
      setVal('heroFirstName', d.firstName);
      setVal('heroLastName', d.lastName);
      setVal('heroTypedRoles', Array.isArray(d.typedRoles) ? d.typedRoles.join(', ') : (d.typedRoles || ''));
      setVal('heroDescription', d.description);
      setVal('heroMetric1Value', d.metric1Value);
      setVal('heroMetric1Label', d.metric1Label);
      setVal('heroMetric2Value', d.metric2Value);
      setVal('heroMetric2Label', d.metric2Label);
      setVal('heroMetric3Value', d.metric3Value);
      setVal('heroMetric3Label', d.metric3Label);
      setVal('heroBadge1', d.badge1);
      setVal('heroBadge2', d.badge2);
      setVal('heroBadge3', d.badge3);
      if (d.image) {
        pendingImages['hero_img'] = d.image;
        renderImagePreview('heroImagePreview', d.image, 'hero_img');
      }
    });
  }

  function saveHero() {
    var typingRaw = val('heroTypedRoles').trim();
    var typedRoles = typingRaw ? typingRaw.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];

    var data = {
      badge: val('heroBadge').trim(),
      firstName: val('heroFirstName').trim(),
      lastName: val('heroLastName').trim(),
      typedRoles: typedRoles,
      description: val('heroDescription').trim(),
      metric1Value: val('heroMetric1Value').trim(),
      metric1Label: val('heroMetric1Label').trim(),
      metric2Value: val('heroMetric2Value').trim(),
      metric2Label: val('heroMetric2Label').trim(),
      metric3Value: val('heroMetric3Value').trim(),
      metric3Label: val('heroMetric3Label').trim(),
      badge1: val('heroBadge1').trim(),
      badge2: val('heroBadge2').trim(),
      badge3: val('heroBadge3').trim(),
      image: pendingImages['hero_img'] || null
    };

    db.ref(DB_PREFIX + 'hero').set(data).then(function() {
      showToast('Hero section saved');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     ABOUT SECTION
     ═══════════════════════════════════════════════════════════ */

  function loadAbout() {
    db.ref(DB_PREFIX + 'about').once('value', function(snap) {
      var d = snap.val() || {};
      for (var i = 1; i <= 4; i++) {
        setVal('aboutStat' + i + 'Value', d['stat' + i + 'Value']);
        setVal('aboutStat' + i + 'Label', d['stat' + i + 'Label']);
      }
      setVal('aboutParagraph1', d.paragraph1);
      setVal('aboutParagraph2', d.paragraph2);
      setVal('aboutParagraph3', d.paragraph3);
      setVal('aboutRole', d.role);
      setVal('aboutCompany', d.company);
      setVal('aboutLocation', d.location);
      setVal('aboutCity', d.city);
      setVal('aboutCert', d.cert);
      setVal('aboutCertDetail', d.certDetail);
      setVal('aboutEdu', d.edu);
      setVal('aboutEduDetail', d.eduDetail);
      setVal('aboutHl1Title', d.hl1Title);
      setVal('aboutHl1Desc', d.hl1Desc);
      setVal('aboutHl2Title', d.hl2Title);
      setVal('aboutHl2Desc', d.hl2Desc);
      setVal('aboutHl3Title', d.hl3Title);
      setVal('aboutHl3Desc', d.hl3Desc);
    });
  }

  function saveAbout() {
    var data = {
      paragraph1: val('aboutParagraph1').trim(),
      paragraph2: val('aboutParagraph2').trim(),
      paragraph3: val('aboutParagraph3').trim(),
      role: val('aboutRole').trim(),
      company: val('aboutCompany').trim(),
      location: val('aboutLocation').trim(),
      city: val('aboutCity').trim(),
      cert: val('aboutCert').trim(),
      certDetail: val('aboutCertDetail').trim(),
      edu: val('aboutEdu').trim(),
      eduDetail: val('aboutEduDetail').trim(),
      hl1Title: val('aboutHl1Title').trim(),
      hl1Desc: val('aboutHl1Desc').trim(),
      hl2Title: val('aboutHl2Title').trim(),
      hl2Desc: val('aboutHl2Desc').trim(),
      hl3Title: val('aboutHl3Title').trim(),
      hl3Desc: val('aboutHl3Desc').trim()
    };
    for (var i = 1; i <= 4; i++) {
      data['stat' + i + 'Value'] = val('aboutStat' + i + 'Value').trim();
      data['stat' + i + 'Label'] = val('aboutStat' + i + 'Label').trim();
    }
    db.ref(DB_PREFIX + 'about').set(data).then(function() {
      showToast('About section saved');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     SKILLS CRUD
     ═══════════════════════════════════════════════════════════ */

  function loadSkills() {
    db.ref(DB_PREFIX + 'skills').orderByChild('order').on('value', function(snap) {
      var items = [];
      snap.forEach(function(c) { var v = c.val(); v.id = c.key; items.push(v); });

      var list = $('skillsList');
      if (!list) return;

      if (items.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No skill categories yet. Click "Add Skill Category" to create one.</p></div>';
        return;
      }

      list.innerHTML = items.map(function(s) {
        var pills = Array.isArray(s.pills) ? s.pills : (s.pills || '').split(',');
        var pillsHtml = pills.map(function(p) {
          return '<span class="badge" style="margin:2px 4px 2px 0">' + esc(p.trim()) + '</span>';
        }).join('');
        return '<div class="data-item">' +
          '<div class="data-item-body">' +
            '<h4>' + esc(s.category) + '</h4>' +
            '<div class="data-item-meta">Order: ' + (s.order || 0) + '</div>' +
            '<div style="margin-top:6px">' + pillsHtml + '</div>' +
          '</div>' +
          '<div class="data-item-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.editSkill(\'' + s.id + '\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteItem(\'' + esc(DB_PREFIX + 'skills') + '\',\'' + s.id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function resetSkillForm() {
    var form = $('skillForm'); if (form) form.style.display = 'none';
    setText('skillFormTitle', 'Add Skill Category');
    setVal('skillEditId', '');
    setVal('skillCategory', '');
    setVal('skillPills', '');
    setVal('skillOrder', '');
  }

  function saveSkill() {
    var category = val('skillCategory').trim();
    if (!category) { showToast('Category name is required', 'error'); return; }

    var pillsRaw = val('skillPills').trim();

    var data = {
      category: category,
      pills: pillsRaw,
      order: parseInt(val('skillOrder')) || 0
    };

    var editId = val('skillEditId');
    var ref;
    if (editId) {
      ref = db.ref(DB_PREFIX + 'skills/' + editId).update(data);
    } else {
      ref = db.ref(DB_PREFIX + 'skills').push(data);
    }

    ref.then(function() {
      showToast(editId ? 'Skill category updated' : 'Skill category added');
      resetSkillForm();
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     EXPERIENCE CRUD
     ═══════════════════════════════════════════════════════════ */

  function loadExperience() {
    db.ref(DB_PREFIX + 'experience').orderByChild('order').on('value', function(snap) {
      var items = [];
      snap.forEach(function(c) { var v = c.val(); v.id = c.key; items.push(v); });

      var list = $('expList');
      if (!list) return;

      if (items.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No experience entries yet. Click "Add Experience" to create one.</p></div>';
        return;
      }

      list.innerHTML = items.map(function(e) {
        var tagsHtml = '';
        if (e.techTags) {
          var tags = Array.isArray(e.techTags) ? e.techTags : e.techTags.split(',');
          tagsHtml = '<div style="margin-top:6px">' + tags.map(function(t) {
            return '<span class="badge" style="margin:2px 4px 2px 0">' + esc(t.trim()) + '</span>';
          }).join('') + '</div>';
        }
        return '<div class="data-item">' +
          '<div class="data-item-body">' +
            '<h4>' + esc(e.role) + ' @ ' + esc(e.company) +
              (e.current ? ' <span style="color:#10b981;font-size:.75rem;font-weight:600">CURRENT</span>' : '') +
            '</h4>' +
            '<div class="data-item-meta">' + esc(e.dateRange) + ' · Order: ' + (e.order || 0) + '</div>' +
            '<p>' + esc((e.description || '').substring(0, 150)) + (e.description && e.description.length > 150 ? '...' : '') + '</p>' +
            tagsHtml +
          '</div>' +
          '<div class="data-item-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.editExp(\'' + e.id + '\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteItem(\'' + esc(DB_PREFIX + 'experience') + '\',\'' + e.id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function resetExpForm() {
    var form = $('expForm'); if (form) form.style.display = 'none';
    setText('expFormTitle', 'Add Experience');
    setVal('expEditId', '');
    setVal('expRole', '');
    setVal('expCompany', '');
    setVal('expCompanyNote', '');
    setVal('expDateRange', '');
    setVal('expDescription', '');
    setVal('expTechTags', '');
    setVal('expOrder', '');
    var cb = $('expCurrent'); if (cb) cb.checked = false;
  }

  function saveExperience() {
    var role = val('expRole').trim();
    var company = val('expCompany').trim();
    if (!role || !company) { showToast('Role and company are required', 'error'); return; }

    var tagsRaw = val('expTechTags').trim();

    var data = {
      role: role,
      company: company,
      companyNote: val('expCompanyNote').trim(),
      dateRange: val('expDateRange').trim(),
      description: val('expDescription').trim(),
      techTags: tagsRaw,
      current: $('expCurrent') ? $('expCurrent').checked : false,
      order: parseInt(val('expOrder')) || 0
    };

    var editId = val('expEditId');
    var ref;
    if (editId) {
      ref = db.ref(DB_PREFIX + 'experience/' + editId).update(data);
    } else {
      ref = db.ref(DB_PREFIX + 'experience').push(data);
    }

    ref.then(function() {
      showToast(editId ? 'Experience updated' : 'Experience added');
      resetExpForm();
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     EDUCATION CRUD
     ═══════════════════════════════════════════════════════════ */

  function loadEducation() {
    db.ref(DB_PREFIX + 'education').orderByChild('order').on('value', function(snap) {
      var items = [];
      snap.forEach(function(c) { var v = c.val(); v.id = c.key; items.push(v); });

      var list = $('eduList');
      if (!list) return;

      if (items.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No education entries yet. Click "Add Education" to create one.</p></div>';
        return;
      }

      list.innerHTML = items.map(function(e) {
        return '<div class="data-item">' +
          '<div class="data-item-body">' +
            '<h4>' + esc(e.degree) +
              (e.badge ? ' <span class="badge badge-accent">' + esc(e.badge) + '</span>' : '') +
            '</h4>' +
            '<div class="data-item-meta">' + esc(e.school) + ' · ' + esc(e.years) + ' · Order: ' + (e.order || 0) + '</div>' +
            '<p>' + esc(e.description) + '</p>' +
          '</div>' +
          '<div class="data-item-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.editEdu(\'' + e.id + '\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteItem(\'' + esc(DB_PREFIX + 'education') + '\',\'' + e.id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function resetEduForm() {
    var form = $('eduForm'); if (form) form.style.display = 'none';
    setText('eduFormTitle', 'Add Education');
    setVal('eduEditId', '');
    setVal('eduDegree', '');
    setVal('eduSchool', '');
    setVal('eduYears', '');
    setVal('eduDescription', '');
    setVal('eduBadge', '');
    setVal('eduOrder', '');
  }

  function saveEducation() {
    var degree = val('eduDegree').trim();
    var school = val('eduSchool').trim();
    if (!degree || !school) { showToast('Degree and school are required', 'error'); return; }

    var data = {
      degree: degree,
      school: school,
      years: val('eduYears').trim(),
      description: val('eduDescription').trim(),
      badge: val('eduBadge').trim(),
      order: parseInt(val('eduOrder')) || 0
    };

    var editId = val('eduEditId');
    var ref;
    if (editId) {
      ref = db.ref(DB_PREFIX + 'education/' + editId).update(data);
    } else {
      ref = db.ref(DB_PREFIX + 'education').push(data);
    }

    ref.then(function() {
      showToast(editId ? 'Education updated' : 'Education added');
      resetEduForm();
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     CERTIFICATIONS CRUD
     ═══════════════════════════════════════════════════════════ */

  function loadCerts() {
    db.ref(DB_PREFIX + 'certs').on('value', function(snap) {
      var items = [];
      snap.forEach(function(c) { var v = c.val(); v.id = c.key; items.push(v); });

      var list = $('certsList');
      if (!list) return;

      if (items.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No certifications yet. Click "Add Certification" to create one.</p></div>';
        return;
      }

      list.innerHTML = items.map(function(c) {
        return '<div class="data-item">' +
          '<div class="data-item-body">' +
            '<h4>' + esc(c.name) + '</h4>' +
            '<div class="data-item-meta">' + esc(c.detail) + '</div>' +
          '</div>' +
          '<div class="data-item-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.editCert(\'' + c.id + '\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteItem(\'' + esc(DB_PREFIX + 'certs') + '\',\'' + c.id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function resetCertForm() {
    var form = $('certForm'); if (form) form.style.display = 'none';
    setText('certFormTitle', 'Add Certification');
    setVal('certEditId', '');
    setVal('certName', '');
    setVal('certDetail', '');
    setVal('certOrder', '');
  }

  function saveCert() {
    var name = val('certName').trim();
    if (!name) { showToast('Certification name is required', 'error'); return; }

    var data = {
      name: name,
      detail: val('certDetail').trim(),
      order: parseInt(val('certOrder')) || 0
    };

    var editId = val('certEditId');
    var ref;
    if (editId) {
      ref = db.ref(DB_PREFIX + 'certs/' + editId).update(data);
    } else {
      ref = db.ref(DB_PREFIX + 'certs').push(data);
    }

    ref.then(function() {
      showToast(editId ? 'Certification updated' : 'Certification added');
      resetCertForm();
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     PROJECTS CRUD
     ═══════════════════════════════════════════════════════════ */

  function loadProjects() {
    db.ref(DB_PREFIX + 'projects').orderByChild('order').on('value', function(snap) {
      var items = [];
      snap.forEach(function(c) { var v = c.val(); v.id = c.key; items.push(v); });

      var list = $('projList');
      if (!list) return;

      if (items.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No projects yet. Click "Add Project" to create one.</p></div>';
        return;
      }

      list.innerHTML = items.map(function(p) {
        var tagsHtml = '';
        if (p.techTags) {
          var tags = Array.isArray(p.techTags) ? p.techTags : p.techTags.split(',');
          tagsHtml = '<div style="margin-top:6px">' + tags.map(function(t) {
            return '<span class="badge" style="margin:2px 4px 2px 0">' + esc(t.trim()) + '</span>';
          }).join('') + '</div>';
        }
        return '<div class="data-item">' +
          '<div class="data-item-body">' +
            '<h4>' + esc(p.title) +
              (p.featured ? ' <span class="badge badge-accent">Featured</span>' : '') +
            '</h4>' +
            '<div class="data-item-meta">' +
              '<span class="badge">' + esc(p.label) + '</span>' +
              ' · Order: ' + (p.order || 0) +
              (p.githubUrl ? ' · <a href="' + esc(p.githubUrl) + '" target="_blank" style="color:#7c3aed">GitHub</a>' : '') +
            '</div>' +
            '<p>' + esc((p.description || '').substring(0, 150)) + (p.description && p.description.length > 150 ? '...' : '') + '</p>' +
            tagsHtml +
          '</div>' +
          '<div class="data-item-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.editProj(\'' + p.id + '\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteItem(\'' + esc(DB_PREFIX + 'projects') + '\',\'' + p.id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function resetProjForm() {
    var form = $('projForm'); if (form) form.style.display = 'none';
    setText('projFormTitle', 'Add Project');
    setVal('projEditId', '');
    setVal('projLabel', '');
    setVal('projTitle', '');
    setVal('projDescription', '');
    setVal('projTechTags', '');
    setVal('projGithubUrl', '');
    setVal('projLiveUrl', '');
    setVal('projOrder', '');
    var cb = $('projFeatured'); if (cb) cb.checked = false;
  }

  function saveProject() {
    var title = val('projTitle').trim();
    if (!title) { showToast('Project title is required', 'error'); return; }

    var tagsRaw = val('projTechTags').trim();

    var data = {
      label: val('projLabel').trim(),
      title: title,
      description: val('projDescription').trim(),
      techTags: tagsRaw,
      githubUrl: val('projGithubUrl').trim(),
      liveUrl: val('projLiveUrl').trim(),
      featured: $('projFeatured') ? $('projFeatured').checked : false,
      order: parseInt(val('projOrder')) || 0
    };

    var editId = val('projEditId');
    var ref;
    if (editId) {
      ref = db.ref(DB_PREFIX + 'projects/' + editId).update(data);
    } else {
      ref = db.ref(DB_PREFIX + 'projects').push(data);
    }

    ref.then(function() {
      showToast(editId ? 'Project updated' : 'Project added');
      resetProjForm();
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     DOWNLOAD MANAGEMENT
     ═══════════════════════════════════════════════════════════ */

  var MAX_DOWNLOAD_FILE_BYTES = 100 * 1024 * 1024;

  function normalizeTags(raw) {
    return (raw || '')
      .split(',')
      .map(function(t) { return t.trim(); })
      .filter(Boolean);
  }

  function categoryKey(name) {
    var key = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return key || 'general';
  }

  function normalizeDownloadCategory(s) {
    return (s || '').trim() || 'General';
  }

  function detectFileType(name, mimeType) {
    var n = (name || '').toLowerCase();
    var m = (mimeType || '').toLowerCase();
    if (m.indexOf('pdf') > -1 || /\.pdf$/.test(n)) return 'pdf';
    if (m.indexOf('presentation') > -1 || /\.(ppt|pptx)$/.test(n)) return 'ppt';
    if (m.indexOf('word') > -1 || /\.(doc|docx)$/.test(n)) return 'word';
    if (m.indexOf('excel') > -1 || /\.(xls|xlsx|csv)$/.test(n)) return 'excel';
    if (m.indexOf('image/') === 0 || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(n)) return 'image';
    if (m.indexOf('video/') === 0 || /\.(mp4|webm|mov|avi|mkv)$/.test(n)) return 'video';
    if (m.indexOf('audio/') === 0 || /\.(mp3|wav|ogg|m4a)$/.test(n)) return 'audio';
    if (m.indexOf('text/') === 0 || /\.(txt|md|json|xml|yaml|yml|js|ts|py|java|css|html)$/.test(n)) return 'text';
    return 'file';
  }

  function formatBytes(bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    var units = ['KB', 'MB', 'GB', 'TB'];
    var i = -1;
    do { n = n / 1024; i++; } while (n >= 1024 && i < units.length - 1);
    return n.toFixed(n >= 100 ? 0 : 1) + ' ' + units[i];
  }

  function iconForFileType(type) {
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

  function isDataUrl(url) {
    return String(url || '').toLowerCase().indexOf('data:') === 0;
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

  function safeDownloadUrl(item) {
    var url = item && item.downloadUrl ? String(item.downloadUrl) : '';
    if (!url) return '';
    url = normalizeFileUrl(url);
    if (isDataUrl(url)) return url;
    if (/^https?:\/\//i.test(url)) return url;
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

  function safeDisplayFileName(item) {
    var name = item && item.displayFileName ? String(item.displayFileName).trim() : '';
    if (name) return name;
    var title = item && item.title ? String(item.title).trim() : '';
    var original = item && item.fileName ? String(item.fileName).trim() : '';
    var ext = '';
    if (original && original.indexOf('.') > -1) ext = original.split('.').pop().toLowerCase();
    if (!title) return '';
    var safe = title.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\s/g, '_');
    if (!safe) return '';
    return ext ? (safe + '.' + ext) : safe;
  }

  function effectiveDownloadUrl(item) {
    var raw = safeDownloadUrl(item);
    if (!raw) return '';
    return raw;
  }

  function buildPreviewPageUrl(item, rawUrl) {
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) return '';
    var officeType = detectOfficeType(item, rawUrl);
    if (officeType) return 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(rawUrl);
    return rawUrl;
  }

  function safeViewUrl(item) {
    var url = safeDownloadUrl(item);
    if (!url) return '';
    return buildPreviewPageUrl(item, url) || url;
  }

  function uploadFileToStorageResumable(file, storagePath, onProgress) {
    return new Promise(function(resolve, reject) {
      var ref = storage.ref(storagePath);
      var task = ref.put(file, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: 'public,max-age=31536000'
      });

      task.on('state_changed', function(snapshot) {
        if (!onProgress) return;
        var pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(pct, snapshot);
      }, function(err) {
        reject(err);
      }, function() {
        task.snapshot.ref.getDownloadURL().then(function(url) {
          resolve(url);
        }).catch(reject);
      });
    });
  }

  function cloudinaryResourceType(file) {
    var kind = detectFileType(file.name, file.type);
    if (kind === 'image') return 'image';
    if (kind === 'video') return 'video';
    if (kind === 'audio') return 'video';
    return 'raw';
  }

  function uploadFileToCloudinary(file, cloudName, uploadPreset, folder, onProgress) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var resourceType = cloudinaryResourceType(file);
      var url = 'https://api.cloudinary.com/v1_1/' + encodeURIComponent(cloudName) + '/' + resourceType + '/upload';
      xhr.open('POST', url, true);
      xhr.responseType = 'json';

      xhr.upload.onprogress = function(e) {
        if (!onProgress || !e.lengthComputable) return;
        var percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      };

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          var body = xhr.response || {};
          if (body.secure_url) {
            resolve({
              downloadUrl: body.secure_url,
              publicId: body.public_id || '',
              sourceKind: 'cloudinary'
            });
            return;
          }
          reject(new Error('Cloudinary response missing secure_url.'));
          return;
        }
        var errMsg = 'Cloudinary upload failed (' + xhr.status + ')';
        if (xhr.response && xhr.response.error && xhr.response.error.message) {
          errMsg += ': ' + xhr.response.error.message;
        }
        reject(new Error(errMsg));
      };

      xhr.onerror = function() {
        reject(new Error('Network error while uploading to Cloudinary.'));
      };

      var fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      if (folder) fd.append('folder', folder);
      xhr.send(fd);
    });
  }

  function loadDownloadCategories() {
    db.ref(DB_PREFIX + 'downloadCategories').on('value', function(snap) {
      var data = snap.val() || {};
      var listEl = $('downloadCategoriesList');
      var optionsEl = $('downloadCategoryOptions');
      var filterEl = $('downloadsCategoryAdmin');
      var categories = Object.keys(data).map(function(k) {
        return { id: k, name: data[k].name || '' };
      }).filter(function(c) { return !!c.name; });
      categories.sort(function(a, b) { return a.name.localeCompare(b.name); });

      if (optionsEl) {
        optionsEl.innerHTML = categories.map(function(c) {
          return '<option value="' + esc(c.name) + '"></option>';
        }).join('');
      }

      if (filterEl) {
        var current = filterEl.value;
        filterEl.innerHTML = '<option value="">All Categories</option>' + categories.map(function(c) {
          return '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>';
        }).join('');
        filterEl.value = current;
      }

      if (listEl) {
        if (!categories.length) {
          listEl.innerHTML = '<div class="empty-state"><p>No categories yet.</p></div>';
        } else {
          listEl.innerHTML = categories.map(function(c) {
            return '<div class="data-item">' +
              '<div class="data-item-body"><h4>' + esc(c.name) + '</h4></div>' +
              '<div class="data-item-actions">' +
              '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteDownloadCategory(\'' + c.id + '\')">Delete</button>' +
              '</div></div>';
          }).join('');
        }
      }
    });
  }

  function addDownloadCategory() {
    var name = normalizeDownloadCategory(val('newDownloadCategory'));
    var key = categoryKey(name);
    db.ref(DB_PREFIX + 'downloadCategories/' + key).set({
      name: name,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(function() {
      setVal('newDownloadCategory', '');
      showToast('Category added');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  function loadDownloads() {
    db.ref(DB_PREFIX + 'downloads').on('value', function(snap) {
      var listEl = $('downloadsList');
      if (!listEl) return;
      var data = snap.val() || {};
      var items = Object.keys(data).map(function(k) {
        var v = data[k] || {};
        v.id = k;
        return v;
      });
      var q = val('downloadsSearchAdmin').trim().toLowerCase();
      var cat = val('downloadsCategoryAdmin').trim().toLowerCase();
      items.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      items = items.filter(function(it) {
        var matchesCat = !cat || (it.category || '').toLowerCase() === cat;
        if (!matchesCat) return false;
        if (!q) return true;
        var hay = [
          it.title, it.fileName, it.description, it.category,
          Array.isArray(it.tags) ? it.tags.join(' ') : ''
        ].join(' ').toLowerCase();
        return hay.indexOf(q) > -1;
      });

      if (!items.length) {
        listEl.innerHTML = '<div class="empty-state"><p>No files found.</p></div>';
        return;
      }

      listEl.innerHTML = items.map(function(it) {
        var vis = it.visible !== false;
        var tags = Array.isArray(it.tags) ? it.tags : [];
        var tagHtml = tags.map(function(t) { return '<span class="badge" style="margin-right:4px">' + esc(t) + '</span>'; }).join('');
        var viewHref = safeViewUrl(it);
        var downloadHref = effectiveDownloadUrl(it);
        var downloadName = safeDisplayFileName(it);
        var viewControl = viewHref
          ? '<a class="btn btn-sm btn-outline-dark" href="' + esc(viewHref) + '" target="_blank" rel="noopener">View</a>'
          : '<button class="btn btn-sm btn-outline-dark" disabled title="Preview unavailable for this file/link.">View</button>';
        var downloadControl = downloadHref
          ? '<a class="btn btn-sm btn-outline-dark" href="' + esc(downloadHref) + '"' + (downloadName ? ' download="' + esc(downloadName) + '"' : ' download') + '>Download</a>'
          : '<button class="btn btn-sm btn-outline-dark" disabled title="Download URL missing or invalid.">Download</button>';
        return '<div class="data-item">' +
          '<div class="data-item-body">' +
            '<h4>' + iconForFileType(it.fileType) + ' ' + esc(it.title || 'Untitled') +
              (vis ? ' <span style="color:#10b981;font-size:.75rem;font-weight:700">VISIBLE</span>' : ' <span style="color:#ef4444;font-size:.75rem;font-weight:700">HIDDEN</span>') +
            '</h4>' +
            '<div class="download-admin-meta">' + formatBytes(it.fileSize) + ' · ' + esc(it.category || 'General') + '</div>' +
            (it.description ? '<p>' + esc(it.description) + '</p>' : '') +
            (tagHtml ? '<div style="margin-top:6px">' + tagHtml + '</div>' : '') +
          '</div>' +
          '<div class="data-item-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.toggleDownloadVisibility(\'' + it.id + '\',' + (vis ? 'false' : 'true') + ')">' + (vis ? 'Hide' : 'Show') + '</button>' +
            viewControl +
            downloadControl +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteDownload(\'' + it.id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function uploadDownloads() {
    var input = $('downloadFileInput');
    if (!input || !input.files || !input.files.length) {
      showToast('Please select at least one file', 'error');
      return;
    }

    var files = Array.prototype.slice.call(input.files);
    var title = val('downloadTitle').trim();
    var category = normalizeDownloadCategory(val('downloadCategory'));
    var description = val('downloadDescription').trim();
    var tags = normalizeTags(val('downloadTags'));
    var visible = $('downloadVisible') ? $('downloadVisible').checked : true;
    var progressEl = $('downloadUploadProgress');
    var completed = 0;

    if (!auth.currentUser) {
      showToast('Please sign in again. Session expired.', 'error');
      if (progressEl) progressEl.textContent = 'Upload blocked: not authenticated.';
      return;
    }
    if (!title) {
      showToast('Title is required', 'error');
      if (progressEl) progressEl.textContent = 'Upload blocked: title is required.';
      return;
    }
    if (progressEl) progressEl.textContent = 'Uploading ' + files.length + ' file(s)...';

    function friendlyUploadError(err, fileName) {
      var code = (err && err.code) || '';
      var message = (err && err.message) || 'Unknown upload error';
      if (code === 'storage/unauthorized') {
        return 'Upload denied for "' + fileName + '". Firebase Storage rules allow nahi kar rahin.';
      }
      if (code === 'storage/retry-limit-exceeded') {
        return 'Network timeout during upload of "' + fileName + '". Dobara try karein.';
      }
      if (code === 'storage/quota-exceeded') {
        return 'Firebase Storage quota exceeded.';
      }
      if (message.toLowerCase().indexOf('cloudinary') > -1) {
        if (message.toLowerCase().indexOf('unknown api key') > -1) {
          return 'Cloudinary credentials mismatch. Cloud Name field me API key mat daalein; default cloud name is now auto-used.';
        }
        return 'Cloudinary upload error for "' + fileName + '": ' + message;
      }
      if (message.toLowerCase().indexOf('404') > -1) {
        return 'Storage bucket not found (404) for "' + fileName + '". Firebase console me Storage enable/configure karein.';
      }
      return 'Upload failed for "' + fileName + '": ' + message;
    }

    function getUploadProviderConfig() {
      var cloudNameRaw = val('settingCloudName').trim();
      var presetRaw = val('settingCloudUploadPreset').trim();
      // Force the known-good cloud name to avoid bad saved values.
      var cloudName = DEFAULT_CLOUDINARY_CLOUD_NAME;
      var uploadPreset = (/^[a-z0-9_-]+$/i.test(presetRaw))
        ? presetRaw
        : DEFAULT_CLOUDINARY_UPLOAD_PRESET;
      if (cloudName && uploadPreset) {
        return {
          provider: 'cloudinary',
          cloudName: cloudName,
          uploadPreset: uploadPreset
        };
      }
      return { provider: 'firebase' };
    }

    function ensureValidFiles() {
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if ((f.size || 0) > MAX_DOWNLOAD_FILE_BYTES) {
          throw new Error('"' + f.name + '" exceeds 100MB limit.');
        }
      }
    }

    function buildRecord(file, downloadUrl, sourceKind, sourcePath) {
      var now = firebase.database.ServerValue.TIMESTAMP;
      var ext = '';
      if (file && file.name && file.name.indexOf('.') > -1) {
        ext = file.name.split('.').pop().toLowerCase();
      }
      var safeBase = title
        .replace(/[\\/:*?"<>|]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\s/g, '_');
      var displayName = safeBase;
      if (ext) displayName += '.' + ext;
      return {
        title: title,
        fileName: file.name,
        displayFileName: displayName,
        description: description,
        category: category,
        tags: tags,
        visible: visible,
        fileType: detectFileType(file.name, file.type),
        mimeType: file.type || '',
        fileSize: file.size || 0,
        downloadUrl: downloadUrl,
        sourceKind: sourceKind || 'storage',
        storagePath: sourcePath || '',
        createdAt: now,
        updatedAt: now
      };
    }

    var providerCfg = getUploadProviderConfig();
    var chain = Promise.resolve().then(function() {
      ensureValidFiles();
    });

    files.forEach(function(file, idx) {
      chain = chain.then(function() {
        var ts = Date.now();
        var safeName = (file.name || ('file-' + idx)).replace(/[^\w.\-]/g, '_');
        var storagePath = DB_PREFIX + 'downloads/' + ts + '-' + idx + '-' + safeName;

        if (progressEl) progressEl.textContent = 'Uploading "' + file.name + '"... 0%';
        var uploadPromise;
        if (providerCfg.provider === 'cloudinary') {
          uploadPromise = uploadFileToCloudinary(
            file,
            providerCfg.cloudName,
            providerCfg.uploadPreset,
            'portfolio/downloads',
            function(percent) {
              if (progressEl) progressEl.textContent = 'Uploading "' + file.name + '"... ' + percent + '%';
            }
          ).then(function(res) {
            return {
              downloadUrl: res.downloadUrl,
              sourceKind: 'cloudinary',
              sourcePath: res.publicId
            };
          });
        } else {
          uploadPromise = uploadFileToStorageResumable(file, storagePath, function(percent) {
            if (progressEl) progressEl.textContent = 'Uploading "' + file.name + '"... ' + percent + '%';
          }).then(function(url) {
            return {
              downloadUrl: url,
              sourceKind: 'storage',
              sourcePath: storagePath
            };
          });
        }

        return uploadPromise.then(function(res) {
          var item = buildRecord(file, res.downloadUrl, res.sourceKind, res.sourcePath);
          return db.ref(DB_PREFIX + 'downloads').push(item);
        }).then(function() {
          completed += 1;
          if (progressEl) progressEl.textContent = 'Uploaded ' + completed + ' / ' + files.length + ' file(s)';
        }).catch(function(err) {
          err.fileName = file.name;
          return Promise.reject(err);
        });
      });
    });

    chain.then(function() {
      showToast('All files uploaded successfully');
      if (progressEl) progressEl.textContent = 'Upload completed.';
      input.value = '';
      setVal('downloadTitle', '');
      setVal('downloadDescription', '');
      setVal('downloadTags', '');
      db.ref(DB_PREFIX + 'downloadCategories').child(
        categoryKey(category)
      ).set({ name: category, updatedAt: firebase.database.ServerValue.TIMESTAMP });
    }).catch(function(err) {
      var detailed = friendlyUploadError(err, (err && err.fileName) || 'file');
      if (progressEl) progressEl.textContent = 'Upload failed.';
      showToast(detailed, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     CONTACT CARDS CRUD
     ═══════════════════════════════════════════════════════════ */

  function loadContacts() {
    db.ref(DB_PREFIX + 'contactCards').orderByChild('order').on('value', function(snap) {
      var items = [];
      snap.forEach(function(c) { var v = c.val(); v.id = c.key; items.push(v); });

      var list = $('contactList');
      if (!list) return;

      if (items.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No contact cards yet. Click "Add Contact Card" to create one.</p></div>';
        return;
      }

      list.innerHTML = items.map(function(c) {
        return '<div class="data-item">' +
          '<div class="data-item-body">' +
            '<h4>' + esc(c.label) + '</h4>' +
            '<div class="data-item-meta">' +
              '<span class="badge">' + esc(c.type) + '</span>' +
              ' · ' + esc(c.value) +
              ' · Order: ' + (c.order || 0) +
              (c.url ? ' · <a href="' + esc(c.url) + '" target="_blank" style="color:#7c3aed">Link</a>' : '') +
            '</div>' +
          '</div>' +
          '<div class="data-item-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.editContact(\'' + c.id + '\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteItem(\'' + esc(DB_PREFIX + 'contactCards') + '\',\'' + c.id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function resetContactForm() {
    var form = $('contactForm'); if (form) form.style.display = 'none';
    setText('contactFormTitle', 'Add Contact Card');
    setVal('contactEditId', '');
    setVal('contactType', 'email');
    setVal('contactLabel', '');
    setVal('contactValue', '');
    setVal('contactUrl', '');
    setVal('contactAction', '');
    setVal('contactOrder', '');
    var ext = $('contactExternal'); if (ext) ext.checked = false;
    setVal('contactDesc', '');
    setVal('contactSeal', '');
    setVal('contactImage', '');
    var jf = $('jamiaFields'); if (jf) jf.style.display = 'none';
  }

  function saveContact() {
    var label = val('contactLabel').trim();
    var value = val('contactValue').trim();
    if (!label || !value) { showToast('Label and value are required', 'error'); return; }

    var contactType = val('contactType');
    var data = {
      type: contactType,
      label: label,
      value: value,
      url: val('contactUrl').trim(),
      action: val('contactAction').trim(),
      external: $('contactExternal') ? $('contactExternal').checked : false,
      order: parseInt(val('contactOrder')) || 0
    };

    if (contactType === 'jamia') {
      data.desc = val('contactDesc').trim();
      data.seal = val('contactSeal').trim();
      data.image = val('contactImage').trim();
    }

    var editId = val('contactEditId');
    var ref;
    if (editId) {
      ref = db.ref(DB_PREFIX + 'contactCards/' + editId).update(data);
    } else {
      ref = db.ref(DB_PREFIX + 'contactCards').push(data);
    }

    ref.then(function() {
      showToast(editId ? 'Contact updated' : 'Contact added');
      resetContactForm();
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     CONTACT CTA
     ═══════════════════════════════════════════════════════════ */

  function loadContactCta() {
    db.ref(DB_PREFIX + 'contactCta').once('value', function(snap) {
      var d = snap.val() || {};
      setVal('contactCtaTitle', d.title);
      setVal('contactCtaText', d.text);
      setVal('contactCtaUrl', d.url);
    });
  }

  function saveContactCta() {
    var data = {
      title: val('contactCtaTitle').trim(),
      text: val('contactCtaText').trim(),
      url: val('contactCtaUrl').trim()
    };
    db.ref(DB_PREFIX + 'contactCta').set(data).then(function() {
      showToast('CTA saved');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     AI CHATBOT KNOWLEDGE BASE CRUD
     ═══════════════════════════════════════════════════════════ */

  function loadKb() {
    db.ref(DB_PREFIX + 'chatbot/kb').on('value', function(snap) {
      var items = [];
      snap.forEach(function(c) { var v = c.val(); v.id = c.key; items.push(v); });

      var list = $('kbList');
      if (!list) return;

      if (items.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No knowledge base entries yet. Click "Add KB Entry" to create one.</p></div>';
        return;
      }

      list.innerHTML = items.map(function(k) {
        return '<div class="data-item">' +
          '<div class="data-item-body">' +
            '<h4>' + esc(k.key) + '</h4>' +
            '<p>' + esc((k.value || '').substring(0, 200)) + (k.value && k.value.length > 200 ? '...' : '') + '</p>' +
          '</div>' +
          '<div class="data-item-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.editKb(\'' + k.id + '\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteItem(\'' + esc(DB_PREFIX + 'chatbot/kb') + '\',\'' + k.id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function resetKbForm() {
    var form = $('kbForm'); if (form) form.style.display = 'none';
    setText('kbFormTitle', 'Add Knowledge Base Entry');
    setVal('kbEditId', '');
    setVal('kbKey', '');
    setVal('kbValue', '');
  }

  function saveKb() {
    var key = val('kbKey').trim();
    var value = val('kbValue').trim();
    if (!key || !value) { showToast('Keyword and response are required', 'error'); return; }

    var data = {
      key: key,
      value: value
    };

    var editId = val('kbEditId');
    var ref;
    if (editId) {
      ref = db.ref(DB_PREFIX + 'chatbot/kb/' + editId).update(data);
    } else {
      ref = db.ref(DB_PREFIX + 'chatbot/kb').push(data);
    }

    ref.then(function() {
      showToast(editId ? 'KB entry updated' : 'KB entry added');
      resetKbForm();
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     FOOTER LINKS CRUD
     ═══════════════════════════════════════════════════════════ */

  function loadFooterLinks() {
    db.ref(DB_PREFIX + 'footerLinks').on('value', function(snap) {
      var list = $('footerLinksList');
      if (!list) return;
      var data = snap.val();
      if (!data) {
        list.innerHTML = '<div class="empty-state"><p>No footer links yet. Click "Add Footer Link" to create one.</p></div>';
        return;
      }
      var items = [];
      Object.keys(data).forEach(function(k) {
        var item = data[k]; item._id = k; items.push(item);
      });
      items.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

      list.innerHTML = items.map(function(item) {
        return '<div class="data-item">' +
          '<div class="di-body">' +
            '<h4>' + esc(item.label) +
              (item.isAdmin ? ' <span style="color:#7c3aed;font-size:.75rem;font-weight:600">ADMIN</span>' : '') +
              (item.visible === false ? ' <span style="color:#ef4444;font-size:.75rem;font-weight:600">HIDDEN</span>' : '') +
            '</h4>' +
            '<p style="color:#6b7280;font-size:.85rem">' + esc(item.href) + ' · Order: ' + (item.order || 0) + '</p>' +
          '</div>' +
          '<div class="di-actions">' +
            '<button class="btn btn-sm btn-outline-dark" onclick="PORTFOLIO.editFooterLink(\'' + item._id + '\')">Edit</button>' +
            '<button class="btn btn-sm btn-danger" onclick="PORTFOLIO.deleteItem(\'' + esc(DB_PREFIX + 'footerLinks') + '\',\'' + item._id + '\')">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function resetFooterLinkForm() {
    setVal('footerLinkEditId', '');
    setVal('footerLinkLabel', '');
    setVal('footerLinkHref', '');
    setVal('footerLinkOrder', '');
    setVal('footerLinkTarget', '_self');
    var vis = $('footerLinkVisible'); if (vis) vis.checked = true;
    var adm = $('footerLinkIsAdmin'); if (adm) adm.checked = false;
    setText('footerLinkFormTitle', 'Add Footer Link');
    var form = $('footerLinkForm'); if (form) form.style.display = 'none';
  }

  function saveFooterLink() {
    var label = val('footerLinkLabel').trim();
    var href = val('footerLinkHref').trim();
    if (!label || !href) { showToast('Label and link are required', 'error'); return; }

    var editId = val('footerLinkEditId');
    var data = {
      label: label,
      href: href,
      order: parseInt(val('footerLinkOrder')) || 0,
      target: val('footerLinkTarget') || '_self',
      visible: $('footerLinkVisible') ? $('footerLinkVisible').checked : true,
      isAdmin: $('footerLinkIsAdmin') ? $('footerLinkIsAdmin').checked : false
    };

    var ref;
    if (editId) {
      ref = db.ref(DB_PREFIX + 'footerLinks/' + editId).update(data);
    } else {
      ref = db.ref(DB_PREFIX + 'footerLinks').push(data);
    }
    ref.then(function() {
      showToast(editId ? 'Footer link updated' : 'Footer link added');
      resetFooterLinkForm();
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     GENERIC DELETE
     ═══════════════════════════════════════════════════════════ */

  window.PORTFOLIO = window.PORTFOLIO || {};

  window.PORTFOLIO.deleteItem = function(collectionPath, id) {
    if (!confirm('Are you sure you want to delete this?')) return;
    db.ref(collectionPath + '/' + id).remove().then(function() {
      showToast('Deleted successfully');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  };

  window.PORTFOLIO.toggleDownloadVisibility = function(id, nextVisible) {
    db.ref(DB_PREFIX + 'downloads/' + id).update({ visible: !!nextVisible }).then(function() {
      showToast(nextVisible ? 'File is now visible' : 'File hidden from website');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  };

  window.PORTFOLIO.deleteDownload = function(id) {
    if (!confirm('Delete this file from downloads list?')) return;
    db.ref(DB_PREFIX + 'downloads/' + id).once('value').then(function(snap) {
      var d = snap.val() || {};
      var removeDb = function() { return db.ref(DB_PREFIX + 'downloads/' + id).remove(); };
      if (d.sourceKind === 'storage' && d.storagePath) {
        return storage.ref(d.storagePath).delete().catch(function() {}).then(removeDb);
      }
      return removeDb();
    }).then(function() {
      showToast('Download deleted');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  };

  window.PORTFOLIO.deleteDownloadCategory = function(id) {
    if (!confirm('Delete this category? Existing files will remain unchanged.')) return;
    db.ref(DB_PREFIX + 'downloadCategories/' + id).remove().then(function() {
      showToast('Category deleted');
    }).catch(function(err) {
      showToast('Error: ' + err.message, 'error');
    });
  };

  /* ═══════════════════════════════════════════════════════════
     EDIT CALLBACKS (global namespace)
     ═══════════════════════════════════════════════════════════ */

  window.PORTFOLIO.editNavLink = function(id) {
    db.ref(DB_PREFIX + 'navLinks/' + id).once('value', function(snap) {
      var d = snap.val();
      if (!d) return;
      setVal('navLinkEditId', id);
      setVal('navLinkLabel', d.label);
      setVal('navLinkHref', d.href);
      setVal('navLinkOrder', d.order);
      setVal('navLinkTarget', d.target || '_self');
      var vis = $('navLinkVisible'); if (vis) vis.checked = d.visible !== false;
      setText('navLinkFormTitle', 'Edit Link');
      var form = $('navLinkForm'); if (form) form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.PORTFOLIO.editSkill = function(id) {
    db.ref(DB_PREFIX + 'skills/' + id).once('value', function(snap) {
      var s = snap.val();
      if (!s) return;
      setVal('skillEditId', id);
      setVal('skillCategory', s.category);
      setVal('skillPills', Array.isArray(s.pills) ? s.pills.join(', ') : (s.pills || ''));
      setVal('skillOrder', s.order);
      setText('skillFormTitle', 'Edit Skill Category');
      var form = $('skillForm'); if (form) form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.PORTFOLIO.editExp = function(id) {
    db.ref(DB_PREFIX + 'experience/' + id).once('value', function(snap) {
      var e = snap.val();
      if (!e) return;
      setVal('expEditId', id);
      setVal('expRole', e.role);
      setVal('expCompany', e.company);
      setVal('expCompanyNote', e.companyNote);
      setVal('expDateRange', e.dateRange);
      setVal('expDescription', e.description);
      setVal('expTechTags', Array.isArray(e.techTags) ? e.techTags.join(', ') : (e.techTags || ''));
      setVal('expOrder', e.order);
      var cb = $('expCurrent'); if (cb) cb.checked = !!e.current;
      setText('expFormTitle', 'Edit Experience');
      var form = $('expForm'); if (form) form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.PORTFOLIO.editEdu = function(id) {
    db.ref(DB_PREFIX + 'education/' + id).once('value', function(snap) {
      var e = snap.val();
      if (!e) return;
      setVal('eduEditId', id);
      setVal('eduDegree', e.degree);
      setVal('eduSchool', e.school);
      setVal('eduYears', e.years);
      setVal('eduDescription', e.description);
      setVal('eduBadge', e.badge);
      setVal('eduOrder', e.order);
      setText('eduFormTitle', 'Edit Education');
      var form = $('eduForm'); if (form) form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.PORTFOLIO.editCert = function(id) {
    db.ref(DB_PREFIX + 'certs/' + id).once('value', function(snap) {
      var c = snap.val();
      if (!c) return;
      setVal('certEditId', id);
      setVal('certName', c.name);
      setVal('certDetail', c.detail);
      setVal('certOrder', c.order);
      setText('certFormTitle', 'Edit Certification');
      var form = $('certForm'); if (form) form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.PORTFOLIO.editProj = function(id) {
    db.ref(DB_PREFIX + 'projects/' + id).once('value', function(snap) {
      var p = snap.val();
      if (!p) return;
      setVal('projEditId', id);
      setVal('projLabel', p.label);
      setVal('projTitle', p.title);
      setVal('projDescription', p.description);
      setVal('projTechTags', Array.isArray(p.techTags) ? p.techTags.join(', ') : (p.techTags || ''));
      setVal('projGithubUrl', p.githubUrl);
      setVal('projLiveUrl', p.liveUrl);
      setVal('projOrder', p.order);
      var cb = $('projFeatured'); if (cb) cb.checked = !!p.featured;
      setText('projFormTitle', 'Edit Project');
      var form = $('projForm'); if (form) form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.PORTFOLIO.editContact = function(id) {
    db.ref(DB_PREFIX + 'contactCards/' + id).once('value', function(snap) {
      var c = snap.val();
      if (!c) return;
      setVal('contactEditId', id);
      setVal('contactType', c.type || 'email');
      setVal('contactLabel', c.label);
      setVal('contactValue', c.value);
      setVal('contactUrl', c.url);
      setVal('contactAction', c.action);
      setVal('contactOrder', c.order);
      var ext = $('contactExternal'); if (ext) ext.checked = !!c.external;
      setVal('contactDesc', c.desc);
      setVal('contactSeal', c.seal);
      setVal('contactImage', c.image);
      var jf = $('jamiaFields'); if (jf) jf.style.display = (c.type === 'jamia') ? '' : 'none';
      setText('contactFormTitle', 'Edit Contact Card');
      var form = $('contactForm'); if (form) form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.PORTFOLIO.editFooterLink = function(id) {
    db.ref(DB_PREFIX + 'footerLinks/' + id).once('value', function(snap) {
      var d = snap.val();
      if (!d) return;
      setVal('footerLinkEditId', id);
      setVal('footerLinkLabel', d.label);
      setVal('footerLinkHref', d.href);
      setVal('footerLinkOrder', d.order);
      setVal('footerLinkTarget', d.target || '_self');
      var vis = $('footerLinkVisible'); if (vis) vis.checked = d.visible !== false;
      var adm = $('footerLinkIsAdmin'); if (adm) adm.checked = !!d.isAdmin;
      setText('footerLinkFormTitle', 'Edit Footer Link');
      var form = $('footerLinkForm'); if (form) form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  window.PORTFOLIO.editKb = function(id) {
    db.ref(DB_PREFIX + 'chatbot/kb/' + id).once('value', function(snap) {
      var k = snap.val();
      if (!k) return;
      setVal('kbEditId', id);
      setVal('kbKey', k.key);
      setVal('kbValue', k.value);
      setText('kbFormTitle', 'Edit KB Entry');
      var form = $('kbForm'); if (form) form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  /* ═══════════════════════════════════════════════════════════
     ACCOUNT SECURITY — EMAIL & PASSWORD CHANGE
     ═══════════════════════════════════════════════════════════ */

  function initAccountSecurity() {
    var user = auth.currentUser;
    if (!user) return;
    setVal('acctCurrentEmail', user.email);

    var newPwInput = $('acctNewPassword');
    if (newPwInput) {
      newPwInput.addEventListener('input', function() {
        updatePasswordStrength(newPwInput.value);
      });
    }
  }

  function showAccountMsg(elId, msg, isError) {
    var el = $(elId);
    if (!el) return;
    el.style.display = '';
    el.textContent = msg;
    el.style.background = isError ? '#fef2f2' : '#f0fdf4';
    el.style.color = isError ? '#dc2626' : '#16a34a';
    el.style.border = '1px solid ' + (isError ? '#fecaca' : '#bbf7d0');
  }

  function hideAccountMsg(elId) {
    var el = $(elId);
    if (el) el.style.display = 'none';
  }

  function updatePasswordStrength(pw) {
    var container = $('passwordStrength');
    if (!container) return;
    if (!pw) { container.style.display = 'none'; return; }
    container.style.display = '';

    var score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;

    var colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    var labels = ['Weak', 'Fair', 'Good', 'Strong'];

    for (var i = 1; i <= 4; i++) {
      var bar = $('pwStr' + i);
      if (bar) bar.style.background = i <= score ? colors[score - 1] : '#e5e7eb';
    }
    var lbl = $('pwStrLabel');
    if (lbl) { lbl.textContent = labels[score - 1] || 'Too short'; lbl.style.color = colors[score - 1] || '#6b7280'; }
  }

  function reauthenticate(password) {
    var user = auth.currentUser;
    var credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    return user.reauthenticateWithCredential(credential);
  }

  function changeEmail() {
    hideAccountMsg('emailChangeMsg');
    var user = auth.currentUser;
    if (!user) { showAccountMsg('emailChangeMsg', 'No user logged in.', true); return; }

    var newEmail = val('acctNewEmail').trim();
    var password = val('acctEmailPassword');

    if (!newEmail) { showAccountMsg('emailChangeMsg', 'Please enter a new email address.', true); return; }
    if (!password) { showAccountMsg('emailChangeMsg', 'Please enter your current password for verification.', true); return; }
    if (newEmail === user.email) { showAccountMsg('emailChangeMsg', 'New email is the same as current email.', true); return; }

    var btn = $('changeEmailBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

    reauthenticate(password).then(function() {
      if (typeof user.verifyBeforeUpdateEmail === 'function') {
        return user.verifyBeforeUpdateEmail(newEmail);
      }
      return user.updateEmail(newEmail);
    }).then(function() {
      if (typeof user.verifyBeforeUpdateEmail === 'function') {
        showAccountMsg('emailChangeMsg', 'A verification email has been sent to ' + newEmail + '. Please click the link in that email to complete the change. After verifying, log out and log back in with your new email.', false);
        showToast('Verification email sent to ' + newEmail);
      } else {
        showAccountMsg('emailChangeMsg', 'Email updated successfully! You are now signed in as ' + newEmail, false);
        setVal('acctCurrentEmail', newEmail);
        setText('adminEmail', newEmail);
        showToast('Email updated successfully');
      }
      setVal('acctNewEmail', '');
      setVal('acctEmailPassword', '');
    }).catch(function(err) {
      var msg = err.message;
      if (err.code === 'auth/wrong-password') msg = 'Incorrect current password. Please try again.';
      if (err.code === 'auth/invalid-email') msg = 'The new email address is not valid.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already in use by another account.';
      if (err.code === 'auth/requires-recent-login') msg = 'Session expired. Please log out, log back in, and try again.';
      if (err.code === 'auth/operation-not-allowed') msg = 'Email change requires verification. A verification link has been sent if possible. Check your Firebase console email settings.';
      showAccountMsg('emailChangeMsg', msg, true);
    }).finally(function() {
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Update Email'; }
    });
  }

  function changePassword() {
    hideAccountMsg('passwordChangeMsg');
    var user = auth.currentUser;
    if (!user) { showAccountMsg('passwordChangeMsg', 'No user logged in.', true); return; }

    var currentPw = val('acctCurrentPassword');
    var newPw = val('acctNewPassword');
    var confirmPw = val('acctConfirmPassword');

    if (!currentPw) { showAccountMsg('passwordChangeMsg', 'Please enter your current password.', true); return; }
    if (!newPw) { showAccountMsg('passwordChangeMsg', 'Please enter a new password.', true); return; }
    if (newPw.length < 6) { showAccountMsg('passwordChangeMsg', 'New password must be at least 6 characters.', true); return; }
    if (newPw !== confirmPw) { showAccountMsg('passwordChangeMsg', 'New passwords do not match.', true); return; }
    if (newPw === currentPw) { showAccountMsg('passwordChangeMsg', 'New password must be different from current password.', true); return; }

    var btn = $('changePasswordBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Updating...'; }

    reauthenticate(currentPw).then(function() {
      return user.updatePassword(newPw);
    }).then(function() {
      showAccountMsg('passwordChangeMsg', 'Password updated successfully!', false);
      setVal('acctCurrentPassword', '');
      setVal('acctNewPassword', '');
      setVal('acctConfirmPassword', '');
      var container = $('passwordStrength'); if (container) container.style.display = 'none';
      showToast('Password updated successfully');
    }).catch(function(err) {
      var msg = err.message;
      if (err.code === 'auth/wrong-password') msg = 'Incorrect current password. Please try again.';
      if (err.code === 'auth/weak-password') msg = 'New password is too weak. Use at least 6 characters with a mix of letters, numbers, and symbols.';
      if (err.code === 'auth/requires-recent-login') msg = 'Session expired. Please log out, log back in, and try again.';
      showAccountMsg('passwordChangeMsg', msg, true);
    }).finally(function() {
      if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Update Password'; }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     BIND SAVE BUTTONS
     ═══════════════════════════════════════════════════════════ */

  function bindSaveButtons() {
    var btn;

    btn = $('saveSettingsBtn');
    if (btn) btn.addEventListener('click', saveSettings);

    btn = $('saveNavLinkBtn');
    if (btn) btn.addEventListener('click', saveNavLink);

    btn = $('saveThemeBtn');
    if (btn) btn.addEventListener('click', saveTheme);

    btn = $('resetThemeBtn');
    if (btn) btn.addEventListener('click', function() {
      themeColorFields.forEach(function(field) {
        setThemeFieldValue(field, themeDefaults[field]);
      });
      updateThemePreview();
      showToast('Reset to defaults. Click "Save Theme" to apply.');
    });

    var presetBtns = document.querySelectorAll('.theme-preset-btn');
    presetBtns.forEach(function(b) {
      b.addEventListener('click', function() { applyPreset(b.getAttribute('data-preset')); });
    });

    btn = $('saveHeroBtn');
    if (btn) btn.addEventListener('click', saveHero);

    btn = $('saveAboutBtn');
    if (btn) btn.addEventListener('click', saveAbout);

    btn = $('saveSkillBtn');
    if (btn) btn.addEventListener('click', saveSkill);

    btn = $('saveExpBtn');
    if (btn) btn.addEventListener('click', saveExperience);

    btn = $('saveEduBtn');
    if (btn) btn.addEventListener('click', saveEducation);

    btn = $('saveCertBtn');
    if (btn) btn.addEventListener('click', saveCert);

    btn = $('saveProjBtn');
    if (btn) btn.addEventListener('click', saveProject);

    btn = $('uploadDownloadsBtn');
    if (btn) btn.addEventListener('click', uploadDownloads);

    btn = $('addDownloadCategoryBtn');
    if (btn) btn.addEventListener('click', addDownloadCategory);

    btn = $('saveContactBtn');
    if (btn) btn.addEventListener('click', saveContact);

    btn = $('saveCtaBtn');
    if (btn) btn.addEventListener('click', saveContactCta);

    btn = $('saveKbBtn');
    if (btn) btn.addEventListener('click', saveKb);

    btn = $('saveFooterLinkBtn');
    if (btn) btn.addEventListener('click', saveFooterLink);

    btn = $('changeEmailBtn');
    if (btn) btn.addEventListener('click', changeEmail);

    btn = $('changePasswordBtn');
    if (btn) btn.addEventListener('click', changePassword);
  }

  /* ═══════════════════════════════════════════════════════════
     BIND CRUD NEW / CANCEL BUTTONS
     ═══════════════════════════════════════════════════════════ */

  function bindCrudButtons() {
    var btn;

    btn = $('newNavLinkBtn');
    if (btn) btn.addEventListener('click', function() {
      resetNavLinkForm();
      $('navLinkForm').style.display = '';
    });
    btn = $('cancelNavLinkBtn');
    if (btn) btn.addEventListener('click', resetNavLinkForm);

    btn = $('newSkillBtn');
    if (btn) btn.addEventListener('click', function() {
      resetSkillForm();
      $('skillForm').style.display = '';
    });
    btn = $('cancelSkillBtn');
    if (btn) btn.addEventListener('click', resetSkillForm);

    btn = $('newExpBtn');
    if (btn) btn.addEventListener('click', function() {
      resetExpForm();
      $('expForm').style.display = '';
    });
    btn = $('cancelExpBtn');
    if (btn) btn.addEventListener('click', resetExpForm);

    btn = $('newEduBtn');
    if (btn) btn.addEventListener('click', function() {
      resetEduForm();
      $('eduForm').style.display = '';
    });
    btn = $('cancelEduBtn');
    if (btn) btn.addEventListener('click', resetEduForm);

    btn = $('newCertBtn');
    if (btn) btn.addEventListener('click', function() {
      resetCertForm();
      $('certForm').style.display = '';
    });
    btn = $('cancelCertBtn');
    if (btn) btn.addEventListener('click', resetCertForm);

    btn = $('newProjBtn');
    if (btn) btn.addEventListener('click', function() {
      resetProjForm();
      $('projForm').style.display = '';
    });
    btn = $('cancelProjBtn');
    if (btn) btn.addEventListener('click', resetProjForm);

    btn = $('newContactBtn');
    if (btn) btn.addEventListener('click', function() {
      resetContactForm();
      $('contactForm').style.display = '';
    });
    btn = $('cancelContactBtn');
    if (btn) btn.addEventListener('click', resetContactForm);

    btn = $('newKbBtn');
    if (btn) btn.addEventListener('click', function() {
      resetKbForm();
      $('kbForm').style.display = '';
    });
    btn = $('cancelKbBtn');
    if (btn) btn.addEventListener('click', resetKbForm);

    btn = $('newFooterLinkBtn');
    if (btn) btn.addEventListener('click', function() {
      resetFooterLinkForm();
      $('footerLinkForm').style.display = '';
    });
    btn = $('cancelFooterLinkBtn');
    if (btn) btn.addEventListener('click', resetFooterLinkForm);
  }

})();
