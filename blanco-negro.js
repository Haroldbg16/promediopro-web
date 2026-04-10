/**
 * ============================================================
 *  PromedioPro — Modo Claro / Modo Oscuro
 *  blanco-negro.js
 * ============================================================
 *
 *  • Lee la preferencia guardada en localStorage.
 *  • Si no hay preferencia, respeta prefers-color-scheme del SO.
 *  • Aplica [data-theme="light"] al <html> para modo claro.
 *  • Sin [data-theme] (o con "dark") → modo oscuro (por defecto).
 *  • Sincroniza todos los botones .theme-toggle-btn de la página.
 * ============================================================
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'promediopro_theme';
    const LIGHT       = 'light';
    const DARK        = 'dark';

    /* ── 1. Detectar preferencia ─────────────────────────── */
    function getPreference() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === LIGHT || saved === DARK) return saved;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? LIGHT : DARK;
    }

    /* ── 2. Aplicar tema (Atributo HTML) ─────────────────── */
    /* Se ejecuta inmediatamente para evitar el 'flash' blanco/oscuro */
    function applyThemeAttribute(theme) {
        if (theme === LIGHT) {
            document.documentElement.setAttribute('data-theme', LIGHT);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    /* ── 3. Actualizar UI (Botones, etc.) ────────────────── */
    function updateUIElements(theme) {
        document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
            const label = btn.querySelector('.theme-label');
            if (label) {
                label.textContent = theme === LIGHT ? 'Oscuro' : 'Claro';
            }
            btn.setAttribute('aria-label',
                theme === LIGHT ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
            btn.setAttribute('title',
                theme === LIGHT ? 'Modo oscuro' : 'Modo claro');
        });
    }

    /* ── 4. Alternar tema ────────────────────────────────── */
    window.toggleTheme = function() {
        const current  = document.documentElement.getAttribute('data-theme') === LIGHT
                            ? LIGHT : DARK;
        const next     = current === LIGHT ? DARK : LIGHT;

        localStorage.setItem(STORAGE_KEY, next);
        applyThemeAttribute(next);
        updateUIElements(next);
    };

    /* ── 5. Inyectar botón en el nav ────────────────────── */
    function injectButton() {
        if (document.querySelector('.theme-toggle-btn')) return;

        const nav = document.querySelector('header nav');
        if (!nav) return;

        const btn = document.createElement('button');
        btn.className = 'theme-toggle-btn';
        btn.id        = 'theme-toggle';
        btn.innerHTML =
            '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' +
            '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
            '<span class="theme-label">Claro</span>';

        btn.addEventListener('click', window.toggleTheme);

        const hamburger = nav.querySelector('.hamburger');
        if (hamburger) nav.insertBefore(btn, hamburger);
        else nav.appendChild(btn);
    }

    /* ── 6. Init ─────────────────────────────────────────── */
    
    // Paso 1: Aplicar atributo inmediatamente
    const initialTheme = getPreference();
    applyThemeAttribute(initialTheme);

    // Paso 2: Inicializar UI cuando el DOM esté listo
    function initUI() {
        injectButton();
        document.querySelectorAll('.theme-toggle-btn').forEach(function (btn) {
            btn.addEventListener('click', window.toggleTheme);
        });
        updateUIElements(initialTheme);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }

    // Sincronizar con cambios del SO
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
        if (!localStorage.getItem(STORAGE_KEY)) {
            const newTheme = e.matches ? LIGHT : DARK;
            applyThemeAttribute(newTheme);
            updateUIElements(newTheme);
        }
    });

})();
