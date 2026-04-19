document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');

    initializeNavigation();

    initializeScrollSpy();

    initializeMobileMenu();

    const allSections = document.querySelectorAll('.section');
    const allHeaders = document.querySelectorAll('.section-header');
    const newsSection = document.getElementById('news');
    
    allSections.forEach(section => {
        if (section.id === 'news') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    allHeaders.forEach((header, index) => {
        if (index === 0) {
            header.style.display = 'block';
        } else {
            header.style.display = 'none';
        }
    });
    
    setTimeout(initializeEnhancedFeatures, 100);
});

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    console.log('Found navigation links:', navLinks.length);

    navLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        console.log(`Setting up navigation link ${index}:`, href);

if (!href || !href.startsWith('#')) {
            console.log('Skipping non-anchor link:', href);
            return;
        }

        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Navigation link clicked:', href);

            if (href === '#') {
                const allSections = document.querySelectorAll('.section');
                const allHeaders = document.querySelectorAll('.section-header');
                allSections.forEach(section => section.style.display = 'block');
                allHeaders.forEach(header => header.style.display = 'block');
            } else {
                const allSections = document.querySelectorAll('.section');
                const allHeaders = document.querySelectorAll('.section-header');
                allSections.forEach(section => section.style.display = 'none');
                allHeaders.forEach(header => header.style.display = 'none');

                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    targetSection.style.display = 'block';
                    
                    const headerIndex = ['news', 'acknowledgments', 'project-schedule-outline', 'faq'].indexOf(targetId);
                    if (headerIndex >= 0 && allHeaders[headerIndex]) {
                        allHeaders[headerIndex].style.display = 'block';
                    }
                    
                    if (targetId === 'project-schedule-outline') {
                        const iframe = targetSection.querySelector('iframe');
                        if (iframe) {
                            iframe.src = iframe.src;
                        }
                    }
                }
                
                closeMobileMenu();
                updateActiveNavLink(this);
            }
        });
    });
}

function closeMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');

    if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        if (navToggle) {
            navToggle.classList.remove('active');
        }
        console.log('Mobile menu closed');
    }
}

function updateActiveNavLink(activeLink) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    if (activeLink) {
        activeLink.classList.add('active');
        console.log('Active navigation set to:', activeLink.getAttribute('href'));
    }
}










function initializeScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    console.log('Scroll spy initialized with sections:', sections.length);

    function handleScroll() {
        const scrollPosition = window.scrollY + 150;
        let activeSection = null;
        let closestDistance = Infinity;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionBottom = sectionTop + sectionHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                activeSection = section;
            }

            const distanceToTop = Math.abs(scrollPosition - sectionTop);
            if (distanceToTop < closestDistance) {
                closestDistance = distanceToTop;
                if (!activeSection) {
                    activeSection = section;
                }
            }
        });

        if (activeSection) {
            const activeId = activeSection.getAttribute('id');
            const activeNavLink = document.querySelector(`.nav-link[href="#${activeId}"]`);

            if (activeNavLink && !activeNavLink.classList.contains('active')) {
                updateActiveNavLink(activeNavLink);
            }
        }
    }

    let isScrolling = false;
    window.addEventListener('scroll', function() {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                handleScroll();
                isScrolling = false;
            });
            isScrolling = true;
        }
    }, { passive: true });

    setTimeout(handleScroll, 100);
}

function initializeMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    console.log('Mobile menu initialization:', { navToggle: !!navToggle, navMenu: !!navMenu });

    if (navToggle && navMenu) {
        console.log('Mobile menu event listeners added');

        navToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const isActive = navMenu.classList.contains('active');

            if (isActive) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                console.log('Mobile menu closed');
            } else {
                navMenu.classList.add('active');
                navToggle.classList.add('active');
                console.log('Mobile menu opened');
            }
        });

        document.addEventListener('click', function(e) {
            const isClickInsideNav = navToggle.contains(e.target) || navMenu.contains(e.target);

            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                closeMobileMenu();
                console.log('Mobile menu closed (clicked outside)');
            }
        });

        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
                closeMobileMenu();
                console.log('Mobile menu closed (window resized)');
            }
        });

        const navMenuLinks = navMenu.querySelectorAll('.nav-link');
        navMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (navMenu.classList.contains('active')) {
                    closeMobileMenu();
                    console.log('Mobile menu closed (nav link clicked)');
                }
            });
        });
    } else {
        console.error('Mobile menu elements not found');
    }
}

function initializeEnhancedFeatures() {
    console.log('Initializing enhanced features...');

    if ('IntersectionObserver' in window) {
        initializeScrollAnimations();
    }

    initializeKeyboardNavigation();

    addHoverEffects();

    initializeAccessibilityFeatures();

    addRippleStyles();

    initializePatronTooltips();

    initializeVideoModal();
}

function initializeVideoModal() {
    const videoElements = document.querySelectorAll('.news-video');
    const modal = document.getElementById('news-video-modal');
    const iframe = document.getElementById('modal-video-iframe');

    if (!modal || !iframe) return;

    videoElements.forEach(el => {
        el.addEventListener('click', function() {
            const videoUrl = this.getAttribute('data-video-url');
            if (videoUrl) {
                let finalUrl = videoUrl;
                if (finalUrl.includes('youtube.com')) {
                    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'autoplay=1';
                } else if (finalUrl.includes('vimeo.com')) {
                    finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'autoplay=1';
                }
                
                iframe.src = finalUrl;
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                
                setTimeout(() => modal.classList.add('show'), 10);
            }
        });
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeVideoModal();
        }
    });
}

function closeVideoModal() {
    const modal = document.getElementById('news-video-modal');
    const iframe = document.getElementById('modal-video-iframe');

    if (modal && iframe) {
        modal.classList.remove('show');
        modal.classList.add('hiding');
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('hiding');
            iframe.src = '';
            document.body.style.overflow = '';
        }, 300);
    }
}

function initializePatronTooltips() {
    const tooltipTargets = document.querySelectorAll('.patrons-names span[data-tooltip], .pie-3d-slice[data-tooltip], .patron-count-badge[data-tooltip]')
    
    let tooltipEl = document.getElementById('patron-floating-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'patron-floating-tooltip';
        tooltipEl.className = 'patron-floating-tooltip';
        document.body.appendChild(tooltipEl);
    }

    tooltipTargets.forEach(target => {
        if (target.getAttribute('data-tooltip-initialized')) return;
        target.setAttribute('data-tooltip-initialized', 'true');

        target.addEventListener('mouseenter', () => {
            const content = target.getAttribute('data-tooltip');
            if (!content) return;

            tooltipEl.innerHTML = content.replace(/\n/g, '<br>');
            tooltipEl.classList.add('active');
            
            const rect = target.getBoundingClientRect();
            const tooltipRect = tooltipEl.getBoundingClientRect();
            
            let top = rect.top - tooltipRect.height - 10;
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            
            if (top < 10) {
                top = rect.bottom + 10;
                tooltipEl.classList.add('bottom');
            } else {
                tooltipEl.classList.remove('bottom');
            }
            
            if (left < 10) left = 10;
            if (left + tooltipRect.width > window.innerWidth - 10) {
                left = window.innerWidth - tooltipRect.width - 10;
            }
            
            tooltipEl.style.top = top + 'px';
            tooltipEl.style.left = left + 'px';
        });

        target.addEventListener('mouseleave', () => {
            tooltipEl.classList.remove('active');
        });

        target.addEventListener('mousedown', () => {
            tooltipEl.classList.remove('active')
        })
    })

    initializeImageTooltips()
}

function initializeImageTooltips() {
    const triggers = document.querySelectorAll('.image-tooltip-trigger')
    
    let imageTooltipEl = document.getElementById('image-floating-tooltip')
    if (!imageTooltipEl) {
        imageTooltipEl = document.createElement('div')
        imageTooltipEl.id = 'image-floating-tooltip'
        imageTooltipEl.className = 'image-floating-tooltip'
        imageTooltipEl.style.position = 'fixed'
        imageTooltipEl.style.zIndex = '10001'
        imageTooltipEl.style.pointerEvents = 'none'
        imageTooltipEl.style.display = 'none'
        imageTooltipEl.style.backgroundColor = '#1e293b'
        imageTooltipEl.style.padding = '5px'
        imageTooltipEl.style.borderRadius = '8px'
        imageTooltipEl.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)'
        imageTooltipEl.style.border = '1px solid rgba(255,255,255,0.1)'
        document.body.appendChild(imageTooltipEl)
    }

    triggers.forEach(trigger => {
        const imagePath = trigger.getAttribute('data-tooltip-image')
        if (!imagePath) return

        trigger.addEventListener('mouseenter', (e) => {
            imageTooltipEl.innerHTML = `<img src="${imagePath}" style="max-width: 300px; border-radius: 4px; display: block">`
            imageTooltipEl.style.display = 'block'
            updateTooltipPosition(e)
        })

        trigger.addEventListener('mousemove', (e) => {
            updateTooltipPosition(e)
        })

        trigger.addEventListener('mouseleave', () => {
            imageTooltipEl.style.display = 'none'
        })

        function updateTooltipPosition(e) {
            const offset = 15
            let top = e.clientY + offset
            let left = e.clientX + offset
            
            const rect = imageTooltipEl.getBoundingClientRect()
            if (left + rect.width > window.innerWidth) {
                left = e.clientX - rect.width - offset
            }
            if (top + rect.height > window.innerHeight) {
                top = e.clientY - rect.height - offset
            }
            
            imageTooltipEl.style.top = top + 'px'
            imageTooltipEl.style.left = left + 'px'
        }
    })
}

function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll([
        '.functionality-card',
        '.mode-card',
        '.feature-card',
        '.security-card',
        '.step',
        '.tester-card',
        '.credit-item'
    ].join(', '));

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
}

function initializeKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }

    });
}

function addHoverEffects() {
    const buttons = document.querySelectorAll('.copy-btn, .btn');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.disabled) return;

            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            this.appendChild(ripple);

            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        });
    });
}

function initializeAccessibilityFeatures() {
    const focusableElements = document.querySelectorAll([
        'a', 'button', 'textarea', 'input', 'select',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', '));

    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.style.outline = 'var(--focus-outline)';
            this.style.outlineOffset = '2px';
        });

        element.addEventListener('blur', function() {
            this.style.outline = '';
            this.style.outlineOffset = '';
        });
    });

    addSkipToContentLink();
}

function addSkipToContentLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#hero';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-to-content';

    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--color-primary);
        color: var(--color-btn-primary-text);
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1001;
        transition: top 0.3s ease;
    `;

    skipLink.addEventListener('focus', function() {
        this.style.top = '6px';
    });

    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
}

function addRippleStyles() {
    if (document.getElementById('ripple-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }

        @keyframes ripple-animation {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }

        .copy-btn, .btn {
            position: relative;
            overflow: hidden;
        }

        .skip-to-content:focus {
            top: 6px !important;
        }
    `;

    document.head.appendChild(style);
}

function initializeThemeHandling() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    prefersDark.addEventListener('change', (e) => {
        console.log('Theme changed to:', e.matches ? 'dark' : 'light');
    });
}

window.addEventListener('error', function(e) {
    console.warn('Error en la página:', e.error);
});

document.addEventListener('DOMContentLoaded', initializeThemeHandling);

(function() {
    'use strict';
    
    const allImages = [
        '../images/pic02.webp',
        '../images/pic03.webp',
        '../images/pic04.webp',
        '../images/pic005.webp',
        '../images/pic006.webp',
        '../images/pic007.webp',
        '../images/pic008.webp',
        '../images/pic09.webp',
        '../images/banner.webp'
    ];
    
    let slides = [];
    let shuffledImages = [];
    let totalSlides = 0;
    let ticking = false;
    
    function shuffleArray(array) {
        const shuffled = array.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    function init() {
        slides = document.querySelectorAll('.spotlight-slide');
        totalSlides = slides.length;
        
        if (totalSlides === 0) return;
        
        shuffledImages = shuffleArray(allImages);
        
        slides.forEach(function(slide, index) {
            const imgIndex = index % shuffledImages.length;
            slide.style.backgroundImage = 'url("' + shuffledImages[imgIndex] + '")';
            slide.style.zIndex = index + 1;
        });
        
        slides[0].style.opacity = '1';
        
        window.addEventListener('scroll', onScroll, { passive: true });
    }
    
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(function() {
                updateCrossfade();
                ticking = false;
            });
            ticking = true;
        }
    }
    
    function updateCrossfade() {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        const maxScroll = docHeight - viewportHeight;
        
        if (maxScroll <= 0) return;
        
        const scrollPercent = scrollY / maxScroll;
        const slideIndex = Math.min(Math.floor(scrollPercent * totalSlides), totalSlides - 1);
        
        slides.forEach(function(slide, i) {
            if (i <= slideIndex) {
                slide.style.opacity = '1';
            } else {
                slide.style.opacity = '0';
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

function catMeow() {
    var audio = new Audio('../sound/miau-PDA.wav');
    audio.play();
    showToast('Meau!');
}

function showToast(message) {
    var container = document.getElementById('toast-container');
    
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<img src="../Data/013.gif" alt="Cat" style="height: 1.5em; width: auto; margin-right: 8px;"><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.classList.add('toast-hide');
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }, 2000);
}

function showCreatingToast(message) {
    var container = document.getElementById('toast-container');
    
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = 'creating-toast';
    toast.innerHTML = '<img src="../Data/013.gif" alt="Cat" style="height: 1.5em; width: auto; margin-right: 8px;"><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    return toast;
}

function hideCreatingToast() {
    var toast = document.getElementById('creating-toast');
    if (toast) {
        toast.classList.add('toast-hide');
        setTimeout(function() {
            if (toast && toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }
}

var galleryImages = [
    '../images/pic02.webp',
    '../images/pic03.webp',
    '../images/pic04.webp',
    '../images/pic005.webp',
    '../images/pic006.webp',
    '../images/pic007.webp',
    '../images/pic008.webp',
    '../images/pic09.webp',
    '../images/banner.webp'
];
var currentImageIndex = 0;

function openGallery() {
    currentImageIndex = 0;
    var modal = document.getElementById('gallery-modal');
    var img = document.getElementById('gallery-image');
    var totalSpan = document.getElementById('gallery-total');
    var currentSpan = document.getElementById('gallery-current');
    
    img.src = galleryImages[currentImageIndex];
    totalSpan.textContent = galleryImages.length;
    currentSpan.textContent = currentImageIndex + 1;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeGallery() {
    var modal = document.getElementById('gallery-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    updateGalleryImage();
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    updateGalleryImage();
}

function updateGalleryImage() {
    var img = document.getElementById('gallery-image');
    var currentSpan = document.getElementById('gallery-current');
    
    img.src = galleryImages[currentImageIndex];
    currentSpan.textContent = currentImageIndex + 1;
}

document.addEventListener('keydown', function(e) {
    var modal = document.getElementById('gallery-modal');
    if (!modal.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
        closeGallery();
    } else if (e.key === 'ArrowLeft') {
        prevImage();
    } else if (e.key === 'ArrowRight') {
        nextImage();
    }
});

var smkState = {
    musicFiles: [],
    imageData: null,
    currentAudio: null,
    currentPlayingIndex: null,
    cropState: null
};

document.addEventListener('DOMContentLoaded', function() {
    initializeSoundMenuKeyGenerator();
});

function initializeSoundMenuKeyGenerator() {
    var musicDropzone = document.getElementById('smk-music-dropzone');
    var imageDropzone = document.getElementById('smk-image-dropzone');
    var modNameInput = document.getElementById('smk-mod-name');
    var moderlisterInput = document.getElementById('smk-moderlister');
    var royaltyLinksInput = document.getElementById('smk-royalty-links');
    var createPackBtn = document.getElementById('smk-create-pack');
    var clearAllBtn = document.getElementById('smk-clear-all');
    
    if (!musicDropzone || !imageDropzone) return;
    
    musicDropzone.addEventListener('dragover', handleMusicDragOver);
    musicDropzone.addEventListener('drop', handleMusicDrop);
    musicDropzone.addEventListener('click', function() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.multiple = true;
        input.addEventListener('change', handleMusicSelect);
        input.click();
    });
    
    imageDropzone.addEventListener('dragover', handleImageDragOver);
    imageDropzone.addEventListener('drop', handleImageDrop);
    imageDropzone.addEventListener('click', function() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', handleImageSelect);
        input.click();
    });
    
    if (modNameInput) {
        modNameInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\s+/g, '_');
            updateIniPreview();
            updateCreateButton();
        });
    }
    if (moderlisterInput) {
        moderlisterInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\s+/g, '_');
            updateIniPreview();
            updateCreateButton();
        });
    }
    if (royaltyLinksInput) {
        royaltyLinksInput.addEventListener('input', updateIniPreview);
    }
    
    if (createPackBtn) {
        createPackBtn.addEventListener('click', createPackZip);
    }
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAll);
    }
    
    var cropCloseBtn = document.getElementById('smk-crop-close');
    var cropZoomInBtn = document.getElementById('smk-crop-zoom-in');
    var cropZoomOutBtn = document.getElementById('smk-crop-zoom-out');
    var cropApplyBtn = document.getElementById('smk-crop-apply');
    
    if (cropCloseBtn) cropCloseBtn.addEventListener('click', closeCropModal);
    if (cropZoomInBtn) cropZoomInBtn.addEventListener('click', cropZoomIn);
    if (cropZoomOutBtn) cropZoomOutBtn.addEventListener('click', cropZoomOut);
    if (cropApplyBtn) cropApplyBtn.addEventListener('click', applyCropImage);
    
    updateIniPreview();
}

function handleMusicDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dropzone-active');
}

function handleMusicDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dropzone-active');
    
    var files = e.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('audio/') || files[i].name.match(/\.(mp3|wav|ogg|flac|m4a|aac|wma|aiff|ape)$/i)) {
            addMusicFile(files[i]);
        }
    }
}

function handleMusicSelect(e) {
    var files = e.target.files;
    for (var i = 0; i < files.length; i++) {
        addMusicFile(files[i]);
    }
}

function addMusicFile(file) {
    var fileName = file.name.replace(/\.[^\.]+$/, '');
    if (smkState.musicFiles.some(function(f) { return f.name === fileName; })) return;
    
    smkState.musicFiles.push({
        name: fileName,
        file: file,
        playback: ''
    });
    
    renderMusicList();
    updateIniPreview();
    updateCreateButton();
}

function renderMusicList() {
    var container = document.getElementById('smk-music-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    smkState.musicFiles.forEach(function(item, index) {
        var div = document.createElement('div');
        div.className = 'music-item';
        
        var nameSpan = document.createElement('span');
        nameSpan.className = 'music-name';
        nameSpan.textContent = item.name;
        
        var controlsDiv = document.createElement('div');
        controlsDiv.className = 'music-controls';
        
        var playbackSelect = document.createElement('select');
        playbackSelect.className = 'playback-select';
        var optEmpty = document.createElement('option');
        optEmpty.value = '';
        optEmpty.textContent = '--';
        var optLoop = document.createElement('option');
        optLoop.value = 'loop';
        optLoop.textContent = 'loop';
        var optOnce = document.createElement('option');
        optOnce.value = 'once';
        optOnce.textContent = 'once';
        playbackSelect.appendChild(optEmpty);
        playbackSelect.appendChild(optLoop);
        playbackSelect.appendChild(optOnce);
        playbackSelect.value = item.playback;
        playbackSelect.addEventListener('change', function(e) {
            smkState.musicFiles[index].playback = e.target.value;
            updateIniPreview();
        });
        
        var playBtn = document.createElement('button');
        playBtn.className = 'btn-play';
        playBtn.setAttribute('data-index', index);
        playBtn.innerHTML = '▶';
        playBtn.addEventListener('click', function() {
            playMusicPreview(item.file, index, playBtn);
        });
        
        var removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = '✕';
        removeBtn.addEventListener('click', function() {
            removeMusicItem(index);
        });
        
        controlsDiv.appendChild(playbackSelect);
        controlsDiv.appendChild(playBtn);
        controlsDiv.appendChild(removeBtn);
        
        div.appendChild(nameSpan);
        div.appendChild(controlsDiv);
        
        container.appendChild(div);
    });
}

function removeMusicItem(index) {
    smkState.musicFiles.splice(index, 1);
    renderMusicList();
    updateIniPreview();
    updateCreateButton();
}

function playMusicPreview(file, index, btn) {
    if (smkState.currentAudio && smkState.currentPlayingIndex === index) {
        smkState.currentAudio.pause();
        smkState.currentAudio = null;
        smkState.currentPlayingIndex = null;
        btn.innerHTML = '▶';
        return;
    }
    
    if (smkState.currentAudio) {
        smkState.currentAudio.pause();
        var prevBtn = document.querySelector('.btn-play[data-index="' + smkState.currentPlayingIndex + '"]');
        if (prevBtn) prevBtn.innerHTML = '▶';
    }
    
    var audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.play();
    smkState.currentAudio = audio;
    smkState.currentPlayingIndex = index;
    btn.innerHTML = '■';
    
    audio.addEventListener('ended', function() {
        smkState.currentAudio = null;
        smkState.currentPlayingIndex = null;
        btn.innerHTML = '▶';
    });
}

function handleImageDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dropzone-active');
}

function handleImageDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dropzone-active');
    
    var files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        processImage(files[0]);
    }
}

function handleImageSelect(e) {
    var files = e.target.files;
    if (files.length > 0) {
        processImage(files[0]);
    }
}

function processImage(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        smkState.cropState = {
            originalImage: e.target.result,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            isDragging: false,
            startX: 0,
            startY: 0
        };
        openCropModal();
    };
    reader.readAsDataURL(file);
}

function openCropModal() {
    var modal = document.getElementById('smk-crop-modal');
    var cropImg = document.getElementById('smk-crop-image');
    var container = document.getElementById('smk-crop-container');
    
    if (!modal || !cropImg || !smkState.cropState) return;
    
    cropImg.src = smkState.cropState.originalImage;
    
    cropImg.onload = function() {
        var imgWidth = cropImg.naturalWidth;
        var imgHeight = cropImg.naturalHeight;
        var containerSize = 500;
        
        var minScale = Math.max(containerSize / imgWidth, containerSize / imgHeight);
        smkState.cropState.scale = minScale;
        smkState.cropState.minScale = minScale;
        
        cropImg.style.width = (imgWidth * smkState.cropState.scale) + 'px';
        cropImg.style.height = (imgHeight * smkState.cropState.scale) + 'px';
        
        smkState.cropState.offsetX = (containerSize - imgWidth * smkState.cropState.scale) / 2;
        smkState.cropState.offsetY = (containerSize - imgHeight * smkState.cropState.scale) / 2;
        
        cropImg.style.left = smkState.cropState.offsetX + 'px';
        cropImg.style.top = smkState.cropState.offsetY + 'px';
    };
    
    modal.style.display = 'block';
    
    container.onmousedown = function(e) {
        smkState.cropState.isDragging = true;
        smkState.cropState.startX = e.clientX - smkState.cropState.offsetX;
        smkState.cropState.startY = e.clientY - smkState.cropState.offsetY;
        container.style.cursor = 'grabbing';
    };
    
    container.onmousemove = function(e) {
        if (!smkState.cropState.isDragging) return;
        smkState.cropState.offsetX = e.clientX - smkState.cropState.startX;
        smkState.cropState.offsetY = e.clientY - smkState.cropState.startY;
        cropImg.style.left = smkState.cropState.offsetX + 'px';
        cropImg.style.top = smkState.cropState.offsetY + 'px';
    };
    
    container.onmouseup = function() {
        smkState.cropState.isDragging = false;
        container.style.cursor = 'grab';
    };
    
    container.onmouseleave = function() {
        smkState.cropState.isDragging = false;
        container.style.cursor = 'grab';
    };
}

function closeCropModal() {
    var modal = document.getElementById('smk-crop-modal');
    if (modal) modal.style.display = 'none';
}

function cropZoomIn() {
    if (!smkState.cropState) return;
    smkState.cropState.scale *= 1.2;
    applyCropScale();
}

function cropZoomOut() {
    if (!smkState.cropState) return;
    smkState.cropState.scale = Math.max(smkState.cropState.minScale, smkState.cropState.scale * 0.8);
    applyCropScale();
}

function applyCropScale() {
    var cropImg = document.getElementById('smk-crop-image');
    if (!cropImg) return;
    
    cropImg.style.width = (cropImg.naturalWidth * smkState.cropState.scale) + 'px';
    cropImg.style.height = (cropImg.naturalHeight * smkState.cropState.scale) + 'px';
}

function applyCropImage() {
    var cropImg = document.getElementById('smk-crop-image');
    var container = document.getElementById('smk-crop-container');
    if (!cropImg || !container || !smkState.cropState) return;
    
    var canvas = document.getElementById('smk-image-canvas');
    var ctx = canvas.getContext('2d');
    
    canvas.width = 1080;
    canvas.height = 1080;
    
    var containerSize = 500;
    var outputSize = 1080;
    
    var scaleToOriginal = outputSize / containerSize;
    
    var srcX = -smkState.cropState.offsetX * (cropImg.naturalWidth / (cropImg.naturalWidth * smkState.cropState.scale));
    var srcY = -smkState.cropState.offsetY * (cropImg.naturalHeight / (cropImg.naturalHeight * smkState.cropState.scale));
    var srcW = containerSize / smkState.cropState.scale;
    var srcH = containerSize / smkState.cropState.scale;
    
    ctx.drawImage(cropImg, srcX, srcY, srcW, srcH, 0, 0, 1080, 1080);
    
    canvas.toBlob(function(blob) {
        smkState.imageData = {
            blob: blob,
            fileName: null
        };
        
        var preview = document.getElementById('smk-image-preview');
        if (preview) {
            preview.innerHTML = '<img src="' + URL.createObjectURL(blob) + '" alt="Preview" style="max-width: 200px; border-radius: 8px;">';
        }
        
        updateCreateButton();
        closeCropModal();
    }, 'image/webp', 0.9);
}

function generateIniContent() {
    var modName = document.getElementById('smk-mod-name') ? document.getElementById('smk-mod-name').value.trim() : '';
    var moderlister = document.getElementById('smk-moderlister') ? document.getElementById('smk-moderlister').value.trim() : '';
    
    if (!modName || !moderlister || smkState.musicFiles.length === 0) return '';
    
    var lines = [];
    lines.push(';OSoundtracks-SA-Expansion-Sounds-NG');
    lines.push('');
    lines.push(';Example of code designs: it\'s very similar to SPID but shorter and simpler.');
    lines.push('');
    lines.push(';SoundKey = AnimationKeyName|SoundNameFile|Playback');
    lines.push(';SoundEffectKey = MoodName|SoundNameFile|Playback');
    lines.push(';SoundPositionKey = PositionKeyword|SoundNameFile|Playback');
    lines.push(';SoundTAGKey = TagName|SoundNameFile|Playback');
    lines.push(';SoundMenuKey = ModerLister|SoundNameFile|Playback');
    lines.push('');
    lines.push(';AnimationKeyName: Animation event message');
    lines.push('');
    lines.push(';MoodName: Mood state related to the animation (e.g., alegria)');
    lines.push('');
    lines.push(';PositionKeyword: Keyword representing the animation or position (e.g., kiss)');
    lines.push('');
    lines.push(';SoundNameFile: Sound file located at \\sound\\OSoundtracks\\Example.mp3');
    lines.push('');
    lines.push(';Playback: Support for \'loop\' and \'once\' keywords');
    lines.push('');
    lines.push(';SoundMenuKey: Menu musica');
    lines.push('');
    lines.push('');
    lines.push(';------------------------------------------------------------------------------------------------------');
    lines.push(';------------------------------------------------------------------------------------------------------');
    lines.push('');
    lines.push('');
    
    smkState.musicFiles.forEach(function(item) {
        var playback = item.playback || '';
        lines.push(';' + moderlister);
        lines.push('SoundMenuKey = ' + moderlister + '|' + item.name + '|' + playback);
        lines.push('');
    });
    
    return lines.join('\r\n');
}

function updateIniPreview() {
    var preview = document.getElementById('smk-ini-preview');
    if (!preview) return;
    
    var content = generateIniContent();
    if (content) {
        preview.textContent = content;
    } else {
        preview.textContent = 'Fill Pack Name, Creator Name, and add music files to generate INI preview...';
    }
}

function updateCreateButton() {
    var btn = document.getElementById('smk-create-pack');
    if (!btn) return;
    
    var modName = document.getElementById('smk-mod-name') ? document.getElementById('smk-mod-name').value.trim() : '';
    var moderlister = document.getElementById('smk-moderlister') ? document.getElementById('smk-moderlister').value.trim() : '';
    
    var isValid = modName && moderlister && smkState.musicFiles.length > 0;
    btn.disabled = !isValid;
}

function createPackZip() {
    var modName = document.getElementById('smk-mod-name').value.trim();
    var moderlister = document.getElementById('smk-moderlister').value.trim();
    var royaltyLinks = document.getElementById('smk-royalty-links') ? document.getElementById('smk-royalty-links').value.trim() : '';
    
    if (!modName || !moderlister || smkState.musicFiles.length === 0) {
        showToast('Please fill all required fields');
        return;
    }
    
    showCreatingToast('Creating pack... Working on the pack meow');
    
    var zip = new JSZip();
    
    var iniContent = generateIniContent();
    var iniFileName = 'OSoundtracks_(' + modName + '_' + moderlister + ').ini';
    zip.file(iniFileName, iniContent);
    
    var soundFolder = zip.folder('sound').folder('OSoundtracks');
    smkState.musicFiles.forEach(function(item) {
        soundFolder.file(item.name + '.mp3', item.file);
    });
    
    if (royaltyLinks) {
        var royaltyFileName = 'Sound_' + modName + '_Royalty-free_Links.txt';
        var royaltyHeaderText = 'All sounds or music used in this project are Royalty-free, free to access and reproduce, not for profit. \r\n' +
            'I really like music, and it truly gives a better atmosphere to the game\'s scenes and effects, \r\n' +
            'so many thanks to the creators who publish their music or effects, I will also make my own and publish them.\r\n\r\n';
        soundFolder.file(royaltyFileName, royaltyHeaderText + royaltyLinks);
    }
    
    if (smkState.imageData) {
        smkState.imageData.fileName = moderlister + '.webp';
        var imageFolder = zip.folder('PrismaUI').folder('views').folder('OSoundtracks-Prisma').folder('Assets').folder('Images');
        imageFolder.file(smkState.imageData.fileName, smkState.imageData.blob);
    }
    
    var zipFileName = 'OSoundtracks ' + modName.replace(/_/g, ' ') + '.zip';
    
    zip.generateAsync({ type: 'blob' }).then(function(blob) {
        hideCreatingToast();
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = zipFileName;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Pack generated! Download starting...');
    }).catch(function(err) {
        hideCreatingToast();
        console.error('Error creating pack:', err);
        showToast('Error creating pack');
    });
}

function clearAll() {
    smkState.musicFiles = [];
    smkState.imageData = null;
    
    if (smkState.currentAudio) {
        smkState.currentAudio.pause();
        smkState.currentAudio = null;
    }
    
    var modNameInput = document.getElementById('smk-mod-name');
    var moderlisterInput = document.getElementById('smk-moderlister');
    var royaltyLinksInput = document.getElementById('smk-royalty-links');
    var musicList = document.getElementById('smk-music-list');
    var imagePreview = document.getElementById('smk-image-preview');
    
    if (modNameInput) modNameInput.value = '';
    if (moderlisterInput) moderlisterInput.value = '';
    if (royaltyLinksInput) royaltyLinksInput.value = '';
    if (musicList) musicList.innerHTML = '';
    if (imagePreview) imagePreview.innerHTML = '';
    
    updateIniPreview();
    updateCreateButton();
    
    showToast('All cleared');
}





