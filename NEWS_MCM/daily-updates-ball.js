(function() {
  const DAILY_JSON_URL = 'https://john95ac.github.io/website-documents-John95AC/NEWS_MCM/Daily_Updates/daily-message.json';
  const SPONSORS_JSON_URL = 'https://john95ac.github.io/website-documents-John95AC/NEWS_MCM/Sponsorship%20Data/sponsors-data.json';

  let dailyData = null;
  let imageRotationInterval = null;
  let sponsorsData = null;
  let sponsorsOpen = false;

  const DAILY_IMAGES = [
    '../Data/001.png',
    '../Data/002.png',
    '../Data/003.png',
    '../Data/005.png',
    '../Data/006.png',
    '../Data/007.png',
    '../Data/009.png',
    '../Data/010.png',
    '../Data/011.png',
    '../Data/012.gif',
    '../Data/013.gif',
    '../Data/015.gif'
  ];

  function getRandomImage() {
    return DAILY_IMAGES[Math.floor(Math.random() * DAILY_IMAGES.length)];
  }

  function applyImageSize(imgEl, src) {
    if (src.includes('013.gif')) {
      imgEl.style.width = '65%';
      imgEl.style.height = '65%';
      imgEl.style.objectFit = 'contain';
    } else if (src.includes('003.png')) {
      imgEl.style.width = '50%';
      imgEl.style.height = '50%';
      imgEl.style.objectFit = 'contain';
    } else {
      imgEl.style.width = '100%';
      imgEl.style.height = '100%';
      imgEl.style.objectFit = 'cover';
    }
  }

  function startImageRotation() {
    if (imageRotationInterval) clearInterval(imageRotationInterval);
    const imgEl = document.getElementById('daily-random-img');
    if (!imgEl) return;
    imageRotationInterval = setInterval(() => {
      const nextSrc = getRandomImage();
      imgEl.style.opacity = '0';
      setTimeout(() => {
        imgEl.src = nextSrc;
        applyImageSize(imgEl, nextSrc);
        imgEl.style.opacity = '1';
      }, 300);
    }, 15000);
  }

  async function loadDailyData() {
    if (typeof dailyMessageData !== 'undefined') {
      dailyData = dailyMessageData;
      updatePanelContent();
      return;
    }
    try {
      const response = await fetch(DAILY_JSON_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('Network response was not ok');
      dailyData = await response.json();
      updatePanelContent();
    } catch (err) {
      console.error('Failed to load daily updates:', err);
      dailyData = { date: new Date().toISOString().split('T')[0], message: 'No message available', tags: [], priority: 'normal' };
      updatePanelContent();
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }

  function createTagsHTML(tags) {
    if (!tags || tags.length === 0) return '';
    return tags.slice(0, 5).map(tag => `<span class="daily-tag">${tag}</span>`).join('');
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = minutes < 10 ? '0' + minutes : minutes;
    return `${h}:${m} ${ampm}`;
  }

  function updatePanelContent() {
    const messageEl = document.getElementById('daily-message-text');
    const dateEl = document.getElementById('daily-date');
    const tagsEl = document.getElementById('daily-tags');
    const detailsEl = document.getElementById('daily-details');

    if (messageEl) messageEl.textContent = dailyData.message || 'No message available';
    if (dateEl) dateEl.textContent = formatDate(dailyData.date);
    if (tagsEl) tagsEl.innerHTML = createTagsHTML(dailyData.tags);
    if (detailsEl) {
      const timeStr = formatTime(dailyData.updated_at);
      let footerText = timeStr ? `Updated at ${timeStr}` : '';
      const p = (dailyData.priority || '').toLowerCase();
      if (p === 'high') {
        footerText += ' <span class="daily-hot-badge">🔥 BIG NEWS</span>';
      } else if (p === 'normal') {
        footerText += ' <span class="daily-normal-badge">Normal Day</span>';
      }
      detailsEl.innerHTML = footerText;
    }
  }

  async function loadSponsorsData() {
    try {
      const response = await fetch(SPONSORS_JSON_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('Network response was not ok');
      sponsorsData = await response.json();
      renderSponsorsPanel();
    } catch (err) {
      console.error('Failed to load sponsors data:', err);
    }
  }

  function renderSponsorsPanel() {
    var container = document.querySelector('.spon-list');
    if (!sponsorsData || !container) return;

    var tiers = sponsorsData.patreon.tiers;
    var tierOrder = ['level4', 'level2', 'level1'];
    var tierCSS = { level4: 'spon-r4', level2: 'spon-r2', level1: 'spon-r1' };

    container.innerHTML = '';

    tierOrder.forEach(function(tk) {
      var tier = tiers[tk];
      var div = document.createElement('div');
      div.className = 'spon-group ' + tierCSS[tk];
      var h5 = document.createElement('h5');
      h5.className = 'spon-title';
      h5.textContent = tier.name + ' (' + tier.count + ')';
      div.appendChild(h5);
      var namesDiv = document.createElement('div');
      namesDiv.className = 'spon-names';
      tier.patrons.forEach(function(p) {
        var span = document.createElement('span');
         span.textContent = p.name;
         span.setAttribute('data-tip', 'Since: ' + p.since);
        namesDiv.appendChild(span);
      });
      div.appendChild(namesDiv);
      container.appendChild(div);
    });

    if (sponsorsData.kofi && sponsorsData.kofi.supporters) {
      var kofiDiv = document.createElement('div');
      kofiDiv.className = 'spon-group spon-kofi';
      var kofiH5 = document.createElement('h5');
      kofiH5.className = 'spon-title';
      kofiH5.textContent = 'Ko-fi Supporters (' + sponsorsData.kofi.supporters.length + ')';
      kofiDiv.appendChild(kofiH5);
      var kofiNames = document.createElement('div');
      kofiNames.className = 'spon-names';
      sponsorsData.kofi.supporters.forEach(function(s) {
        var span = document.createElement('span');
         span.textContent = s.name;
         span.setAttribute('data-tip', s.date);
        kofiNames.appendChild(span);
      });
      kofiDiv.appendChild(kofiNames);
       container.appendChild(kofiDiv);
     }

    if (sponsorsData.beta_testers && sponsorsData.beta_testers.testers) {
      var betaDiv = document.createElement('div');
      betaDiv.className = 'spon-group spon-beta';
      var betaH5 = document.createElement('h5');
      betaH5.className = 'spon-title';
      betaH5.textContent = sponsorsData.beta_testers.title + ' (' + sponsorsData.beta_testers.testers.length + ')';
      betaDiv.appendChild(betaH5);
      var betaNames = document.createElement('div');
      betaNames.className = 'spon-names';
      sponsorsData.beta_testers.testers.forEach(function(t) {
        var span = document.createElement('span');
        span.textContent = t.name;
        span.setAttribute('data-tip', t.role);
        betaNames.appendChild(span);
      });
      betaDiv.appendChild(betaNames);
      container.appendChild(betaDiv);
    }

     if (tiers.free) {
      var freeDiv = document.createElement('div');
      freeDiv.className = 'spon-group spon-free';
      var freeH5 = document.createElement('h5');
      freeH5.className = 'spon-title';
      freeH5.textContent = tiers.free.name + ' (' + tiers.free.count + ')';
      freeDiv.appendChild(freeH5);
      var freeNames = document.createElement('div');
      freeNames.className = 'spon-names';
      tiers.free.patrons.forEach(function(p) {
        var span = document.createElement('span');
        span.textContent = p.name;
        span.setAttribute('data-tip', 'Since: ' + p.since);
        freeNames.appendChild(span);
      });
      freeDiv.appendChild(freeNames);
      container.appendChild(freeDiv);
    }

    if (tiers.former) {
      var formerDiv = document.createElement('div');
      formerDiv.className = 'spon-group spon-former';
      var formerH5 = document.createElement('h5');
      formerH5.className = 'spon-title';
      formerH5.textContent = tiers.former.name + ' (' + tiers.former.count + ')';
      formerDiv.appendChild(formerH5);
      var formerNames = document.createElement('div');
      formerNames.className = 'spon-names';
      tiers.former.patrons.forEach(function(p) {
        var span = document.createElement('span');
        span.textContent = p.name;
        span.setAttribute('data-tip', p.from + ' → ' + p.to);
        formerNames.appendChild(span);
      });
      formerDiv.appendChild(formerNames);
       container.appendChild(formerDiv);
     }
  }

  function positionSponsorsPanel() {
    var mainPanel = document.getElementById('daily-updates-panel');
    var sponPanel = document.getElementById('daily-sponsors-panel');
    if (!mainPanel || !sponPanel) return;
    var rect = mainPanel.getBoundingClientRect();
    sponPanel.style.top = rect.top + 'px';
    sponPanel.style.right = (window.innerWidth - rect.left - 6) + 'px';
    sponPanel.style.height = rect.height + 'px';
  }

  function toggleSponsorsPanel() {
    var sponPanel = document.getElementById('daily-sponsors-panel');
    if (!sponPanel) return;
    sponsorsOpen = !sponsorsOpen;
    if (sponsorsOpen) {
      positionSponsorsPanel();
      sponPanel.classList.add('show');
      if (!sponsorsData) loadSponsorsData();
    } else {
      sponPanel.classList.remove('show');
    }
  }

  function createDailyUpdatesStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #daily-updates-ball {
        position: fixed; bottom: 95px; right: 20px; width: 40px; height: 40px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 50%; cursor: pointer; z-index: 9997;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 16px;
        transition: all 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
        box-shadow: 0 4px 20px rgba(16,185,129,0.4);
        border: 2px solid rgba(255,255,255,0.3);
      }
      #daily-updates-ball.near {
        animation: dailyGlow 1.5s ease-in-out infinite;
      }
      @keyframes dailyGlow {
        0%, 100% { box-shadow: 0 4px 20px rgba(16,185,129,0.4); }
        50% { box-shadow: 0 4px 30px rgba(16,185,129,0.9), 0 0 15px rgba(16,185,129,0.6), 0 0 30px rgba(16,185,129,0.3); }
      }
      #daily-updates-ball:hover {
        background: linear-gradient(135deg, #059669, #047857);
        transform: scale(1.15);
        box-shadow: 0 8px 35px rgba(16,185,129,0.7);
      }
      #daily-updates-ball.has-updates {
        animation: dailyPulse 2s infinite;
      }
      @keyframes dailyPulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(16,185,129,0.4); }
        50% { box-shadow: 0 4px 30px rgba(16,185,129,0.8), 0 0 20px rgba(16,185,129,0.6); }
      }
      #daily-updates-panel {
        position: fixed; bottom: 145px; right: 20px;
        background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(30,30,30,0.95));
        border-radius: 15px; z-index: 10000; display: none;
        min-width: 380px; max-width: 440px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);
        overflow: hidden; transition: all 0.3s ease;
      }
      #daily-updates-panel.show { display: block; }
      .daily-updates-header {
        background: linear-gradient(135deg, #10b981, #059669); color: white;
        padding: 20px; text-align: center; position: relative; overflow: hidden;
      }
      .daily-updates-header::before {
        content: ''; position: absolute; top: -50%; left: -50%;
        width: 200%; height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        animation: dailyHeaderShine 3s infinite;
      }
      @keyframes dailyHeaderShine { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
      .daily-updates-header h3 { margin: 0 0 8px 0; font-size: 18px; font-weight: 700; position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .daily-title-icon { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; }
      .daily-updates-header p { margin: 0; font-size: 14px; opacity: 0.9; position: relative; z-index: 1; }
      .daily-updates-content {
        padding: 25px 20px;
        max-height: 400px;
        overflow-y: auto;
      }
      .daily-date {
        font-size: 11px;
        color: rgba(255,255,255,0.9);
        margin-bottom: 10px;
        text-align: center;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        font-weight: 300;
        display: inline-block;
        padding: 3px 12px;
        background: rgba(16,185,129,0.3);
        border: 1px solid rgba(16,185,129,0.5);
        border-radius: 20px;
      }
      .daily-content-row {
        display: flex;
        gap: 12px;
        align-items: stretch;
      }
      .daily-content-text {
        flex: 2;
        min-width: 0;
      }
      .daily-content-image {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        overflow: hidden;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
      }
      .daily-content-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
        transition: opacity 0.3s ease;
      }
      .daily-message {
        font-size: 14px;
        line-height: 1.6;
        color: rgba(255,255,255,0.9);
        margin-bottom: 15px;
        padding: 15px;
        background: rgba(255,255,255,0.05);
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.1);
        max-height: 112px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(16,185,129,0.4) transparent;
      }
      .daily-message::-webkit-scrollbar {
        width: 4px;
      }
      .daily-message::-webkit-scrollbar-track {
        background: transparent;
      }
      .daily-message::-webkit-scrollbar-thumb {
        background: rgba(16,185,129,0.4);
        border-radius: 2px;
      }
      .daily-message::-webkit-scrollbar-thumb:hover {
        background: rgba(16,185,129,0.7);
      }
      .daily-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 0;
      }
      .daily-tag {
        display: inline-block;
        padding: 2px 7px;
        background: rgba(16,185,129,0.2);
        border: 1px solid rgba(16,185,129,0.4);
        border-radius: 10px;
        font-size: 9px;
        color: #10b981;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .daily-tag:hover {
        background: rgba(16,185,129,0.3);
        border-color: rgba(16,185,129,0.6);
      }
      .daily-updates-footer {
        background: rgba(0,0,0,0.2);
        padding: 15px 20px;
        text-align: center;
        border-top: 1px solid rgba(255,255,255,0.1);
      }
      .daily-updates-footer small {
        color: rgba(255,255,255,0.6);
        font-style: italic;
        font-size: 11px;
      }
      .daily-hot-badge {
        display: inline-block;
        padding: 1px 8px;
        margin-left: 6px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        border-radius: 8px;
        font-size: 9px;
        font-weight: 700;
        font-style: normal;
        color: #000;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        vertical-align: middle;
      }
      .daily-normal-badge {
        display: inline-block;
        padding: 1px 8px;
        margin-left: 6px;
        background: linear-gradient(135deg, #22d3ee, #06b6d4);
        border-radius: 8px;
        font-size: 9px;
        font-weight: 700;
        font-style: normal;
        color: #000;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        vertical-align: middle;
      }
      .daily-thank-btn {
        position: absolute; top: 50%; left: 12px; z-index: 5;
        transform: translateY(-50%);
        display: flex; align-items: center; gap: 6px;
        background: rgba(255,255,255,0.12); border: none;
        border-radius: 20px; padding: 6px 12px; cursor: pointer;
        color: white; font-family: inherit;
        transition: all 0.25s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .daily-thank-btn:hover {
        background: rgba(255,255,255,0.25);
        box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        transform: translateY(-50%) scale(1.04);
      }
      .daily-thank-btn .tbtn-icon { font-size: 15px; line-height: 1; }
      .daily-thank-btn .tbtn-text { font-size: 9px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; }
      #daily-sponsors-panel {
        position: fixed;
        background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(30,30,30,0.95));
        border-radius: 15px; z-index: 10000;
        width: 440px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);
        overflow: hidden;
        transform: translateX(20px); opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        pointer-events: none;
      }
      #daily-sponsors-panel.show {
        transform: translateX(0); opacity: 1;
        pointer-events: auto;
      }
      .spon-body {
        padding: 10px 12px; overflow-y: auto;
        max-height: 100%;
        scrollbar-width: thin; scrollbar-color: rgba(124,58,237,0.4) transparent;
      }
      .spon-intro {
        font-size: 13px; line-height: 1.6; color: rgba(200,200,210,0.85);
        margin: 0 0 10px 0; padding: 10px 12px;
        background: rgba(255,255,255,0.05); border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .spon-main-title {
        margin: 0 0 8px 0; font-size: 12px; font-weight: 700;
        letter-spacing: 0.5px; text-transform: uppercase;
         color: #22d3ee; padding: 10px 12px 0 12px;
      }
      .spon-group { margin: 8px 0; padding: 8px 10px; border-radius: 6px; }
      .spon-title { margin: 0 0 5px 0; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
      .spon-r4 { background: rgba(212,175,55,0.10); border: 1px solid rgba(212,175,55,0.25); }
      .spon-r4 .spon-title { color: #fff7d6; }
      .spon-r2 { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); }
      .spon-r2 .spon-title { color: #d1fae5; }
      .spon-r1 { background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.2); }
      .spon-r1 .spon-title { color: #e0f6ff; }
      .spon-kofi { background: rgba(91,192,235,0.08); border: 1px solid rgba(91,192,235,0.2); }
      .spon-kofi .spon-title { color: #e0f2ff; }
      .spon-beta { background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2); }
      .spon-beta .spon-title { color: #c4b5fd; }
      .spon-free { background: rgba(107,114,128,0.06); border: 1px solid rgba(107,114,128,0.18); }
      .spon-free .spon-title { color: #d1d5db; }
      .spon-former { background: rgba(230,213,184,0.06); border: 1px solid rgba(230,213,184,0.18); }
      .spon-former .spon-title { color: #fff4e3; }
      .spon-names { display: flex; flex-wrap: wrap; gap: 5px; }
      .spon-names span { padding: 3px 8px; border-radius: 4px; font-size: 11px; position: relative; cursor: default; }
      .spon-r4 .spon-names span { background: rgba(212,175,55,0.12); border: 1px solid rgba(212,175,55,0.25); color: #fff7d6; }
      .spon-r2 .spon-names span { background: rgba(34,197,94,0.10); border: 1px solid rgba(34,197,94,0.2); color: #d1fae5; }
      .spon-r1 .spon-names span { background: rgba(56,189,248,0.10); border: 1px solid rgba(56,189,248,0.2); color: #e0f6ff; }
      .spon-kofi .spon-names span { background: rgba(91,192,235,0.10); border: 1px solid rgba(91,192,235,0.2); color: #e0f2ff; }
      .spon-beta .spon-names span { background: rgba(139,92,246,0.10); border: 1px solid rgba(139,92,246,0.2); color: #c4b5fd; }
      .spon-free .spon-names span { background: rgba(107,114,128,0.08); border: 1px solid rgba(107,114,128,0.15); color: #d1d5db; }
      .spon-former .spon-names span { background: rgba(230,213,184,0.08); border: 1px solid rgba(230,213,184,0.15); color: #fff4e3; }
      .spon-names span[data-tip]::after {
        content: attr(data-tip); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
        padding: 4px 8px; border-radius: 4px; font-size: 10px; white-space: pre;
        background: rgba(0,0,0,0.95); border: 1px solid rgba(255,255,255,0.2);
        color: #fff; opacity: 0; pointer-events: none; transition: opacity 0.2s; z-index: 10001;
      }
      .spon-names span[data-tip]:hover::after { opacity: 1; }
      @media (max-width: 768px) {
        #daily-updates-panel { right: 10px; left: 10px; min-width: auto; max-width: none; }
        #daily-updates-ball { width: 45px; height: 45px; font-size: 20px; }
      }
    `;
    document.head.appendChild(style);
  }

  function initializeDailyUpdatesEvents() {
    const $ball = document.getElementById('daily-updates-ball');
    const $panel = document.getElementById('daily-updates-panel');

    let isNear = false;
    const PROXIMITY_RADIUS = 180;

    function getDistanceToBall(mx, my) {
      const rect = $ball.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
    }

    document.addEventListener('mousemove', (e) => {
      if ($ball.style.display === 'none') return;
      const dist = getDistanceToBall(e.clientX, e.clientY);
      if (dist <= PROXIMITY_RADIUS && !isNear) {
        isNear = true;
        $ball.classList.add('near');
      } else if (dist > PROXIMITY_RADIUS + 20 && isNear && !$panel.classList.contains('show')) {
        isNear = false;
        $ball.classList.remove('near');
      }
    });

    function animateContent() {
      const elements = $panel.querySelectorAll('.daily-message, .daily-tag, .daily-updates-footer');
      elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(15px)';
        setTimeout(() => {
          el.style.transition = 'all 0.5s cubic-bezier(0.25,0.46,0.45,0.94)';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, index * 100 + 200);
      });
    }

    $ball.onmouseenter = () => { $panel.classList.add('show'); animateContent(); };
    $ball.onmouseleave = () => { setTimeout(() => { if (!$panel.matches(':hover') && !document.getElementById('daily-sponsors-panel')?.matches(':hover')) $panel.classList.remove('show'); }, 200); };
    $panel.onmouseenter = () => {};
    $panel.onmouseleave = () => { setTimeout(() => { var sp = document.getElementById('daily-sponsors-panel'); if (!sp || !sp.matches(':hover')) $panel.classList.remove('show'); }, 300); };
    var sponPanelEl2 = document.getElementById('daily-sponsors-panel');
    if (sponPanelEl2) {
      sponPanelEl2.addEventListener('mouseenter', function() {});
      sponPanelEl2.addEventListener('mouseleave', function() {
        setTimeout(function() { if (!$panel.matches(':hover')) { if (sponsorsOpen) toggleSponsorsPanel(); $panel.classList.remove('show'); } }, 300);
      });
    }
    document.addEventListener('click', (e) => { if (!e.target.closest('#daily-updates-ball, #daily-updates-panel, #daily-sponsors-panel, #daily-thank-btn')) { $panel.classList.remove('show'); if (sponsorsOpen) toggleSponsorsPanel(); } });

    var thankBtn = document.getElementById('daily-thank-btn');
    if (thankBtn) {
      thankBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSponsorsPanel();
      });
    }
  }

  function createDailyUpdatesElements() {
    if (document.getElementById('daily-updates-ball')) return;

    const ball = document.createElement('div');
    ball.id = 'daily-updates-ball';
    ball.innerHTML = '📰';
    ball.title = 'Daily Updates';
    document.body.appendChild(ball);

    const panel = document.createElement('div');
    panel.id = 'daily-updates-panel';
    panel.innerHTML = `
      <div class="daily-updates-header">
        <button id="daily-thank-btn" class="daily-thank-btn" title="View Sponsors">
          <span class="tbtn-icon">🙏</span>
          <span class="tbtn-text">Thank You</span>
        </button>
        <h3 id="daily-title">📰 Daily News <img src="../Data/003.png" class="daily-title-icon" alt=""></h3>
        <p id="daily-date" class="daily-date">Loading...</p>
      </div>
      <div class="daily-updates-content">
        <div class="daily-content-row">
          <div class="daily-content-text">
            <div id="daily-message-text" class="daily-message">Loading daily updates...</div>
            <div id="daily-tags" class="daily-tags"></div>
          </div>
          <div class="daily-content-image">
            <img id="daily-random-img" src="../Data/001.png" alt="">
          </div>
        </div>
      </div>
      <div class="daily-updates-footer">
        <small id="daily-details">🔄 Updates daily</small>
      </div>
    `;
    document.body.appendChild(panel);

    var sponPanel = document.createElement('div');
    sponPanel.id = 'daily-sponsors-panel';
    sponPanel.innerHTML = '<div class="spon-body"><h5 class="spon-main-title">Sponsors, Donations, Beta Testers and Followers</h5><p class="spon-intro">Thank you very much to all my patrons and the people who altruistically support me so I can continue with mod projects for Skyrim, manuals for new mods, and robotics. Without you, I wouldn\'t have all the motivation. That drive gives me the strength to keep going, since I like to keep my word, so even if it takes me time to make the mods, I\'ll eventually do them, and you believe in me. Thank you very much. 🐈</p><div class="spon-list"></div></div>';
    document.body.appendChild(sponPanel);

    const imgEl = document.getElementById('daily-random-img');
    if (imgEl) {
      const initialSrc = getRandomImage();
      imgEl.src = initialSrc;
      applyImageSize(imgEl, initialSrc);
    }

    createDailyUpdatesStyles();
    loadDailyData();
    initializeDailyUpdatesEvents();
    startImageRotation();
  }

  window.showDailyUpdatesBall = function() {
    const ball = document.getElementById('daily-updates-ball');
    const panel = document.getElementById('daily-updates-panel');
    if (ball) ball.style.display = 'flex';
  };

  window.hideDailyUpdatesBall = function() {
    const ball = document.getElementById('daily-updates-ball');
    const panel = document.getElementById('daily-updates-panel');
    if (ball) ball.style.display = 'none';
    if (panel) panel.classList.remove('show');
  };

  window.isDailyUpdatesBallVisible = function() {
    const ball = document.getElementById('daily-updates-ball');
    return ball && ball.style.display !== 'none';
  };

  window.refreshDailyUpdates = function() {
    loadDailyData();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createDailyUpdatesElements);
  } else {
    createDailyUpdatesElements();
  }
})();