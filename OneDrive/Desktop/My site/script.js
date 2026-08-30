const CONFIG = {
    SCROLL_THRESHOLD: 300,
    HERO_HIDE_THRESHOLD: 100,
    COMMAND_PALETTE_COMMANDS: [
        { id: 'about', title: 'About', desc: 'Jump to About section', icon: '👤', href: '#introduction' },
        { id: 'skills', title: 'Skills', desc: 'View my skills & tech stack', icon: '⚙️', href: '#skills' },
        { id: 'achievements', title: 'Achievements', desc: 'My awards & recognition', icon: '🏆', href: '#achievements' },
        { id: 'projects', title: 'Projects', desc: 'View my portfolio projects', icon: '💻', href: '#projects' },
        { id: 'songs', title: 'Favorites', desc: 'My favorite songs', icon: '🎵', href: '#favorites' },
        { id: 'contact', title: 'Contact', desc: 'Get in touch with me', icon: '💬', href: '#contact' },
        { id: 'email', title: 'Copy Email', desc: 'Copy email to clipboard', icon: '📧', action: 'copyEmail' },
        { id: 'github', title: 'GitHub Profile', desc: 'Open my GitHub', icon: '🐙', href: 'https://github.com/jigneshphalsawal-cloud' },
    ]
};

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    if (!themeToggle) return;

    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        htmlElement.classList.add('dark-mode');
        themeToggle.textContent = '☀️ Light Mode';
    }

    themeToggle.addEventListener('click', function() {
        htmlElement.classList.toggle('dark-mode');
        const newTheme = htmlElement.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
}

function initBackToTop() {
    const backToTopButton = document.getElementById('backToTop');
    if (!backToTopButton) return;

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > CONFIG.SCROLL_THRESHOLD) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    }, { passive: true });

    backToTopButton.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScroll > CONFIG.HERO_HIDE_THRESHOLD) {
            if (currentScroll > lastScrollTop) {
                header.classList.add('hide');
            } else {
                header.classList.remove('hide');
            }
        }

        lastScrollTop = Math.max(0, currentScroll);
    }, { passive: true });
}

function initProjectFilters() {
    const filterTags = document.querySelectorAll('.filter-tag');
    const cards = document.querySelectorAll('.card[data-category]');

    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');

            const filter = tag.dataset.filter;
            cards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = '';
                    setTimeout(() => card.classList.add('reveal-active'), 50);
                } else {
                    card.style.display = 'none';
                    card.classList.remove('reveal-active');
                }
            });
        });
    });
}

function initScrollReveal() {
    const reveals = document.querySelectorAll('section, .card, .skill-card, .achievement-card, .song-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

function initCommandPalette() {
    const overlay = document.getElementById('commandPaletteOverlay');
    const palette = document.getElementById('commandPalette');
    const input = document.getElementById('commandPaletteInput');
    const results = document.getElementById('commandPaletteResults');

    if (!overlay || !palette || !input || !results) return;

    function openPalette() {
        overlay.classList.add('active');
        palette.classList.add('active');
        input.focus();
    }

    function closePalette() {
        overlay.classList.remove('active');
        palette.classList.remove('active');
        input.value = '';
        results.innerHTML = '';
    }

    function renderResults(query) {
        results.innerHTML = '';
        const filtered = CONFIG.COMMAND_PALETTE_COMMANDS.filter(cmd =>
            cmd.title.toLowerCase().includes(query.toLowerCase()) ||
            cmd.desc.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length === 0) {
            results.innerHTML = '<li style="padding: 1rem; text-align: center; color: var(--text-light);">No results found</li>';
            return;
        }

        filtered.forEach(cmd => {
            const li = document.createElement('li');
            li.className = 'command-palette-item';
            li.innerHTML = `
                <span class="command-palette-item-icon">${cmd.icon}</span>
                <div class="command-palette-item-content">
                    <div class="command-palette-item-title">${cmd.title}</div>
                    <div class="command-palette-item-desc">${cmd.desc}</div>
                </div>
            `;
            li.addEventListener('click', () => executeCommand(cmd));
            results.appendChild(li);
        });
    }

    function executeCommand(cmd) {
        if (cmd.action === 'copyEmail') {
            navigator.clipboard.writeText('jigneshphalsawal@gmail.com');
            alert('Email copied to clipboard!');
        } else if (cmd.href) {
            if (cmd.href.startsWith('http')) {
                window.open(cmd.href, '_blank');
            } else {
                document.querySelector(cmd.href).scrollIntoView({ behavior: 'smooth' });
            }
        }
        closePalette();
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            palette.classList.contains('active') ? closePalette() : openPalette();
        } else if (e.key === 'Escape') {
            closePalette();
        }
    });

    input.addEventListener('input', (e) => renderResults(e.target.value));
    overlay.addEventListener('click', closePalette);
}

function initParticleCanvas() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles = [];
    const particleCount = Math.min(Math.floor((width * height) / 25000), 50);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 1.8 + 0.8;
            this.alpha = Math.random() * 0.5 + 0.2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(96, 165, 250, ${this.alpha})`;
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    let animationFrameId;
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw connecting constellation lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }

        particles.forEach((p) => {
            p.update();
            p.draw();
        });

        animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }, 150);
    }, { passive: true });
}

function init() {
    initThemeToggle();
    initBackToTop();
    initHeaderScroll();
    initScrollReveal();
    initCommandPalette();
    initProjectFilters();
    initParticleCanvas();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
