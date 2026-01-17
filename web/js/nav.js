/* ============================================================================
   SPELIN NAVIGATION COMPONENT
   Injects consistent navigation and footer across all pages
   ============================================================================ */

// Navigation configuration
const NAV_ITEMS = [
    { href: 'index.html', label: 'Home', icon: 'home' },
    { href: 'learn.html', label: 'Learn', icon: 'learn' },
    { href: 'reader.html', label: 'Reader', icon: 'reader' },
    { href: 'games.html', label: 'Games', icon: 'games' },
    { href: 'type.html', label: 'Type', icon: 'type' },
    { href: 'history.html', label: 'History', icon: 'history' }
];

// Icon SVGs for mobile nav
const NAV_ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    reader: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    games: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="10" y2="12"/><circle cx="17" cy="10" r="1"/><circle cx="17" cy="14" r="1"/></svg>',
    type: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><line x1="6" y1="16" x2="18" y2="16"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
};

// Settings state (loaded from localStorage)
let spelinSettings = {
    hoverSpeak: true,
    soundEnabled: true
};

/**
 * Get the current page name from the URL
 */
function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page === '' ? 'index.html' : page;
}

/**
 * Generate the header HTML
 */
function generateHeader() {
    const currentPage = getCurrentPage();

    const navLinks = NAV_ITEMS.map(item => {
        const isActive = item.href === currentPage;
        return `<a href="${item.href}" class="nav-link${isActive ? ' active' : ''}">${item.label}</a>`;
    }).join('');

    return `
        <header class="site-header">
            <div class="container">
                <a href="index.html" class="site-logo">
                    <span>·spelin</span>
                </a>
                <nav class="main-nav">
                    ${navLinks}
                </nav>
                <div class="nav-settings">
                    <label class="toggle" title="Hover-to-speak: hear sounds when hovering over letters">
                        <input type="checkbox" class="toggle-input" id="hoverSpeakToggle" ${spelinSettings.hoverSpeak ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">Hover</span>
                    </label>
                    <button class="btn btn--icon btn--ghost" id="soundToggle" title="Toggle sound">
                        ${spelinSettings.soundEnabled ? getSoundOnIcon() : getSoundOffIcon()}
                    </button>
                </div>
                <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
                    <span>☰</span>
                </button>
            </div>
        </header>
    `;
}

/**
 * Generate the mobile navigation HTML
 */
function generateMobileNav() {
    const currentPage = getCurrentPage();

    // Show only main items in mobile nav (max 5)
    const mobileItems = NAV_ITEMS.slice(0, 5);

    const navLinks = mobileItems.map(item => {
        const isActive = item.href === currentPage;
        return `
            <a href="${item.href}" class="nav-link${isActive ? ' active' : ''}">
                <span class="nav-icon">${NAV_ICONS[item.icon]}</span>
                ${item.label}
            </a>
        `;
    }).join('');

    return `
        <nav class="mobile-nav">
            ${navLinks}
        </nav>
    `;
}

/**
 * Generate the footer HTML
 */
function generateFooter() {
    return `
        <footer class="site-footer">
            <div class="container">
                <p>·spelin - A phonemic alphabet for English</p>
                <p>
                    <a href="https://github.com/ruapotato/spelin" target="_blank">GitHub</a>
                    ·
                    <a href="history.html">History</a>
                    ·
                    <a href="learn.html">Learn</a>
                </p>
            </div>
        </footer>
    `;
}

/**
 * Sound toggle icons
 */
function getSoundOnIcon() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
}

function getSoundOffIcon() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem('spelinSettings');
        if (saved) {
            spelinSettings = { ...spelinSettings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.warn('Failed to load settings:', e);
    }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
    try {
        localStorage.setItem('spelinSettings', JSON.stringify(spelinSettings));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

/**
 * Initialize navigation and settings
 */
function initNavigation() {
    // Load settings
    loadSettings();

    // Inject header at start of body
    const headerHTML = generateHeader();
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    // Inject mobile nav at end of body
    const mobileNavHTML = generateMobileNav();
    document.body.insertAdjacentHTML('beforeend', mobileNavHTML);

    // Inject footer before mobile nav
    const footer = document.querySelector('.mobile-nav');
    if (footer) {
        footer.insertAdjacentHTML('beforebegin', generateFooter());
    } else {
        document.body.insertAdjacentHTML('beforeend', generateFooter());
    }

    // Set up event listeners
    setupEventListeners();

    // Apply settings
    applySettings();
}

/**
 * Set up event listeners for nav controls
 */
function setupEventListeners() {
    // Hover-to-speak toggle
    const hoverToggle = document.getElementById('hoverSpeakToggle');
    if (hoverToggle) {
        hoverToggle.addEventListener('change', (e) => {
            spelinSettings.hoverSpeak = e.target.checked;
            saveSettings();
            applySettings();
            // Dispatch custom event for other components
            window.dispatchEvent(new CustomEvent('spelinSettingsChanged', { detail: spelinSettings }));
        });
    }

    // Sound toggle
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            spelinSettings.soundEnabled = !spelinSettings.soundEnabled;
            soundToggle.innerHTML = spelinSettings.soundEnabled ? getSoundOnIcon() : getSoundOffIcon();
            saveSettings();
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('spelinSettingsChanged', { detail: spelinSettings }));
        });
    }

    // Mobile menu toggle (for future dropdown menu if needed)
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            // For now, just scroll to mobile nav
            const mobileNav = document.querySelector('.mobile-nav');
            if (mobileNav) {
                mobileNav.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

/**
 * Apply current settings to the page
 */
function applySettings() {
    // Toggle hover-speak class on body
    if (spelinSettings.hoverSpeak) {
        document.body.classList.add('hover-speak-enabled');
    } else {
        document.body.classList.remove('hover-speak-enabled');
    }
}

/**
 * Get current settings (for use by other components)
 */
function getSpelinSettings() {
    return { ...spelinSettings };
}

/**
 * Update settings programmatically
 */
function updateSpelinSettings(newSettings) {
    spelinSettings = { ...spelinSettings, ...newSettings };
    saveSettings();
    applySettings();

    // Update UI
    const hoverToggle = document.getElementById('hoverSpeakToggle');
    if (hoverToggle) {
        hoverToggle.checked = spelinSettings.hoverSpeak;
    }

    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.innerHTML = spelinSettings.soundEnabled ? getSoundOnIcon() : getSoundOffIcon();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    initNavigation();
}

// Export for use by other modules
window.spelinNav = {
    getSettings: getSpelinSettings,
    updateSettings: updateSpelinSettings
};
