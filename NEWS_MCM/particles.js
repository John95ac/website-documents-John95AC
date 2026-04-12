document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 280;
    canvas.height = window.innerHeight;
    
    let particlesArray = [];
    const numberOfParticles = 50;
    let particleColor = { r: 0, g: 188, b: 212 };
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        draw() {
            ctx.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function initParticles() {
        particlesArray = [];
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        requestAnimationFrame(animateParticles);
    }
    
    function hexToRgb(hex) {
        if (!hex) return null;
        hex = hex.trim();
        if (hex.startsWith('rgb')) {
            const m = hex.match(/(\d+),\s*(\d+),\s*(\d+)/);
            return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
        }
        if (hex[0] === '#') hex = hex.slice(1);
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        if (Number.isNaN(num)) return null;
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }
    
    function updateParticleColorFromTheme() {
        const primary = getComputedStyle(document.body).getPropertyValue('--primary').trim();
        const rgb = hexToRgb(primary);
        if (rgb) particleColor = rgb;
    }
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth - 280;
        canvas.height = window.innerHeight;
        initParticles();
    });
    
    updateParticleColorFromTheme();
    initParticles();
    animateParticles();
});
