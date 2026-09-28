/* ============================================================
   CV TEMPLATES — Professional Resume Template Engine
   ============================================================ */
var CVTemplates = (function () {

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nl2br(s) { return (s || '').replace(/\n/g, '<br>'); }
  function arr(v) { return Array.isArray(v) ? v : (v ? [v] : []); }
  function dateRange(s, e, current) { return (s || '') + (current ? ' — Present' : (e ? ' — ' + e : '')); }
  function spaced(s) { return (s || '').split('').join(' ').toUpperCase(); }
  function vis(key, design) { return !(design.hiddenSections || []).indexOf ? true : (design.hiddenSections || []).indexOf(key) === -1; }
  function getOrder(design) { return design.sectionOrder || ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages', 'custom']; }
  function showPhoto(design) { return design.showPhoto !== false; }

  function photoHTML(p, design, defaults) {
    if (!showPhoto(design) || !p.photo) return '';
    var size = design.photoSize || defaults.size || 80;
    var shape = design.photoShape || defaults.shape || 'circle';
    var br = shape === 'circle' ? '50%' : shape === 'rounded' ? '12px' : '0';
    var border = design.photoBorder ? '3px solid ' + (defaults.borderColor || design.colorAccent || '#6c63ff') : 'none';
    return '<img src="' + p.photo + '" alt="" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + br + ';object-fit:cover;border:' + border + ';display:block;margin-bottom:12px">';
  }

  function contactItems(p) {
    var items = [];
    if (p.email) items.push({ icon: '✉', label: 'Email', val: p.email });
    if (p.phone) items.push({ icon: '☎', label: 'Phone', val: p.phone });
    if (p.location) items.push({ icon: '⌖', label: 'Location', val: p.location });
    if (p.website) items.push({ icon: '⊕', label: 'Website', val: p.website });
    return items;
  }

  function profileItems(p) {
    var items = [];
    if (p.linkedin) items.push({ label: 'LinkedIn', val: p.linkedin });
    if (p.github) items.push({ label: 'GitHub', val: p.github });
    return items;
  }

  function bullets(items) {
    var b = arr(items).filter(function (x) { return x && x.trim(); });
    if (!b.length) return '';
    return '<ul style="margin:3px 0 0;padding-left:16px">' + b.map(function (x) { return '<li style="margin-bottom:2px">' + esc(x) + '</li>'; }).join('') + '</ul>';
  }

  function skillPills(skills, accent, light) {
    return '<div style="display:flex;flex-wrap:wrap;gap:5px">' + arr(skills).map(function (s) {
      var name = typeof s === 'string' ? s : (s.name || '');
      return name ? '<span style="padding:2px 10px;background:' + (light || 'rgba(255,255,255,.12)') + ';color:' + (accent || '#fff') + ';border-radius:3px;font-size:.82em;font-weight:500">' + esc(name) + '</span>' : '';
    }).join('') + '</div>';
  }

  function cssBase(design) {
    return 'font-family:' + (design.fontFamily || 'Inter') + ',system-ui,sans-serif;font-size:' + (design.fontSize || 10) + 'px;line-height:' + (design.lineSpacing || 1.45) + ';box-sizing:border-box;';
  }

  /* ============================================================
     SECTION RENDERERS (for main area)
     ============================================================ */
  function renderSummary(data, design, headStyle) {
    if (!data.summary) return '';
    return '<div style="margin-bottom:' + (design.sectionSpacing || 14) + 'px">' + sHead('Professional Summary', headStyle) +
      '<p style="margin:0;color:#444;font-size:.92em;line-height:1.65">' + nl2br(esc(data.summary)) + '</p></div>';
  }

  function renderExperience(data, design, headStyle) {
    var items = arr(data.experience);
    if (!items.length) return '';
    return '<div style="margin-bottom:' + (design.sectionSpacing || 14) + 'px">' + sHead('Work Experience', headStyle) + items.map(function (exp) {
      return '<div style="margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;align-items:baseline"><strong style="font-size:1em;color:#1a1a2e">' + esc(exp.role || exp.title || '') + '</strong>' +
        '<span style="font-size:.82em;color:#777;white-space:nowrap;flex-shrink:0;margin-left:12px">' + dateRange(exp.startDate, exp.endDate, exp.current) + '</span></div>' +
        '<div style="font-size:.9em;color:#555;margin-bottom:2px">' + esc(exp.company || '') + (exp.location ? ' — ' + esc(exp.location) : '') + '</div>' +
        bullets(exp.bullets) + '</div>';
    }).join('') + '</div>';
  }

  function renderEducation(data, design, headStyle) {
    var items = arr(data.education);
    if (!items.length) return '';
    return '<div style="margin-bottom:' + (design.sectionSpacing || 14) + 'px">' + sHead('Education', headStyle) + items.map(function (edu) {
      return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:baseline"><strong style="font-size:.95em;color:#1a1a2e">' + esc(edu.degree || '') + '</strong>' +
        '<span style="font-size:.82em;color:#777;white-space:nowrap;flex-shrink:0;margin-left:12px">' + dateRange(edu.startDate, edu.endDate) + '</span></div>' +
        '<div style="font-size:.88em;color:#555">' + esc(edu.school || '') + (edu.location ? ' — ' + esc(edu.location) : '') + '</div>' +
        (edu.gpa ? '<div style="font-size:.82em;color:#777">GPA: ' + esc(edu.gpa) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  }

  function renderSkillsMain(data, design, headStyle) {
    var items = arr(data.skills);
    if (!items.length) return '';
    var accent = design.colorAccent || '#6c63ff';
    return '<div style="margin-bottom:' + (design.sectionSpacing || 14) + 'px">' + sHead('Skills', headStyle) +
      '<div style="display:flex;flex-wrap:wrap;gap:5px">' + items.map(function (s) {
        var name = typeof s === 'string' ? s : (s.name || '');
        return name ? '<span style="padding:3px 10px;background:' + accent + '15;color:' + accent + ';border-radius:3px;font-size:.84em;font-weight:500">' + esc(name) + '</span>' : '';
      }).join('') + '</div></div>';
  }

  function renderCertifications(data, design, headStyle) {
    var items = arr(data.certifications);
    if (!items.length) return '';
    return '<div style="margin-bottom:' + (design.sectionSpacing || 14) + 'px">' + sHead('Certifications', headStyle) + items.map(function (c) {
      return '<div style="margin-bottom:3px;font-size:.9em"><span style="color:#1a1a2e;font-weight:600">' + esc(c.name || '') + '</span>' +
        (c.issuer ? '<span style="color:#777"> — ' + esc(c.issuer) + '</span>' : '') +
        (c.date ? '<span style="color:#999;font-size:.85em"> (' + esc(c.date) + ')</span>' : '') + '</div>';
    }).join('') + '</div>';
  }

  function renderProjects(data, design, headStyle) {
    var items = arr(data.projects);
    if (!items.length) return '';
    return '<div style="margin-bottom:' + (design.sectionSpacing || 14) + 'px">' + sHead('Projects', headStyle) + items.map(function (p) {
      return '<div style="margin-bottom:8px"><strong style="font-size:.95em;color:#1a1a2e">' + esc(p.name || '') + '</strong>' +
        (p.description ? '<p style="margin:2px 0 0;font-size:.88em;color:#555">' + nl2br(esc(p.description)) + '</p>' : '') +
        (p.technologies ? '<div style="font-size:.8em;color:#777;margin-top:2px">Tech: ' + esc(p.technologies) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  }

  function renderLanguages(data, design, headStyle) {
    var items = arr(data.languages);
    if (!items.length) return '';
    return '<div style="margin-bottom:' + (design.sectionSpacing || 14) + 'px">' + sHead('Languages', headStyle) + items.map(function (l) {
      return '<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:.9em"><span style="color:#1a1a2e">' + esc(l.name || '') + '</span>' +
        '<span style="color:#777">' + esc(l.proficiency || '') + '</span></div>';
    }).join('') + '</div>';
  }

  function renderCustom(data, design, headStyle) {
    var items = arr(data.customSections);
    if (!items.length) return '';
    return items.map(function (sec) {
      return '<div style="margin-bottom:' + (design.sectionSpacing || 14) + 'px">' + sHead(sec.title || 'Additional', headStyle) +
        '<p style="margin:0;font-size:.9em;color:#555">' + nl2br(esc(sec.content || '')) + '</p></div>';
    }).join('');
  }

  function sHead(text, style) {
    if (style === 'spaced') return '<div style="font-size:.78em;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:inherit;margin-bottom:8px;padding-bottom:4px;border-bottom:1.5px solid rgba(128,128,128,.25)">' + spaced(text) + '</div>';
    if (style === 'accent-line') return '<div style="font-size:.95em;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--cv-accent,#2563eb);margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid var(--cv-accent,#2563eb)">' + esc(text) + '</div>';
    if (style === 'bold-line') return '<div style="font-size:1em;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#1a1a2e;margin-bottom:6px;padding-bottom:4px;border-bottom:2.5px solid #1a1a2e">' + esc(text) + '</div>';
    if (style === 'subtle') return '<div style="font-size:.88em;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:6px">' + esc(text) + '</div>';
    if (style === 'plain') return '<div style="font-size:1em;font-weight:700;color:#000;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid #000">' + esc(text).toUpperCase() + '</div>';
    return '<div style="font-size:.95em;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--cv-accent,#6c63ff);margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid currentColor">' + esc(text) + '</div>';
  }

  function sHeadSidebar(text) {
    return '<div style="font-size:.7em;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:8px;margin-top:16px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.15)">' + spaced(text) + '</div>';
  }

  var sectionMap = {
    summary: renderSummary,
    experience: renderExperience,
    education: renderEducation,
    skills: renderSkillsMain,
    certifications: renderCertifications,
    projects: renderProjects,
    languages: renderLanguages,
    custom: renderCustom
  };

  function renderOrderedSections(data, design, headStyle, exclude) {
    var order = getOrder(design);
    var ex = exclude || [];
    return order.map(function (key) {
      if (!vis(key, design)) return '';
      if (ex.indexOf(key) !== -1) return '';
      return (sectionMap[key] || function () { return ''; })(data, design, headStyle);
    }).join('');
  }

  /* ============================================================
     TEMPLATE 1 — MODERN (Two-Column Dark Sidebar)
     Matches user's resume: sidebar with contact/skills, main with experience
     ============================================================ */
  function renderModern(data, design) {
    var p = data.personal || {};
    var primary = design.colorPrimary || '#1a1a2e';
    var accent = design.colorAccent || '#6c63ff';
    var m = design.margins || {};
    var sideW = 210;

    // Sidebar
    var sb = '<div style="background:' + primary + ';color:#e0e0e0;padding:' + (m.top || 32) + 'px 20px ' + (m.bottom || 32) + 'px;width:' + sideW + 'px;flex-shrink:0;font-size:.88em">';
    sb += photoHTML(p, design, { size: 90, shape: 'circle', borderColor: accent });
    sb += '<div style="font-size:1.6em;font-weight:800;color:#fff;line-height:1.15;margin-bottom:2px">' + esc(p.firstName || '') + '<br>' + esc(p.lastName || '') + '</div>';
    if (p.title) sb += '<div style="color:' + accent + ';font-size:.95em;font-weight:600;margin-bottom:14px;line-height:1.3">' + esc(p.title) + '</div>';

    // Contact
    sb += sHeadSidebar('Contact');
    contactItems(p).forEach(function (c) {
      sb += '<div style="margin-bottom:5px;font-size:.9em"><div style="color:rgba(255,255,255,.5);font-size:.8em;font-weight:600;text-transform:uppercase;letter-spacing:1px">' + esc(c.label) + '</div>' + esc(c.val) + '</div>';
    });

    // Online Profiles
    var profiles = profileItems(p);
    if (profiles.length) {
      sb += sHeadSidebar('Online Profiles');
      profiles.forEach(function (pr) {
        sb += '<div style="margin-bottom:4px;font-size:.85em;word-break:break-all">' + esc(pr.val) + '</div>';
      });
    }

    // Skills in sidebar
    if (vis('skills', design) && arr(data.skills).length) {
      sb += sHeadSidebar('Core Skills');
      sb += skillPills(data.skills, accent, 'rgba(255,255,255,.1)');
    }

    // Certifications in sidebar
    if (vis('certifications', design) && arr(data.certifications).length) {
      sb += sHeadSidebar('Certifications');
      arr(data.certifications).forEach(function (c) {
        sb += '<div style="margin-bottom:3px;font-size:.88em">• ' + esc(c.name || '') + '</div>';
      });
    }

    // Languages in sidebar
    if (vis('languages', design) && arr(data.languages).length) {
      sb += sHeadSidebar('Languages');
      arr(data.languages).forEach(function (l) {
        sb += '<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:.88em"><span>' + esc(l.name || '') + '</span><span style="color:rgba(255,255,255,.5)">' + esc(l.proficiency || '') + '</span></div>';
      });
    }

    sb += '</div>';

    // Main content
    var main = '<div style="flex:1;padding:' + (m.top || 32) + 'px ' + (m.right || 28) + 'px ' + (m.bottom || 32) + 'px 24px;color:' + (design.colorText || '#333') + '">';
    main += renderOrderedSections(data, design, 'spaced', ['skills', 'certifications', 'languages']);
    main += '</div>';

    return '<div style="' + cssBase(design) + 'display:flex;width:595px;min-height:842px;background:' + (design.colorBg || '#fff') + ';--cv-accent:' + accent + '">' + sb + main + '</div>';
  }

  /* ============================================================
     TEMPLATE 2 — CLASSIC (Single-Column, Professional)
     Traditional format used by banks, law firms, consulting
     ============================================================ */
  function renderClassic(data, design) {
    var p = data.personal || {};
    var primary = design.colorPrimary || '#1a1a2e';
    var accent = design.colorAccent || '#2563eb';
    var m = design.margins || {};
    var pad = 'padding:' + (m.top || 36) + 'px ' + (m.right || 40) + 'px ' + (m.bottom || 36) + 'px ' + (m.left || 40) + 'px';

    var header = '<div style="text-align:center;margin-bottom:16px;padding-bottom:14px;border-bottom:2.5px solid ' + primary + '">';
    header += '<div style="display:flex;align-items:center;justify-content:center;gap:16px">';
    if (showPhoto(design) && p.photo) {
      var sz = design.photoSize || 70;
      var br = (design.photoShape || 'circle') === 'circle' ? '50%' : (design.photoShape === 'rounded' ? '10px' : '0');
      header += '<img src="' + p.photo + '" style="width:' + sz + 'px;height:' + sz + 'px;border-radius:' + br + ';object-fit:cover">';
    }
    header += '<div>';
    header += '<div style="font-size:2.2em;font-weight:800;color:' + primary + ';letter-spacing:1px">' + esc(p.firstName || '') + ' ' + esc(p.lastName || '') + '</div>';
    if (p.title) header += '<div style="font-size:1em;color:' + accent + ';font-weight:600;margin-top:2px">' + esc(p.title) + '</div>';
    header += '</div></div>';
    var contactParts = [];
    if (p.email) contactParts.push(esc(p.email));
    if (p.phone) contactParts.push(esc(p.phone));
    if (p.location) contactParts.push(esc(p.location));
    if (p.linkedin) contactParts.push(esc(p.linkedin));
    if (contactParts.length) header += '<div style="font-size:.82em;color:#666;margin-top:8px">' + contactParts.join(' &nbsp;|&nbsp; ') + '</div>';
    header += '</div>';

    return '<div style="' + cssBase(design) + 'width:595px;min-height:842px;background:' + (design.colorBg || '#fff') + ';color:' + (design.colorText || '#333') + ';' + pad + ';--cv-accent:' + accent + '">' + header + renderOrderedSections(data, design, 'accent-line') + '</div>';
  }

  /* ============================================================
     TEMPLATE 3 — MINIMAL (Clean Swiss Design)
     Whitespace-focused, understated elegance
     ============================================================ */
  function renderMinimal(data, design) {
    var p = data.personal || {};
    var accent = design.colorAccent || '#0ea5e9';
    var m = design.margins || {};
    var pad = 'padding:' + (m.top || 44) + 'px ' + (m.right || 44) + 'px ' + (m.bottom || 44) + 'px ' + (m.left || 44) + 'px';

    var header = '<div style="margin-bottom:24px">';
    if (showPhoto(design) && p.photo) {
      var sz = design.photoSize || 60;
      var br = (design.photoShape || 'circle') === 'circle' ? '50%' : (design.photoShape === 'rounded' ? '8px' : '0');
      header += '<img src="' + p.photo + '" style="width:' + sz + 'px;height:' + sz + 'px;border-radius:' + br + ';object-fit:cover;float:right">';
    }
    header += '<div style="font-size:2em;font-weight:300;letter-spacing:3px;color:#1a1a2e">' + esc(p.firstName || '').toUpperCase() + ' <strong style="font-weight:700">' + esc(p.lastName || '').toUpperCase() + '</strong></div>';
    if (p.title) header += '<div style="font-size:.9em;color:' + accent + ';letter-spacing:2px;font-weight:500;margin-top:2px">' + esc(p.title).toUpperCase() + '</div>';
    var contactParts = [p.email, p.phone, p.location, p.linkedin].filter(Boolean).map(function (x) { return esc(x); });
    if (contactParts.length) header += '<div style="font-size:.78em;color:#aaa;margin-top:8px;letter-spacing:.5px">' + contactParts.join(' &nbsp;· &nbsp;') + '</div>';
    header += '<div style="width:40px;height:2px;background:' + accent + ';margin-top:14px"></div></div>';

    return '<div style="' + cssBase(design) + 'width:595px;min-height:842px;background:' + (design.colorBg || '#fff') + ';color:' + (design.colorText || '#333') + ';' + pad + ';--cv-accent:' + accent + '">' + header + renderOrderedSections(data, design, 'subtle') + '</div>';
  }

  /* ============================================================
     TEMPLATE 4 — EXECUTIVE (Bold Header, Corporate)
     For C-level, directors, senior management
     ============================================================ */
  function renderExecutive(data, design) {
    var p = data.personal || {};
    var primary = design.colorPrimary || '#0f172a';
    var accent = design.colorAccent || '#d97706';
    var m = design.margins || {};

    var header = '<div style="background:' + primary + ';margin:0;padding:28px 36px;color:#fff;display:flex;align-items:center;gap:20px">';
    if (showPhoto(design) && p.photo) {
      var sz = design.photoSize || 80;
      var br = (design.photoShape || 'circle') === 'circle' ? '50%' : (design.photoShape === 'rounded' ? '10px' : '0');
      header += '<img src="' + p.photo + '" style="width:' + sz + 'px;height:' + sz + 'px;border-radius:' + br + ';object-fit:cover;border:2px solid ' + accent + ';flex-shrink:0">';
    }
    header += '<div style="flex:1">';
    header += '<div style="font-size:2em;font-weight:800;letter-spacing:1px">' + esc(p.firstName || '') + ' ' + esc(p.lastName || '') + '</div>';
    if (p.title) header += '<div style="font-size:1em;color:' + accent + ';font-weight:600;margin-top:2px">' + esc(p.title) + '</div>';
    var contactParts = [p.email, p.phone, p.location].filter(Boolean).map(function (x) { return esc(x); });
    if (contactParts.length) header += '<div style="font-size:.8em;color:rgba(255,255,255,.65);margin-top:6px">' + contactParts.join(' &nbsp;|&nbsp; ') + '</div>';
    var links = [p.linkedin, p.github, p.website].filter(Boolean).map(function (x) { return esc(x); });
    if (links.length) header += '<div style="font-size:.75em;color:rgba(255,255,255,.45);margin-top:2px">' + links.join(' &nbsp;|&nbsp; ') + '</div>';
    header += '</div></div>';

    var body = '<div style="padding:' + (m.top ? m.top - 8 : 24) + 'px ' + (m.right || 36) + 'px ' + (m.bottom || 32) + 'px ' + (m.left || 36) + 'px">';
    body += renderOrderedSections(data, design, 'bold-line');
    body += '</div>';

    return '<div style="' + cssBase(design) + 'width:595px;min-height:842px;background:' + (design.colorBg || '#fff') + ';color:' + (design.colorText || '#333') + ';--cv-accent:' + accent + '">' + header + body + '</div>';
  }

  /* ============================================================
     TEMPLATE 5 — CREATIVE (Two-Column with Top Header)
     For designers, marketers, tech professionals
     ============================================================ */
  function renderCreative(data, design) {
    var p = data.personal || {};
    var accent = design.colorAccent || '#8b5cf6';
    var primary = design.colorPrimary || '#1e1b4b';
    var m = design.margins || {};

    // Top header bar
    var header = '<div style="background:linear-gradient(135deg,' + primary + ',' + accent + ');padding:24px 28px;color:#fff;display:flex;align-items:center;gap:16px">';
    if (showPhoto(design) && p.photo) {
      var sz = design.photoSize || 70;
      var br = (design.photoShape || 'circle') === 'circle' ? '50%' : (design.photoShape === 'rounded' ? '10px' : '0');
      header += '<img src="' + p.photo + '" style="width:' + sz + 'px;height:' + sz + 'px;border-radius:' + br + ';object-fit:cover;border:3px solid rgba(255,255,255,.3)">';
    }
    header += '<div style="flex:1"><div style="font-size:1.8em;font-weight:800">' + esc(p.firstName || '') + ' ' + esc(p.lastName || '') + '</div>';
    if (p.title) header += '<div style="font-size:.9em;opacity:.8;font-weight:500">' + esc(p.title) + '</div>';
    header += '</div>';
    var contactParts = [p.email, p.phone, p.location].filter(Boolean).map(function (x) { return '<div style="font-size:.78em;opacity:.7">' + esc(x) + '</div>'; });
    if (contactParts.length) header += '<div style="text-align:right">' + contactParts.join('') + '</div>';
    header += '</div>';

    // Two columns: main + sidebar
    var sideW = 170;
    var body = '<div style="display:flex;min-height:0">';

    // Main
    body += '<div style="flex:1;padding:20px 22px 24px ' + (m.left || 28) + 'px">';
    body += renderOrderedSections(data, design, 'accent-line', ['skills', 'certifications', 'languages']);
    body += '</div>';

    // Right sidebar
    body += '<div style="width:' + sideW + 'px;background:' + primary + '0a;padding:20px 16px;border-left:2px solid ' + accent + '20">';
    if (vis('skills', design) && arr(data.skills).length) {
      body += '<div style="font-size:.75em;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:' + accent + ';margin-bottom:8px">Skills</div>';
      body += '<div style="display:flex;flex-wrap:wrap;gap:4px">' + arr(data.skills).map(function (s) {
        var name = typeof s === 'string' ? s : (s.name || '');
        return '<span style="padding:2px 8px;background:' + accent + '12;color:' + accent + ';border-radius:3px;font-size:.8em;font-weight:500">' + esc(name) + '</span>';
      }).join('') + '</div>';
    }
    if (vis('certifications', design) && arr(data.certifications).length) {
      body += '<div style="font-size:.75em;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:' + accent + ';margin-top:16px;margin-bottom:6px">Certifications</div>';
      arr(data.certifications).forEach(function (c) {
        body += '<div style="font-size:.82em;color:#444;margin-bottom:3px">• ' + esc(c.name || '') + '</div>';
      });
    }
    if (vis('languages', design) && arr(data.languages).length) {
      body += '<div style="font-size:.75em;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:' + accent + ';margin-top:16px;margin-bottom:6px">Languages</div>';
      arr(data.languages).forEach(function (l) {
        body += '<div style="font-size:.82em;color:#444;margin-bottom:2px">' + esc(l.name || '') + ' <span style="color:#999">(' + esc(l.proficiency || '') + ')</span></div>';
      });
    }
    if (p.linkedin || p.github) {
      body += '<div style="font-size:.75em;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:' + accent + ';margin-top:16px;margin-bottom:6px">Links</div>';
      if (p.linkedin) body += '<div style="font-size:.78em;color:#555;word-break:break-all;margin-bottom:2px">' + esc(p.linkedin) + '</div>';
      if (p.github) body += '<div style="font-size:.78em;color:#555;word-break:break-all">' + esc(p.github) + '</div>';
    }
    body += '</div></div>';

    return '<div style="' + cssBase(design) + 'width:595px;min-height:842px;background:' + (design.colorBg || '#fff') + ';color:' + (design.colorText || '#333') + ';--cv-accent:' + accent + '">' + header + body + '</div>';
  }

  /* ============================================================
     TEMPLATE 6 — ATS OPTIMIZED (Plain, Scanner-Friendly)
     Maximum ATS compatibility, no colors, no columns
     ============================================================ */
  function renderATS(data, design) {
    var p = data.personal || {};
    var m = design.margins || {};
    var pad = 'padding:' + (m.top || 36) + 'px ' + (m.right || 42) + 'px ' + (m.bottom || 36) + 'px ' + (m.left || 42) + 'px';

    var header = '<div style="margin-bottom:14px">';
    header += '<div style="font-size:2em;font-weight:700;color:#000">' + esc(p.firstName || '') + ' ' + esc(p.lastName || '') + '</div>';
    if (p.title) header += '<div style="font-size:1em;color:#333;margin-bottom:6px">' + esc(p.title) + '</div>';
    var parts = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(function (x) { return esc(x); });
    if (parts.length) header += '<div style="font-size:.85em;color:#333;border-top:1px solid #000;border-bottom:1px solid #000;padding:4px 0">' + parts.join(' | ') + '</div>';
    header += '</div>';

    var atsDesign = Object.assign({}, design, { colorAccent: '#000', colorPrimary: '#000' });
    return '<div style="' + cssBase(design) + 'width:595px;min-height:842px;background:#fff;color:#000;' + pad + ';--cv-accent:#000">' + header + renderOrderedSections(data, atsDesign, 'plain') + '</div>';
  }

  /* ============================================================
     TEMPLATE REGISTRY
     ============================================================ */
  var templates = {
    modern: { id: 'modern', name: 'Modern', description: 'Two-column with dark sidebar', thumbnail: '#1a1a2e', layout: 'two-column', render: renderModern },
    classic: { id: 'classic', name: 'Classic', description: 'Traditional single-column', thumbnail: '#1a1a2e', layout: 'single', render: renderClassic },
    minimal: { id: 'minimal', name: 'Minimal', description: 'Clean Swiss design', thumbnail: '#64748b', layout: 'single', render: renderMinimal },
    executive: { id: 'executive', name: 'Executive', description: 'Bold corporate header', thumbnail: '#0f172a', layout: 'single', render: renderExecutive },
    creative: { id: 'creative', name: 'Creative', description: 'Gradient header, side panel', thumbnail: '#8b5cf6', layout: 'two-column', render: renderCreative },
    ats: { id: 'ats', name: 'ATS Optimized', description: 'Plain text, max compatibility', thumbnail: '#374151', layout: 'single', render: renderATS }
  };

  function renderResume(data, design) {
    var tpl = templates[(design || {}).template || 'modern'];
    if (!tpl) tpl = templates.modern;
    return tpl.render(data || {}, design || {});
  }

  function generateThumbnail(tplId) {
    var tpl = templates[tplId] || templates.modern;
    var c = tpl.thumbnail || '#7c3aed';
    var isTwoCol = tpl.layout === 'two-column';

    if (isTwoCol) {
      return '<div class="thumb-mini" style="display:grid;grid-template-columns:38% 1fr;height:100%">' +
        '<div style="background:' + c + ';padding:8px"><div style="width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.2);margin-bottom:4px"></div>' +
        '<div style="height:4px;background:rgba(255,255,255,.4);margin-bottom:2px;width:75%"></div><div style="height:2px;background:rgba(255,255,255,.15);margin-bottom:2px;width:55%"></div>' +
        '<div style="height:1px;background:rgba(255,255,255,.1);margin-top:6px;margin-bottom:4px"></div>' +
        '<div style="height:2px;background:rgba(255,255,255,.15);margin-bottom:2px;width:60%"></div><div style="height:2px;background:rgba(255,255,255,.1);width:45%"></div></div>' +
        '<div style="padding:8px"><div style="height:3px;background:#ddd;margin-bottom:2px;width:50%"></div><div style="height:2px;background:#eee;margin-bottom:2px;width:85%"></div>' +
        '<div style="height:2px;background:#eee;margin-bottom:6px;width:75%"></div><div style="height:2px;background:#ddd;margin-bottom:2px;width:35%;margin-top:4px"></div>' +
        '<div style="height:2px;background:#eee;width:90%"></div></div></div>';
    }

    var isExec = tplId === 'executive';
    if (isExec) {
      return '<div class="thumb-mini" style="height:100%;display:flex;flex-direction:column">' +
        '<div style="background:' + c + ';padding:8px 8px 6px"><div style="height:5px;background:rgba(255,255,255,.5);width:50%;margin-bottom:2px"></div>' +
        '<div style="height:2px;background:rgba(255,255,255,.2);width:70%"></div></div>' +
        '<div style="flex:1;padding:6px 8px"><div style="height:2px;background:#ddd;margin-bottom:2px;width:40%"></div>' +
        '<div style="height:2px;background:#eee;margin-bottom:2px;width:90%"></div><div style="height:2px;background:#eee;margin-bottom:4px;width:80%"></div>' +
        '<div style="height:2px;background:#ddd;margin-bottom:2px;width:35%"></div><div style="height:2px;background:#eee;width:85%"></div></div></div>';
    }

    return '<div class="thumb-mini" style="padding:8px;height:100%;display:flex;flex-direction:column">' +
      '<div style="text-align:center;margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid ' + c + '">' +
      '<div style="height:5px;background:' + c + ';width:45%;margin:0 auto 2px;border-radius:1px"></div>' +
      '<div style="height:2px;background:#ccc;width:65%;margin:0 auto"></div></div>' +
      '<div style="flex:1"><div style="height:2px;background:' + c + '50;margin-bottom:2px;width:30%"></div>' +
      '<div style="height:2px;background:#eee;margin-bottom:2px;width:92%"></div><div style="height:2px;background:#eee;margin-bottom:5px;width:80%"></div>' +
      '<div style="height:2px;background:' + c + '50;margin-bottom:2px;width:25%"></div>' +
      '<div style="height:2px;background:#eee;margin-bottom:2px;width:88%"></div></div></div>';
  }

  return {
    render: renderResume,
    list: function () { return Object.keys(templates).map(function (k) { return templates[k]; }); },
    thumbnail: generateThumbnail,
    get: function (id) { return templates[id]; },
    helpers: { esc: esc, nl2br: nl2br, arr: arr, spaced: spaced }
  };
})();
