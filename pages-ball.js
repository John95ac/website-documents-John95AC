(function() {
  const subfolders = ['NEWS_MCM', 'Race_Menu_Overlay_to_SlaveTats_Helper', 'OSoundtracks_Expansion_Sounds_SA', 'OBody_NG_Preset_Distribution_Assistant_NG', 'Tools'];
  const isInSubfolder = subfolders.some(folder => window.location.pathname.includes('/' + folder + '/'));
  const prefix = isInSubfolder ? '../' : '';

  const projects = [
    {
      name: 'Home',
      emoji: '🏠',
      color: '#6366f1',
      url: prefix + 'index.html',
      desc: 'Main page'
    },
    {
      name: 'Race Menu Overlay',
      emoji: '🎭',
      color: '#8b5cf6',
      url: prefix + 'Race_Menu_Overlay_to_SlaveTats_Helper/index.html',
      desc: 'Overlay helper'
    },
    {
      name: 'OSoundtracks SA',
      emoji: '🎵',
      color: '#3b82f6',
      url: prefix + 'OSoundtracks_Expansion_Sounds_SA/index.html',
      desc: 'Soundtracks mod'
    },
    {
      name: 'OBody NG PDA',
      emoji: '👤',
      color: '#14b8a6',
      url: prefix + 'OBody_NG_Preset_Distribution_Assistant_NG/index.html',
      desc: 'Body preset assistant'
    },
    {
      name: 'NEWS',
      emoji: '📰',
      color: '#10b981',
      url: prefix + 'NEWS_MCM/index.html',
      desc: 'News & updates'
    }
  ];

  const tools = [
    {
      name: 'Dice',
      emoji: '🎲',
      color: '#f59e0b',
      url: prefix + 'Tools/dado.html',
      desc: 'Dice Generator and Play'
    },
    {
      name: 'Grim Generator',
      emoji: '🎬',
      color: '#10b981',
      url: prefix + 'Tools/Grim_Generator_Video.html',
      desc: 'Video for Prisma'
    },
    {
      name: 'Pachinko',
      emoji: '🎰',
      color: '#ec4899',
      url: prefix + 'Tools/Pachinko.html',
      desc: 'Pachinko Generator and Play'
    }
  ];

  function createPagesStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #pages-ball {
        position: fixed;
        top: 100px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        border-radius: 50%;
        cursor: pointer;
        z-index: 9997;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        transition: all 0.6s cubic-bezier(0.25,0.46,0.45,0.94);
        box-shadow: 0 4px 20px rgba(99,102,241,0.4);
        border: 2px solid rgba(255,255,255,0.3);
      }

      #pages-ball.near {
        animation: pagesGlow 1.5s ease-in-out infinite;
      }

      @keyframes pagesGlow {
        0%, 100% { box-shadow: 0 4px 20px rgba(99,102,241,0.4); }
        50% { box-shadow: 0 4px 30px rgba(99,102,241,0.9), 0 0 15px rgba(99,102,241,0.6), 0 0 30px rgba(99,102,241,0.3); }
      }

      #pages-ball:hover {
        background: linear-gradient(135deg, #4f46e5, #3730a3);
        transform: scale(1.15);
        box-shadow: 0 8px 35px rgba(99,102,241,0.7);
      }

      #pages-panel {
        position: fixed;
        top: 150px;
        right: 20px;
        background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(30,30,30,0.95));
        border-radius: 15px;
        z-index: 10000;
        display: none;
        min-width: 320px;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        overflow: hidden;
        transition: all 0.3s ease;
      }

      #pages-panel.show {
        display: block;
      }

      .pages-header {
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: white;
        padding: 12px 15px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .pages-header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        animation: pagesHeaderShine 3s infinite;
      }

      @keyframes pagesHeaderShine {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .pages-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        position: relative;
        z-index: 1;
      }

      .pages-section-label {
        padding: 8px 15px;
        font-size: 11px;
        font-weight: 600;
        color: rgba(255,255,255,0.7);
        background: rgba(255,255,255,0.05);
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .pages-grid {
        padding: 10px 15px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .pages-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        margin: 5px 15px;
      }

      .page-item {
        display: flex;
        align-items: center;
        padding: 10px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.1);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        text-decoration: none;
        color: inherit;
      }

      .page-item:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      }

      .page-emoji {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border-radius: 6px;
        margin-right: 8px;
        flex-shrink: 0;
      }

      .page-info {
        flex: 1;
        min-width: 0;
      }

      .page-name {
        font-size: 12px;
        font-weight: 600;
        margin: 0 0 1px 0;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .page-desc {
        font-size: 10px;
        color: rgba(255,255,255,0.6);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .pages-footer {
        background: rgba(0,0,0,0.2);
        padding: 8px 15px;
        text-align: center;
        border-top: 1px solid rgba(255,255,255,0.1);
      }

      .pages-footer small {
        color: rgba(255,255,255,0.5);
        font-size: 10px;
      }

      .pages-footer-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }

      .pages-footer img {
        width: 14px;
        height: 14px;
        object-fit: contain;
      }

      @media (max-width: 768px) {
        #pages-panel {
          right: 10px;
          min-width: 280px;
        }
        #pages-ball {
          width: 45px;
          height: 45px;
          font-size: 20px;
          top: 80px;
        }
        .pages-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createPagesElements() {
    if (document.getElementById('pages-ball')) return;

    const ball = document.createElement('div');
    ball.id = 'pages-ball';
    ball.innerHTML = '🔗';
    ball.title = 'Project Pages';
    document.body.appendChild(ball);

    const panel = document.createElement('div');
    panel.id = 'pages-panel';
    panel.innerHTML = `
      <div class="pages-header">
        <h3>🔗 Quick Links</h3>
      </div>
      <div class="pages-section-label">Projects</div>
      <div class="pages-grid" id="projects-grid"></div>
      <div class="pages-divider"></div>
      <div class="pages-section-label">Tools</div>
      <div class="pages-grid" id="tools-grid"></div>
      <div class="pages-footer" id="pages-footer"></div>
    `;
    document.body.appendChild(panel);

    const footerContent = document.getElementById('pages-footer');
    footerContent.innerHTML = `
      <div class="pages-footer-content">
        <img src="${prefix}Data/013.gif" alt="cat">
        <small>Navigate between pages like a cat</small>
      </div>
    `;

    const projectsGrid = document.getElementById('projects-grid');
    projects.forEach(page => {
      const item = document.createElement('a');
      item.href = page.url;
      item.className = 'page-item';
      item.innerHTML = `
        <div class="page-emoji" style="background: ${page.color}20; border: 1px solid ${page.color}50;">
          ${page.emoji}
        </div>
        <div class="page-info">
          <h4 class="page-name">${page.name}</h4>
          <p class="page-desc">${page.desc}</p>
        </div>
      `;
      projectsGrid.appendChild(item);
    });

    const toolsGrid = document.getElementById('tools-grid');
    tools.forEach(tool => {
      const item = document.createElement('a');
      item.href = tool.url;
      item.className = 'page-item';
      item.innerHTML = `
        <div class="page-emoji" style="background: ${tool.color}20; border: 1px solid ${tool.color}50;">
          ${tool.emoji}
        </div>
        <div class="page-info">
          <h4 class="page-name">${tool.name}</h4>
          <p class="page-desc">${tool.desc}</p>
        </div>
      `;
      toolsGrid.appendChild(item);
    });

    createPagesStyles();
    initializePagesEvents();
  }

  function initializePagesEvents() {
    const $ball = document.getElementById('pages-ball');
    const $panel = document.getElementById('pages-panel');

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

    function animateItems() {
      const items = $panel.querySelectorAll('.page-item');
      items.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(15px)';
        setTimeout(() => {
          item.style.transition = 'all 0.5s cubic-bezier(0.25,0.46,0.45,0.94)';
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, index * 80 + 200);
      });
    }

    $ball.onmouseenter = () => { $panel.classList.add('show'); animateItems(); };
    $ball.onmouseleave = () => { setTimeout(() => { if (!$panel.matches(':hover')) $panel.classList.remove('show'); }, 200); };
    $panel.onmouseenter = () => {};
    $panel.onmouseleave = () => { $panel.classList.remove('show'); };
    document.addEventListener('click', (e) => { if (!e.target.closest('#pages-ball, #pages-panel')) $panel.classList.remove('show'); });
  }

  window.showPagesBall = function() {
    const ball = document.getElementById('pages-ball');
    if (ball) ball.style.display = 'flex';
  };

  window.hidePagesBall = function() {
    const ball = document.getElementById('pages-ball');
    const panel = document.getElementById('pages-panel');
    if (ball) ball.style.display = 'none';
    if (panel) panel.classList.remove('show');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPagesElements);
  } else {
    createPagesElements();
  }
})();