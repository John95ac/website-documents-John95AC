// Race Menu Overlay to SlaveTats Helper Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Race Menu Helper application...');

    // Typewriter animation for hero text
    initializeTypewriterAnimation();

    // Simulator animation (after a delay to ensure section is visible)
    initializeSimulatorAnimation();

    // Navigation functionality
    initializeNavigation();

    // Copy functionality
    initializeCopyFunction();

    // Workflow Simulator functionality
    initializeWorkflowSimulator();
});

function initializeTypewriterAnimation() {
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroDescription = document.querySelector('.hero-description');

    if (!heroSubtitle || !heroDescription) return;

    // Clear initial text
    heroSubtitle.textContent = '';
    heroDescription.textContent = '';

    // Show elements first
    heroSubtitle.style.opacity = '1';
    heroDescription.style.opacity = '1';

    const subtitleText = 'A simple tool to convert SlaveTats mods to Race Menu Overlays without Open the Creation Kit';
    const descriptionText = 'Designed to optimize the creation, conversion, and management of NPC tattoos or textures. Focused on the relationship between the RaceMenu and SlaveTats systems. You can convert from one to the other or create from scratch.';

    // Start typewriter effect for subtitle
    typeWriter(subtitleText, heroSubtitle, 12, () => {
        // Start description after subtitle completes
        setTimeout(() => {
            typeWriter(descriptionText, heroDescription, 5);
        }, 300);
    });
}

function typeWriter(text, element, speed, callback) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }

    type();
}

function initializeSimulatorAnimation() {
    // Add some visual feedback for the simulator section
    const simulatorSection = document.getElementById('simulador');
    if (!simulatorSection) return;

    // Observer for when simulator comes into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSimulator();
                observer.unobserve(entry.target);
            }
        });
    });

    observer.observe(simulatorSection);
}

function animateSimulator() {
    // Animate simulator cards
    const cards = document.querySelectorAll('.functionality-card, .feature-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update active nav link
                    navLinks.forEach(nl => nl.classList.remove('active'));
                    link.classList.add('active');
                }
            }
            // For external links (like ../index.html), do nothing and let the default browser action occur.
        });
    });

    // Highlight active section on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Mobile navigation toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
}

function initializeCopyFunction() {
    const copyButtons = document.querySelectorAll('.copy-btn');

    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('onclick');
            if (targetId) {
                // Extract the ID from onclick attribute
                const match = targetId.match(/copyToClipboard\('([^']+)'\)/);
                if (match) {
                    copyToClipboard(match[1]);
                }
            } else {
                // Handle copy result button
                if (button.id === 'copyResult') {
                    const textarea = document.getElementById('generatedRule');
                    if (textarea) {
                        copyTextToClipboard(textarea.value);
                        showCopyFeedback(button);
                    }
                }
            }
        });
    });
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        copyTextToClipboard(element.value || element.textContent);
        const copyBtn = element.closest('.example-editor')?.querySelector('.copy-btn') || 
                       document.querySelector(`[onclick*="${elementId}"]`);
        if (copyBtn) {
            showCopyFeedback(copyBtn);
        }
    }
}

function copyTextToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Text copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        console.log('Text copied using fallback method');
    } catch (err) {
        console.error('Fallback copy failed: ', err);
    }

    document.body.removeChild(textArea);
}

function showCopyFeedback(button) {
    const originalText = button.textContent;
    button.textContent = '✓ Copiado';
    button.style.background = 'rgba(76, 175, 80, 0.8)';

    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
}

function initializeWorkflowSimulator() {
    const generateBtn = document.getElementById('generateBtn');
    const conversionType = document.getElementById('conversionType');
    const inputFile = document.getElementById('inputFile');
    const elementValueInput = document.getElementById('elementValueInput');
    const outputFormat = document.getElementById('outputFormat');
    const generatedRule = document.getElementById('generatedRule');
    const elementValue = document.getElementById('elementValue');

    if (!generateBtn) return;

    // Show/hide mod name input based on DDS workflows
    if (conversionType) {
        conversionType.addEventListener('change', () => {
            const isDDS = conversionType.value.includes('dds');
            if (elementValue) {
                elementValue.style.display = isDDS ? 'block' : 'none';
            }
        });
    }

    generateBtn.addEventListener('click', () => {
        generateWorkflowResult();
    });

    function generateWorkflowResult() {
        const type = conversionType?.value || 'st-to-rm';
        const input = inputFile?.value || 'ejemplo.json';
        const modName = elementValueInput?.value || 'MiModOverlay';
        const format = outputFormat?.value || 'zip';

        let result = generateWorkflowForType(type, input, modName, format);

        if (generatedRule) {
            generatedRule.value = result;

            // Animate the result appearing
            generatedRule.style.opacity = '0.5';
            setTimeout(() => {
                generatedRule.style.transition = 'opacity 0.5s ease';
                generatedRule.style.opacity = '1';
            }, 100);
        }
    }

    function generateWorkflowForType(type, input, modName, format) {
        const timestamp = new Date().toLocaleString();

        switch(type) {
            case 'st-to-rm':
                return `# Race Menu Helper - SlaveTats → RaceMenu Workflow
# Generado: ${timestamp}
# Entrada: ${input}

PASO 1: Análisis del JSON
=============================
✓ Archivo cargado: ${input}
✓ Parsing de entradas de tatuajes
✓ Extracción de: name, section, texture, area

PASO 2: Generación de PSC
=============================
✓ Script generado: scripts/Source/${modName}.psc
✓ Llamadas AddBodyPaint/AddWarpaint creadas
✓ Función OnInit() implementada

PASO 3: Estructura de Overlays
=============================
✓ Carpeta creada: textures/Actors/Character/Overlays/${modName}/
✓ Archivos DDS copiados y organizados
✓ Rutas actualizadas en el script

PASO 4: Compilación (Opcional)
=============================
→ Usar PCA Helper para compilar PSC → PEX
→ Configurar rutas de MO2
→ Compilación automática disponible

PASO 5: Empaquetado
=============================
✓ Formato de salida: ${format.toUpperCase()}
✓ Estructura de mod completada
✓ Listo para distribución

RESULTADO: Mod RaceMenu completo listo para usar`;

            case 'rm-to-st':
                return `# Race Menu Helper - RaceMenu → SlaveTats Workflow
# Generado: ${timestamp}
# Entrada: ${input}

PASO 1: Análisis del PSC
=============================
✓ Archivo PSC cargado: ${input}
✓ Extracción de llamadas Add*Paint
✓ Análisis de rutas de texturas

PASO 2: Generación de JSON
=============================
✓ JSON normalizado creado
✓ Entradas de tatuajes estructuradas
✓ Metadatos de sección y área asignados

PASO 3: Estructura SlaveTats
=============================
✓ Carpeta creada: textures/actors/character/slavetats/${modName}/
✓ Archivos DDS reorganizados
✓ Estructura compatible con SlaveTats

PASO 4: Empaquetado
=============================
✓ Formato de salida: ${format.toUpperCase()}
✓ JSON incluido en el paquete
✓ Limpieza automática de archivos temporales

RESULTADO: Mod SlaveTats listo para distribución`;

            case 'dds-to-st':
                return `# Race Menu Helper - DDS → SlaveTats Workflow
# Generado: ${timestamp}
# Proyecto: ${modName}

PASO 1: Análisis de DDS
=============================
✓ Carpeta DDS escaneada
✓ Archivos detectados automáticamente
✓ Tabla editable preparada

PASO 2: Configuración Manual
=============================
→ Asignar Section (grupo) para cada DDS
→ Seleccionar Area: Body/Feet/Hand/Face
→ Definir nombres descriptivos

PASO 3: Exportación JSON
=============================
✓ JSON generado: ${modName}.json
✓ Estructura SlaveTats válida
✓ Backup automático creado

PASO 4: Creación de Mod
=============================
✓ Estructura: textures/actors/character/slavetats/${modName}/
✓ DDS copiados y organizados
✓ Formato de salida: ${format.toUpperCase()}

RESULTADO: Mod SlaveTats creado desde cero`;

            case 'dds-to-rm':
                return `# Race Menu Helper - DDS → RaceMenu Workflow
# Generado: ${timestamp}
# Proyecto: ${modName}

PASO 1: Análisis de DDS
=============================
✓ Carpeta DDS escaneada
✓ Archivos detectados automáticamente
✓ Tabla editable preparada

PASO 2: Configuración Manual
=============================
→ Asignar Type: BodyPaint/Warpaint/HandPaint/FeetPaint/FacePaint
→ Definir nombres descriptivos para cada overlay
→ Verificar rutas de archivos

PASO 3: Exportación PSC
=============================
✓ Script generado: scripts/Source/${modName}.psc
✓ Función OnInit() con llamadas apropiadas
✓ Backup automático creado

PASO 4: Estructura Overlays
=============================
✓ Carpeta: textures/Actors/Character/Overlays/${modName}/
✓ DDS organizados por tipo
✓ Rutas actualizadas en PSC

PASO 5: Compilación y ESP
=============================
→ Usar PCA Helper para PSC → PEX
→ Usar script Pascal en SSEdit para crear ESP
→ Asignar quest y FormID

PASO 6: Empaquetado
=============================
✓ Formato de salida: ${format.toUpperCase()}
✓ Estructura completa de mod
✓ Listo para distribución

RESULTADO: Mod RaceMenu completo creado desde cero`;

            default:
                return `# Race Menu Helper - Workflow Simulator
# Selecciona un tipo de conversión válido para ver el resultado detallado.`;
        }
    }

    // Initialize with default
    generateWorkflowResult();
}

// Utility function for smooth animations
function animateOnScroll() {
    const elements = document.querySelectorAll('.functionality-card, .feature-card, .arch-step, .security-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Initialize animations
animateOnScroll();

console.log('Race Menu Helper application initialized successfully');