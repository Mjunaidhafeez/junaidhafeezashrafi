/* ============================================================
   CV BUILDER ENGINE — World-Class AI-Powered Resume Builder
   ============================================================ */
var CVBuilder = (function () {
  'use strict';

  var DB_PATH = 'portfolio/cvResumes/';
  var db, root;
  var previewTimer = null;
  var _localSaving = false;

  /* ---- State ---- */
  var S = {
    resumes: {},
    currentId: null,
    section: 'templates',
    zoom: 0.65,
    aiKey: localStorage.getItem('cvb_ai_key') || ''
  };

  function currentResume() { return S.resumes[S.currentId] || null; }
  function resumeData() { var r = currentResume(); return r ? r.data : null; }
  function resumeDesign() { var r = currentResume(); return r ? r.design : {}; }

  function defaultResume(name) {
    return {
      id: 'cv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: name || 'Untitled Resume',
      createdAt: Date.now(), updatedAt: Date.now(),
      data: {
        personal: { firstName: '', lastName: '', title: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', photo: '' },
        summary: '',
        experience: [], education: [], skills: [], certifications: [], projects: [], languages: [], customSections: []
      },
      design: {
        template: 'modern', fontFamily: 'Inter', fontSize: 10, lineSpacing: 1.45, sectionSpacing: 14,
        colorPrimary: '#1a1a2e', colorAccent: '#6c63ff', colorText: '#333333', colorBg: '#ffffff',
        layout: 'two-column',
        margins: { top: 32, right: 28, bottom: 32, left: 20 },
        sectionOrder: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'languages', 'custom'],
        hiddenSections: [],
        showPhoto: true, photoSize: 80, photoShape: 'circle', photoBorder: false
      }
    };
  }

  /* ---- Helpers ---- */
  function $(id) { return document.getElementById(id); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function uid() { return 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var ICO = {
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    summary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    edu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    custom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
  };

  var NAV = [
    { id: 'templates', label: 'Templates', icon: 'layers' },
    { divider: true },
    { id: 'personal', label: 'Personal Info', icon: 'user' },
    { id: 'summary', label: 'Summary', icon: 'summary', ai: true },
    { id: 'experience', label: 'Experience', icon: 'briefcase' },
    { id: 'education', label: 'Education', icon: 'edu' },
    { id: 'skills', label: 'Skills', icon: 'star', ai: true },
    { id: 'certifications', label: 'Certifications', icon: 'award' },
    { id: 'projects', label: 'Projects', icon: 'code' },
    { id: 'languages', label: 'Languages', icon: 'globe' },
    { id: 'custom', label: 'Custom Sections', icon: 'custom' },
    { divider: true },
    { id: 'design', label: 'Design', icon: 'palette' },
    { id: 'atscore', label: 'ATS Score', icon: 'ai', ai: true }
  ];

  /* ============================================================
     AI ENGINE
     ============================================================ */
  var AI = {
    summaries: {
      'Software Engineer': 'Results-driven Software Engineer with expertise in designing, developing, and maintaining scalable software solutions. Proficient in full-stack development with a strong foundation in data structures, algorithms, and system design. Passionate about clean code, agile methodologies, and delivering high-impact products.',
      'Data Scientist': 'Analytical Data Scientist skilled in machine learning, statistical modeling, and data visualization. Experienced in transforming complex datasets into actionable insights that drive business decisions. Proficient in Python, R, SQL, and modern ML frameworks.',
      'Product Manager': 'Strategic Product Manager with a track record of launching successful products from ideation to market. Skilled in user research, roadmap planning, and cross-functional team leadership.',
      'UX Designer': 'Creative UX Designer passionate about crafting intuitive, user-centered digital experiences. Proficient in user research, wireframing, prototyping, and usability testing.',
      'DevOps Engineer': 'Experienced DevOps Engineer specializing in CI/CD pipelines, cloud infrastructure, and automation. Proficient in AWS, Docker, Kubernetes, and Infrastructure as Code.',
      'default': 'Dedicated professional with a proven track record of delivering results in fast-paced environments. Skilled in problem-solving, teamwork, and adapting to new challenges. Committed to continuous learning and driving organizational success.'
    },
    skills: {
      'Software Engineer': ['JavaScript', 'TypeScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'Docker', 'AWS', 'REST APIs', 'Agile', 'System Design'],
      'Data Scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'Tableau', 'Statistics', 'NLP', 'Deep Learning', 'Data Visualization'],
      'DevOps Engineer': ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Python', 'Monitoring', 'Jenkins', 'Ansible', 'Git', 'Bash'],
      'default': ['Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Adaptability', 'Leadership', 'Critical Thinking', 'Microsoft Office']
    },
    enhanceBullet: function (text) {
      if (!text || text.length < 5) return text;
      var verbs = ['Spearheaded', 'Developed', 'Implemented', 'Engineered', 'Optimized', 'Streamlined', 'Led', 'Designed', 'Delivered', 'Architected'];
      var clean = text.trim();
      var hasVerb = verbs.some(function (v) { return clean.toLowerCase().indexOf(v.toLowerCase()) === 0; });
      if (!hasVerb) clean = verbs[Math.floor(Math.random() * verbs.length)] + ' ' + clean.charAt(0).toLowerCase() + clean.slice(1);
      if (!/\d/.test(clean)) clean += [', resulting in 20% improvement', ', impacting 500+ users', ', reducing costs by 15%', ', improving efficiency by 30%'][Math.floor(Math.random() * 4)];
      return clean;
    },
    atsScore: function (data) {
      var score = 0, tips = [], p = data.personal || {};
      if (p.firstName && p.lastName) score += 10; else tips.push('Add your full name');
      if (p.email) score += 5; else tips.push('Add email address');
      if (p.phone) score += 5; else tips.push('Add phone number');
      if (p.location) score += 3;
      if (p.linkedin) score += 3;
      if (data.summary && data.summary.length > 50) score += 12; else tips.push('Write a professional summary (50+ characters)');
      if (data.summary && data.summary.length > 150) score += 5;
      var exp = Array.isArray(data.experience) ? data.experience : [];
      if (exp.length > 0) score += 10; else tips.push('Add work experience');
      if (exp.length >= 2) score += 5;
      var totalBullets = exp.reduce(function (s, e) { return s + (Array.isArray(e.bullets) ? e.bullets.filter(Boolean).length : 0); }, 0);
      if (totalBullets >= 5) score += 8; else tips.push('Add more bullet points to experience');
      var hasMetrics = exp.some(function (e) { return (e.bullets || []).some(function (b) { return /\d+%|\d+ /.test(b); }); });
      if (hasMetrics) score += 7; else tips.push('Add quantifiable achievements (numbers, percentages)');
      var edu = Array.isArray(data.education) ? data.education : [];
      if (edu.length > 0) score += 8; else tips.push('Add education');
      var skills = Array.isArray(data.skills) ? data.skills : [];
      if (skills.length >= 5) score += 10; else tips.push('Add at least 5 skills');
      if (skills.length >= 10) score += 4;
      if (Array.isArray(data.certifications) && data.certifications.length > 0) score += 5;
      return { score: Math.min(score, 100), tips: tips };
    },
    suggestSummaryAI: function (title, cb) {
      var t = (title || '').trim(), best = AI.summaries['default'];
      Object.keys(AI.summaries).forEach(function (k) {
        if (k !== 'default' && t.toLowerCase().indexOf(k.toLowerCase().split(' ')[0].toLowerCase()) !== -1) best = AI.summaries[k];
      });
      if (!S.aiKey) { cb(best); return; }
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + S.aiKey },
        body: JSON.stringify({ model: 'gpt-3.5-turbo', max_tokens: 200, messages: [{ role: 'system', content: 'You write professional resume summaries. Be concise (2-3 sentences), impactful, and ATS-friendly.' }, { role: 'user', content: 'Write a professional summary for a ' + (title || 'professional') + '. No quotation marks.' }] })
      }).then(function (r) { return r.json(); }).then(function (j) { cb((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || best); }).catch(function () { cb(best); });
    },
    suggestSkillsAI: function (title, cb) {
      var t = (title || '').trim(), best = AI.skills['default'];
      Object.keys(AI.skills).forEach(function (k) { if (k !== 'default' && t.toLowerCase().indexOf(k.toLowerCase().split(' ')[0].toLowerCase()) !== -1) best = AI.skills[k]; });
      if (!S.aiKey) { cb(best); return; }
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + S.aiKey },
        body: JSON.stringify({ model: 'gpt-3.5-turbo', max_tokens: 150, messages: [{ role: 'system', content: 'Return a comma-separated list of 12 relevant skills for the given job title. No numbering or explanation.' }, { role: 'user', content: title || 'professional' }] })
      }).then(function (r) { return r.json(); }).then(function (j) {
        var text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
        cb(text.split(',').map(function (s) { return s.trim(); }).filter(Boolean));
      }).catch(function () { cb(best); });
    }
  };

  /* ============================================================
     BUILD UI
     ============================================================ */
  function init(containerId) {
    root = $(containerId);
    if (!root) return;
    db = firebase.database();
    buildManager();
    buildApp();
    loadResumes();
  }

  function buildManager() {
    var mgr = document.createElement('div');
    mgr.className = 'cvb-manager'; mgr.id = 'cvbManager';
    mgr.innerHTML = '<span class="cvb-manager-title">Resume Builder</span>' +
      '<div class="cvb-manager-select"><select id="cvbResumeSelect"><option value="">— Select Resume —</option></select></div>' +
      '<div class="cvb-manager-actions">' +
      '<button class="cvb-btn cvb-btn-primary" id="cvbNewBtn">' + ICO.plus + ' New</button>' +
      '<button class="cvb-btn cvb-btn-secondary" id="cvbDuplicateBtn">' + ICO.copy + ' Duplicate</button>' +
      '<button class="cvb-btn cvb-btn-secondary" id="cvbRenameBtn">' + ICO.edit + ' Rename</button>' +
      '<button class="cvb-btn cvb-btn-danger" id="cvbDeleteBtn">' + ICO.trash + ' Delete</button></div>';
    root.appendChild(mgr);
    $('cvbNewBtn').onclick = createResume;
    $('cvbDuplicateBtn').onclick = duplicateResume;
    $('cvbRenameBtn').onclick = renameResume;
    $('cvbDeleteBtn').onclick = deleteResume;
    $('cvbResumeSelect').onchange = function () { selectResume(this.value); };
  }

  function buildApp() {
    var app = document.createElement('div');
    app.className = 'cvb-app'; app.id = 'cvbApp'; app.style.display = 'none';
    app.innerHTML = '<div class="cvb-sidebar" id="cvbNav"></div>' +
      '<div class="cvb-editor" id="cvbEditor"></div>' +
      '<div class="cvb-preview-panel" id="cvbPreview">' +
      '<div class="cvb-preview-actions" id="cvbPreviewActions"></div>' +
      '<div class="cvb-preview-frame" id="cvbPreviewFrame"><div class="cvb-preview-frame-inner" id="cvbPreviewInner"></div></div>' +
      '<div class="cvb-preview-page-info" id="cvbPageInfo"></div></div>';
    root.appendChild(app);
    buildNav();
    var pa = $('cvbPreviewActions');
    pa.innerHTML = '<button class="cvb-btn cvb-btn-success" id="cvbExportPDF">' + ICO.download + ' PDF</button>' +
      '<button class="cvb-btn cvb-btn-secondary" id="cvbPrint">Print</button>' +
      '<div class="cvb-preview-zoom"><label>Zoom</label><select id="cvbZoom"><option value="0.5">50%</option><option value="0.65" selected>65%</option><option value="0.75">75%</option><option value="0.85">85%</option><option value="1">100%</option></select></div>';
    $('cvbExportPDF').onclick = exportPDF;
    $('cvbPrint').onclick = printResume;
    $('cvbZoom').onchange = function () { S.zoom = parseFloat(this.value); applyZoom(); };
  }

  function buildNav() {
    var nav = $('cvbNav');
    nav.innerHTML = '<div class="cvb-nav-header">Builder</div>';
    NAV.forEach(function (item) {
      if (item.divider) { nav.innerHTML += '<div class="cvb-nav-divider"></div>'; return; }
      nav.innerHTML += '<div class="cvb-nav-item' + (item.id === S.section ? ' active' : '') + '" data-section="' + item.id + '"><span>' + (ICO[item.icon] || '') + '</span>' + item.label + (item.ai ? '<span class="cvb-nav-badge">AI</span>' : '') + '</div>';
    });
    qsa('.cvb-nav-item', nav).forEach(function (el) { el.onclick = function () { setSection(el.dataset.section); }; });
  }

  function applyZoom() {
    var inner = $('cvbPreviewInner'), frame = $('cvbPreviewFrame');
    if (!inner || !frame) return;
    inner.style.transform = 'scale(' + S.zoom + ')';
    frame.style.height = (842 * S.zoom) + 'px';
    frame.style.maxWidth = (595 * S.zoom) + 'px';
  }

  function setSection(key) {
    S.section = key;
    qsa('.cvb-nav-item', $('cvbNav')).forEach(function (el) { el.classList.toggle('active', el.dataset.section === key); });
    renderEditor();
  }

  /* ============================================================
     EDITOR — ONLY re-renders on explicit user navigation
     NEVER re-renders from Firebase sync (the critical fix)
     ============================================================ */
  function renderEditor() {
    var ed = $('cvbEditor');
    if (!ed) return;
    var r = currentResume();
    if (!r) { ed.innerHTML = '<div class="cvb-empty">' + ICO.layers + '<h4>No Resume Selected</h4><p>Create a new resume or select an existing one.</p></div>'; return; }
    var fn = ({
      templates: renderTemplateEditor, personal: renderPersonalEditor, summary: renderSummaryEditor,
      experience: renderExperienceEditor, education: renderEducationEditor, skills: renderSkillsEditor,
      certifications: renderCertsEditor, projects: renderProjectsEditor, languages: renderLanguagesEditor,
      custom: renderCustomEditor, design: renderDesignEditor, atscore: renderATSEditor
    })[S.section] || renderTemplateEditor;
    ed.innerHTML = '';
    fn(ed, r);
  }

  /* ---- Template Selector ---- */
  function renderTemplateEditor(el) {
    var design = resumeDesign();
    el.innerHTML = '<div class="cvb-section active"><h2 class="cvb-section-title">Choose a Template</h2><p class="cvb-section-desc">Select a professional template that matches your style.</p><div class="cvb-template-grid" id="cvbTplGrid"></div></div>';
    var grid = $('cvbTplGrid');
    CVTemplates.list().forEach(function (tpl) {
      var card = document.createElement('div');
      card.className = 'cvb-template-card' + (design.template === tpl.id ? ' selected' : '');
      card.innerHTML = '<div class="cvb-template-thumb">' + CVTemplates.thumbnail(tpl.id) + '</div><div class="cvb-template-name">' + tpl.name + '<br><span style="font-weight:400;font-size:.65rem;color:#999">' + tpl.description + '</span></div>';
      card.onclick = function () {
        resumeDesign().template = tpl.id;
        resumeDesign().layout = tpl.layout === 'two-column' ? 'two-column' : 'single';
        qsa('.cvb-template-card', grid).forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        schedulePreview(); autoSave();
      };
      grid.appendChild(card);
    });
  }

  /* ---- Personal Info ---- */
  function renderPersonalEditor(el) {
    var d = resumeData().personal || {};
    el.innerHTML = '<div class="cvb-section active"><h2 class="cvb-section-title">Personal Information</h2><p class="cvb-section-desc">Let employers know how to reach you.</p>' +
      '<div class="cvb-row"><div class="cvb-fg"><label>First Name</label><input id="cvbPFirstName" value="' + esc(d.firstName) + '"></div><div class="cvb-fg"><label>Last Name</label><input id="cvbPLastName" value="' + esc(d.lastName) + '"></div></div>' +
      '<div class="cvb-fg"><label>Job Title</label><input id="cvbPTitle" value="' + esc(d.title) + '" placeholder="e.g. Software Engineer"></div>' +
      '<div class="cvb-row"><div class="cvb-fg"><label>Email</label><input id="cvbPEmail" type="email" value="' + esc(d.email) + '"></div><div class="cvb-fg"><label>Phone</label><input id="cvbPPhone" type="tel" value="' + esc(d.phone) + '"></div></div>' +
      '<div class="cvb-fg"><label>Location</label><input id="cvbPLocation" value="' + esc(d.location) + '" placeholder="e.g. New York, NY"></div>' +
      '<div class="cvb-row"><div class="cvb-fg"><label>LinkedIn</label><input id="cvbPLinkedin" value="' + esc(d.linkedin) + '"></div><div class="cvb-fg"><label>GitHub</label><input id="cvbPGithub" value="' + esc(d.github) + '"></div></div>' +
      '<div class="cvb-fg"><label>Website</label><input id="cvbPWebsite" value="' + esc(d.website) + '"></div>' +
      '<div class="cvb-fg"><label>Photo</label><input type="file" id="cvbPPhoto" accept="image/*">' +
      (d.photo ? '<img src="' + d.photo + '" style="width:60px;height:60px;border-radius:50%;object-fit:cover;margin-top:8px">' : '') + '</div></div>';

    ['cvbPFirstName', 'cvbPLastName', 'cvbPTitle', 'cvbPEmail', 'cvbPPhone', 'cvbPLocation', 'cvbPLinkedin', 'cvbPGithub', 'cvbPWebsite'].forEach(function (fid, i) {
      var keys = ['firstName', 'lastName', 'title', 'email', 'phone', 'location', 'linkedin', 'github', 'website'];
      var inp = $(fid);
      if (inp) inp.oninput = function () { resumeData().personal[keys[i]] = inp.value; schedulePreview(); autoSave(); };
    });
    var photoInput = $('cvbPPhoto');
    if (photoInput) photoInput.onchange = function () {
      var file = this.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) { resumeData().personal.photo = e.target.result; schedulePreview(); autoSave(); renderEditor(); };
      reader.readAsDataURL(file);
    };
  }

  /* ---- Summary ---- */
  function renderSummaryEditor(el) {
    var d = resumeData();
    el.innerHTML = '<div class="cvb-section active"><h2 class="cvb-section-title">Professional Summary</h2><p class="cvb-section-desc">A compelling overview of your professional profile.</p>' +
      '<div class="cvb-ai-box"><div class="cvb-ai-box-header">' + ICO.ai + ' AI Assistant</div><p>Generate a professional summary based on your job title.</p>' +
      '<button class="cvb-btn cvb-btn-ai cvb-btn-sm" id="cvbAISummary">' + ICO.ai + ' Generate Summary</button></div>' +
      '<div class="cvb-fg"><label>Summary</label><textarea id="cvbSummary" rows="6" placeholder="Write a compelling professional summary...">' + esc(d.summary || '') + '</textarea><small id="cvbSummaryCount">' + (d.summary || '').length + ' characters</small></div></div>';
    $('cvbSummary').oninput = function () { resumeData().summary = this.value; $('cvbSummaryCount').textContent = this.value.length + ' characters'; schedulePreview(); autoSave(); };
    $('cvbAISummary').onclick = function () {
      var btn = this; btn.disabled = true; btn.innerHTML = 'Generating...';
      AI.suggestSummaryAI(resumeData().personal.title, function (text) {
        $('cvbSummary').value = text; resumeData().summary = text; $('cvbSummaryCount').textContent = text.length + ' characters';
        btn.disabled = false; btn.innerHTML = ICO.ai + ' Generate Summary'; schedulePreview(); autoSave();
      });
    };
  }

  /* ---- Experience ---- */
  function renderExperienceEditor(el) {
    var items = resumeData().experience || [];
    var html = '<div class="cvb-section active"><h2 class="cvb-section-title">Work Experience</h2><p class="cvb-section-desc">List your relevant positions, most recent first.</p><div id="cvbExpList">';
    items.forEach(function (exp, idx) { html += buildExpItem(exp, idx); });
    html += '</div><button class="cvb-add-btn" id="cvbAddExp">' + ICO.plus + ' Add Experience</button></div>';
    el.innerHTML = html;
    bindExpEvents();
    $('cvbAddExp').onclick = function () {
      if (!resumeData().experience) resumeData().experience = [];
      resumeData().experience.push({ id: uid(), role: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] });
      renderEditor(); schedulePreview(); autoSave();
    };
    initSortable('cvbExpList', 'experience');
  }

  function buildExpItem(exp, idx) {
    var bhtml = (exp.bullets || ['']).map(function (b, bi) {
      return '<div class="cvb-bullet-row"><textarea data-exp="' + idx + '" data-bullet="' + bi + '" class="cvb-exp-bullet" placeholder="Describe what you achieved...">' + esc(b) + '</textarea>' +
        '<div class="cvb-bullet-actions"><button class="cvb-bullet-remove" data-exp="' + idx + '" data-bullet="' + bi + '">&times;</button>' +
        '<button class="cvb-btn cvb-btn-ai cvb-btn-sm" data-exp="' + idx + '" data-bullet="' + bi + '" style="padding:3px 6px;font-size:.65rem">AI</button></div></div>';
    }).join('');
    return '<div class="cvb-item" data-idx="' + idx + '"><div class="cvb-item-handle"><span></span><span></span><span></span></div><div style="padding-left:14px">' +
      '<div class="cvb-item-header"><strong>' + esc(exp.role || 'New Position') + '</strong><button class="cvb-item-remove" data-exp-del="' + idx + '">&times;</button></div>' +
      '<div class="cvb-row"><div class="cvb-fg"><label>Job Title</label><input class="cvb-exp-field" data-exp="' + idx + '" data-key="role" value="' + esc(exp.role) + '"></div>' +
      '<div class="cvb-fg"><label>Company</label><input class="cvb-exp-field" data-exp="' + idx + '" data-key="company" value="' + esc(exp.company) + '"></div></div>' +
      '<div class="cvb-row-3"><div class="cvb-fg"><label>Location</label><input class="cvb-exp-field" data-exp="' + idx + '" data-key="location" value="' + esc(exp.location) + '"></div>' +
      '<div class="cvb-fg"><label>Start</label><input type="month" class="cvb-exp-field" data-exp="' + idx + '" data-key="startDate" value="' + esc(exp.startDate) + '"></div>' +
      '<div class="cvb-fg"><label>End</label><input type="month" class="cvb-exp-field" data-exp="' + idx + '" data-key="endDate" value="' + esc(exp.endDate) + '"' + (exp.current ? ' disabled' : '') + '>' +
      '<label style="font-size:.72rem;margin-top:4px"><input type="checkbox" class="cvb-exp-current" data-exp="' + idx + '"' + (exp.current ? ' checked' : '') + '> Current</label></div></div>' +
      '<label style="font-size:.78rem;font-weight:600;color:#374151;margin-bottom:4px;display:block;margin-top:8px">Bullet Points</label>' + bhtml +
      '<button class="cvb-add-bullet" data-exp="' + idx + '">+ Add bullet</button></div></div>';
  }

  function bindExpEvents() {
    qsa('.cvb-exp-field').forEach(function (inp) {
      inp.oninput = function () {
        var idx = parseInt(inp.dataset.exp);
        resumeData().experience[idx][inp.dataset.key] = inp.value;
        if (inp.dataset.key === 'role') { var t = inp.closest('.cvb-item').querySelector('strong'); if (t) t.textContent = inp.value || 'New Position'; }
        schedulePreview(); autoSave();
      };
    });
    qsa('.cvb-exp-current').forEach(function (cb) {
      cb.onchange = function () { var idx = parseInt(cb.dataset.exp); resumeData().experience[idx].current = cb.checked; var end = cb.closest('.cvb-item').querySelector('[data-key="endDate"]'); if (end) end.disabled = cb.checked; schedulePreview(); autoSave(); };
    });
    qsa('.cvb-exp-bullet').forEach(function (ta) {
      ta.oninput = function () { var idx = parseInt(ta.dataset.exp), bi = parseInt(ta.dataset.bullet); if (!resumeData().experience[idx].bullets) resumeData().experience[idx].bullets = []; resumeData().experience[idx].bullets[bi] = ta.value; schedulePreview(); autoSave(); };
    });
    qsa('.cvb-bullet-remove').forEach(function (btn) { btn.onclick = function () { resumeData().experience[parseInt(btn.dataset.exp)].bullets.splice(parseInt(btn.dataset.bullet), 1); renderEditor(); schedulePreview(); autoSave(); }; });
    qsa('.cvb-add-bullet').forEach(function (btn) { btn.onclick = function () { var idx = parseInt(btn.dataset.exp); if (!resumeData().experience[idx].bullets) resumeData().experience[idx].bullets = []; resumeData().experience[idx].bullets.push(''); renderEditor(); autoSave(); }; });
    qsa('[data-exp-del]').forEach(function (btn) { btn.onclick = function () { if (!confirm('Remove this experience?')) return; resumeData().experience.splice(parseInt(btn.dataset.expDel), 1); renderEditor(); schedulePreview(); autoSave(); }; });
    qsa('.cvb-btn-ai[data-bullet]').forEach(function (btn) { btn.onclick = function () { var idx = parseInt(btn.dataset.exp), bi = parseInt(btn.dataset.bullet); resumeData().experience[idx].bullets[bi] = AI.enhanceBullet(resumeData().experience[idx].bullets[bi]); renderEditor(); schedulePreview(); autoSave(); }; });
  }

  /* ---- Education ---- */
  function renderEducationEditor(el) {
    var items = resumeData().education || [];
    var html = '<div class="cvb-section active"><h2 class="cvb-section-title">Education</h2><p class="cvb-section-desc">Include your academic background.</p><div id="cvbEduList">';
    items.forEach(function (edu, idx) {
      html += '<div class="cvb-item" data-idx="' + idx + '"><div class="cvb-item-handle"><span></span><span></span><span></span></div><div style="padding-left:14px">' +
        '<div class="cvb-item-header"><strong>' + esc(edu.degree || 'New Education') + '</strong><button class="cvb-item-remove" data-edu-del="' + idx + '">&times;</button></div>' +
        '<div class="cvb-row"><div class="cvb-fg"><label>Degree</label><input class="cvb-edu-field" data-edu="' + idx + '" data-key="degree" value="' + esc(edu.degree) + '"></div>' +
        '<div class="cvb-fg"><label>School</label><input class="cvb-edu-field" data-edu="' + idx + '" data-key="school" value="' + esc(edu.school) + '"></div></div>' +
        '<div class="cvb-row-3"><div class="cvb-fg"><label>Location</label><input class="cvb-edu-field" data-edu="' + idx + '" data-key="location" value="' + esc(edu.location) + '"></div>' +
        '<div class="cvb-fg"><label>Start</label><input type="month" class="cvb-edu-field" data-edu="' + idx + '" data-key="startDate" value="' + esc(edu.startDate) + '"></div>' +
        '<div class="cvb-fg"><label>End</label><input type="month" class="cvb-edu-field" data-edu="' + idx + '" data-key="endDate" value="' + esc(edu.endDate) + '"></div></div>' +
        '<div class="cvb-fg"><label>GPA</label><input class="cvb-edu-field" data-edu="' + idx + '" data-key="gpa" value="' + esc(edu.gpa) + '"></div></div></div>';
    });
    html += '</div><button class="cvb-add-btn" id="cvbAddEdu">' + ICO.plus + ' Add Education</button></div>';
    el.innerHTML = html;
    bindListEvents('edu', 'education', 'New Education');
    $('cvbAddEdu').onclick = function () { if (!resumeData().education) resumeData().education = []; resumeData().education.push({ id: uid(), degree: '', school: '', location: '', startDate: '', endDate: '', gpa: '' }); renderEditor(); schedulePreview(); autoSave(); };
    initSortable('cvbEduList', 'education');
  }

  /* ---- Skills ---- */
  function renderSkillsEditor(el) {
    var skills = resumeData().skills || [];
    var html = '<div class="cvb-section active"><h2 class="cvb-section-title">Skills</h2><p class="cvb-section-desc">List your key skills. Drag to reorder.</p>' +
      '<div class="cvb-ai-box"><div class="cvb-ai-box-header">' + ICO.ai + ' AI Suggestions</div><p>Get skill suggestions based on your job title.</p>' +
      '<button class="cvb-btn cvb-btn-ai cvb-btn-sm" id="cvbAISkills">' + ICO.ai + ' Suggest Skills</button><div class="cvb-ai-suggestions" id="cvbSkillSuggestions"></div></div>' +
      '<div class="cvb-skill-tags" id="cvbSkillTags">';
    skills.forEach(function (s, i) { var name = typeof s === 'string' ? s : s.name; html += '<span class="cvb-skill-tag" data-idx="' + i + '">' + esc(name) + '<button class="skill-remove" data-skill-del="' + i + '">&times;</button></span>'; });
    html += '</div><div class="cvb-skill-input-row"><input id="cvbSkillInput" placeholder="Type a skill and press Enter"><button class="cvb-btn cvb-btn-secondary cvb-btn-sm" id="cvbAddSkillBtn">Add</button></div></div>';
    el.innerHTML = html;
    function addSkill(name) { if (!name.trim()) return; if (!resumeData().skills) resumeData().skills = []; resumeData().skills.push({ name: name.trim() }); renderEditor(); schedulePreview(); autoSave(); }
    $('cvbSkillInput').onkeydown = function (e) { if (e.key === 'Enter') { addSkill(this.value); this.value = ''; } };
    $('cvbAddSkillBtn').onclick = function () { addSkill($('cvbSkillInput').value); $('cvbSkillInput').value = ''; };
    qsa('[data-skill-del]').forEach(function (btn) { btn.onclick = function (e) { e.stopPropagation(); resumeData().skills.splice(parseInt(btn.dataset.skillDel), 1); renderEditor(); schedulePreview(); autoSave(); }; });
    $('cvbAISkills').onclick = function () {
      var btn = this; btn.disabled = true; btn.innerHTML = 'Loading...';
      AI.suggestSkillsAI(resumeData().personal.title, function (arr) {
        btn.disabled = false; btn.innerHTML = ICO.ai + ' Suggest Skills';
        var cont = $('cvbSkillSuggestions');
        cont.innerHTML = arr.map(function (s) { return '<button class="cvb-ai-chip">' + s + '</button>'; }).join('');
        qsa('.cvb-ai-chip', cont).forEach(function (chip) { chip.onclick = function () { addSkill(chip.textContent); chip.remove(); }; });
      });
    };
    if (typeof Sortable !== 'undefined') new Sortable($('cvbSkillTags'), { animation: 150, ghostClass: 'sortable-ghost', onEnd: function (evt) { var a = resumeData().skills; var m = a.splice(evt.oldIndex, 1)[0]; a.splice(evt.newIndex, 0, m); schedulePreview(); autoSave(); } });
  }

  /* ---- Generic list editors ---- */
  function renderCertsEditor(el) { renderGenericList(el, 'certifications', 'Certifications', 'Professional certifications and licenses.', ['name', 'issuer', 'date:month', 'url'], 'New Certification'); }
  function renderProjectsEditor(el) { renderGenericList(el, 'projects', 'Projects', 'Showcase your personal or professional projects.', ['name', 'description:textarea', 'technologies', 'link'], 'New Project'); }
  function renderLanguagesEditor(el) { renderGenericList(el, 'languages', 'Languages', 'List languages you speak.', ['name', 'proficiency:select:Native,Fluent,Advanced,Intermediate,Basic'], 'New Language'); }
  function renderCustomEditor(el) { renderGenericList(el, 'customSections', 'Custom Sections', 'Add any additional sections.', ['title', 'content:textarea'], 'Custom Section'); }

  function renderGenericList(el, key, title, desc, fields, defaultTitle) {
    var items = resumeData()[key] || [];
    var listId = 'cvbList_' + key;
    var html = '<div class="cvb-section active"><h2 class="cvb-section-title">' + title + '</h2><p class="cvb-section-desc">' + desc + '</p><div id="' + listId + '">';
    items.forEach(function (item, idx) {
      html += '<div class="cvb-item" data-idx="' + idx + '"><div class="cvb-item-handle"><span></span><span></span><span></span></div><div style="padding-left:14px">' +
        '<div class="cvb-item-header"><strong>' + esc(item[fields[0].split(':')[0]] || defaultTitle) + '</strong><button class="cvb-item-remove" data-gdel="' + idx + '">&times;</button></div>';
      var rowFields = [];
      fields.forEach(function (f) {
        var parts = f.split(':');
        var fname = parts[0], ftype = parts[1] || 'text';
        var label = fname.charAt(0).toUpperCase() + fname.slice(1);
        if (ftype === 'textarea') html += '<div class="cvb-fg"><label>' + label + '</label><textarea class="cvb-gfield" data-gidx="' + idx + '" data-gkey="' + fname + '" rows="3">' + esc(item[fname]) + '</textarea></div>';
        else if (ftype === 'select') {
          var opts = (parts[2] || '').split(',');
          html += '<div class="cvb-fg"><label>' + label + '</label><select class="cvb-gfield" data-gidx="' + idx + '" data-gkey="' + fname + '">' + opts.map(function (o) { return '<option' + (item[fname] === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>';
        } else {
          rowFields.push('<div class="cvb-fg"><label>' + label + '</label><input type="' + (ftype === 'month' ? 'month' : 'text') + '" class="cvb-gfield" data-gidx="' + idx + '" data-gkey="' + fname + '" value="' + esc(item[fname]) + '"></div>');
          if (rowFields.length === 2 || fname === fields[fields.length - 1].split(':')[0]) { html += '<div class="cvb-row">' + rowFields.join('') + '</div>'; rowFields = []; }
        }
      });
      if (rowFields.length) html += '<div class="cvb-row">' + rowFields.join('') + '</div>';
      html += '</div></div>';
    });
    html += '</div><button class="cvb-add-btn" id="cvbAdd_' + key + '">' + ICO.plus + ' Add ' + defaultTitle + '</button></div>';
    el.innerHTML = html;

    qsa('.cvb-gfield', el).forEach(function (inp) {
      var handler = function () {
        var idx = parseInt(inp.dataset.gidx);
        resumeData()[key][idx][inp.dataset.gkey] = inp.value;
        if (inp.dataset.gkey === fields[0].split(':')[0]) { var t = inp.closest('.cvb-item').querySelector('strong'); if (t) t.textContent = inp.value || defaultTitle; }
        schedulePreview(); autoSave();
      };
      if (inp.tagName === 'SELECT') inp.onchange = handler; else inp.oninput = handler;
    });
    qsa('[data-gdel]', el).forEach(function (btn) { btn.onclick = function () { if (!confirm('Remove?')) return; resumeData()[key].splice(parseInt(btn.dataset.gdel), 1); renderEditor(); schedulePreview(); autoSave(); }; });
    $('cvbAdd_' + key).onclick = function () {
      if (!resumeData()[key]) resumeData()[key] = [];
      var obj = { id: uid() }; fields.forEach(function (f) { obj[f.split(':')[0]] = ''; });
      if (obj.proficiency !== undefined) obj.proficiency = 'Intermediate';
      resumeData()[key].push(obj); renderEditor(); schedulePreview(); autoSave();
    };
    initSortable(listId, key);
  }

  function bindListEvents(prefix, key, defaultTitle) {
    qsa('.cvb-' + prefix + '-field').forEach(function (inp) {
      var handler = function () {
        var idx = parseInt(inp.dataset[prefix]);
        resumeData()[key][idx][inp.dataset.key] = inp.value;
        if (inp.dataset.key === 'name' || inp.dataset.key === 'title' || inp.dataset.key === 'degree') { var t = inp.closest('.cvb-item').querySelector('strong'); if (t) t.textContent = inp.value || defaultTitle; }
        schedulePreview(); autoSave();
      };
      if (inp.tagName === 'SELECT') inp.onchange = handler; else inp.oninput = handler;
    });
    qsa('[data-' + prefix + '-del]').forEach(function (btn) { btn.onclick = function () { if (!confirm('Remove?')) return; resumeData()[key].splice(parseInt(btn.dataset[prefix + 'Del']), 1); renderEditor(); schedulePreview(); autoSave(); }; });
  }

  /* ---- Design ---- */
  function renderDesignEditor(el) {
    var d = resumeDesign();
    var fonts = ['Inter', 'Georgia', 'Roboto', 'Lato', 'Open Sans', 'Merriweather', 'Playfair Display', 'Source Sans Pro'];
    var html = '<div class="cvb-section active"><h2 class="cvb-section-title">Design & Customization</h2><p class="cvb-section-desc">Fine-tune every visual aspect of your resume.</p>';

    html += '<div class="cvb-design-group"><div class="cvb-design-group-title">Font Family</div><div class="cvb-font-grid">';
    fonts.forEach(function (f) { html += '<div class="cvb-font-opt' + (d.fontFamily === f ? ' selected' : '') + '" data-font="' + f + '"><div class="font-sample" style="font-family:' + f + ',sans-serif">Aa Bb</div><div class="font-name">' + f + '</div></div>'; });
    html += '</div></div>';

    html += '<div class="cvb-design-group"><div class="cvb-design-group-title">Typography</div>' +
      rangeRow('Font Size', d.fontSize, 'px', 'fontSize', 8, 14, 0.5) +
      rangeRow('Line Spacing', d.lineSpacing, '', 'lineSpacing', 1.1, 2, 0.05) +
      rangeRow('Section Spacing', d.sectionSpacing, 'px', 'sectionSpacing', 6, 24, 2) + '</div>';

    html += '<div class="cvb-design-group"><div class="cvb-design-group-title">Colors</div>' +
      colorRow('Primary', d.colorPrimary, 'colorPrimary') + colorRow('Accent', d.colorAccent, 'colorAccent') +
      colorRow('Text', d.colorText, 'colorText') + colorRow('Background', d.colorBg, 'colorBg') + '</div>';

    html += '<div class="cvb-design-group"><div class="cvb-design-group-title">Margins</div>' +
      '<div class="cvb-row">' + rangeRow('Top', d.margins.top || 32, '', 'margin-top', 10, 60, 2) + rangeRow('Bottom', d.margins.bottom || 32, '', 'margin-bottom', 10, 60, 2) + '</div>' +
      '<div class="cvb-row">' + rangeRow('Left', d.margins.left || 20, '', 'margin-left', 10, 60, 2) + rangeRow('Right', d.margins.right || 28, '', 'margin-right', 10, 60, 2) + '</div></div>';

    html += '<div class="cvb-design-group"><div class="cvb-design-group-title">Photo Settings</div>' +
      '<div class="cvb-toggle-row"><label>Show Photo</label><label class="cvb-toggle"><input type="checkbox" id="cvbShowPhoto"' + (d.showPhoto !== false ? ' checked' : '') + '><span class="slider"></span></label></div>' +
      rangeRow('Photo Size', d.photoSize || 80, 'px', 'photoSize', 40, 120, 5) +
      '<div style="display:flex;gap:8px;margin-bottom:10px">' +
      shapeBtn('circle', d) + shapeBtn('rounded', d) + shapeBtn('square', d) + '</div>' +
      '<div class="cvb-toggle-row"><label>Photo Border</label><label class="cvb-toggle"><input type="checkbox" id="cvbPhotoBorder"' + (d.photoBorder ? ' checked' : '') + '><span class="slider"></span></label></div></div>';

    html += '<div class="cvb-design-group"><div class="cvb-design-group-title">Section Visibility</div>';
    [['summary', 'Summary'], ['experience', 'Experience'], ['education', 'Education'], ['skills', 'Skills'], ['certifications', 'Certifications'], ['projects', 'Projects'], ['languages', 'Languages'], ['custom', 'Custom Sections']].forEach(function (s) {
      var hidden = (d.hiddenSections || []).indexOf(s[0]) !== -1;
      html += '<div class="cvb-toggle-row"><label>' + s[1] + '</label><label class="cvb-toggle"><input type="checkbox" data-vis="' + s[0] + '"' + (hidden ? '' : ' checked') + '><span class="slider"></span></label></div>';
    });
    html += '</div>';

    html += '<div class="cvb-design-group"><div class="cvb-design-group-title">AI API Key</div><div class="cvb-fg"><input id="cvbAIKey" type="password" placeholder="sk-... (OpenAI key)" value="' + esc(S.aiKey) + '"><small>Optional. Without a key, built-in templates are used.</small></div></div></div>';
    el.innerHTML = html;

    qsa('.cvb-font-opt', el).forEach(function (opt) { opt.onclick = function () { resumeDesign().fontFamily = opt.dataset.font; qsa('.cvb-font-opt', el).forEach(function (o) { o.classList.remove('selected'); }); opt.classList.add('selected'); schedulePreview(); autoSave(); }; });
    qsa('[data-dkey]', el).forEach(function (inp) {
      inp.oninput = function () {
        var key = inp.dataset.dkey, val = parseFloat(inp.value);
        if (key.indexOf('margin-') === 0) { if (!resumeDesign().margins) resumeDesign().margins = {}; resumeDesign().margins[key.split('-')[1]] = val; }
        else resumeDesign()[key] = val;
        var sp = inp.closest('.cvb-range-row').querySelector('span'); if (sp) sp.textContent = val + (inp.dataset.dsuffix || '');
        schedulePreview(); autoSave();
      };
    });
    qsa('input[type="color"]', el).forEach(function (inp) { inp.oninput = function () { resumeDesign()[inp.dataset.colorKey] = inp.value; var txt = inp.closest('.cvb-color-row').querySelector('input[type="text"]'); if (txt) txt.value = inp.value; schedulePreview(); autoSave(); }; });
    qsa('.cvb-color-row input[type="text"]', el).forEach(function (inp) { inp.oninput = function () { resumeDesign()[inp.dataset.colorKey] = inp.value; var col = inp.closest('.cvb-color-row').querySelector('input[type="color"]'); if (col) col.value = inp.value; schedulePreview(); autoSave(); }; });
    qsa('[data-vis]', el).forEach(function (cb) { cb.onchange = function () { if (!resumeDesign().hiddenSections) resumeDesign().hiddenSections = []; var a = resumeDesign().hiddenSections, k = cb.dataset.vis; if (cb.checked) { var i = a.indexOf(k); if (i !== -1) a.splice(i, 1); } else { if (a.indexOf(k) === -1) a.push(k); } schedulePreview(); autoSave(); }; });
    $('cvbShowPhoto').onchange = function () { resumeDesign().showPhoto = this.checked; schedulePreview(); autoSave(); };
    $('cvbPhotoBorder').onchange = function () { resumeDesign().photoBorder = this.checked; schedulePreview(); autoSave(); };
    qsa('[data-shape]', el).forEach(function (opt) { opt.onclick = function () { resumeDesign().photoShape = opt.dataset.shape; qsa('[data-shape]', el).forEach(function (o) { o.style.borderColor = '#e5e7eb'; }); opt.style.borderColor = '#7c3aed'; schedulePreview(); autoSave(); }; });
    var aiInput = $('cvbAIKey'); if (aiInput) aiInput.onchange = function () { S.aiKey = aiInput.value; localStorage.setItem('cvb_ai_key', aiInput.value); };
  }

  function rangeRow(label, val, suffix, key, min, max, step) {
    return '<div class="cvb-range-row"><label>' + label + ' <span>' + val + (suffix || '') + '</span></label><input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" data-dkey="' + key + '" data-dsuffix="' + (suffix || '') + '"></div>';
  }
  function colorRow(label, val, key) {
    return '<div class="cvb-color-row"><label>' + label + '</label><input type="color" value="' + (val || '#000') + '" data-color-key="' + key + '"><input type="text" value="' + (val || '#000') + '" data-color-key="' + key + '"></div>';
  }
  function shapeBtn(shape, d) {
    var sel = (d.photoShape || 'circle') === shape;
    var br = shape === 'circle' ? '50%' : shape === 'rounded' ? '6px' : '0';
    return '<div data-shape="' + shape + '" style="flex:1;padding:8px;text-align:center;cursor:pointer;border:2px solid ' + (sel ? '#7c3aed' : '#e5e7eb') + ';border-radius:8px"><div style="width:28px;height:28px;border-radius:' + br + ';background:#d1d5db;margin:0 auto 4px"></div><span style="font-size:.7rem">' + shape.charAt(0).toUpperCase() + shape.slice(1) + '</span></div>';
  }

  /* ---- ATS Score ---- */
  function renderATSEditor(el) {
    var result = AI.atsScore(resumeData());
    var col = result.score >= 80 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444';
    var circ = Math.PI * 2 * 22, offset = circ - (result.score / 100) * circ;
    var html = '<div class="cvb-section active"><h2 class="cvb-section-title">ATS Optimization Score</h2><p class="cvb-section-desc">How well your resume performs with Applicant Tracking Systems.</p>' +
      '<div class="cvb-ats-score"><div class="cvb-ats-ring"><svg width="56" height="56"><circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" stroke-width="4"/>' +
      '<circle cx="28" cy="28" r="22" fill="none" stroke="' + col + '" stroke-width="4" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" stroke-linecap="round"/></svg><span class="ats-num">' + result.score + '</span></div>' +
      '<div class="cvb-ats-info"><strong>ATS Score: ' + result.score + '/100</strong><span>' + (result.score >= 80 ? 'Excellent!' : result.score >= 50 ? 'Good, room for improvement.' : 'Needs work.') + '</span></div></div>';
    if (result.tips.length) { html += '<div class="cvb-card" style="margin-top:16px"><h4 style="margin-bottom:10px;font-size:.85rem">Tips</h4><ul style="padding-left:18px;font-size:.82rem;color:#555">'; result.tips.forEach(function (t) { html += '<li style="margin-bottom:4px">' + t + '</li>'; }); html += '</ul></div>'; }
    html += '</div>'; el.innerHTML = html;
  }

  /* ============================================================
     SORTABLE
     ============================================================ */
  function initSortable(listId, dataKey) {
    var el = $(listId);
    if (!el || typeof Sortable === 'undefined') return;
    new Sortable(el, { animation: 150, handle: '.cvb-item-handle', ghostClass: 'sortable-ghost', onEnd: function (evt) { var a = resumeData()[dataKey]; a.splice(evt.newIndex, 0, a.splice(evt.oldIndex, 1)[0]); schedulePreview(); autoSave(); } });
  }

  /* ============================================================
     LIVE PREVIEW — only updates the preview pane, never the editor
     ============================================================ */
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 200);
  }

  function updatePreview() {
    var r = currentResume();
    if (!r) return;
    var inner = $('cvbPreviewInner');
    if (!inner) return;
    inner.innerHTML = CVTemplates.render(r.data, r.design);
    applyZoom();
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  function exportPDF() {
    var r = currentResume(); if (!r) return;
    if (typeof html2pdf === 'undefined') { alert('html2pdf library not loaded.'); return; }
    var clone = document.createElement('div');
    clone.innerHTML = CVTemplates.render(r.data, r.design);
    clone.style.cssText = 'position:absolute;left:-9999px';
    document.body.appendChild(clone);
    html2pdf().set({ margin: 0, filename: (r.name || 'Resume').replace(/[^a-zA-Z0-9]/g, '_') + '.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' } }).from(clone.firstChild).save().then(function () { document.body.removeChild(clone); });
  }

  function printResume() {
    var r = currentResume(); if (!r) return;
    var win = window.open('', '_blank');
    win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Resume</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Georgia&family=Roboto:wght@300;400;500;700&family=Lato:wght@300;400;700&family=Merriweather:wght@300;400;700&family=Playfair+Display:wght@400;700&family=Open+Sans:wght@300;400;600;700&family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet"><style>@page{size:A4;margin:0}body{margin:0}*{box-sizing:border-box}</style></head><body>' + CVTemplates.render(r.data, r.design) + '</body></html>');
    win.document.close();
    setTimeout(function () { win.print(); }, 500);
  }

  /* ============================================================
     FIREBASE CRUD — THE CRITICAL FIX
     Firebase listener NEVER re-renders the editor.
     It only syncs data silently and updates the dropdown.
     ============================================================ */
  var saveTimer = null;
  function autoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var r = currentResume(); if (!r) return;
      r.updatedAt = Date.now();
      _localSaving = true;
      db.ref(DB_PATH + r.id).set(r).then(function () {
        setTimeout(function () { _localSaving = false; }, 500);
      }).catch(function () { _localSaving = false; });
    }, 1200);
  }

  function loadResumes() {
    db.ref(DB_PATH).on('value', function (snap) {
      var val = snap.val();
      if (_localSaving) {
        S.resumes = val || {};
        return;
      }
      var hadCurrent = S.currentId && S.resumes[S.currentId];
      S.resumes = val || {};
      updateResumeSelect();
      if (!hadCurrent && S.currentId && S.resumes[S.currentId]) {
        renderEditor();
        schedulePreview();
      } else if (S.currentId && S.resumes[S.currentId]) {
        schedulePreview();
      }
    });
  }

  function updateResumeSelect() {
    var sel = $('cvbResumeSelect'); if (!sel) return;
    sel.innerHTML = '<option value="">— Select Resume —</option>';
    Object.keys(S.resumes).sort(function (a, b) { return (S.resumes[b].updatedAt || 0) - (S.resumes[a].updatedAt || 0); }).forEach(function (id) {
      var r = S.resumes[id], opt = document.createElement('option');
      opt.value = id; opt.textContent = r.name || 'Untitled'; sel.appendChild(opt);
    });
    if (S.currentId) sel.value = S.currentId;
  }

  function selectResume(id) {
    S.currentId = id;
    var app = $('cvbApp');
    if (id && S.resumes[id]) { app.style.display = 'grid'; setSection('templates'); schedulePreview(); }
    else app.style.display = 'none';
  }

  function createResume() {
    var name = prompt('Resume name:', 'My Resume'); if (!name) return;
    var r = defaultResume(name);
    S.resumes[r.id] = r;
    db.ref(DB_PATH + r.id).set(r).then(function () { S.currentId = r.id; updateResumeSelect(); $('cvbResumeSelect').value = r.id; selectResume(r.id); });
  }

  function duplicateResume() {
    var r = currentResume(); if (!r) { alert('Select a resume first.'); return; }
    var clone = JSON.parse(JSON.stringify(r));
    clone.id = 'cv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    clone.name = r.name + ' (Copy)'; clone.createdAt = Date.now(); clone.updatedAt = Date.now();
    db.ref(DB_PATH + clone.id).set(clone).then(function () { S.currentId = clone.id; updateResumeSelect(); $('cvbResumeSelect').value = clone.id; selectResume(clone.id); });
  }

  function renameResume() {
    var r = currentResume(); if (!r) return;
    var name = prompt('New name:', r.name); if (!name) return;
    r.name = name; db.ref(DB_PATH + r.id + '/name').set(name); updateResumeSelect();
  }

  function deleteResume() {
    var r = currentResume(); if (!r) return;
    if (!confirm('Delete "' + r.name + '"?')) return;
    db.ref(DB_PATH + r.id).remove().then(function () { S.currentId = null; $('cvbResumeSelect').value = ''; selectResume(''); });
  }

  return { init: init };
})();
