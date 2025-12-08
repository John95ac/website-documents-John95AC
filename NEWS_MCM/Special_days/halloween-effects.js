// halloween-effects.js
(function() {
    let halloweenInterval = null; // Variable global para el intervalo

    // Verificar si es Halloween (10-01 a 10-31)
    function isHalloween() {
        const now = new Date();
        const month = now.getMonth() + 1; // 0-based
        const day = now.getDate();
        return month === 10 && day >= 1 && day <= 31;
    }


    // Crear efectos de Halloween
    function activateHalloweenEffects() {
        if (sessionStorage.getItem('disableHalloweenEffects')) return;

        const container = document.getElementById('halloween-effects-container');
        if (!container) return;


        // Limpiar intervalo anterior si existe
        if (halloweenInterval) clearInterval(halloweenInterval);

        const emojis = ['🎃', '👻', '🕷️', '🕸️', '🦇', '💀', '👽', '🧛', '🧟', '🧙', '🧌', '🕯️', '🔮', '📜', '🕰️', '🌑', '🌒'];
        halloweenInterval = setInterval(() => {
            const emoji = document.createElement('div');
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.position = 'absolute';
            emoji.style.left = Math.random() * 100 + 'vw';
            emoji.style.fontSize = (Math.random() * 2 + 1) + 'rem';
            emoji.style.opacity = '0.05';
            emoji.style.filter = 'blur(0.2px)';
            emoji.style.zIndex = '-1';
            emoji.style.animation = 'halloween-fall 10s linear forwards';
            container.appendChild(emoji);

            setTimeout(() => emoji.remove(), 10000);
        }, 1000);

        // Agregar emoji fijo de Halloween en esquina inferior derecha
        const fixedHalloween = document.createElement('div');
        fixedHalloween.textContent = '🎃';
        fixedHalloween.style.position = 'fixed';
        fixedHalloween.style.bottom = '-10px';
        fixedHalloween.style.right = '20px';
        fixedHalloween.style.fontSize = '4rem';
        fixedHalloween.style.opacity = '0.05';
        fixedHalloween.style.filter = 'blur(0.2px)';
        fixedHalloween.style.zIndex = '-1';
        fixedHalloween.style.pointerEvents = 'none';
        container.appendChild(fixedHalloween);
        // Agregar segundo emoji fijo de Halloween en esquina inferior izquierda
                const fixedHalloweenLeft = document.createElement('div');
                fixedHalloweenLeft.textContent = '👻';
                fixedHalloweenLeft.style.position = 'fixed';
                fixedHalloweenLeft.style.bottom = '-25px';
                fixedHalloweenLeft.style.left = '10px';
                fixedHalloweenLeft.style.fontSize = '8rem';
                fixedHalloweenLeft.style.opacity = '0.05';
                fixedHalloweenLeft.style.filter = 'blur(0.2px)';
                fixedHalloweenLeft.style.zIndex = '-1';
                fixedHalloweenLeft.style.pointerEvents = 'none';
                container.appendChild(fixedHalloweenLeft);


        // CSS para animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes halloween-fall {
                0% { transform: translateY(-100px) rotate(0deg); }
                100% { transform: translateY(100vh) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // Detener después de 5 horas para no sobrecargar
        setTimeout(() => {
            if (halloweenInterval) {
                clearInterval(halloweenInterval);
                halloweenInterval = null;
            }
        }, 18000000);
    }

    // Función para detener efectos
    function stopHalloweenEffects() {
        if (halloweenInterval) {
            clearInterval(halloweenInterval);
            halloweenInterval = null;
        }
        const container = document.getElementById('halloween-effects-container');
        if (container) {
            container.innerHTML = ''; // Limpiar emojis existentes
        }
    }

    // Exponer funciones globales
    window.activateHalloweenEffects = activateHalloweenEffects;
    window.stopHalloweenEffects = stopHalloweenEffects;

    // Activar al cargar la página
    document.addEventListener('DOMContentLoaded', () => {
        if (isHalloween()) activateHalloweenEffects();
    });
})();