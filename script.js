/**
 * Jignesh Phalsawal - Portfolio Interactive Engine
 * Vanilla JavaScript portfolio engine
 * Features: Command Palette, Terminal Emulator, Particle Canvas, GitHub API, Modals
 */

(function () {
    'use strict';

    // ==========================================
    // Configuration & Constants
    // ==========================================
    const CONFIG = {
        SCROLL_THRESHOLD: 300,
        HERO_HIDE_THRESHOLD: 80,
        GITHUB_USERNAME: 'jigneshphalsawal-cloud',
        GITHUB_CACHE_KEY: 'jp_github_stats_v2',
        GITHUB_CACHE_TTL: 10 * 60 * 1000, // 10 minutes
        PARTICLE_COUNT: 45,
        PARTICLE_MAX_DIST: 120,
        COMMANDS: [
            { id: 'about', title: 'About Me', desc: 'Jump to biography & background', icon: '👤', href: '#introduction', category: 'Navigation' },
            { id: 'skills', title: 'Skills', desc: 'What I do across web, hardware, and audio', icon: '⚡', href: '#skills', category: 'Navigation' },,
            { id: 'achievements', title: 'Achievements', desc: 'Awards, recognition & academic honors', icon: '🏆', href: '#achievements', category: 'Navigation' },
            { id: 'projects', title: 'Projects', desc: 'Explore featured engineering projects', icon: '💻', href: '#projects', category: 'Navigation' },
            { id: 'stats', title: 'By The Numbers', desc: 'A quick overview', icon: '📊', href: '#stats', category: 'Navigation' },
            { id: 'terminal', title: 'Interactive Terminal', desc: 'Launch browser developer terminal', icon: '⌨️', href: '#terminal', category: 'Tools' },
            { id: 'github', title: 'GitHub Activity', desc: 'View live repository data', icon: '🐙', href: '#github-stats', category: 'Tools' },
            { id: 'audio-lab', title: 'Audio Lab', desc: 'Frequency Canvas synthesizer', icon: '🎛️', href: '#audio-lab', category: 'Media' },
            { id: 'contact', title: 'Get in Touch', desc: 'Contact options and social profiles', icon: '✉️', href: '#contact', category: 'Navigation' },
            { id: 'copy-email', title: 'Copy Email Address', desc: 'Copy jigneshphalsawal@gmail.com', icon: '📋', action: 'copyEmail', category: 'Actions' },
            { id: 'toggle-theme', title: 'Toggle Dark / Light Mode', desc: 'Switch visual color palette', icon: '🌓', action: 'toggleTheme', category: 'Actions' }
        ]
    };

    // ==========================================
    // Utility Helpers
    // ==========================================
    const Utils = {
        debounce(func, wait = 100) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },
        throttle(func, limit = 50) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => (inThrottle = false), limit);
                }
            };
        },
        escapeHTML(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };

    // ==========================================
    // 1. Theme Manager
    // ==========================================
    const ThemeManager = {
        init() {
            this.themeToggle = document.getElementById('themeToggle');
            this.html = document.documentElement;

            // Check storage or system preference
            let savedTheme = null;
            try {
                savedTheme = localStorage.getItem('theme');
            } catch (e) {
                // Private browsing or storage disabled
                console.warn('Could not access localStorage:', e);
            }
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

            this.setTheme(initialTheme);

            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', () => this.toggle());
            }

            // Listen for OS preference changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        },
        setTheme(theme) {
            if (theme === 'dark') {
                this.html.setAttribute('data-theme', 'dark');
                this.html.classList.add('dark-mode');
                if (this.themeToggle) this.themeToggle.innerHTML = '☀️ <span>Light</span>';
            } else {
                this.html.setAttribute('data-theme', 'light');
                this.html.classList.remove('dark-mode');
                if (this.themeToggle) this.themeToggle.innerHTML = '🌙 <span>Dark</span>';
            }
            try {
                localStorage.setItem('theme', theme);
            } catch (e) {
                // Private browsing or storage disabled
                console.warn('Theme preference could not be saved:', e);
            }
        },
        toggle() {
            const current = this.html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            this.setTheme(next);
        }
    };

    // ==========================================
    // 2. Navigation & Header Scroll
    // ==========================================
    const Navigation = {
        init() {
            this.header = document.querySelector('header');
            this.backToTopBtn = document.getElementById('backToTop');
            this.scrollProgress = document.getElementById('scrollProgress');
            this.lastScrollY = 0;

            window.addEventListener('scroll', Utils.throttle(() => this.onScroll(), 25), { passive: true });

            if (this.backToTopBtn) {
                this.backToTopBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            // Smooth scroll for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const targetId = anchor.getAttribute('href');
                    if (targetId && targetId !== '#') {
                        const targetEl = document.querySelector(targetId);
                        if (targetEl) {
                            e.preventDefault();
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            });
        },
        onScroll() {
            const currentY = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

            // Scroll Progress Bar
            if (this.scrollProgress && scrollHeight > 0) {
                const progress = (currentY / scrollHeight) * 100;
                this.scrollProgress.style.width = `${progress}%`;
            }

            // Back to Top Visibility
            if (this.backToTopBtn) {
                if (currentY > CONFIG.SCROLL_THRESHOLD) {
                    this.backToTopBtn.classList.add('show');
                } else {
                    this.backToTopBtn.classList.remove('show');
                }
            }

            // Header Hide / Reveal
            if (this.header) {
                if (currentY > CONFIG.HERO_HIDE_THRESHOLD) {
                    if (currentY > this.lastScrollY && currentY > 150) {
                        this.header.classList.add('hide');
                    } else {
                        this.header.classList.remove('hide');
                    }
                } else {
                    this.header.classList.remove('hide');
                }
            }

            this.lastScrollY = Math.max(0, currentY);
        }
    };

    // ==========================================
    // 3. Command Palette (Cmd+K)
    // ==========================================
    const CommandPalette = {
        init() {
            this.overlay = document.getElementById('commandPaletteOverlay');
            this.palette = document.getElementById('commandPalette');
            this.input = document.getElementById('commandPaletteInput');
            this.results = document.getElementById('commandPaletteResults');
            this.selectedIndex = 0;
            this.filteredCommands = [];

            if (!this.palette || !this.input || !this.results) return;

            // Keyboard shortcut listener
            window.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    this.toggle();
                } else if (e.key === 'Escape' && this.isOpen()) {
                    e.preventDefault();
                    this.close();
                }
            });

            if (this.overlay) {
                this.overlay.addEventListener('click', () => this.close());
            }

            this.input.addEventListener('input', () => this.filter(this.input.value));
            this.input.addEventListener('keydown', (e) => this.handleNavigation(e));

            // Initial render
            // Keep command palette usable without the search UI.
            this.filter('');

            // If the search input is hidden/removed, still let Enter work by
            // immediately selecting the first command.
            if (this.input) this.input.style.display = 'none';
            this.updateSelection();
        },
        isOpen() {
            return this.palette && this.palette.classList.contains('active');
        },
        open() {
            if (!this.palette) return;
            this.palette.classList.add('active');
            if (this.overlay) this.overlay.classList.add('active');
            this.input.value = '';
            this.selectedIndex = 0;
            this.filter('');
            setTimeout(() => this.input.focus(), 50);
            document.body.style.overflow = 'hidden';
        },
        close() {
            if (!this.palette) return;
            this.palette.classList.remove('active');
            if (this.overlay) this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        },
        toggle() {
            this.isOpen() ? this.close() : this.open();
        },
        filter(query) {
            const cleanQuery = query.toLowerCase().trim();
            this.filteredCommands = CONFIG.COMMANDS.filter(cmd => {
                return cmd.title.toLowerCase().includes(cleanQuery) ||
                    cmd.desc.toLowerCase().includes(cleanQuery) ||
                    cmd.id.toLowerCase().includes(cleanQuery);
            });

            this.selectedIndex = 0;
            this.render();
        },
        render() {
            if (!this.results) return;

            if (this.filteredCommands.length === 0) {
                this.results.innerHTML = `
                    <li class="command-empty">
                        <i class="fas fa-search-minus"></i> No matching commands found
                    </li>`;
                return;
            }

            this.results.innerHTML = this.filteredCommands.map((cmd, idx) => `
                <li class="command-palette-item ${idx === this.selectedIndex ? 'selected' : ''}" data-index="${idx}">
                    <span class="command-icon">${cmd.icon}</span>
                    <div class="command-info">
                        <div class="command-title">${cmd.title}</div>
                        <div class="command-desc">${cmd.desc}</div>
                    </div>
                    <span class="command-category">${cmd.category || 'Action'}</span>
                </li>
            `).join('');

            // Click handling on results
            this.results.querySelectorAll('.command-palette-item').forEach(item => {
                item.addEventListener('click', () => {
                    const idx = parseInt(item.dataset.index, 10);
                    this.execute(this.filteredCommands[idx]);
                });
            });
        },
        handleNavigation(e) {
            if (this.filteredCommands.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length;
                this.updateSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
                this.updateSelection();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.filteredCommands[this.selectedIndex]) {
                    this.execute(this.filteredCommands[this.selectedIndex]);
                }
            }
        },
        updateSelection() {
            const items = this.results.querySelectorAll('.command-palette-item');
            items.forEach((item, idx) => {
                if (idx === this.selectedIndex) {
                    item.classList.add('selected');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('selected');
                }
            });
        },
        execute(cmd) {
            this.close();
            if (!cmd) return;

            if (cmd.href) {
                if (cmd.href.startsWith('#')) {
                    const el = document.querySelector(cmd.href);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    window.open(cmd.href, '_blank', 'noopener,noreferrer');
                }
            } else if (cmd.action === 'copyEmail') {
                navigator.clipboard.writeText('jigneshphalsawal@gmail.com').then(() => {
                    this.showToast('📧 Email copied to clipboard!');
                }).catch(() => {
                    this.showToast('Could not copy email');
                });
            } else if (cmd.action === 'toggleTheme') {
                ThemeManager.toggle();
            }
        },
        showToast(message) {
            let toast = document.getElementById('appToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'appToast';
                toast.className = 'app-toast';
                document.body.appendChild(toast);
            }
            toast.textContent = message;
            toast.classList.add('visible');
            setTimeout(() => toast.classList.remove('visible'), 3000);
        }
    };

    // ==========================================
    // 4. Interactive Terminal Emulator
    // ==========================================
    const Terminal = {
        init() {
            this.terminalBody = document.querySelector('.terminal-body');
            this.input = document.getElementById('terminalInput');
            this.inputRow = document.querySelector('.terminal-input-row');
            this.chips = document.querySelectorAll('.terminal-chip');
            this.history = [];
            this.historyIndex = -1;

            if (!this.input || !this.terminalBody) return;

            this.input.addEventListener('keydown', (e) => this.handleInput(e));

            // Chips click support
            this.chips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const cmd = chip.dataset.command;
                    if (cmd) {
                        this.execute(cmd);
                    }
                });
            });

            // Focus input on terminal click
            this.terminalBody.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                    this.input.focus();
                }
            });
        },
        handleInput(e) {
            if (e.key === 'Enter') {
                const cmd = this.input.value.trim();
                if (cmd) {
                    this.history.push(cmd);
                    this.historyIndex = this.history.length;
                    this.execute(cmd);
                }
                this.input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    this.input.value = '';
                }
            }
        },
        execute(cmd) {
            const rawCmd = cmd.trim();
            const lowerCmd = rawCmd.toLowerCase();

            // Print user command line
            this.printLine(`<span class="t-path">jignesh@portfolio:~$</span> <span class="t-cmd">${Utils.escapeHTML(rawCmd)}</span>`);

            switch (lowerCmd) {
                case 'clear':
                case 'cls':
                    this.clear();
                    return;

                case 'help':
                    this.printLines([
                        '<span class="t-out">Available terminal commands:</span>',
                        '  <span class="t-accent">help</span>        - Display list of supported commands',
                        '  <span class="t-accent">about</span>       - Brief background and mission statement',
                        '  <span class="t-accent">skills</span>      - What I Do',
                        '  <span class="t-accent">projects</span>    - Featured software and hardware builds',
                        '  <span class="t-accent">github</span>      - Launch GitHub profile repository list',
                        '  <span class="t-accent">contact</span>     - Reach out directly via email or social',
                        '  <span class="t-accent">theme</span>       - Toggle UI dark/light theme',
                        '  <span class="t-accent">clear</span>       - Wipe terminal output history',
                        '',
                        '<span class="t-muted">Tip: Click quick command chips above to run commands instantly</span>'
                    ]);
                    break;

                case 'about':
                    this.printLines([
                        '<span class="t-success">Jignesh Phalsawal</span> — Full Stack Developer & Hardware Tinkerer',
                        '<span class="t-out">I build web apps, embedded systems, and audio tools that feel practical and well-made.</span>',
                        '',
                        '<span class="t-muted">Recognized as State Topper (2026).</span>',
                        '<span class="t-muted">Location: Working on interesting projects.</span>'
                    ]);
                    break;

                case 'skills':
                    this.printLines([
                        '<span class="t-accent">▎ CORE SKILLSET</span>',
                        '',
                        '<span class="t-accent">Web:</span>        Web development, functional and clean websites',
                        '<span class="t-accent">Hardware:</span>   Arduino and embedded systems',
                        '<span class="t-accent">Audio:</span>      Digital synthesis and audio tools',
                        '<span class="t-accent">Tinkering:</span>  Learning, making, and fixing',
                        '',
                        '<span class="t-muted">Always learning and building new things.</span>'
                    ]);
                    break;

                case 'projects':
                    this.printLines([
                        '<span class="t-accent">▎ PORTFOLIO BUILDS</span>',
                        '',
                        '  1. <span class="t-prompt">astronav</span>         - A simple space data tracker I built.',
                        '     https://github.com/jigneshphalsawal-cloud/astronav',
                        '',
                        '  2. <span class="t-prompt">music-controller</span>  - A custom hardware console for audio.',
                        '',
                        '<span class="t-muted">More projects available on GitHub → github command</span>'
                    ]);
                    break;

                case 'contact':
                    this.printLines([
                        '<span class="t-accent">▎ GET IN TOUCH</span>',
                        '',
                        '  <span class="t-accent">Email:</span>     <a href="mailto:jigneshphalsawal@gmail.com" class="t-link">jigneshphalsawal@gmail.com</a>',
                        '  <span class="t-accent">GitHub:</span>    <a href="https://github.com/jigneshphalsawal-cloud" target="_blank" class="t-link">github.com/jigneshphalsawal-cloud</a>',
                        '  <span class="t-accent">Hack Club:</span> <a href="https://stardance.hackclub.com/@jigneshphalsawal" target="_blank" class="t-link">stardance.hackclub.com/@jigneshphalsawal</a>',
                        '',
                        '<span class="t-muted">Available for collaborations and interesting projects.</span>'
                    ]);
                    break;

                case 'theme':
                    ThemeManager.toggle();
                    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    this.printLine(`<span class="t-success">✨ Switched color theme to: <strong>${currentTheme.toUpperCase()}</strong></span>`);
                    break;

                case 'github':
                    this.printLine('<span class="t-accent">🚀 Opening GitHub profile in new tab...</span>');
                    window.open(`https://github.com/${CONFIG.GITHUB_USERNAME}`, '_blank', 'noopener,noreferrer');
                    break;

                default:
                    // Check if it might be a repo name
                    const matchingRepo = CONFIG.COMMANDS.find(c =>
                        c.id === lowerCmd ||
                        (c.href && c.href.includes(lowerCmd))
                    );

                    if (matchingRepo) {
                        this.printLine(`<span class="t-success">Found: ${matchingRepo.title}</span>`);
                        this.printLine(`<span class="t-muted">Type <span class="t-accent">github</span> to view all repositories.</span>`);
                    } else {
                        this.printLines([
                            `<span class="t-warning">Command not found: "${Utils.escapeHTML(rawCmd)}"</span>`,
                            '',
                            '<span class="t-muted">Type <span class="t-accent">help</span> for a list of valid commands.</span>',
                            '<span class="t-muted">Hint: Try "about", "skills", "projects", "github", or "contact"</span>'
                        ]);
                    }
                    break;
            }

            this.scrollToBottom();
        },
        printLine(html) {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.innerHTML = html;
            if (this.inputRow && this.terminalBody.contains(this.inputRow)) {
                this.terminalBody.insertBefore(line, this.inputRow);
            } else {
                this.terminalBody.appendChild(line);
            }
        },
        printLines(linesArray) {
            linesArray.forEach(line => this.printLine(line));
        },
        clear() {
            const lines = this.terminalBody.querySelectorAll('.terminal-line');
            lines.forEach(l => l.remove());
        },
        scrollToBottom() {
            this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
        }
    };

    // ==========================================
    // 5. GitHub API & Stats Integration
    // ==========================================
    const GitHubFeed = {
        init() {
            this.container = document.getElementById('githubReposGrid');
            if (!this.container) return;
            this.load();
        },
        async load() {
            this.container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-circle-notch fa-spin"></i> Fetching latest GitHub repositories...
                </div>`;

            // Check cache
            const cached = this.getCache();
            if (cached) {
                this.render(cached);
                return;
            }

            try {
                // Fetch up to 10 repos to ensure we have enough non-forks
                const response = await fetch(`https://api.github.com/users/${CONFIG.GITHUB_USERNAME}/repos?sort=updated&per_page=10`);
                if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
                const repos = await response.json();
                this.setCache(repos);
                this.render(repos);
            } catch (err) {
                console.warn('GitHub API fetch failed, using fallback:', err);
                this.renderFallback();
            }
        },
        getCache() {
            try {
                const item = sessionStorage.getItem(CONFIG.GITHUB_CACHE_KEY);
                if (!item) return null;
                const { data, timestamp } = JSON.parse(item);
                if (Date.now() - timestamp < CONFIG.GITHUB_CACHE_TTL) {
                    return data;
                }
            } catch (e) {
                return null;
            }
            return null;
        },
        setCache(data) {
            try {
                sessionStorage.setItem(CONFIG.GITHUB_CACHE_KEY, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            } catch (e) {
                // Ignore storage write fails
            }
        },
        render(repos) {
            if (!Array.isArray(repos) || repos.length === 0) {
                this.renderFallback();
                return;
            }

            const filtered = repos.filter(r => !r.fork);

            // Render GitHub grid (bottom section max 4)
            this.container.innerHTML = filtered.slice(0, 4).map(repo => `
                <a href="${repo.html_url}" class="github-repo-card" target="_blank" rel="noopener noreferrer">
                    <div>
                        <div class="repo-card-top">
                            <span class="repo-card-title"><i class="fab fa-github"></i> ${Utils.escapeHTML(repo.name)}</span>
                        </div>
                        <p class="repo-card-desc">${Utils.escapeHTML(repo.description || 'Unavailable for this project')}</p>
                    </div>
                    <div class="repo-card-meta">
                        <span class="repo-lang-tag">
                            <span class="repo-lang-dot ${this.getLanguageClass(repo.language)}"></span>
                            ${Utils.escapeHTML(repo.language || 'Code')}
                        </span>
                        <span>
                            <i class="fas fa-star" aria-hidden="true"></i> ${repo.stargazers_count}
                            <span style="margin: 0 4px;">•</span>
                            <i class="fas fa-code-branch" aria-hidden="true"></i> ${repo.forks_count}
                        </span>
                    </div>
                </a>
            `).join('');

            // Also render to main Projects section
            this.renderToProjects(filtered);
        },
        renderToProjects(repos) {
            const projectList = document.querySelector('.project-list');
            const filterGroup = document.querySelector('.project-filters');
            if (!projectList) return;

            const existingTitles = Array.from(projectList.querySelectorAll('h3')).map(h3 => h3.textContent.toLowerCase().trim());

            const projectsHTML = repos.map(repo => {
                if (existingTitles.includes(repo.name.toLowerCase().trim())) return '';

                const desc = repo.description ? Utils.escapeHTML(repo.description) : 'Unavailable for this project';
                const lang = repo.language ? Utils.escapeHTML(repo.language) : 'Code';
                const category = 'github';

                return `
                <article class="card glass-panel reveal-init reveal-active" data-category="${category}">
                    <div class="card-header">
                        <h3>${Utils.escapeHTML(repo.name)}</h3>
                        <span class="status completed"><i class="fas fa-code-branch" aria-hidden="true"></i> GitHub Repo</span>
                    </div>
                    <div class="card-tags">
                        <span class="tag">Open Source</span>
                        <span class="tag">${lang}</span>
                    </div>
                    <p>${desc}</p>
                    <div class="card-img-wrapper" style="display:flex; align-items:center; justify-content:center; background: #0c1729; border: 1px solid var(--border-glass-subtle);">
                        <i class="fab fa-github" style="font-size: 5rem; color: var(--border-glass-hover);"></i>
                    </div>
                    <div class="card-footer">
                        <a href="${repo.html_url}" class="project-link" target="_blank" rel="noopener noreferrer">
                            <span>View Source Code</span>
                            <i class="fas fa-arrow-right" aria-hidden="true"></i>
                        </a>
                    </div>
                </article>`;
            }).filter(Boolean).join('');

            if (projectsHTML) {
                // Add filter button if not exists
                if (filterGroup && !filterGroup.querySelector('[data-filter="github"]')) {
                    filterGroup.insertAdjacentHTML('beforeend', '<button class="filter-tag" data-filter="github">Open Source (GitHub)</button>');
                    // Re-init filters logic
                    Projects.initFilters();
                }

                // Append newly mapped cards
                projectList.insertAdjacentHTML('beforeend', projectsHTML);

                // Re-bind modal events and interactions for the new cards
                Projects.initModals();
                if (typeof MicroInteractions !== 'undefined' && MicroInteractions.initTilt) {
                    MicroInteractions.initTilt();
                }
            }
        },
        renderFallback() {
            this.container.innerHTML = `
                <a href="https://github.com/jigneshphalsawal-cloud/astronav" class="github-repo-card" target="_blank" rel="noopener noreferrer">
                    <div>
                        <div class="repo-card-top"><span class="repo-card-title"><i class="fab fa-github"></i> astronav</span></div>
                        <p class="repo-card-desc">App for tracking and visualizing satellite data.</p>
                    </div>
                    <div class="repo-card-meta">
                        <span class="repo-lang-tag"><span class="repo-lang-dot javascript"></span> JavaScript</span>
                        <span><i class="fas fa-star"></i> 15 • <i class="fas fa-code-branch"></i> 3</span>
                    </div>
                </a>
                <a href="https://github.com/jigneshphalsawal-cloud" class="github-repo-card" target="_blank" rel="noopener noreferrer">
                    <div>
                        <div class="repo-card-top"><span class="repo-card-title"><i class="fab fa-github"></i> portfolio</span></div>
                        <p class="repo-card-desc">My portfolio site with a built-in terminal.</p>
                    </div>
                    <div class="repo-card-meta">
                        <span class="repo-lang-tag"><span class="repo-lang-dot html"></span> HTML / CSS</span>
                        <span><i class="fas fa-star"></i> 20 • <i class="fas fa-code-branch"></i> 5</span>
                    </div>
                </a>
            `;
        },
        getLanguageClass(lang) {
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
    };

    // ==========================================
    // 6. Project Filters & Project Modal
    // ==========================================
    const Projects = {
        init() {
            this.modal = document.getElementById('projectModal');
            this.closeBtn = document.getElementById('modalClose');
            this.closeBtn2 = document.getElementById('modalCloseBtn');

            this.initFilters();
            this.initModals();

            if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
            if (this.closeBtn2) this.closeBtn2.addEventListener('click', () => this.closeModal());

            if (this.modal) {
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.closeModal();
                });
            }

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
                    this.closeModal();
                }
            });
        },
        initFilters() {
            const filterButtons = document.querySelectorAll('.filter-tag');

            // Clear old listeners by cloning (if needed, but simple addEventListener is fine if we remove old ones)
            filterButtons.forEach(btn => {
                // Ensure we don't bind multiple times, use a marker class
                if (btn.classList.contains('filter-bound')) return;
                btn.classList.add('filter-bound');

                btn.addEventListener('click', () => {
                    document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const filter = btn.dataset.filter;
                    const cards = document.querySelectorAll('.card[data-category]');
                    cards.forEach(card => {
                        if (filter === 'all' || card.dataset.category === filter) {
                            card.style.display = '';
                            setTimeout(() => card.classList.add('reveal-active'), 30);
                        } else {
                            card.style.display = 'none';
                            card.classList.remove('reveal-active');
                        }
                    });
                });
            });
        },
        initModals() {
            const cards = document.querySelectorAll('.card[data-category]');
            cards.forEach(card => {
                if (card.classList.contains('modal-bound')) return;
                card.classList.add('modal-bound');

                card.addEventListener('click', (e) => {
                    // Prevent modal when clicking direct links
                    if (e.target.closest('a')) return;
                    this.openModal(card);
                });
            });
        },
        openModal(card) {
            if (!this.modal) return;

            const title = card.querySelector('h3')?.textContent || 'Project';
            const desc = card.querySelector('p')?.textContent || '';
            const img = card.querySelector('.card-img-wrapper img');
            const imgSrc = img ? img.src : '';
            const category = card.dataset.category || 'General';
            const githubLink = card.querySelector('.project-link')?.href || '#';

            const modalTitle = document.getElementById('modalTitle');
            const modalDesc = document.getElementById('modalDescription');
            const modalImg = document.getElementById('modalImage');
            const modalImgContainer = document.querySelector('.modal-image-container');
            const modalCat = document.getElementById('modalCategory');
            const modalGH = document.getElementById('modalGitHubLink');

            if (modalTitle) modalTitle.textContent = title;
            if (modalDesc) modalDesc.textContent = desc;

            // Handle if there is no image (e.g., dynamically fetched GitHub repo)
            if (imgSrc) {
                if (modalImg) {
                    modalImg.src = imgSrc;
                    modalImg.style.display = 'block';
                }
                modalImgContainer.style.background = '#000000';
                modalImgContainer.innerHTML = '<img src="' + imgSrc + '" alt="" class="modal-image" id="modalImage">';
            } else {
                modalImgContainer.style.background = '#0c1729';
                modalImgContainer.style.display = 'flex';
                modalImgContainer.style.alignItems = 'center';
                modalImgContainer.style.justifyContent = 'center';
                modalImgContainer.innerHTML = '<i class="fab fa-github" style="font-size: 6rem; color: rgba(255, 255, 255, 0.1);"></i>';
            }

            if (modalCat) modalCat.textContent = category.toUpperCase();
            if (modalGH) modalGH.href = githubLink;

            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        },
        closeModal() {
            if (!this.modal) return;
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // ==========================================
    // 7. Dynamic Stat Counters
    // ==========================================
    const StatCounters = {
        init() {
            const statCards = document.querySelectorAll('.stat-card h3');
            if (statCards.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            statCards.forEach(stat => observer.observe(stat));
        },
        animateCounter(el) {
            const originalText = el.textContent.trim();
            const targetNum = parseInt(originalText.replace(/[^0-9]/g, ''), 10);
            const suffix = originalText.replace(/[0-9]/g, '');

            if (isNaN(targetNum)) return;

            const duration = 1200;
            const startTime = performance.now();

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out quad
                const ease = 1 - (1 - progress) * (1 - progress);
                const currentVal = Math.floor(ease * targetNum);

                el.textContent = `${currentVal}${suffix}`;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    el.textContent = originalText;
                }
            };

            requestAnimationFrame(update);
        }
    };

    // ==========================================
    // 8. Particle Canvas Network
    // ==========================================
    const ParticleNetwork = {
        init() {
            this.canvas = document.getElementById('particleCanvas');
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.mouse = { x: null, y: null, radius: 100 };
            this.animationId = null;

            this.resize();
            window.addEventListener('resize', Utils.debounce(() => this.resize(), 150));

            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });

            window.addEventListener('mouseleave', () => {
                this.mouse.x = null;
                this.mouse.y = null;
            });

            this.createParticles();
            this.animate();
        },
        resize() {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        },
        createParticles() {
            this.particles = [];
            for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
                this.particles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: (Math.random() - 0.5) * 0.8,
                    size: Math.random() * 2 + 1
                });
            }
        },
        animate() {
            this.ctx.clearRect(0, 0, this.width, this.height);

            const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                           document.documentElement.classList.contains('dark-mode');
            const dotColor = isDark ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.25)';
            const lineColor = isDark ? 'rgba(96, 165, 250, ' : 'rgba(59, 130, 246, ';

            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > this.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.height) p.vy *= -1;

                this.ctx.fillStyle = dotColor;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();

                // Connect nodes
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONFIG.PARTICLE_MAX_DIST) {
                        const alpha = (1 - dist / CONFIG.PARTICLE_MAX_DIST) * 0.15;
                        this.ctx.strokeStyle = `${lineColor}${alpha})`;
                        this.ctx.lineWidth = 0.8;
                        this.ctx.beginPath();
                        this.ctx.moveTo(p.x, p.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                    }
                }
            }

            this.animationId = requestAnimationFrame(() => this.animate());
        },

        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
        }
    };

    // ==========================================
    // 9. Scroll Reveal Animations
    // ==========================================
    const ScrollReveal = {
        init() {
            const elements = document.querySelectorAll('section, .skill-card, .achievement-card, .card, .song-card, .stat-card');

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal-active');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            elements.forEach(el => {
                el.classList.add('reveal-init');
                observer.observe(el);
            });
        }
    };

    // ==========================================
    // 10. Micro-Interactions (Tilt & Cursor)
    // ==========================================
    const MicroInteractions = {
        init() {
            this.initTilt();
            this.initCursor();
        },
        initTilt() {
            // Check if device supports fine hover pointer
            if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

            const cards = document.querySelectorAll('.card, .skill-card, .achievement-card, .stat-card');
            cards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;

                    const rotateX = ((y - centerY) / centerY) * -5;
                    const rotateY = ((x - centerX) / centerX) * 5;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                });
            });
        },
        initCursor() {
            const cursor = document.getElementById('customCursor');
            if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

            let mouseX = -100, mouseY = -100;
            let cursorX = -100, cursorY = -100;

            window.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            const render = () => {
                cursorX += (mouseX - cursorX) * 0.2;
                cursorY += (mouseY - cursorY) * 0.2;
                cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
                requestAnimationFrame(render);
            };
            requestAnimationFrame(render);

            document.querySelectorAll('a, button, .card, .skill-card, .terminal-chip, input').forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('active'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
            });
        }
    };

    // ==========================================
    // 11. MyBeats Controller
    // ==========================================
    const MyBeatsController = {
        init() {
            this.containerEl = document.getElementById('my-beats');
            if (!this.containerEl) return;

            this.buttons = this.containerEl.querySelectorAll('.song-external');
            if (!this.buttons || this.buttons.length === 0) return;

            this.buttons.forEach((btn) => {
                const audioId = btn.dataset.audioId || btn.getAttribute('data-audio-id');
                if (!audioId) return;

                const audioEl = document.getElementById(audioId);
                if (!audioEl) return;

                // Initialize button icon based on current paused state.
                const setPlayingUI = (isPlaying) => {
                    btn.classList.toggle('active', isPlaying);
                    btn.innerHTML = isPlaying
                        ? '<i class="fas fa-pause"></i>'
                        : '<i class="fas fa-play"></i>';
                };

                setPlayingUI(!audioEl.paused);

                audioEl.addEventListener('ended', () => setPlayingUI(false));
                audioEl.addEventListener('pause', () => setPlayingUI(false));

                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const lab = window.AudioLab;
                    if (!lab || typeof lab.playExternalSong !== 'function') return;

                    const shouldPlay = audioEl.paused || audioEl.ended;
                    if (shouldPlay) {
                        lab.playExternalSong(audioEl);
                        setPlayingUI(true);
                    } else {
                        lab.stopExternalSong(audioEl);
                        setPlayingUI(false);
                    }
                });
            });
        }
    };

    // ==========================================
    // Master Application Bootstrap
    // ==========================================
    function initializeApp() {
        ThemeManager.init();
        Navigation.init();
        CommandPalette.init();
        Terminal.init();
        GitHubFeed.init();
        Projects.init();
        StatCounters.init();
        ParticleNetwork.init();
        ScrollReveal.init();
        MicroInteractions.init();
        MyBeatsController.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
})();
