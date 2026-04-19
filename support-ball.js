(function() {
  const supportLinks = [
    {
      name: 'Ko-fi',
      image: 'images/support_me_on_kofi_badge_beige.png',
      url: 'https://ko-fi.com/john95ac',
      alt: 'Support me on Ko-fi'
    },
    {
      name: 'Patreon',
      image: 'images/support_me_on_Patrion_badge_red.png',
      url: 'https://www.patreon.com/John95ac',
      alt: 'Support me on Patreon'
    }
  ];

  const storageKey = 'supportBallState';
  const expandedKey = 'supportBallExpanded';

  function createSupportElements() {
    if (document.getElementById('support-ball')) return;

    const ball = document.createElement('div');
    ball.id = 'support-ball';
    ball.innerHTML = '💝';
    ball.title = 'Support the Developer';
    document.body.appendChild(ball);

    const panel = document.createElement('div');
    panel.id = 'support-panel';
    panel.innerHTML = `
      <div class="support-header">
        <h3>💖 Support the Developer</h3>
        <p>Help keep mods updated and participate in future decisions, plus in the long term be part of a big project 🤖</p>
      </div>
      <div class="support-links" id="support-links">
      </div>
      <div class="support-footer">
        <small>❤️ Your contributions are greatly appreciated, helping to continue and achieve something bigger in the future</small>
      </div>
    `;
    document.body.appendChild(panel);

    createSupportStyles();
    createSupportLinks();
    initializeSupportEvents();
  }

  function createSupportStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #support-ball {
        position: fixed;
        bottom: 15px;
        right: 20px;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        box-shadow: 0 4px 20px rgba(255, 107, 107, 0.4);
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
      
      #support-ball:hover {
        background: linear-gradient(135deg, #ff5252, #d32f2f);
        transform: scale(1.15);
        box-shadow: 0 8px 35px rgba(255, 107, 107, 0.7);
      }

      #support-panel {
        position: fixed;
        bottom: 55px;
        right: 20px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(30, 30, 30, 0.95));
        border-radius: 15px;
        z-index: 10000;
        display: none;
        min-width: 280px;
        max-width: 350px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        overflow: hidden;
        transition: all 0.3s ease;
      }

      #support-panel.show {
        display: block;
      }

      .support-header {
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        color: white;
        padding: 20px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .support-header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        animation: supportHeaderShine 3s infinite;
      }

      @keyframes supportHeaderShine {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .support-header h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 700;
        position: relative;
        z-index: 1;
      }

      .support-header p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
        position: relative;
        z-index: 1;
      }

      .support-links {
        padding: 25px 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .support-link {
        display: flex;
        align-items: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-decoration: none;
        color: inherit;
        position: relative;
        overflow: hidden;
      }

      .support-link::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s;
      }

      .support-link:hover::before {
        left: 100%;
      }

      .support-link:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }

      .support-link img {
        width: 60px;
        height: 30px;
        object-fit: contain;
        border-radius: 6px;
        margin-right: 15px;
        transition: transform 0.3s ease;
      }

      .support-link:hover img {
        transform: scale(1.05);
      }

      .support-link-info {
        flex: 1;
      }

      .support-link-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 4px 0;
        color: #fff;
      }

      .support-link-desc {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
      }

      .support-link-icon {
        font-size: 20px;
        color: rgba(255, 255, 255, 0.5);
        transition: transform 0.3s ease;
      }

      .support-link:hover .support-link-icon {
        transform: translateX(3px);
        color: #ff6b6b;
      }

      .support-footer {
        background: rgba(0, 0, 0, 0.2);
        padding: 15px 20px;
        text-align: center;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .support-footer small {
        color: rgba(255, 255, 255, 0.6);
        font-style: italic;
      }

      @media (max-width: 768px) {
        #support-panel {
          right: 10px;
          left: 10px;
          min-width: auto;
          max-width: none;
        }
        
        #support-ball {
          width: 45px;
          height: 45px;
          font-size: 20px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createSupportLinks() {
    const linksContainer = document.getElementById('support-links');
    linksContainer.innerHTML = '';

    supportLinks.forEach((link, index) => {
      const linkElement = document.createElement('a');
      linkElement.href = link.url;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener noreferrer';
      linkElement.className = 'support-link';
      linkElement.style.animationDelay = `${index * 0.1}s`;
      
      linkElement.innerHTML = `
        <img src="${link.image}" alt="${link.alt}" loading="lazy">
        <div class="support-link-info">
          <h4 class="support-link-title">${link.name}</h4>
          <p class="support-link-desc">Click to support on ${link.name}</p>
        </div>
        <div class="support-link-icon">→</div>
      `;
      
      linksContainer.appendChild(linkElement);
    });
  }

  function initializeSupportEvents() {
    const $ball = document.getElementById('support-ball');
    const $panel = document.getElementById('support-panel');

    function animateLinks() {
      const links = $panel.querySelectorAll('.support-link');
      links.forEach((link, index) => {
        link.style.opacity = '0';
        link.style.transform = 'translateY(20px)';
        setTimeout(() => {
          link.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          link.style.opacity = '1';
          link.style.transform = 'translateY(0)';
        }, index * 150 + 300);
      });
    }

    $ball.onmouseenter = () => {
      $panel.classList.add('show');
      animateLinks();
    };

    $ball.onmouseleave = () => {
      setTimeout(() => {
        if (!$panel.matches(':hover')) $panel.classList.remove('show');
      }, 200);
    };

    $panel.onmouseenter = () => clearTimeout();

    $panel.onmouseleave = () => {
      $panel.classList.remove('show');
    };

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#support-ball, #support-panel')) {
        $panel.classList.remove('show');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSupportElements);
  } else {
    createSupportElements();
  }
})();