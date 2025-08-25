/*
	Landed by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ null,      '480px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Touch mode.
		if (browser.mobile)
			$body.addClass('is-touch');

	// Scrolly links.
		$('.scrolly').scrolly({
			speed: 2000
		});

	// Dropdowns.
		$('#nav > ul').dropotron({
			alignment: 'right',
			hideDelay: 350
		});

	// Nav.

		// Title Bar.
			$(
				'<div id="titleBar">' +
					'<a href="#navPanel" class="toggle"></a>' +
					'<span class="title">' + $('#logo').html() + '</span>' +
				'</div>'
			)
				.appendTo($body);

		// Panel.
			$(
				'<div id="navPanel">' +
					'<nav>' +
						$('#nav').navList() +
					'</nav>' +
				'</div>'
			)
				.appendTo($body)
				.panel({
					delay: 500,
					hideOnClick: true,
					hideOnSwipe: true,
					resetScroll: true,
					resetForms: true,
					side: 'left',
					target: $body,
					visibleClass: 'navPanel-visible'
				});

	// Parallax.
	// Disabled on IE (choppy scrolling) and mobile platforms (poor performance).
		if (browser.name == 'ie'
		||	browser.mobile) {

			$.fn._parallax = function() {

				return $(this);

			};

		}
		else {

			$.fn._parallax = function() {

				$(this).each(function() {

					var $this = $(this),
						on, off;

					on = function() {

						$this
							.css('background-position', 'center 0px');

						$window
							.on('scroll._parallax', function() {

								var pos = parseInt($window.scrollTop()) - parseInt($this.position().top);

								$this.css('background-position', 'center ' + (pos * -0.15) + 'px');

							});

					};

					off = function() {

						$this
							.css('background-position', '');

						$window
							.off('scroll._parallax');

					};

					breakpoints.on('<=medium', off);
					breakpoints.on('>medium', on);

				});

				return $(this);

			};

			$window
				.on('load resize', function() {
					$window.trigger('scroll');
				});

		}

	// Spotlights.
		var $spotlights = $('.spotlight');

		$spotlights
			._parallax()
			.each(function() {

				var $this = $(this),
					on, off;

				on = function() {

					var top, bottom, mode;

					// Use main <img>'s src as this spotlight's background.
						$this.css('background-image', 'url("' + $this.find('.image.main > img').attr('src') + '")');

					// Side-specific scrollex tweaks.
						if ($this.hasClass('top')) {

							mode = 'top';
							top = '-20%';
							bottom = 0;

						}
						else if ($this.hasClass('bottom')) {

							mode = 'bottom-only';
							top = 0;
							bottom = '20%';

						}
						else {

							mode = 'middle';
							top = 0;
							bottom = 0;

						}

					// Add scrollex.
						$this.scrollex({
							mode:		mode,
							top:		top,
							bottom:		bottom,
							initialize:	function(t) { $this.addClass('inactive'); },
							terminate:	function(t) { $this.removeClass('inactive'); },
							enter:		function(t) { $this.removeClass('inactive'); },

							// Uncomment the line below to "rewind" when this spotlight scrolls out of view.

							//leave:	function(t) { $this.addClass('inactive'); },

						});

				};

				off = function() {

					// Clear spotlight's background.
						$this.css('background-image', '');

					// Remove scrollex.
						$this.unscrollex();

				};

				breakpoints.on('<=medium', off);
				breakpoints.on('>medium', on);

			});

	// Wrappers.
		var $wrappers = $('.wrapper');

		$wrappers
			.each(function() {

				var $this = $(this),
					on, off;

				on = function() {

					$this.scrollex({
						top:		250,
						bottom:		0,
						initialize:	function(t) { $this.addClass('inactive'); },
						terminate:	function(t) { $this.removeClass('inactive'); },
						enter:		function(t) { $this.removeClass('inactive'); },

						// Uncomment the line below to "rewind" when this wrapper scrolls out of view.

						//leave:	function(t) { $this.addClass('inactive'); },

					});

				};

				off = function() {
					$this.unscrollex();
				};

				breakpoints.on('<=medium', off);
				breakpoints.on('>medium', on);

			});

	// Banner.
		var $banner = $('#banner');

		$banner
			._parallax();

	// Background audio (YouTube) + toggle.
		(function() {
			var $container = $('#ytAudio');
			var $toggle = $('.audio-toggle').first();
			var $title = $('.audio-title').first();
			if ($container.length === 0 || $toggle.length === 0)
				return;

			// Persisted state across pages (localStorage): 'playing' | 'paused'
			var storageKey = 'bgAudioState';
			var desiredState = (function() {
				try {
					return localStorage.getItem(storageKey) || 'playing';
				} catch (e) { return 'playing'; }
			})();

			// Parse list of available IDs from data attribute (comma-separated)
			var rawIds = ($container.attr('data-video-ids') || '').trim();
			var videoIds = rawIds ? rawIds.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [];
			// Ensure the primary data-video-id is present at the front
			var primaryId = ($container.data('video-id') || '').toString();
			if (primaryId) {
				videoIds = [primaryId].concat(videoIds.filter(function(id){ return id !== primaryId; }));
			}
			// Restore last chosen track if exists
			var selectionKey = 'bgAudioVideoId';
			var storedVideoId = (function(){ try { return localStorage.getItem(selectionKey) || ''; } catch(e) { return ''; } })();
			var videoId = (storedVideoId && videoIds.indexOf(storedVideoId) !== -1) ? storedVideoId : (videoIds[0] || primaryId);
			var player = null;
			var targetVolume = 3; // percent

			var setIcon = function(isPlaying) {
				if (isPlaying) {
					$toggle.removeClass('fa-volume-mute').addClass('fa-volume-up');
					$toggle.attr('aria-label', 'Mute background audio');
				} else {
					$toggle.removeClass('fa-volume-up').addClass('fa-volume-mute');
					$toggle.attr('aria-label', 'Unmute background audio');
				}
			};

			// Reflect stored preference immediately in the icon
			setIcon(desiredState === 'playing');

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

			// Try to resolve a title via YouTube oEmbed (no API key). Fallback to player data or ID.
			var fetchTitleForId = function(id) {
				return new Promise(function(resolve) {
					var url = 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id);
					$.ajax({ url: url, dataType: 'json', timeout: 4000 })
					 .done(function(data){ resolve((data && data.title) ? data.title : id); })
					 .fail(function(){ resolve(id); });
				});
			};

			var updateTitle = function() {
				if (!$title.length) return false;
				// Prefer oEmbed for the current videoId
				fetchTitleForId(videoId).then(function(t){ $title.text(t); });
				return true;
			};

			// Build a small picker UI next to the audio title
			var $pickerBtn = $('<a href="#" class="audio-picker icon solid fa-list" title="Choose background track" aria-label="Choose background track"></a>');
			var $pickerMenu = $('<div class="audio-picker-menu" aria-hidden="true"></div>').css({
				position: 'absolute', background: 'rgba(0,0,0,0.9)', color: '#fff', padding: '0.5rem',
				borderRadius: '0.25rem', display: 'none', zIndex: 10000, maxHeight: '50vh', overflowY: 'auto',
				minWidth: '220px'
			});
			var $pickerList = $('<ul style="list-style:none; margin:0; padding:0;"></ul>');
			$pickerMenu.append($pickerList);
			var buildPicker = function() {
				$pickerList.empty();
				videoIds.forEach(function(id){
					var $li = $('<li style="margin:0; padding:0;"></li>');
					var $a = $('<a href="#" style="display:block; padding:0.25rem 0.5rem; color:#fff;"></a>');
					$a.attr('data-id', id);
					// Fill titles async
					fetchTitleForId(id).then(function(t){ $a.text((id === videoId ? '• ' : '') + t); });
					$a.on('click', function(e){ e.preventDefault(); selectVideo($(this).data('id')); hideMenu(); });
					$li.append($a);
					$pickerList.append($li);
				});
			};
			var showMenu = function() {
				buildPicker();
				var off = $pickerBtn.offset();
				$pickerMenu.css({ left: off.left + 'px', top: (off.top + $pickerBtn.outerHeight()) + 'px' });
				$pickerMenu.show();
			};
			var hideMenu = function(){ $pickerMenu.hide(); };
			$pickerBtn.on('click', function(e){ e.preventDefault(); ($pickerMenu.is(':visible') ? hideMenu() : showMenu()); });
			$(document).on('click', function(e){ if (!$(e.target).closest('.audio-picker, .audio-picker-menu').length) hideMenu(); });
			// Insert controls if we have a title element available
			if ($title.length) {
				// Ensure exactly one blank space between title and picker button
				var titleEl = $title.get(0);
				var parent = titleEl.parentNode;
				var space = document.createTextNode('  ');
				if (titleEl.nextSibling) {
					parent.insertBefore(space, titleEl.nextSibling);
					parent.insertBefore($pickerBtn.get(0), space.nextSibling);
				} else {
					parent.appendChild(space);
					parent.appendChild($pickerBtn.get(0));
				}
				$('body').append($pickerMenu);
			}

			var createPlayer = function() {
				player = new YT.Player($container.get(0), {
					height: '1',
					width: '1',
					videoId: videoId,
					playerVars: {
						autoplay: 1,
						controls: 0,
						loop: 1,
						playlist: (videoIds && videoIds.length ? videoIds.join(',') : videoId),
						mute: 0,
						playsinline: 1,
						modestbranding: 1,
						iv_load_policy: 3,
						rel: 0
					},
					events: {
						onReady: function(ev) {
							try { ev.target.setVolume(targetVolume); } catch(e) {}
							if (desiredState === 'paused') {
								try { ev.target.pauseVideo(); } catch(e) {}
								setIcon(false);
							} else {
								try { ev.target.unMute(); } catch(e) {}
								tryPlay();
							}
							// Set title now and slightly later
							updateTitle();
							setTimeout(updateTitle, 600);
						},
						onStateChange: function(ev) {
							if (ev.data === YT.PlayerState.PLAYING) setIcon(true);
							if (ev.data === YT.PlayerState.PAUSED || ev.data === YT.PlayerState.ENDED) setIcon(false);
							updateTitle();
						}
					}
				});
			};

			var tryPlay = function() {
				if (!player || typeof player.playVideo !== 'function') return;
				try {
					player.playVideo();
					setIcon(true);
				} catch(e) {
					setIcon(false);
				}
			};

			// Switch to a different video id
			var selectVideo = function(newId) {
				if (!newId || newId === videoId) return;
				videoId = newId;
				try { localStorage.setItem(selectionKey, videoId); } catch(e) {}
				if (player && typeof player.loadVideoById === 'function') {
					try { player.loadVideoById(videoId); } catch(e) {}
					updateTitle();
				}
			};

			// Defer: initialize API + player on interaction or idle to improve performance
			var playerScheduled = false;
			var initNow = function() {
				if (playerScheduled) return;
				playerScheduled = true;
				ensureApi(createPlayer);
			};

			// If user prefers playing, schedule during idle; otherwise wait for interaction
			if (desiredState === 'playing') {
				if ('requestIdleCallback' in window) {
					try { requestIdleCallback(function(){ initNow(); }, { timeout: 3000 }); }
					catch(e) { setTimeout(initNow, 3000); }
				} else {
					setTimeout(initNow, 3000);
				}
			}

			// Fallback: resume on first user interaction if autoplay is blocked (but only if desired state is 'playing').
			var resumeOnInteract = function() {
				// Ensure player exists on first interaction
				if (!playerScheduled) initNow();
				if (desiredState === 'playing' && player) tryPlay();
				window.removeEventListener('click', resumeOnInteract);
				window.removeEventListener('keydown', resumeOnInteract);
				window.removeEventListener('touchstart', resumeOnInteract);
			};
			window.addEventListener('click', resumeOnInteract, { once: true });
			window.addEventListener('keydown', resumeOnInteract, { once: true });
			window.addEventListener('touchstart', resumeOnInteract, { once: true });

			// Toggle click handler.
			$toggle.on('click', function(e) {
				e.preventDefault();
				if (!playerScheduled) initNow();
				if (!player) return;
				var state = player.getPlayerState ? player.getPlayerState() : null;
				if (state !== YT.PlayerState.PLAYING) {
					try { player.setVolume(targetVolume); } catch(e) {}
					try { player.unMute(); } catch(e) {}
					tryPlay();
					desiredState = 'playing';
					try { localStorage.setItem(storageKey, desiredState); } catch(e) {}
				} else {
					try { player.pauseVideo(); } catch(e) {}
					setIcon(false);
					desiredState = 'paused';
					try { localStorage.setItem(storageKey, desiredState); } catch(e) {}
				}
			});
		})();

})(jQuery);