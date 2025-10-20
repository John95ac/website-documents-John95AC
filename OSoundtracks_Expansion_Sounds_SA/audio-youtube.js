// YouTube Audio System - Based on working main page audio
(function() {
    // Get or create container
    var container = document.getElementById('ytAudio');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ytAudio';
        container.setAttribute('data-video-id', 'nRe3xFeyhVY');
        container.setAttribute('data-video-ids', 'nRe3xFeyhVY,wSYoT_ptT00,-wPg1tNEWmo,9ou1pl0XNRs,Jde-TFha0ko,vgUaZz04bkw,8F1-1j_ZDgc');
        container.setAttribute('aria-hidden', 'true');
        document.body.appendChild(container);
    }

    // Parse video IDs
    var rawIds = (container.getAttribute('data-video-ids') || '').trim();
    var videoIds = rawIds ? rawIds.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
    var primaryId = container.getAttribute('data-video-id') || 'nRe3xFeyhVY';
    
    // Random selection on page load
    var randomIndex = Math.floor(Math.random() * videoIds.length);
    var videoId = videoIds[randomIndex] || primaryId;
    
    // Always start playing
    var desiredState = 'playing';
    var targetVolume = 30;
    var player = null;

    // Load YouTube API
    var ensureApi = function(cb) {
        if (window.YT && typeof YT.Player === 'function') return cb();
        var tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        var prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function() {
            if (typeof prev === 'function') try { prev(); } catch(e) {}
            cb();
        };
    };

    // Create player
    var createPlayer = function() {
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
                rel: 0,
                start: 0
            },
            events: {
                onReady: function(ev) {
                    try { 
                        ev.target.setVolume(targetVolume);
                        ev.target.unMute();
                        ev.target.playVideo();
                    } catch(e) {}
                },
                onStateChange: function(ev) {
                    // If ended, play again
                    if (ev.data === YT.PlayerState.ENDED) {
                        try { ev.target.playVideo(); } catch(e) {}
                    }
                }
            }
        });
    };

    // Initialize immediately
    var initNow = function() {
        ensureApi(createPlayer);
    };

    // Start with a small delay to ensure DOM is ready
    setTimeout(initNow, 500);

    // Fallback: resume on first user interaction if autoplay is blocked
    var resumeOnInteract = function() {
        if (player && typeof player.playVideo === 'function') {
            try {
                player.setVolume(targetVolume);
                player.unMute();
                player.playVideo();
            } catch(e) {}
        }
        window.removeEventListener('click', resumeOnInteract);
        window.removeEventListener('keydown', resumeOnInteract);
        window.removeEventListener('touchstart', resumeOnInteract);
    };
    
    window.addEventListener('click', resumeOnInteract, { once: true });
    window.addEventListener('keydown', resumeOnInteract, { once: true });
    window.addEventListener('touchstart', resumeOnInteract, { once: true });
})();
