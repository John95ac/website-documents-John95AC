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





