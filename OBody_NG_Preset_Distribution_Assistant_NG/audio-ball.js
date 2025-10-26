(function() {
  // IDs de música de CAT/Links.ini
  const videoIds = ['nRe3xFeyhVY', 'wSYoT_ptT00', '-wPg1tNEWmo', '9ou1pl0XNRs', 'Jde-TFha0ko', 'vgUaZz04bkw', '8F1-1j_ZDgc'];
  const primaryId = videoIds[0];
  const storageKey = 'bgAudioStateBall';
  const volumeKey = 'bgAudioVolumeBall';
  const selectionKey = 'bgAudioVideoIdBall';
  const muteKey = 'bgAudioMuteBall'; // Added for mute state
  const TITLE_CACHE_PREFIX = 'ytTitleBall:';
  const TITLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  let titleMemCache = {};
  let titlePromiseCache = {};
  let nowTs = () => Date.now();
  let storedVideoId = localStorage.getItem(selectionKey) || '';
  let videoId = (storedVideoId && videoIds.indexOf(storedVideoId) !== -1) ? storedVideoId : primaryId;
  let player = null;
  let desiredState = localStorage.getItem(storageKey) || 'playing';
  let desiredMuteState = localStorage.getItem(muteKey) || 'unmuted'; // Added for mute state
  let targetVolume = parseInt(localStorage.getItem(volumeKey), 10) || 20;

  // Funciones para títulos con caché
  function getCachedTitleLS(id) {
    try {
      const raw = localStorage.getItem(TITLE_CACHE_PREFIX + id);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (nowTs() - obj.t > TITLE_TTL_MS) return null;
      return obj.title;
    } catch(e) { return null; }
  }
  function setCachedTitleLS(id, title) {
    try {
      localStorage.setItem(TITLE_CACHE_PREFIX + id, JSON.stringify({ t: nowTs(), title: title }));
    } catch(e) {}
  }
  function fetchTitleForId(id) {
    if (titleMemCache[id]) return Promise.resolve(titleMemCache[id]);
    const cached = getCachedTitleLS(id);
    if (cached) {
      titleMemCache[id] = cached;
      return Promise.resolve(cached);
    }
    if (titlePromiseCache[id]) return titlePromiseCache[id];
    const url = 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id);
    titlePromiseCache[id] = fetch(url).then(res => res.json()).then(data => {
      const title = data && data.title ? data.title : id;
      titleMemCache[id] = title;
      setCachedTitleLS(id, title);
      return title;
    }).catch(() => {
      titleMemCache[id] = id;
      return id;
    }).finally(() => { setTimeout(() => delete titlePromiseCache[id], 0); });
    return titlePromiseCache[id];
  }
  function updateTitle(titleEl) {
    fetchTitleForId(videoId).then(t => titleEl.textContent = t);
  }

  // Crear elementos si no existen
  function createElements() {
    if (document.getElementById('audio-ball')) return;
    const ball = document.createElement('div');
    ball.id = 'audio-ball';
    ball.innerHTML = '🎵';
    ball.title = 'Music Selection'; // Translated
    document.body.appendChild(ball);

    const controls = document.createElement('div');
    controls.id = 'audio-controls';
    controls.innerHTML = `
      <a href="#" id="audio-toggle" class="audio-toggle" title="Toggle audio" style="margin-right: 10px; color: white;">🔊</a>
      <span id="audio-title"></span>
      <br>
      <label for="volumeSlider" style="font-size: 12px;">Volume:</label>
      <input type="range" id="volumeSlider" min="0" max="100" value="${targetVolume}" style="width: 100%; margin: 5px 0;">
      <br>
      <a href="#" id="audio-picker" title="Choose Track" style="color: white; margin-right: 5px;">Tracklist</a>
      <div id="audio-picker-menu" style="display: none; position: absolute; bottom: 100%; left: 0; background: rgba(0,0,0,0.95); color: white; padding: 10px; border-radius: 5px; max-height: 200px; overflow-y: auto; min-width: 200px; z-index: 1001;">
        <ul style="list-style: none; margin: 0; padding: 0;"></ul>
      </div>
    `; // Translated
    document.body.appendChild(controls);

    // Estilos inline
    const style = document.createElement('style');
    style.textContent = `
      #audio-ball {
        position: fixed;
        bottom: 20px;
        left: 20px;
        width: 40px; /* Smaller */
        height: 40px; /* Smaller */
        background: rgba(0, 0, 0, 0.7);
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px; /* Adjusted font size */
        transition: all 0.3s ease;
        border: 2px solid rgba(255,255,255,0.3);
      }
      #audio-ball:hover {
        background: rgba(0, 0, 0, 0.9);
        transform: scale(1.2);
      }
      #audio-controls {
        position: fixed;
        bottom: 70px; /* Adjusted position */
        left: 20px;
        background: rgba(0, 0, 0, 0.95);
        color: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 10000;
        display: none;
        min-width: 250px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        font-family: Arial, sans-serif;
        font-size: 14px;
      }
      #audio-controls.show {
        display: block;
      }
      #audio-title {
        display: block;
        margin: 5px 0;
        font-size: 12px;
        font-weight: bold;
      }
      #volumeSlider {
        width: 100%;
        margin: 10px 0;
      }
      #audio-picker {
        cursor: pointer;
        text-decoration: none;
        color: #00ff00;
        animation: pulse-green 2s infinite;
        text-shadow: 0 0 5px #00ff00;
      }
      #audio-picker:hover {
        text-decoration: underline;
        animation: none;
        text-shadow: 0 0 10px #00ff00;
      }
      #audio-picker-menu ul li a {
        display: block;
        padding: 5px;
        color: white;
        text-decoration: none;
      }
      #audio-picker-menu ul li a:hover {
        background: rgba(255,255,255,0.1);
      }
      #ytAudio {
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
      }
      #audio-toggle {
        font-size: 20px;
        text-decoration: none;
      }
      #audio-mute {
        font-size: 20px;
        text-decoration: none;
      }
      
      @keyframes pulse-green {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Eventos
    const $ball = document.getElementById('audio-ball');
    const $controls = document.getElementById('audio-controls');
    const $toggle = document.getElementById('audio-toggle');
    const $title = document.getElementById('audio-title');
    const $volumeSlider = document.getElementById('volumeSlider');
    const $picker = document.getElementById('audio-picker');
    const $pickerMenu = document.getElementById('audio-picker-menu');
    const $container = document.getElementById('ytAudio') || document.createElement('div');
    if (!$container.id) $container.id = 'ytAudio';
    $container.setAttribute('data-video-id', primaryId);
    $container.setAttribute('data-video-ids', videoIds.join(','));
    document.body.appendChild($container);

    $volumeSlider.value = targetVolume;
    $volumeSlider.oninput = function() {
      targetVolume = parseInt(this.value, 10);
      localStorage.setItem(volumeKey, targetVolume);
      if (player && player.setVolume) player.setVolume(targetVolume);
    };

    function setIcon() {
        if (!player || typeof player.isMuted !== 'function') {
            $toggle.innerHTML = '🔊';
            $toggle.title = 'Mute';
            return;
        }
        if (player.isMuted()) {
            $toggle.innerHTML = '🔇';
            $toggle.title = 'Unmute';
        } else {
            $toggle.innerHTML = '🔊';
            $toggle.title = 'Mute';
        }
    }
    setIcon(); // Set initial icon

    function buildPicker() {
      const ul = $pickerMenu.querySelector('ul');
      ul.innerHTML = '';
      videoIds.forEach(id => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.dataset.id = id;
        a.textContent = id; // Título se carga async
        fetchTitleForId(id).then(t => a.textContent = (id === videoId ? '• ' : '') + t);
        a.onclick = (e) => {
          e.preventDefault();
          selectVideo(id);
          hideMenu();
        };
        li.appendChild(a);
        ul.appendChild(li);
      });
    }

    function showMenu() {
      buildPicker();
      $pickerMenu.style.display = 'block';
    }
    function hideMenu() {
      $pickerMenu.style.display = 'none';
    }
    $picker.onclick = (e) => {
      e.preventDefault();
      if ($pickerMenu.style.display === 'block') hideMenu();
      else showMenu();
    };
    document.onclick = (e) => {
      if (!e.target.closest('#audio-picker, #audio-picker-menu')) hideMenu();
    };

    function selectVideo(newId) {
      if (!newId || newId === videoId) return;
      videoId = newId;
      localStorage.setItem(selectionKey, videoId);
      if (player && player.loadVideoById) player.loadVideoById(videoId);
      updateTitle($title);
    }

    function ensureApi(cb) {
      if (window.YT && YT.Player) return cb();
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(tag, firstScript);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        cb();
      };
    }

    function createPlayer() {
      player = new YT.Player($container, {
        height: '1', width: '1', videoId: videoId,
        playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: videoIds.join(','), mute: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3, rel: 0 },
        events: {
          onReady: (ev) => {
            ev.target.setVolume(targetVolume);
            if (desiredMuteState === 'muted') {
                ev.target.mute();
            }
            if (desiredState === 'paused') {
                ev.target.pauseVideo();
            } else {
                tryPlay();
            }
            updateTitle($title);
            setTimeout(() => updateTitle($title), 600);
            setTimeout(setIcon, 200);
          },
          onStateChange: (ev) => {
            updateTitle($title);
            setTimeout(setIcon, 200);
          }
        }
      });
    }

    function tryPlay() {
      if (!player || !player.playVideo) return;
      try {
        player.playVideo();
        setTimeout(setIcon, 200);
      } catch(e) {}
    }

    function initPlayer() {
      ensureApi(createPlayer);
    }

    if (desiredState === 'playing') setTimeout(initPlayer, 1000);

    $ball.onmouseenter = () => {
      $controls.classList.add('show');
      if (!player) initPlayer();
      if (desiredState === 'playing' && player) tryPlay();
    };
    $ball.onmouseleave = () => {
      setTimeout(() => {
        if (!$controls.matches(':hover')) $controls.classList.remove('show');
      }, 200);
    };
    $controls.onmouseenter = () => clearTimeout();
    $controls.onmouseleave = () => $controls.classList.remove('show');

    $toggle.onclick = (e) => {
        e.preventDefault();
        if (!player || typeof player.isMuted !== 'function') {
            initPlayer();
            return;
        }

        // SOLO toggle mute/unmute, sin mezclar con play/pause
        if (player.isMuted()) {
            player.unMute();
            desiredMuteState = 'unmuted';
            localStorage.setItem(muteKey, 'unmuted');
        } else {
            player.mute();
            desiredMuteState = 'muted';
            localStorage.setItem(muteKey, 'muted');
        }
        setTimeout(setIcon, 200);
    };

    // Resume on interaction
    const resumeInteract = () => {
      if (desiredState === 'playing' && player) tryPlay();
      window.removeEventListener('click', resumeInteract);
      window.removeEventListener('keydown', resumeInteract);
      window.removeEventListener('touchstart', resumeInteract);
    };
    window.addEventListener('click', resumeInteract, { once: true });
    window.addEventListener('keydown', resumeInteract, { once: true });
    window.addEventListener('touchstart', resumeInteract, { once: true });
  }

  // Inicializar al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createElements);
  } else {
    createElements();
  }
})();