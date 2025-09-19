// Particles.js - Dedicated background particles animation for Race Menu Helper pages
// Creates a full-screen canvas overlay with floating particles on an animated gradient background (gradient handled in CSS)

document.addEventListener('DOMContentLoaded', function() {
    console.log('Race Menu Helper particles animation initialized');

    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        opacity: 0.6;
    `;

    document.body.insertBefore(canvas, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    // Resize canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Particle class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.size = Math.random() * 3 + 1;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.hue = 120 + Math.random() * 60; // Green hues (120-180)
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

            // Keep particles within bounds
            this.x = Math.max(0, Math.min(canvas.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height, this.y));
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = `hsl(${this.hue}, 70%, 60%)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Initialize particles
    function initParticles() {
        particles = [];
        const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        // Draw connections between nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.save();
                    ctx.globalAlpha = 0.1 * (1 - distance / 120);
                    ctx.strokeStyle = 'hsl(140, 70%, 60%)'; // Green connection lines
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    // Initialize
    resizeCanvas();
    initParticles();
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        canvas.remove();
    });
});