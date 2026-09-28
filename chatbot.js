// ============================================================
// CONTACT MESSAGE MODAL
// ============================================================
(function () {
  const overlay = document.getElementById('msgOverlay');
  const closeBtn = document.getElementById('msgClose');
  const fabMsg = document.getElementById('fabMsg');

  // Open message modal from CTA buttons
  fabMsg.addEventListener('click', () => overlay.classList.add('active'));
  closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });

  // Also open from "Start a Conversation" link
  document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (el.closest('.contact-cta-card')) {
        e.preventDefault();
        overlay.classList.add('active');
      }
    });
  });
})();

// ============================================================
// AI CHATBOT
// ============================================================
(function () {
  const aiChat = document.getElementById('aiChat');
  const fabAI = document.getElementById('fabAI');
  const aiClose = document.getElementById('aiClose');
  const aiBody = document.getElementById('aiBody');
  const aiInput = document.getElementById('aiInput');
  const aiSend = document.getElementById('aiSend');
  const aiChips = document.getElementById('aiChips');

  if (!aiChat || !aiClose || !aiBody || !aiInput || !aiSend || !aiChips) return;

  // Toggle
  if (fabAI) fabAI.addEventListener('click', () => aiChat.classList.toggle('open'));
  aiClose.addEventListener('click', () => aiChat.classList.remove('open'));

  // Quick chips
  aiChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.ai-chip');
    if (chip) {
      const q = chip.getAttribute('data-q');
      handleUserMessage(q);
    }
  });

  // Send
  aiSend.addEventListener('click', () => sendFromInput());
  aiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendFromInput();
  });

  function sendFromInput() {
    const msg = aiInput.value.trim();
    if (!msg) return;
    aiInput.value = '';
    handleUserMessage(msg);
  }

  function handleUserMessage(msg) {
    addMessage(msg, 'user');
    // Show typing
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      const reply = generateReply(msg);
      addMessage(reply, 'bot');
    }, 600 + Math.random() * 600);
  }

  function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${sender}`;
    if (sender === 'bot') {
      div.innerHTML = `<div class="ai-msg-avatar">AI</div><div class="ai-msg-bubble">${text}</div>`;
    } else {
      div.innerHTML = `<div class="ai-msg-bubble">${escapeHtml(text)}</div>`;
    }
    aiBody.appendChild(div);
    aiBody.scrollTop = aiBody.scrollHeight;
    return div;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'ai-msg ai-msg-bot ai-typing';
    div.innerHTML = `<div class="ai-msg-avatar">AI</div><div class="ai-msg-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>`;
    aiBody.appendChild(div);
    aiBody.scrollTop = aiBody.scrollHeight;
    return div;
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ---- AI KNOWLEDGE BASE (defaults, overridden by Firebase) ----
  const KB = {
    name: "Junaid Hafeez Ashrafi",
    title: "SDET & Senior Automation Engineer",
    company: "Ethizo (formerly AppifyTech)",
    email: "junaidhafeez.cs@gmail.com",
    phone: "+92 306 928 7947",
    location: "Lahore, Pakistan",
    linkedin: "https://www.linkedin.com/in/junaidhafeezcs/",
    github: "https://github.com/Mjunaidhafeez",
    kaggle: "https://www.kaggle.com/junaidhafeez",
    yearsQA: "5+",
    yearsTotal: "7+",
    skills: {
      automation: ["Selenium WebDriver", "Cypress", "Playwright", "testRigor", "Postman", "Agentic AI Automation"],
      programming: ["Python", "JavaScript", "Dart", "SQL", "HTML/CSS"],
      frameworks: ["Django", "FastAPI", "Flutter", "REST APIs", "MySQL", "Git", "Jira", "Docker", "CI/CD"],
      domain: ["Healthcare IT", "EHR/EMR Systems", "HIPAA Compliance", "HL7/FHIR", "Patient Portals", "Clinical Workflows"]
    },
    experience: [],
    education: [],
    certifications: ["HIPAA Certified", "Agile/Scrum", "Selenium WebDriver Expert"],
    projects: []
  };

  if (typeof firebase !== 'undefined' && window.initPortfolioFirebase && window.initPortfolioFirebase()) {
    const chatDb = firebase.database();
    const P = 'portfolio/';

    function toArrChat(d) {
      if (!d) return [];
      return Array.isArray(d) ? d : Object.values(d);
    }

    chatDb.ref(P + 'settings').on('value', s => {
      const d = s.val(); if (!d) return;
      if (d.name) KB.name = d.name;
      if (d.title) KB.title = d.title;
      if (d.email) KB.email = d.email;
      if (d.phone) KB.phone = d.phone;
      if (d.location) KB.location = d.location;
      if (d.linkedin) KB.linkedin = d.linkedin;
      if (d.github) KB.github = d.github;
      if (d.kaggle) KB.kaggle = d.kaggle;
    });

    chatDb.ref(P + 'experience').on('value', s => {
      const d = s.val(); if (!d) return;
      KB.experience = toArrChat(d).map(e => ({ role: e.role || '', company: e.company || '', period: e.period || e.dateRange || '' }));
    });

    chatDb.ref(P + 'education').on('value', s => {
      const d = s.val(); if (!d) return;
      KB.education = toArrChat(d).map(e => ({ degree: e.degree || '', school: e.school || '', year: e.years || e.year || '', status: e.badge || '' }));
    });

    chatDb.ref(P + 'certs').on('value', s => {
      const d = s.val(); if (!d) return;
      KB.certifications = toArrChat(d).map(c => c.name || c.title || c);
    });

    chatDb.ref(P + 'projects').on('value', s => {
      const d = s.val(); if (!d) return;
      KB.projects = toArrChat(d).map(p => p.title || p.name || '');
    });

    chatDb.ref(P + 'skills').on('value', s => {
      const d = s.val(); if (!d) return;
      const arr = toArrChat(d);
      KB.skills = {};
      arr.forEach(cat => {
        const key = (cat.category || 'other').toLowerCase().replace(/[^a-z]/g, '');
        let pills = [];
        if (typeof cat.pills === 'string') pills = cat.pills.split(',').map(p => p.trim()).filter(Boolean);
        else if (Array.isArray(cat.pills)) pills = cat.pills;
        KB.skills[key] = pills;
      });
    });

    const kbCustom = {};
    chatDb.ref(P + 'chatbot/kb').on('value', s => {
      const d = s.val(); if (!d) return;
      Object.keys(kbCustom).forEach(k => delete kbCustom[k]);
      toArrChat(d).forEach(entry => {
        if (entry.key && entry.value) kbCustom[entry.key.toLowerCase()] = entry.value;
      });
    });
    window._chatbotCustomKB = kbCustom;
  }

  function generateReply(input) {
    const q = input.toLowerCase();

    if (window._chatbotCustomKB) {
      const customKB = window._chatbotCustomKB;
      for (const key in customKB) {
        if (q.includes(key)) return customKB[key];
      }
    }

    if (/^(hi|hello|hey|salam|assalam|aoa)/.test(q)) {
      return `Hello! I'm ${KB.name.split(' ')[0]}'s AI assistant. I can tell you about his <strong>skills</strong>, <strong>experience</strong>, <strong>education</strong>, <strong>projects</strong>, or how to <strong>contact</strong> him. What would you like to know?`;
    }

    if (/skill|tech|tool|stack|what (does he|can he) (know|do|use)|automation tool|framework/i.test(q)) {
      let skillsHtml = '<strong>Technical Skills:</strong><br><br>';
      Object.keys(KB.skills).forEach(cat => {
        if (KB.skills[cat].length) skillsHtml += '<strong>' + cat.charAt(0).toUpperCase() + cat.slice(1) + ':</strong> ' + KB.skills[cat].join(', ') + '<br><br>';
      });
      return skillsHtml;
    }

    if (/experience|work|job|career|where (does|did) he work|company|ethizo|appifytech|role/i.test(q)) {
      let exp = KB.experience.map(e => `• <strong>${e.role}</strong> at ${e.company} (${e.period})`).join('<br>');
      return `<strong>Work Experience:</strong><br><br>${exp || 'Loading...'}`;
    }

    if (/educat|degree|university|study|school|college|mba|bs|masters|bachelor|darse/i.test(q)) {
      let edu = KB.education.map(e => `• <strong>${e.degree}</strong> — ${e.school} (${e.status || e.year})`).join('<br>');
      return `<strong>Education:</strong><br><br>${edu || 'Loading...'}`;
    }

    if (/contact|email|phone|call|reach|hire|talk|message|connect/i.test(q)) {
      return `<strong>Get in Touch:</strong><br><br>
Email: <a href="mailto:${KB.email}">${KB.email}</a><br>
Phone: <a href="tel:${KB.phone.replace(/[\s\-]/g,'')}">${KB.phone}</a><br>
LinkedIn: <a href="${KB.linkedin}" target="_blank">LinkedIn Profile</a><br>
GitHub: <a href="${KB.github}" target="_blank">GitHub Profile</a><br><br>
Or click the <strong>Message</strong> button to send a message directly!`;
    }

    if (/cv|resume|download|pdf/i.test(q)) {
      return `You can view and download the CV here:<br><br><a href="cv.html" target="_blank"><strong>View / Download CV</strong></a><br><br>Click the link, then use "Save as PDF" to download.`;
    }

    if (/project|portfolio|built|github|repo|work.*built/i.test(q)) {
      let proj = KB.projects.map(p => `• ${p}`).join('<br>');
      return `<strong>Key Projects:</strong><br><br>${proj || 'Loading...'}<br><br>View all on <a href="${KB.github}?tab=repositories" target="_blank">GitHub</a>.`;
    }

    if (/health|ehr|emr|hipaa|medical|hospital|patient|clinical/i.test(q)) {
      return `${KB.name.split(' ')[0]} specializes in <strong>Healthcare IT</strong>:<br><br>
EHR/EMR systems, patient portals, clinical workflows<br>
<strong>HIPAA Certified</strong> — ensuring compliance in all testing<br>
HL7/FHIR standards expertise<br>
Billing modules, prescriptions, encounters validation`;
    }

    if (/certif|hipaa cert|credential/i.test(q)) {
      return `<strong>Certifications:</strong><br><br>${KB.certifications.map(c => `• ${c}`).join('<br>')}`;
    }

    if (/who is|about|tell me about|introduce|summary|overview/i.test(q)) {
      return `<strong>${KB.name}</strong> is a ${KB.title} based in ${KB.location}.<br><br>Specializes in building enterprise test frameworks for HIPAA-compliant healthcare (EHR) systems. Proficient in Selenium, Cypress, Playwright, Python, Django, and FastAPI.`;
    }

    if (/where|location|city|country|based/i.test(q)) {
      return `${KB.name.split(' ')[0]} is based in <strong>${KB.location}</strong>. Open to remote opportunities worldwide.`;
    }

    if (/available|hire|freelance|open|opportunity/i.test(q)) {
      return `Yes! Currently <strong>open to new opportunities</strong>. Reach out at:<br><br>Email: <a href="mailto:${KB.email}">${KB.email}</a><br>Phone: ${KB.phone}<br><br>Or send a message using the Message button!`;
    }

    if (/thank|thanks|thx|appreciate/i.test(q)) {
      return `You're welcome! Feel free to ask anything else, or <a href="mailto:${KB.email}">send an email</a> to start a conversation!`;
    }

    return `I can help you learn about ${KB.name.split(' ')[0]}! Try asking about:<br><br>
• <strong>Skills</strong> — technical expertise<br>
• <strong>Experience</strong> — work history<br>
• <strong>Education</strong> — academic background<br>
• <strong>Projects</strong> — things built<br>
• <strong>Contact</strong> — how to reach out<br>
• <strong>CV</strong> — download resume<br>
• <strong>Healthcare</strong> — EHR domain expertise`;
  }
})();
