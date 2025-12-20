// SKSE OBody NG Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');

    // Navigation functionality
    initializeNavigation();

    // Scroll spy for navigation
    initializeScrollSpy();

    // Mobile menu toggle
    initializeMobileMenu();

    // Initialize enhanced features
    // Hide all sections except news by default
    const allSections = document.querySelectorAll('.section');
    const newsSection = document.getElementById('news');
    
    allSections.forEach(section => {
        if (section.id === 'news') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    setTimeout(initializeEnhancedFeatures, 100);
});

// Global variable for permanent rules (shared between functions)
// let permanentRules = ''; // Removed as obsolete

/**
 * Initialize navigation functionality
 */
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    console.log('Found navigation links:', navLinks.length);

    // Add click handlers for navigation links
    navLinks.forEach((link, index) => {
        const href = link.getAttribute('href');
        console.log(`Setting up navigation link ${index}:`, href);

        // Skip if not an anchor link
        if (!href || !href.startsWith('#')) {
            console.log('Skipping non-anchor link:', href);
            return;
        }

        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Navigation link clicked:', href);

            if (href === '#') {
                // Show all sections
                const allSections = document.querySelectorAll('.section');
                allSections.forEach(section => section.style.display = 'block');
            } else {
                // 1. PRIMERO: Ocultar TODAS las secciones (para que no se amontonen)
                const allSections = document.querySelectorAll('.section');
                allSections.forEach(section => section.style.display = 'none');

                // 2. SEGUNDO: Mostrar la sección que quieres ver
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    targetSection.style.display = 'block';
                    
                    // 3. TRUCO FINAL: Si es la sección del mapa, forzar recarga
                    if (targetId === 'project-schedule-outline') {
                        const iframe = targetSection.querySelector('iframe');
                        if (iframe) {
                            iframe.src = iframe.src;
                        }
                    }
                }
                
                // Cerrar menú móvil
                closeMobileMenu();
                updateActiveNavLink(this);
            }
        });
    });
}

/**
 * Close mobile menu
 */
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

/**
 * Update active navigation link
 */
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










/**
 * Initialize scroll spy functionality
 */
function initializeScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    console.log('Scroll spy initialized with sections:', sections.length);

    function handleScroll() {
        const scrollPosition = window.scrollY + 150; // Account for navbar height
        let activeSection = null;
        let closestDistance = Infinity;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionBottom = sectionTop + sectionHeight;

            // Check if we're within this section
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                activeSection = section;
            }

            // Also check which section we're closest to
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

    // Add scroll listener with throttling
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

    // Initial call
    setTimeout(handleScroll, 100);
}

/**
 * Initialize mobile menu functionality
 */
function initializeMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    console.log('Mobile menu initialization:', { navToggle: !!navToggle, navMenu: !!navMenu });

    if (navToggle && navMenu) {
        console.log('Mobile menu event listeners added');

        navToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Toggle active classes
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

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            const isClickInsideNav = navToggle.contains(e.target) || navMenu.contains(e.target);

            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                closeMobileMenu();
                console.log('Mobile menu closed (clicked outside)');
            }
        });

        // Close menu on window resize if mobile menu is not visible
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
                closeMobileMenu();
                console.log('Mobile menu closed (window resized)');
            }
        });

        // Close menu when navigation links are clicked
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

/**
 * Initialize enhanced features
 */
function initializeEnhancedFeatures() {
    console.log('Initializing enhanced features...');

    // Add scroll animations if browser supports Intersection Observer
    if ('IntersectionObserver' in window) {
        initializeScrollAnimations();
    }

    // Initialize keyboard navigation
    initializeKeyboardNavigation();

    // Add hover effects for interactive elements
    addHoverEffects();

    // Initialize accessibility features
    initializeAccessibilityFeatures();

    // Add ripple styles
    addRippleStyles();

    // Initialize patron tooltips to fix clipping issues
    initializePatronTooltips();
}

/**
 * Initialize patron tooltips to fix clipping issues in scrollable container
 */
function initializePatronTooltips() {
    const tooltipTargets = document.querySelectorAll('.patrons-names span[data-tooltip], .pie-3d-slice[data-tooltip], .patron-count-badge[data-tooltip]')
    
    // Create a single tooltip element in the body if it doesn't exist
    let tooltipEl = document.getElementById('patron-floating-tooltip');
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'patron-floating-tooltip';
        tooltipEl.className = 'patron-floating-tooltip';
        document.body.appendChild(tooltipEl);
    }

    tooltipTargets.forEach(target => {
        // Prevent duplicate listeners
        if (target.getAttribute('data-tooltip-initialized')) return;
        target.setAttribute('data-tooltip-initialized', 'true');

        target.addEventListener('mouseenter', () => {
            const content = target.getAttribute('data-tooltip');
            if (!content) return;

            tooltipEl.innerHTML = content.replace(/\n/g, '<br>');
            tooltipEl.classList.add('active');
            
            // Position the tooltip
            const rect = target.getBoundingClientRect();
            const tooltipRect = tooltipEl.getBoundingClientRect();
            
            let top = rect.top - tooltipRect.height - 10;
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            
            // Boundary checks
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

        // Hide on click/mousedown
        target.addEventListener('mousedown', () => {
            tooltipEl.classList.remove('active')
        })
    })

    // Initialize image tooltips
    initializeImageTooltips()
}

/**
 * Initialize image tooltips for specific triggers
 */
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
            
            // Boundary check
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

/**
 * Add scroll-triggered animations
 */
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

    // Observe elements that should animate in
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

/**
 * Initialize keyboard navigation support
 */
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Press 'Escape' to close mobile menu
        if (e.key === 'Escape') {
            closeMobileMenu();
        }

        // Copy functionality removed as obsolete
    });
}

/**
 * Add enhanced hover effects
 */
function addHoverEffects() {
    const buttons = document.querySelectorAll('.copy-btn, .btn');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Skip if button is disabled
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

/**
 * Initialize accessibility features
 */
function initializeAccessibilityFeatures() {
    // Add focus indicators for keyboard navigation
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

    // Add skip to content link
    addSkipToContentLink();
}

/**
 * Add skip to content link for accessibility
 */
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

/**
 * Add CSS for ripple effect
 */
function addRippleStyles() {
    // Check if styles already exist
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

// Initialize theme handling
function initializeThemeHandling() {
    // Check for system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // Listen for changes in system preference
    prefersDark.addEventListener('change', (e) => {
        console.log('Theme changed to:', e.matches ? 'dark' : 'light');
    });
}

// Error handling for any JavaScript errors
window.addEventListener('error', function(e) {
    console.warn('Error en la página:', e.error);
});

// Initialize theme handling when DOM is ready
document.addEventListener('DOMContentLoaded', initializeThemeHandling);





