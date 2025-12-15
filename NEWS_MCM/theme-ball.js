/**
 * Theme Ball - Floating Ball for Theme Selection
 * Allows switching between festive themes based on dates from days.ini
 */
(function() {
  // Theme configuration with emojis
  const themes = {
    Saint_Patrick: { emoji: '🍀', name: 'Saint Patrick' },
    Easter_Week: { emoji: '🐣', name: 'Easter Week' },
    Halloween: { emoji: '🎃', name: 'Halloween' },
    Christmas: { emoji: '🎄', name: 'Christmas' },
    New_Year: { emoji: '🎆', name: 'New Year' },
    Normal: { emoji: '🍵', name: 'Normal' }
  };

  const expandedKey = 'themeBallExpanded';
  const disableChristmasKey = 'disableChristmasEffects';
  const disableSaintPatrickKey = 'disableSaintPatrickEffects';
  const disableEasterKey = 'disableEasterEffects';
  const disableHalloweenKey = 'disableHalloweenEffects';
  const disableNewYearKey = 'disableNewYearEffects';

  let holidaysData = {};
  let currentSelectedTheme = 'Normal';

  // Function to stop all effects
  function stopAllEffects() {
    if (window.stopChristmasEffects) window.stopChristmasEffects();
    if (window.stopSaintPatrickEffects) window.stopSaintPatrickEffects();
    if (window.stopEasterEffects) window.stopEasterEffects();
    if (window.stopHalloweenEffects) window.stopHalloweenEffects();
    if (window.stopNewYearEffects) window.stopNewYearEffects();
  }

  // Load holidays (hardcoded for reliability)
  async function loadHolidays() {
    // En lugar de fetch, usar datos hardcodeados directamente
    holidaysData = {
      'Saint_Patrick': '03-16 to 03-18',
      'Easter_Week': '04-13 to 04-20',
      'Halloween': '10-01 to 10-31',
      'Christmas': '12-01 to 12-25',
      'New_Year': '12-26 to 01-01'
    };
    console.log('Holidays data loaded (hardcoded):', holidaysData);
  }

  // Check if current date is within a holiday period
  function getCurrentTheme() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();
    const currentYear = now.getFullYear();

    for (const [theme, dateRange] of Object.entries(holidaysData)) {
      if (dateRange.includes('to')) {
        const [start, end] = dateRange.split('to').map(s => s.trim());
        const [startMonth, startDay] = start.split('-').map(Number);
        const [endMonth, endDay] = end.split('-').map(Number);

        let startDate, endDate;

        if (endMonth < startMonth) { // Crosses year boundary (e.g., New Year)
          startDate = new Date(currentYear, startMonth - 1, startDay);
          endDate = new Date(currentYear + 1, endMonth - 1, endDay);
          if (now < startDate) {
            startDate = new Date(currentYear - 1, startMonth - 1, startDay);
            endDate = new Date(currentYear, endMonth - 1, endDay);
          }
        } else {
          startDate = new Date(currentYear, startMonth - 1, startDay);
          endDate = new Date(currentYear, endMonth - 1, endDay);
        }

        if (now >= startDate && now <= endDate) {
          return theme;
        }
      }
    }

    return 'Normal';
  }

  // Get selected theme (based on date and session selection)
  function getSelectedTheme() {
    return currentSelectedTheme;
  }

  // Create elements if they don't exist
  function createThemeElements() {
    if (document.getElementById('theme-ball')) return;

    // Create the main ball
    const ball = document.createElement('div');
    ball.id = 'theme-ball';
    ball.title = 'Theme Selector';
    document.body.appendChild(ball);

    // Add fallback styles
    const fallbackStyle = document.createElement('style');
    fallbackStyle.textContent = `
      #theme-ball {
        position: fixed !important;
        bottom: 75px !important;
        left: 15px !important;
        width: 32px !important;
        height: 32px !important;
        z-index: 999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(fallbackStyle);

    // Create the theme panel
    const panel = document.createElement('div');
    panel.id = 'theme-panel';
    panel.innerHTML = `
      <div class="theme-header">
        <h3>🎨 Theme Selector</h3>
        <p>Choose your festive theme!</p>
      </div>
      <div class="themes" id="themes">
        <!-- Themes will be loaded dynamically -->
      </div>
      <div class="theme-info-message">
        Automatically selected when the date approaches, but you can preview or change it to normal mode at any time.
      </div>
    `;
    document.body.appendChild(panel);

    // Create CSS styles
    createThemeStyles();

    // Create themes dynamically
    createThemes();

    // Initialize events
    initializeThemeEvents();

    // Update ball emoji
    updateBallEmoji();
  }

  function createThemeStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #theme-ball {
        position: fixed;
        bottom: 75px; /* Above the audio sphere */
        left: 15px;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #008B8B, #006666);
        border-radius: 50%;
        cursor: pointer;
        z-index: 999 !important; /* Low z-index to avoid overlapping with tabs or modals */
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        box-shadow: 0 4px 20px rgba(0, 139, 139, 0.4);
        border: 2px solid rgba(255, 255, 255, 0.3);
      }

      #theme-ball:hover {
        background: linear-gradient(135deg, #006B6B, #004D4D);
        transform: scale(1.15);
        box-shadow: 0 8px 35px rgba(0, 139, 139, 0.7);
      }

      #theme-panel {
        position: fixed;
        bottom: 65px; /* Above the audio sphere */
        left: 15px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(30, 30, 30, 0.95));
        border-radius: 15px;
        z-index: 999; /* Above the audio sphere */
        display: none;
        min-width: 280px;
        max-width: 350px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        overflow: hidden;
        transition: all 0.3s ease;
      }

      #theme-panel.show {
        display: block;
      }

      .theme-header {
        background: linear-gradient(135deg, #008B8B, #006666);
        color: white;
        padding: 20px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      .theme-header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        animation: themeHeaderShine 3s infinite;
      }

      @keyframes themeHeaderShine {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .theme-header h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 700;
        position: relative;
        z-index: 1;
      }

      .theme-header p {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
        position: relative;
        z-index: 1;
      }

      .themes {
        padding: 25px 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .theme-option {
        display: flex;
        align-items: center;
        padding: 15px;
        background: rgba(0, 0, 0, 1);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .theme-option::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s;
      }

      .theme-option:hover::before {
        left: 100%;
      }

      .theme-option:hover {
        background: rgba(0, 0, 0, 1);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }

      .theme-option.selected {
        background: rgba(0, 0, 0, 1);
        border-color: #008B8B;
      }

      .theme-emoji {
        font-size: 24px;
        margin-right: 15px;
        min-width: 30px;
        text-align: center;
      }

      .theme-info {
        flex: 1;
      }

      .theme-name {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 4px 0;
        color: #fff;
      }

      .theme-desc {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
      }

      .theme-check {
        font-size: 18px;
        color: #008B8B;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .theme-option.selected .theme-check {
        opacity: 1;
      }

      .theme-info-message {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        margin-top: 15px;
        padding: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      /* Responsive */
      @media (max-width: 768px) {
        #theme-panel {
          top: 60px;
          bottom: auto;
          left: 10px;
          right: 10px;
          min-width: auto;
          max-width: none;
          z-index: 999;
        }

        #theme-ball {
          width: 36px;
          height: 36px;
          font-size: 16px;
          z-index: 999;
        }

        .theme-option {
          flex-direction: column;
          align-items: center;
        }

        .theme-emoji {
          margin-right: 0;
          margin-bottom: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createThemes() {
    const themesContainer = document.getElementById('themes');
    themesContainer.innerHTML = '';

    const selectedTheme = getSelectedTheme();

    Object.entries(themes).forEach(([key, theme], index) => {
      const themeElement = document.createElement('div');
      themeElement.className = `theme-option ${key === selectedTheme ? 'selected' : ''}`;
      themeElement.dataset.theme = key;
      themeElement.style.animationDelay = `${index * 0.1}s`;

      themeElement.innerHTML = `
        <div class="theme-info">
          <h4 class="theme-name">${theme.name}</h4>
          <p class="theme-desc">${key === 'Normal' ? 'Default theme' : `Festive ${theme.name.toLowerCase()} theme`}</p>
        </div>
        <div class="theme-emoji">${theme.emoji}</div>
        <div class="theme-check">✓</div>
      `;

      themesContainer.appendChild(themeElement);
    });
  }

  function updateBallEmoji() {
    const ball = document.getElementById('theme-ball');
    const selectedTheme = getSelectedTheme();
    const emoji = themes[selectedTheme].emoji;
    ball.textContent = selectedTheme === 'Normal' ? '🍵' : (emoji || '🎨'); // Use 🍵 for Normal theme
  }


  function initializeThemeEvents() {
    const $ball = document.getElementById('theme-ball');
    const $panel = document.getElementById('theme-panel');

    // Staggered entry animation for themes
    function animateThemes() {
      const themeOptions = $panel.querySelectorAll('.theme-option');
      themeOptions.forEach((option, index) => {
        option.style.opacity = '0';
        option.style.transform = 'translateY(20px)';
        setTimeout(() => {
          option.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          option.style.opacity = '1';
          option.style.transform = 'translateY(0)';
        }, index * 150 + 300);
      });
    }

    // Events
    $ball.onmouseenter = () => {
      $panel.classList.add('show');
      animateThemes();
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

    // Theme selection
    $panel.addEventListener('click', (e) => {
      const themeOption = e.target.closest('.theme-option');
      if (themeOption) {
        const selectedTheme = themeOption.dataset.theme;

        // Update selection
        $panel.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('selected'));
        themeOption.classList.add('selected');

        // Handle theme selection and effects
        currentSelectedTheme = selectedTheme;
        // Stop all effects first
        stopAllEffects();
        if (selectedTheme === 'Normal') {
          // Set disable for all themes
          sessionStorage.setItem(disableChristmasKey, 'true');
          sessionStorage.setItem(disableSaintPatrickKey, 'true');
          sessionStorage.setItem(disableEasterKey, 'true');
          sessionStorage.setItem(disableHalloweenKey, 'true');
          sessionStorage.setItem(disableNewYearKey, 'true');
        } else if (selectedTheme === 'Christmas') {
          sessionStorage.removeItem(disableChristmasKey);
          sessionStorage.setItem(disableSaintPatrickKey, 'true');
          sessionStorage.setItem(disableEasterKey, 'true');
          sessionStorage.setItem(disableHalloweenKey, 'true');
          sessionStorage.setItem(disableNewYearKey, 'true');
          if (window.activateChristmasEffects) window.activateChristmasEffects();
        } else if (selectedTheme === 'Saint_Patrick') {
          sessionStorage.setItem(disableChristmasKey, 'true');
          sessionStorage.removeItem(disableSaintPatrickKey);
          sessionStorage.setItem(disableEasterKey, 'true');
          sessionStorage.setItem(disableHalloweenKey, 'true');
          sessionStorage.setItem(disableNewYearKey, 'true');
          if (window.activateSaintPatrickEffects) window.activateSaintPatrickEffects();
        } else if (selectedTheme === 'Easter_Week') {
          sessionStorage.setItem(disableChristmasKey, 'true');
          sessionStorage.setItem(disableSaintPatrickKey, 'true');
          sessionStorage.removeItem(disableEasterKey);
          sessionStorage.setItem(disableHalloweenKey, 'true');
          sessionStorage.setItem(disableNewYearKey, 'true');
          if (window.activateEasterEffects) window.activateEasterEffects();
        } else if (selectedTheme === 'Halloween') {
          sessionStorage.setItem(disableChristmasKey, 'true');
          sessionStorage.setItem(disableSaintPatrickKey, 'true');
          sessionStorage.setItem(disableEasterKey, 'true');
          sessionStorage.removeItem(disableHalloweenKey);
          sessionStorage.setItem(disableNewYearKey, 'true');
          if (window.activateHalloweenEffects) window.activateHalloweenEffects();
        } else if (selectedTheme === 'New_Year') {
          sessionStorage.setItem(disableChristmasKey, 'true');
          sessionStorage.setItem(disableSaintPatrickKey, 'true');
          sessionStorage.setItem(disableEasterKey, 'true');
          sessionStorage.setItem(disableHalloweenKey, 'true');
          sessionStorage.removeItem(disableNewYearKey);
          if (window.activateNewYearEffects) window.activateNewYearEffects();
        }

        // Update ball emoji
        updateBallEmoji();

        // Close panel after selection
        setTimeout(() => $panel.classList.remove('show'), 500);
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#theme-ball, #theme-panel')) {
        $panel.classList.remove('show');
      }
    });
  }

  // Initialize when DOM is ready
  async function init() {
    await loadHolidays();
    const current = getCurrentTheme();
    if (current === 'Christmas') {
      sessionStorage.removeItem(disableChristmasKey);
    } else if (current === 'Saint_Patrick') {
      sessionStorage.removeItem(disableSaintPatrickKey);
    } else if (current === 'Easter_Week') {
      sessionStorage.removeItem(disableEasterKey);
    } else if (current === 'Halloween') {
      sessionStorage.removeItem(disableHalloweenKey);
    } else if (current === 'New_Year') {
      sessionStorage.removeItem(disableNewYearKey);
    }
    currentSelectedTheme = current;

    // Stop all effects first, then activate the current theme effect if applicable
    stopAllEffects();
    if (current === 'Christmas' && !sessionStorage.getItem(disableChristmasKey)) {
      if (window.activateChristmasEffects) window.activateChristmasEffects();
    } else if (current === 'Saint_Patrick' && !sessionStorage.getItem(disableSaintPatrickKey)) {
      if (window.activateSaintPatrickEffects) window.activateSaintPatrickEffects();
    } else if (current === 'Easter_Week' && !sessionStorage.getItem(disableEasterKey)) {
      if (window.activateEasterEffects) window.activateEasterEffects();
    } else if (current === 'Halloween' && !sessionStorage.getItem(disableHalloweenKey)) {
      if (window.activateHalloweenEffects) window.activateHalloweenEffects();
    } else if (current === 'New_Year' && !sessionStorage.getItem(disableNewYearKey)) {
      if (window.activateNewYearEffects) window.activateNewYearEffects();
    }

    // Ejecutar inmediatamente sin setTimeout
    createThemeElements();

    // Verificar que se creó correctamente
    setTimeout(() => {
      const ball = document.getElementById('theme-ball');
      if (ball) {
        console.log('Theme ball created successfully');
        updateBallEmoji();
      } else {
        console.error('Theme ball not created');
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();