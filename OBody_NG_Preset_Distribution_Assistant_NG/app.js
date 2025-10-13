// SKSE OBody NG Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');

    // Typewriter animation for hero text
    initializeTypewriterAnimation();

    // Navigation functionality
    initializeNavigation();

    // Copy functionality
    initializeCopyFunction();

    // INI Simulator functionality
    initializeINISimulator();

    // Scroll spy for navigation
    initializeScrollSpy();

    // Mobile menu toggle
    initializeMobileMenu();

    // Initialize enhanced features
    setTimeout(initializeEnhancedFeatures, 100);
});

// Global variable for permanent rules (shared between functions)
let permanentRules = '';

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

            const targetId = href.substring(1);
            const targetSection = document.getElementById(targetId);
            console.log('Target section:', targetId, !!targetSection);

            if (targetSection) {
                // Close mobile menu if open
                closeMobileMenu();

                // Calculate scroll position
                const navbar = document.querySelector('.navbar');
                const navHeight = navbar ? navbar.offsetHeight : 80;
                const targetPosition = targetSection.offsetTop - navHeight - 10;
                console.log('Scrolling to position:', targetPosition);

                // Scroll to target section
                window.scrollTo({
                    top: Math.max(0, targetPosition),
                    behavior: 'smooth'
                });

                // Update active link immediately
                updateActiveNavLink(this);

                // Also update after scroll completes
                setTimeout(() => {
                    updateActiveNavLink(this);
                }, 800);
            } else {
                console.error('Target section not found:', targetId);
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
 * Initialize copy functionality for INI editor
 */
function initializeCopyFunction() {
    const copyBtn = document.getElementById('copyBtn');
    const iniEditor = document.getElementById('iniEditor');

    if (copyBtn && iniEditor) {
        console.log('Copy functionality initialized');
        copyBtn.addEventListener('click', function() {
            console.log('Copy button clicked');
            copyToClipboard(iniEditor.value, this);
        });
    } else {
        console.warn('Copy elements not found:', { copyBtn: !!copyBtn, iniEditor: !!iniEditor });
    }

    // Initialize copy for simulator
    const copyRuleBtn = document.getElementById('copyRuleBtn');
    const generatedRule = document.getElementById('generatedRule');

    if (copyRuleBtn && generatedRule) {
        console.log('Rule copy functionality initialized');
        copyRuleBtn.addEventListener('click', function() {
            console.log('Copy rule button clicked');
            let ruleText = generatedRule.innerText.trim();

            if (ruleText === '' || ruleText.includes('Complete all fields')) {
                showCopyError(this, 'Generate a rule first');
                return;
            }

            // If there's a preview (ends with comment + rule), copy all; else just permanent
            const lines = ruleText.split('\n');
            if (lines.length >= 2 && lines[lines.length - 2].startsWith(';') && lines[lines.length - 1].includes('=')) {
                ruleText = ruleText;
            } else {
                ruleText = permanentRules.trim();
            }

            if (!ruleText) {
                showCopyError(this, 'No rules to copy');
                return;
            }

            copyToClipboard(ruleText, this);
        });
    }

    // Initialize clean button for simulator
    const cleanRuleBtn = document.getElementById('cleanRuleBtn');
    if (cleanRuleBtn && generatedRule) {
        console.log('Clean functionality initialized');
        cleanRuleBtn.addEventListener('click', function() {
            console.log('Clean button clicked');
            permanentRules = '';
            generatedRule.innerHTML = '';

            // Show clean feedback
            const originalText = this.innerHTML;
            const originalColor = this.style.backgroundColor;
            this.innerHTML = '🗑️ CLEANED!';
            this.disabled = true;

            setTimeout(() => {
                this.innerHTML = originalText;
                this.style.backgroundColor = originalColor;
                this.disabled = false;
            }, 1500);
        });
    }
}

/**
 * Download INI file
 */
function downloadINIFile(content, fileName, button) {
    try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = fileName;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        // Show success feedback
        const originalText = button.innerHTML;
        const originalColor = button.style.backgroundColor;

        button.innerHTML = '✓ Downloaded!';
        button.style.backgroundColor = 'var(--color-success)';
        button.disabled = true;

        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.backgroundColor = originalColor;
            button.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Download failed:', error);
        showCopyError(button, '❌ Error al descargar');
    }
}

/**
 * Copy text to clipboard with fallback
 */
function copyToClipboard(text, button) {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess(button);
        }).catch((err) => {
            console.error('Clipboard API failed:', err);
            fallbackCopy(text, button);
        });
    } else {
        fallbackCopy(text, button);
    }
}

/**
 * Highlight INI rule syntax
 */
function highlightRule(text) {
    const lines = text.split('\n');
    const htmlLines = lines.map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith(';')) {
            return `<span style="color: var(--color-text-secondary);">${line}</span>`;
        }
        if (!trimmedLine.includes('=')) {
            return line;
        }

        const parts = line.split('=');
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        const valueParts = value.split('|');

        let element = '', presets = '', mode = '';
        if (valueParts.length > 0) element = valueParts[0].trim();
        if (valueParts.length > 1) presets = valueParts[1].trim();
        if (valueParts.length > 2) mode = valueParts[2].trim();

        let highlightedValue = `<span class="rule-element">${element}</span>`;
        if (presets || valueParts.length > 1) {
            highlightedValue += `|<span class="rule-presets">${presets}</span>`;
        }
        if (mode || valueParts.length > 2) {
            highlightedValue += `|<span class="rule-mode">${mode}</span>`;
        }

        return `<span class="rule-key">${key}</span> = ${highlightedValue}`;
    });
    return htmlLines.join('\n');
}

/**
 * Initialize INI Simulator functionality
 */
function initializeINISimulator() {
    const newRuleBtn = document.getElementById('newRule');
    const ruleTypeSelect = document.getElementById('ruleType');
    const elementValueSelect = document.getElementById('elementValue');
    const elementValueInput = document.getElementById('elementValueInput');
    const presetsInput = document.getElementById('presets');
    const modeSelect = document.getElementById('mode');
    const generatedRuleEl = document.getElementById('generatedRule');

    if (!newRuleBtn || !ruleTypeSelect || !elementValueSelect || !elementValueInput || !presetsInput || !modeSelect || !generatedRuleEl) {
        console.warn('Simulator elements not found');
        return;
    }

    console.log('INI Simulator initialized');

    // Use global permanentRules

    // Sample data for quick fills
    const sampleData = {
        npcFormID: {
            values: ['xx0001', '0x12345', '0xABCDE'],
            presets: ['PresetA,PresetB,PresetC']
        },
        npc: {
            values: ['Serana', 'Lydia', 'Aela', 'Mjoll'],
            presets: ['Custom Preset 1,Custom Preset 2']
        },
        factionFemale: {
            values: ['ImperialFaction', 'StormcloakFaction', 'GuardFaction'],
            presets: ['Imperial Body,Noble Body']
        },
        factionMale: {
            values: ['ImperialFaction', 'StormcloakFaction', 'GuardFaction'],
            presets: ['Imperial Male,Noble Male']
        },
        npcPluginFemale: {
            values: ['YurianaWench.esp', 'Immersive Wenches.esp', 'Miya_follower.esp'],
            presets: ['Wench Body 2.0 Naked Body SSE,!CCPoundcakeNaked2']
        },
        npcPluginMale: {
            values: ['Plugin222.esp', 'Zapato.esp', 'Male_follower.esp'],
            presets: ['Male Body Preset 1,Male Body Preset 2']
        },
        raceFemale: {
            values: ['NordRace', 'ImperialRace', 'BretonRace'],
            presets: ['Nordic Female,Orcish Female']
        },
        raceMale: {
            values: ['NordRace', 'ImperialRace', 'BretonRace'],
            presets: ['Nordic Male,Orcish Male']
        }
    };

    // Handle rule type changes
    ruleTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;

        // Show/hide appropriate input based on rule type
        if (selectedType === 'raceFemale' || selectedType === 'raceMale') {
            elementValueSelect.style.display = 'block';
            elementValueInput.style.display = 'none';
            elementValueSelect.value = '';
        } else {
            elementValueSelect.style.display = 'none';
            elementValueInput.style.display = 'block';
            elementValueInput.value = '';
        }

        // Auto-fill sample data
        const data = sampleData[selectedType];
        if (data) {
            const randomPresets = data.presets[Math.floor(Math.random() * data.presets.length)];
            presetsInput.value = randomPresets;

            if (selectedType !== 'raceFemale' && selectedType !== 'raceMale') {
                const randomValue = data.values[Math.floor(Math.random() * data.values.length)];
                elementValueInput.value = randomValue;
            }
        }

        // Clear presets and mode if no type selected
        if (!selectedType) {
            presetsInput.value = '';
            modeSelect.value = '';
        }
    });

    // Handle race dropdown changes
    elementValueSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            this.style.display = 'none';
            elementValueInput.style.display = 'block';
            elementValueInput.placeholder = 'Escribe la raza personalizada...';
            elementValueInput.focus();
        }
    });

    // New rule button functionality
    newRuleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const ruleType = ruleTypeSelect.value;
        const elementValue = (elementValueSelect.style.display !== 'none' && elementValueSelect.value !== 'custom')
            ? elementValueSelect.value
            : elementValueInput.value.trim();
        const presets = presetsInput.value.trim();
        const mode = modeSelect.value;

        if (!ruleType || !elementValue || !presets) {
            generatedRuleEl.innerHTML = highlightRule(permanentRules || '; Complete all fields to generate the INI rule');
            return;
        }

        // Generate new permanent rule
        const modeDescriptions = {
            'x': 'simple application',
            '': 'simple application',
            '1': 'once',
            '0': 'disabled',
            '-': 'remove preset',
            'x-': 'unlimited remove',
            '*': 'remove element',
            'x*': 'unlimited element remove'
        };
        const modeDesc = modeDescriptions[mode] || mode;
        const comment = `;${elementValue} presets in mode ${modeDesc}`;
        const rule = `${ruleType} = ${elementValue}|${presets}|${mode}`;
        const newRuleText = `${comment}\n${rule}`;

        // Add to permanent rules
        permanentRules += (permanentRules ? '\n\n' : '') + newRuleText;
        generatedRuleEl.innerHTML = highlightRule(permanentRules);

        // Clear form for new rule but keep rule type
        if (elementValueSelect.style.display !== 'none') {
            elementValueSelect.value = '';
        } else {
            elementValueInput.value = '';
        }

        presetsInput.value = '';
        modeSelect.value = '';
        console.log('New permanent rule added:', rule);
    });

    // Live preview when inputs change
    [ruleTypeSelect, elementValueSelect, elementValueInput, presetsInput, modeSelect].forEach(element => {
        element.addEventListener('input', updatePreview);
        element.addEventListener('change', updatePreview);
    });

    function updatePreview() {
        const ruleType = ruleTypeSelect.value;
        const elementValue = (elementValueSelect.style.display !== 'none' && elementValueSelect.value !== 'custom')
            ? elementValueSelect.value
            : elementValueInput.value.trim();
        const presets = presetsInput.value.trim();
        const mode = modeSelect.value;

        // Solo mostrar preview si hay datos suficientes
        if (!ruleType || !elementValue || !presets) {
            generatedRuleEl.innerHTML = highlightRule(permanentRules || '; Complete all fields to generate the INI rule');
            return;
        }

        // Generar preview de la nueva regla
        const modeDescriptions = {
            'x': 'simple application',
            '': 'simple application',
            '1': 'once',
            '0': 'disabled',
            '-': 'remove preset',
            'x-': 'unlimited remove',
            '*': 'remove element',
            'x*': 'unlimited element remove'
        };
        const modeDesc = modeDescriptions[mode] || mode;
        const comment = `;${elementValue} presets in mode ${modeDesc}`;
        const rule = `${ruleType} = ${elementValue}|${presets}|${mode}`;
        const previewText = `${comment}\n${rule}`;

        // Mostrar permanent + preview (reemplaza preview anterior)
        generatedRuleEl.innerHTML = highlightRule(permanentRules ? permanentRules + '\n\n' + previewText : previewText);

        console.log('Preview updated:', rule);
    }
}


/**
 * Debounce function to limit rapid function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Fallback copy method
 */
function fallbackCopy(text, button) {
    try {
        // Create a temporary textarea
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = text;
        tempTextarea.style.position = 'fixed';
        tempTextarea.style.left = '-9999px';
        tempTextarea.style.top = '-9999px';

        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        tempTextarea.setSelectionRange(0, 99999); // For mobile devices

        const successful = document.execCommand('copy');
        document.body.removeChild(tempTextarea);

        if (successful) {
            showCopySuccess(button);
        } else {
            showCopyError(button);
        }

        // Deselect
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    } catch (err) {
        console.error('Copy failed:', err);
        showCopyError(button, 'Copy error');
    }
}

/**
 * Show copy success message
 */
function showCopySuccess(button) {
    if (!button) return;

    const originalText = button.innerHTML;
    const originalColor = button.style.backgroundColor;

    button.innerHTML = '✓ Copied!';
    button.style.backgroundColor = 'var(--color-success)';
    button.disabled = true;

    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = originalColor;
        button.disabled = false;
    }, 2000);
}

/**
 * Show copy error message
 */
function showCopyError(button, message = '❌ Error') {
    if (!button) return;

    const originalText = button.innerHTML;
    const originalColor = button.style.backgroundColor;

    button.innerHTML = message;
    button.style.backgroundColor = 'var(--color-error)';
    button.disabled = true;

    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = originalColor;
        button.disabled = false;
    }, 2000);
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

        // Press 'Ctrl+C' to copy INI content when editor is focused
        if (e.key === 'c' && e.ctrlKey) {
            const activeElement = document.activeElement;

            if (activeElement && activeElement.id === 'iniEditor') {
                const copyBtn = document.getElementById('copyBtn');
                if (copyBtn) {
                    e.preventDefault();
                    copyBtn.click();
                }
            }

            if (activeElement && activeElement.id === 'generatedRule') {
                const copyRuleBtn = document.getElementById('copyRuleBtn');
                if (copyRuleBtn) {
                    e.preventDefault();
                    copyRuleBtn.click();
                }
            }
        }
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

// Debug function to check if all elements are found
function debugElementsPresence() {
    const elements = {
        navToggle: document.getElementById('navToggle'),
        navMenu: document.getElementById('navMenu'),
        navLinks: document.querySelectorAll('.nav-link'),
        copyBtn: document.getElementById('copyBtn'),
        iniEditor: document.getElementById('iniEditor'),
        sections: document.querySelectorAll('section[id]'),
        generateRule: document.getElementById('generateRule'),
        ruleType: document.getElementById('ruleType'),
        generatedRule: document.getElementById('generatedRule')
    };

    console.log('Element presence check:', elements);
    return elements;
}

// Export for debugging
window.debugApp = {
    debugElementsPresence,
    initializeNavigation,
    initializeMobileMenu,
    initializeINISimulator
};

/**
 * Initialize typewriter animation for hero section
 */
function initializeTypewriterAnimation() {
    const subtitle = document.querySelector('.hero-subtitle');
    const descriptions = document.querySelectorAll('.hero-description');
 
    if (!subtitle || descriptions.length < 2) {
        console.warn('Hero text elements not found for typewriter animation');
        return;
    }
 
    const [firstDescription, secondDescription] = descriptions;
 
    // Initial state: hide and set empty
    subtitle.style.opacity = '0';
    firstDescription.style.opacity = '0';
    secondDescription.style.opacity = '0';
    subtitle.textContent = '';
    firstDescription.textContent = '';
    secondDescription.textContent = '';
 
    const subtitleText = 'Addition to OBody NG for Automated Preset Distribution for UBE and CBBE, distribution manager and many more functions for Skyrim Special Edition, Compatible with CBBE, 3BA, UBE, HIMBO...';
    const firstDescText = 'A lightweight SKSE DLL mod that automatically detects UBE presets and applies them to the blacklist to prevent generation errors in OBody while simultaneously applying UBE presets to UBE NPCs in the game. It also includes a cleaning and maintenance system for OBody master JSON, and a system that processes simple rules written in INI files, similar to SPID but called PDA, to automatically manage the OBody_presetDistributionConfig.json file without direct intervention, avoiding human errors and reading time.';
    const secondDescText = 'It allows applying predefined presets for NPCs, races, factions, and complete plugins. If you decide to apply a different preset in-game using the \'O\' menu, this will take precedence over the INI modification, so there are no configuration issues. 🐈';
 
    // Typewriter function
    function typeWriter(element, text, speed = 50, callback) {
        let i = 0;
        element.style.opacity = '1';
 
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                if (callback) callback();
            }
        }
        type();
    }
 
    // Animate subtitle first, then first description, then second description
    typeWriter(subtitle, subtitleText, 10, () => {
        // Small delay before starting first description
        setTimeout(() => {
            typeWriter(firstDescription, firstDescText, 8, () => {
                // Delay before second description
                setTimeout(() => {
                    typeWriter(secondDescription, secondDescText, 8);
                }, 500);
            });
        }, 300);
    });
 
    console.log('Typewriter animation started for hero section');
}
