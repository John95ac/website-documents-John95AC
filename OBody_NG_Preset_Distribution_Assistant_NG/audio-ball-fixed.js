(function() {
  // IDs de música de CAT/Links.ini
  const videoIds = ['nRe3xFeyhVY', 'wSYoT_ptT00', '-wPg1tNEWmo', '9ou1pl0XNRs', 'Jde-TFha0ko', 'vgUaZz04bkw', '8F1-1j_ZDgc'];
  const primaryId = videoIds[0];
  const storageKey = 'bgAudioStateBall';
  const volumeKey = 'bgAudioVolumeBall';
  const selectionKey = 'bgAudioVideoIdBall';
  const muteKey = 'bgAudioMuteBall';
  
  // Variables globales
  let player = null;
  let targetVolume = parseInt(localStorage.getItem(volumeKey), 10) || 30;
  let videoId = localStorage.getItem(selectionKey) || primaryId;
  let isInitialized = false;
  let isMuted = localStorage.getItem(muteKey) === 'muted';

  console.log('🎵 Audio Ball Starting...');
  console.log('Video ID:', videoId);
  console.log('Volume:', targetVolume);
  console.log('Initial Mute State:', isMuted);

  // Crear elementos UI
  function createUIElements() {
    console.log('Creating UI elements...');
    
    // Verificar si ya existe
    if (document.getElementById('audio-ball-fixed')) {
      console.log('Audio ball already exists');
      return;
    }

    // Crear bola principal
    const ball = document.createElement('div');
    ball.id = 'audio-ball-fixed';
    ball.innerHTML = '🎵';
    ball.title = 'Audio Controls';
    ball.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      border: 2px solid rgba(255, 255, 255, 0.3);
    `;
    
    // Hover effects
    ball.addEventListener('mouseenter', () => {
      ball.style.transform = 'scale(1.1)';
      ball.style.background = 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)';
    });
    ball.addEventListener('mouseleave', () => {
      ball.style.transform = 'scale(1)';
      ball.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    });

    document.body.appendChild(ball);

    // Crear contenedor de audio
    const audioContainer = document.createElement('div');
    audioContainer.id = 'ytAudio-fixed';
    audioContainer.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px;';
    document.body.appendChild(audioContainer);

    console.log('UI elements created successfully');
    
    // Inicializar el sistema
    setTimeout(() => initializeYouTubePlayer(), 500);
    
    return ball;
  }

  // Cargar YouTube API
  function loadYouTubeAPI() {
    return new Promise((resolve) => {
      if (window.YT && YT.Player) {
        console.log('YouTube API already loaded');
        resolve();
        return;
      }

      console.log('Loading YouTube API...');
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onload = () => console.log('YouTube API script loaded');
      script.onerror = () => console.error('Failed to load YouTube API');
      document.head.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube API ready');
        resolve();
      };
    });
  }

  // Inicializar reproductor
  function initializeYouTubePlayer() {
    if (isInitialized) {
      console.log('Player already initialized');
      return;
    }

    console.log('Initializing YouTube player...');
    loadYouTubeAPI().then(() => {
      const container = document.getElementById('ytAudio-fixed');
      if (!container) {
        console.error('Audio container not found');
        return;
      }

      player = new YT.Player(container, {
        height: '1',
        width: '1',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          loop: 1,
          playlist: videoIds.join(','),
          mute: 0,
          playsinline: 1,
          modestbranding: 1,
          iv_load_policy: 3,
          rel: 0
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });

      console.log('Player initialization started');
    });
  }

  // Callback cuando el player está listo
  function onPlayerReady(event) {
    console.log('✅ Player ready!', {
      muted: event.target.isMuted(),
      volume: event.target.getVolume()
    });

    // Aplicar configuraciones
    event.target.setVolume(targetVolume);
    
    if (isMuted) {
      event.target.mute();
      console.log('🔇 Player muted');
    } else {
      event.target.unMute();
      console.log('🔊 Player unmuted');
    }

    // Intentar reproducir
    try {
      event.target.playVideo();
      console.log('▶️ Playback started');
    } catch (error) {
      console.log('⚠️ Autoplay prevented:', error.message);
    }

    // Configurar eventos de click
    setupClickEvents();
    
    isInitialized = true;
    
    // Actualizar UI
    updateMuteIcon();
  }

  // Callback de cambio de estado
  function onPlayerStateChange(event) {
    console.log('Player state changed:', event.data);
    updateMuteIcon();
  }

  // Configurar eventos de click
  function setupClickEvents() {
    const ball = document.getElementById('audio-ball-fixed');
    if (!ball) return;

    console.log('Setting up click events...');
    
    ball.onclick = function(event) {
      event.preventDefault();
      event.stopPropagation();
      console.log('🎯 Audio ball clicked!', {
        isInitialized,
        hasPlayer: !!player,
        playerReady: player && typeof player.isMuted === 'function'
      });

      if (!player) {
        console.log('🔄 Player not ready, initializing...');
        initializeYouTubePlayer();
        return;
      }

      if (typeof player.isMuted !== 'function') {
        console.log('⏳ Player methods not available yet');
        return;
      }

      toggleMute();
    };

    console.log('✅ Click events configured');
  }

  // Alternar mute
  function toggleMute() {
    console.log('🔄 Toggling mute...', {
      currentMuted: player.isMuted(),
      targetMuted: !player.isMuted()
    });

    if (player.isMuted()) {
      player.unMute();
      isMuted = false;
      localStorage.setItem(muteKey, 'unmuted');
      console.log('🔊 Unmuted successfully');
    } else {
      player.mute();
      isMuted = true;
      localStorage.setItem(muteKey, 'muted');
      console.log('🔇 Muted successfully');
    }

    updateMuteIcon();
  }

  // Actualizar icono
  function updateMuteIcon() {
    const ball = document.getElementById('audio-ball-fixed');
    if (!ball) return;

    const icon = isMuted || (player && player.isMuted && player.isMuted()) ? '🔇' : '🔊';
    ball.innerHTML = icon;
    
    console.log('🔄 Icon updated:', {
      isMuted,
      playerMuted: player ? player.isMuted() : 'N/A',
      icon
    });
  }

  // Inicializar cuando el DOM esté listo
  function init() {
    console.log('🚀 Initializing Audio Ball...');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createUIElements);
    } else {
      createUIElements();
    }
  }

  // Iniciar inmediatamente
  init();

})();