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

function initStatCounters() {
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const h3 = entry.target.querySelector('h3');
                if (h3) {
                    const text = h3.textContent.trim();
                    const numberMatch = text.match(/(\d+)/);
                    if (numberMatch) {
                        const target = parseInt(numberMatch[1], 10);
                        let current = 0;
                        const duration = 1500;
                        const startTime = performance.now();

                        const animate = (currentTime) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const easeOutQuad = 1 - (1 - progress) * (1 - progress);

                            current = Math.floor(target * easeOutQuad);
                            h3.textContent = h3.textContent.replace(/\d+/, current.toString());

                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            }
                        };

                        requestAnimationFrame(animate);
                    }
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    statCards.forEach(card => {
        observer.observe(card);
    });
}

function initTerminal() {
    const terminalInput = document.getElementById('terminalInput');
    const terminalChips = document.querySelectorAll('.terminal-chip');

    if (!terminalInput) return;

    let commandHistory = [];
    let historyIndex = -1;

    // Handle command chips
    terminalChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const command = chip.dataset.command;
            processTerminalCommand(command);
        });
    });

    // Handle Enter key
    terminalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const command = terminalInput.value.trim();
            if (command) {
                processTerminalCommand(command);
                commandHistory.push(command);
                historyIndex = commandHistory.length;
            }
            terminalInput.value = '';
        }
    });

    // Handle Arrow Up/Down for history navigation
    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                terminalInput.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[historyIndex];
            } else {
                historyIndex = commandHistory.length;
                terminalInput.value = '';
            }
        }
    });

    function processTerminalCommand(command) {
        const terminalBody = document.querySelector('.terminal-body');
        if (!terminalBody) return;

        const lines = [
            `<div class="terminal-line"><span class="t-path">~</span> <span class="t-cmd">${command}</span></div>`
        ];

        const cmdLower = command.toLowerCase();

        if (cmdLower === 'clear' || cmdLower === 'cls') {
            terminalBody.innerHTML = '';
            return;
        } else if (cmdLower === 'help') {
            lines.push(`<div class="terminal-line"><span class="t-out">Available commands:</span></div>
                <div class="terminal-line"><span class="t-accent">  help</span>    - Show this help message</div>
                <div class="terminal-line"><span class="t-accent">  about</span>  - Show developer information</div>
                <div class="terminal-line"><span class="t-accent">  skills</span> - Display tech stack</div>
                <div class="t-accent">  projects</span> - View portfolio projects</div>
                <div class="t-accent">  contact</span> - Show contact info</div>
                <div class="t-accent">  theme</span>   - Toggle dark/light mode</div>
                <div class="t-accent">  github</span>  - Show GitHub profile</div>
                <div class="t-accent">  clear</span>  - Clear terminal</div>`);
        } else if (cmdLower === 'about') {
            lines.push(`<div class="terminal-line"><span class="t-success">Jignesh Phalsawal</span> - Full Stack Developer</div>
                <div class="terminal-line"><span class="t-out">Passionate about technology, music, and creative problem-solving.</span></div>
                <div class="terminal-line"><span class="t-muted">Location: 2026 State Topper</span></div>`);
        } else if (cmdLower === 'skills') {
            lines.push(`<div class="terminal-line"><span class="t-accent">SKILLS</span> <span class="t-muted">[Frontend | Backend | Hardware]</span></div>
                <div class="terminal-line">  HTML5, CSS3, JavaScript (ES6+)</div>
                <div class="terminal-line">  React, Node.js, Python</div>
                <div class="terminal-line">  Arduino, Embedded Systems, DSP</div>`);
        } else if (cmdLower === 'projects') {
            lines.push(`<div class="terminal-line"><span class="t-accent">PROJECTS</span> <span class="t-muted">[2+ projects built]</span></div>
                <div class="terminal-line">  <span class="t-prompt">astronav</span>    - Space data API platform</div>
                <div class="terminal-line">  <span class="t-prompt">music-controller</span> - Hardware music controller</div>`);
        } else if (cmdLower === 'contact') {
            lines.push(`<div class="terminal-line"><span class="t-accent">CONTACT</span> <span class="t-muted">[jigneshphalsawal@gmail.com]</span></div>
                <div class="terminal-line"><span class="t-out">GitHub: github.com/jigneshphalsawal-cloud</span></div>
                <div class="terminal-line"><span class="t-out">Hack Club: stardance.hackclub.com/@jigneshphalsawal</span></div>`);
        } else if (cmdLower === 'theme') {
            const isDark = document.documentElement.classList.contains('dark-mode');
            document.documentElement.classList.toggle('dark-mode');
            const newTheme = document.documentElement.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            lines.push(`<div class="terminal-line"><span class="t-success">Theme toggled to: ${newTheme.toUpperCase()}</span></div>`);
        } else if (cmdLower === 'github') {
            lines.push(`<div class="terminal-line"><span class="t-accent">GitHub Profile</span> <span class="t-out">https://github.com/jigneshphalsawal-cloud</span></div>
                <div class="terminal-line"><span class="t-muted">Opening in browser...</span></div>`);
            setTimeout(() => {
                window.open('https://github.com/jigneshphalsawal-cloud', '_blank');
            }, 500);
        } else {
            lines.push(`<div class="terminal-line"><span class="t-warning">Unknown command: ${command}</span></div>
                <div class="terminal-line"><span class="t-muted">Type 'help' for available commands</span></div>`);
        }

        // Insert before input row
        const inputRow = document.querySelector('.terminal-input-row');
        if (inputRow) {
            lines.forEach(line => {
                const div = document.createElement('div');
                div.innerHTML = line;
                div.className = 'terminal-line';
                terminalBody.insertBefore(div, inputRow);
            });
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }
    }
}

function initGitHubStats() {
    const reposGrid = document.getElementById('githubReposGrid');
    if (!reposGrid) return;

    const CACHE_KEY = 'github_stats_cache';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    function loadFromCache() {
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL) {
                    return data;
                }
            }
        } catch (e) {
            // Cache read failed, continue to API
        }
        return null;
    }

    function saveToCache(data) {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            // Cache write failed, continue
        }
    }

    function fetchGitHubData() {
        reposGrid.innerHTML = '<div class="loading-placeholder"><i class="fas fa-circle-notch fa-spin"></i> Fetching GitHub data...</div>';

        const cachedData = loadFromCache();
        if (cachedData) {
            renderGitHubRepos(cachedData);
            return;
        }

        // Fetch user info
        fetch('https://api.github.com/users/jigneshphalsawal-cloud')
            .then(response => {
                if (!response.ok) throw new Error('GitHub API rate limited');
                return response.json();
            })
            .then(userData => {
                // Fetch repos
                return fetch(`https://api.github.com/users/jigneshphalsawal-cloud/repos?per_page=100`)
                    .then(repoResponse => {
                        if (!repoResponse.ok) throw new Error('GitHub API rate limited');
                        return repoResponse.json();
                    })
                    .then(reposData => {
                        const stats = {
                            user: userData,
                            repos: reposData
                        };
                        saveToCache(stats);
                        renderGitHubRepos(stats);
                    });
            })
            .catch(error => {
                console.warn('GitHub API fetch failed:', error);
                renderGitHubReposFallback();
            });
    }

    function renderGitHubRepos(stats) {
        if (!stats || !stats.repos || stats.repos.length === 0) {
            reposGrid.innerHTML = '<p class="t-muted">No public repositories found</p>';
            return;
        }

        // Sort by last updated, filter out forks
        const sortedRepos = stats.repos
            .filter(repo => !repo.fork)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 6);

        reposGrid.innerHTML = sortedRepos.map(repo => `
            <a href="${repo.html_url}" class="github-repo-card" target="_blank" rel="noopener noreferrer">
                <div>
                    <div class="repo-card-top">
                        <span class="repo-card-title"><i class="fab fa-github"></i> ${repo.name}</span>
                    </div>
                    <p class="repo-card-desc">${repo.description || 'No description available'}</p>
                </div>
                <div class="repo-card-meta">
                    <span class="repo-lang-tag">
                        <span class="repo-lang-dot ${getLanguageClass(repo.language)}"></span>
                        ${repo.language || 'Unknown'}
                    </span>
                    <span>
                        <i class="fas fa-star"></i> ${repo.stargazers_count} |
                        <i class="fas fa-code-branch"></i> ${repo.forks_count}
                    </span>
                </div>
            </a>
        `).join('');
    }

    function renderGitHubReposFallback() {
        reposGrid.innerHTML = `
            <a href="https://github.com/jigneshphalsawal-cloud/astronav" class="github-repo-card" target="_blank" rel="noopener noreferrer">
                <div>
                    <div class="repo-card-top"><span class="repo-card-title"><i class="fab fa-github"></i> astronav</span></div>
                    <p class="repo-card-desc">API-based space data platform for enthusiasts and researchers.</p>
                </div>
                <div class="repo-card-meta"><span class="repo-lang-tag"><span class="repo-lang-dot javascript"></span> JavaScript</span><span><i class="fas fa-star"></i> 15 | <i class="fas fa-code-branch"></i> 3</span></div>
            </a>
            <a href="https://github.com/jigneshphalsawal-cloud" class="github-repo-card" target="_blank" rel="noopener noreferrer">
                <div>
                    <div class="repo-card-top"><span class="repo-card-title"><i class="fab fa-github"></i> portfolio</span></div>
                    <p class="repo-card-desc">My personal portfolio showcasing web development projects and achievements.</p>
                </div>
                <div class="repo-card-meta"><span class="repo-lang-tag"><span class="repo-lang-dot html"></span> HTML</span><span><i class="fas fa-star"></i> 20+ | <i class="fas fa-code-branch"></i> 5+</span></div>
            </a>
        `;
    }

    function getLanguageClass(lang) {
        if (!lang) return '';
        const map = {
            'JavaScript': 'javascript',
            'Python': 'python',
            'C++': 'cpp',
            'HTML': 'html',
            'CSS': 'html'
        };
        return map[lang] || '';
    }

    // Initial fetch
    fetchGitHubData();
}

function initProjectModals() {
    const modalOverlay = document.getElementById('projectModal');
    const modalCloseBtn = document.getElementById('modalClose');
    const modalCloseBtn2 = document.getElementById('modalCloseBtn');
    const projectCards = document.querySelectorAll('.card[data-category]');
    const body = document.body;

    if (!modalOverlay) return;

    let currentCard = null;

    function openModal(card) {
        currentCard = card;
        const title = card.querySelector('h3')?.textContent || 'Project';
        const category = card.querySelector('.tag')?.textContent || 'Project';
        const image = card.querySelector('img')?.src || '';
        const description = card.querySelector('p')?.textContent || 'Project description not available.';
        const footerLink = card.querySelector('.project-link')?.href || '#';

        document.getElementById('modalCategory').textContent = category;
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalImage').src = image;
        document.getElementById('modalDescription').textContent = description;
        document.getElementById('modalGitHubLink').href = footerLink;

        // Add features based on category
        const featuresList = document.getElementById('modalFeatures');
        const tagsContainer = document.getElementById('modalTags');

        if (category.toLowerCase() === 'api') {
            featuresList.innerHTML = `
                <li><i class="fas fa-check"></i> REST API Integration</li>
                <li><i class="fas fa-check"></i> Responsive Data Fetching</li>
                <li><i class="fas fa-check"></i> User-Friendly Interface</li>
            `;
            tagsContainer.innerHTML = `<span class="modal-tag">API</span><span class="modal-tag">JavaScript</span><span class="modal-tag">Async</span>`;
        } else if (category.toLowerCase() === 'hardware') {
            featuresList.innerHTML = `
                <li><i class="fas fa-check"></i> Physical Hardware Integration</li>
                <li><i class="fas fa-check"></i> Arduino Microcontroller</li>
                <li><i class="fas fa-check"></i> Real-Time Feedback</li>
            `;
            tagsContainer.innerHTML = `<span class="modal-tag">Hardware</span><span class="modal-tag">Arduino</span><span class="modal-tag">C++</span>`;
        } else {
            featuresList.innerHTML = `
                <li><i class="fas fa-check"></i> Modern Web Technologies</li>
                <li><i class="fas fa-check"></i> Clean UI Design</li>
                <li><i class="fas fa-check"></i> Full Functionality</li>
            `;
            tagsContainer.innerHTML = `<span class="modal-tag">Web</span><span class="modal-tag">Development</span>`;
        }

        modalOverlay.classList.add('active');
        body.style.overflow = 'hidden';

        // Focus management
        modalCloseBtn.focus();
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        body.style.overflow = '';
        if (currentCard) {
            currentCard.focus();
            currentCard = null;
        }
    }

    // Open modal on click
    projectCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.project-link')) {
                openModal(this);
            }
        });
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View details for ${card.querySelector('h3')?.textContent || 'project'}`);
    });

    // Close modal events
    modalCloseBtn.addEventListener('click', closeModal);
    modalCloseBtn2.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) closeModal();
    });

    // Keyboard accessibility
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
}

function init() {
    initThemeToggle();
    initBackToTop();
    initHeaderScroll();
    initScrollReveal();
    initCommandPalette();
    initProjectFilters();
    initParticleCanvas();
    initStatCounters();
    initProjectModals();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
