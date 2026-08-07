/**
 * ESPHome ComfoAir Custom Web UI
 * Renders a visual ComfoAir HVAC diagram and control panel at top of page,
 * followed by standard ESPHome web UI below.
 */

(function () {
  'use strict';

  // Official Material Design SVG Icons (matching Home Assistant & lovelace-comfoair)
  const ICONS = {
    sun: `<svg viewBox="0 0 24 24"><path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2A1,1 0 0,1 13,3V5A1,1 0 0,1 11,5V3A1,1 0 0,1 12,2M12,19A1,1 0 0,1 13,20V22A1,1 0 0,1 11,22V20A1,1 0 0,1 12,19M4.93,4.93A1,1 0 0,1 6.34,4.93L7.76,6.34A1,1 0 0,1 6.34,7.76L4.93,6.34A1,1 0 0,1 4.93,4.93M16.24,16.24A1,1 0 0,1 17.66,16.24L19.07,17.66A1,1 0 0,1 17.66,19.07L16.24,17.66A1,1 0 0,1 16.24,16.24M2,12A1,1 0 0,1 3,11H5A1,1 0 0,1 5,13H3A1,1 0 0,1 2,12M19,12A1,1 0 0,1 20,11H22A1,1 0 0,1 22,13H20A1,1 0 0,1 19,12M4.93,19.07A1,1 0 0,1 4.93,17.66L6.34,16.24A1,1 0 0,1 7.76,17.66L6.34,19.07A1,1 0 0,1 4.93,19.07M16.24,7.76A1,1 0 0,1 16.24,6.34L17.66,4.93A1,1 0 0,1 19.07,6.34L17.66,7.76A1,1 0 0,1 16.24,7.76Z"/></svg>`,
    snowflake: `<svg viewBox="0 0 24 24"><path d="M13 11V7.83L15.59 10.42L17 9L12 4L7 9L8.41 10.41L11 7.83V11H7.83L10.42 8.41L9 7L4 12L9 17L10.41 15.59L7.83 13H11V16.17L8.41 13.58L7 15L12 20L17 15L15.59 13.59L13 16.17V13H16.17L13.58 15.59L15 17L20 12L15 7L13.59 8.41L16.17 11H13Z"/></svg>`,
    fanOff: `<svg viewBox="0 0 24 24"><path d="M12.5,2C9.64,2 8.57,4.55 9.29,7.47L15,13.16C15.87,13.37 16.81,13.81 17.28,14.73C18.46,17.1 22.03,17 22.03,12.5C22.03,8.92 18.05,8.13 14.35,10.13C14.03,9.73 13.61,9.42 13.13,9.22C13.32,8.29 13.76,7.24 14.75,6.75C17.11,5.57 17,2 12.5,2M3.28,4L2,5.27L4.47,7.73C3.22,7.74 2,8.87 2,11.5C2,15.07 5.96,15.85 9.65,13.87C9.97,14.27 10.4,14.59 10.89,14.79C10.69,15.71 10.25,16.75 9.27,17.24C6.91,18.42 7,22 11.5,22C13.8,22 14.94,20.36 14.94,18.21L18.73,22L20,20.72L3.28,4Z"/></svg>`,
    fanLow: `<svg viewBox="0 0 24 24"><path d="M13 19C13 17.59 13.5 16.3 14.3 15.28C14.17 14.97 14.03 14.65 13.86 14.34C14.26 14 14.57 13.59 14.77 13.11C15.26 13.21 15.78 13.39 16.25 13.67C17.07 13.25 18 13 19 13C20.05 13 21.03 13.27 21.89 13.74C21.95 13.37 22 12.96 22 12.5C22 8.92 18.03 8.13 14.33 10.13C14 9.73 13.59 9.42 13.11 9.22C13.3 8.29 13.74 7.24 14.73 6.75C17.09 5.57 17 2 12.5 2C8.93 2 8.14 5.96 10.13 9.65C9.72 9.97 9.4 10.39 9.21 10.87C8.28 10.68 7.23 10.25 6.73 9.26C5.56 6.89 2 7 2 11.5C2 15.07 5.95 15.85 9.64 13.87C9.96 14.27 10.39 14.59 10.88 14.79C10.68 15.71 10.24 16.75 9.26 17.24C6.9 18.42 7 22 11.5 22C12.31 22 13 21.78 13.5 21.41C13.19 20.67 13 19.86 13 19M12 13C11.43 13 11 12.55 11 12S11.43 11 12 11C12.54 11 13 11.45 13 12S12.54 13 12 13M17 15V17H18V23H20V15H17Z"/></svg>`,
    fanMedium: `<svg viewBox="0 0 24 24"><path d="M13 19C13 17.59 13.5 16.3 14.3 15.28C14.17 14.97 14.03 14.65 13.86 14.34C14.26 14 14.57 13.59 14.77 13.11C15.26 13.21 15.78 13.39 16.25 13.67C17.07 13.25 18 13 19 13C20.05 13 21.03 13.27 21.89 13.74C21.95 13.37 22 12.96 22 12.5C22 8.92 18.03 8.13 14.33 10.13C14 9.73 13.59 9.42 13.11 9.22C13.3 8.29 13.74 7.24 14.73 6.75C17.09 5.57 17 2 12.5 2C8.93 2 8.14 5.96 10.13 9.65C9.72 9.97 9.4 10.39 9.21 10.87C8.28 10.68 7.23 10.25 6.73 9.26C5.56 6.89 2 7 2 11.5C2 15.07 5.95 15.85 9.64 13.87C9.96 14.27 10.39 14.59 10.88 14.79C10.68 15.71 10.24 16.75 9.26 17.24C6.9 18.42 7 22 11.5 22C12.31 22 13 21.78 13.5 21.41C13.19 20.67 13 19.86 13 19M12 13C11.43 13 11 12.55 11 12S11.43 11 12 11C12.54 11 13 11.45 13 12S12.54 13 12 13M16 15V17H19V18H18C16.9 18 16 18.9 16 20V23H21V21H18V20H19C20.11 20 21 19.11 21 18V17C21 15.9 20.11 15 19 15H16Z"/></svg>`,
    fanHigh: `<svg viewBox="0 0 24 24"><path d="M13 19C13 17.59 13.5 16.3 14.3 15.28C14.17 14.97 14.03 14.65 13.86 14.34C14.26 14 14.57 13.59 14.77 13.11C15.26 13.21 15.78 13.39 16.25 13.67C17.07 13.25 18 13 19 13C20.05 13 21.03 13.27 21.89 13.74C21.95 13.37 22 12.96 22 12.5C22 8.92 18.03 8.13 14.33 10.13C14 9.73 13.59 9.42 13.11 9.22C13.3 8.29 13.74 7.24 14.73 6.75C17.09 5.57 17 2 12.5 2C8.93 2 8.14 5.96 10.13 9.65C9.72 9.97 9.4 10.39 9.21 10.87C8.28 10.68 7.23 10.25 6.73 9.26C5.56 6.89 2 7 2 11.5C2 15.07 5.95 15.85 9.64 13.87C9.96 14.27 10.39 14.59 10.88 14.79C10.68 15.71 10.24 16.75 9.26 17.24C6.9 18.42 7 22 11.5 22C12.31 22 13 21.78 13.5 21.41C13.19 20.67 13 19.86 13 19M12 13C11.43 13 11 12.55 11 12S11.43 11 12 11C12.54 11 13 11.45 13 12S12.54 13 12 13M21 21V20.5C21 19.67 20.33 19 19.5 19C20.33 19 21 18.33 21 17.5V17C21 15.89 20.1 15 19 15H16V17H19V18H17V20H19V21H16V23H19C20.11 23 21 22.11 21 21"/></svg>`,
    fanClock: `<svg viewBox="0 0 24 24"><path d="M16 14H17.5V16.8L19.9 18.2L19.1 19.5L16 17.7V14M21 11.3C20.8 7.9 17 7.2 13.3 9.2C13 8.8 12.6 8.5 12.1 8.3C12.3 7.4 12.7 6.3 13.7 5.8C16.1 4.6 16 1 11.5 1C7.9 1 7.2 5 9.1 8.7C8.7 9 8.4 9.4 8.2 9.9C7.3 9.7 6.2 9.3 5.7 8.3C4.6 5.9 1 6 1 10.5C1 14.1 5 14.8 8.7 12.9C9 13.3 9.5 13.6 9.9 13.8C9.7 14.7 9.3 15.8 8.3 16.3C5.9 17.4 6 21 10.5 21C10.8 21 11 21 11.2 20.9C12.5 22.8 14.6 24 17 24C20.9 24 20.9 12.5 21 11.3M11 10C11.6 10 12 10.4 12 11S11.6 12 11 12 10 11.6 10 11 10.4 10 11 10M17 22C14.2 22 12 19.8 12 17S14.2 12 17 12 22 14.2 22 17 19.8 22 17 22Z"/></svg>`,
    filter: `<svg viewBox="0 0 24 24"><path d="M19,18.31V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V16.3C4.54,16.12 3.95,16 3,16A1,1 0 0,1 2,15A1,1 0 0,1 3,14C3.82,14 4.47,14.08 5,14.21V12.3C4.54,12.12 3.95,12 3,12A1,1 0 0,1 2,11A1,1 0 0,1 3,10C3.82,10 4.47,10.08 5,10.21V8.3C4.54,8.12 3.95,8 3,8A1,1 0 0,1 2,7A1,1 0 0,1 3,6C3.82,6 4.47,6.08 5,6.21V4A2,2 0 0,1 7,2H17A2,2 0 0,1 19,4V6.16C20.78,6.47 21.54,7.13 21.71,7.29C22.1,7.68 22.1,8.32 21.71,8.71C21.32,9.1 20.8,9.09 20.29,8.71V8.71C20.29,8.71 19.25,8 17,8C15.74,8 14.91,8.41 13.95,8.9C12.91,9.41 11.74,10 10,10C9.64,10 9.31,10 9,9.96V7.95C9.3,8 9.63,8 10,8C11.26,8 12.09,7.59 13.05,7.11C14.09,6.59 15.27,6 17,6V4H7V20H17V18C18.5,18 18.97,18.29 19,18.31M17,10C15.27,10 14.09,10.59 13.05,11.11C12.09,11.59 11.26,12 10,12C9.63,12 9.3,12 9,11.95V13.96C9.31,14 9.64,14 10,14C11.74,14 12.91,13.41 13.95,12.9C14.91,12.42 15.74,12 17,12C20.29,12 20.29,12.71 20.29,12.71V12.71C20.8,13.1 21.32,13.1 21.71,12.71C22.1,12.32 22.1,11.69 21.71,11.29C21.5,11.08 20.25,10 17,10M17,14C15.27,14 14.09,14.59 13.05,15.11C12.09,15.59 11.26,16 10,16C9.63,16 9.3,16 9,15.95V17.96C9.31,18 9.64,18 10,18C11.74,18 12.91,17.41 13.95,16.9C14.91,16.42 15.74,16 17,16C19.25,16 20.29,16.71 20.29,16.71V16.71C20.8,17.1 21.32,17.1 21.71,15.29C21.5,15.08 20.25,14 17,14Z"/></svg>`
  };

  // State Management
  const state = {
    outsideTemp: 0,
    exhaustTemp: 0,
    returnTemp: 0,
    supplyTemp: 0,
    outsideStr: '—',
    exhaustStr: '—',
    returnStr: '—',
    supplyStr: '—',
    intakeRpm: 0,
    exhaustRpm: 0,
    returnLvl: 0,
    supplyLvl: 0,
    bypassOpen: false,
    summerMode: false,
    filterStatus: 'OK',
    fanMode: 'OFF',
    boostActive: false,
    // Dynamically captured name_ids for REST API endpoints
    climateNameId: 'climate/ComfoAir 180',
    boostButtonNameId: 'button/Start Fan Boost',
    resetFilterButtonNameId: 'button/Reset Filter'
  };

  function parseTemp(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  function getTempColor(temp) {
    if (temp < 18.0) return '#1e88e5'; // Deep Blue
    if (temp < 23.5) return '#0097a7'; // Deep Cyan
    if (temp <= 25.5) return '#2e7d32'; // Rich Dark Green
    if (temp <= 27.0) return '#e65100'; // Deep Orange
    return '#d32f2f'; // Crimson Red
  }

  function chevron(cx, cy, dir) {
    const d = dir === 'right'
      ? `M${cx - 4},${cy - 5} L${cx + 4},${cy} L${cx - 4},${cy + 5}`
      : `M${cx + 4},${cy - 5} L${cx - 4},${cy} L${cx + 4},${cy + 5}`;
    return `<path class="arrow" d="${d}"/>`;
  }

  function renderFlowArrows(bypass) {
    if (bypass) {
      return `
        ${chevron(50, 109, 'right')}
        ${chevron(100, 109, 'right')}
        ${chevron(270, 109, 'right')}
        ${chevron(320, 109, 'right')}
        ${chevron(320, 187, 'left')}
        ${chevron(270, 187, 'left')}
        ${chevron(100, 187, 'left')}
        ${chevron(50, 187, 'left')}
      `;
    }
    return `
      ${chevron(50, 109, 'right')}
      ${chevron(100, 109, 'right')}
      ${chevron(270, 187, 'right')}
      ${chevron(320, 187, 'right')}
      ${chevron(320, 109, 'left')}
      ${chevron(270, 109, 'left')}
      ${chevron(100, 187, 'left')}
      ${chevron(50, 187, 'left')}
    `;
  }

  function renderDucts(bypass, outsideClr, exhaustClr, returnClr, supplyClr) {
    if (bypass) {
      return `
        <rect class="duct" x="20" y="97" width="330" height="24" rx="4" fill="url(#grad-bypass-upper)" />
        <rect class="duct" x="20" y="175" width="330" height="24" rx="4" fill="url(#grad-bypass-lower)" />
      `;
    }
    return `
      <!-- Fresh air (Top-left outdoor -> Bottom-right indoor) -->
      <path class="duct"
        d="M 20,97 L 130,97 Q 145,97 155,104 L 215,168 Q 225,175 240,175 L 350,175 L 350,199 L 240,199 Q 220,199 205,187 L 145,123 Q 135,121 120,121 L 20,121 Z"
        fill="url(#grad-hx1)"
      />
      <rect class="duct" x="20" y="97" width="10" height="24" rx="2" fill="${outsideClr}"/>
      <rect class="duct" x="340" y="175" width="10" height="24" rx="2" fill="${supplyClr}"/>

      <!-- Stale air (Top-right indoor -> Bottom-left outdoor) -->
      <path class="duct"
        d="M 350,97 L 240,97 Q 225,97 215,104 L 155,168 Q 145,175 130,175 L 20,175 L 20,199 L 130,199 Q 150,199 165,187 L 225,123 Q 235,121 250,121 L 350,121 Z"
        fill="url(#grad-hx2)"
      />
      <rect class="duct" x="340" y="97" width="10" height="24" rx="2" fill="${returnClr}"/>
      <rect class="duct" x="20" y="175" width="10" height="24" rx="2" fill="${exhaustClr}"/>
    `;
  }

  function renderGradients(bypass, outsideClr, exhaustClr, returnClr, supplyClr) {
    if (bypass) {
      return `
        <linearGradient id="grad-bypass-upper" x1="20" y1="0" x2="350" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${outsideClr}"/>
          <stop offset="100%" stop-color="${supplyClr}"/>
        </linearGradient>
        <linearGradient id="grad-bypass-lower" x1="20" y1="0" x2="350" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="${exhaustClr}"/>
          <stop offset="100%" stop-color="${returnClr}"/>
        </linearGradient>
      `;
    }
    return `
      <linearGradient id="grad-hx1" x1="130" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${outsideClr}"/>
        <stop offset="100%" stop-color="${supplyClr}"/>
      </linearGradient>
      <linearGradient id="grad-hx2" x1="240" y1="0" x2="130" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${returnClr}"/>
        <stop offset="100%" stop-color="${exhaustClr}"/>
      </linearGradient>
    `;
  }

  function updateTheme() {
    const container = document.getElementById('comfoair-custom-container');
    if (!container) return;
    const card = container.querySelector('.comfoair-card');
    if (!card) return;

    const htmlStyle = document.documentElement.getAttribute('style') || '';
    const espApp = document.querySelector('esp-app');
    const appScheme = espApp ? (espApp.scheme || espApp.getAttribute('scheme')) : null;
    const computedScheme = getComputedStyle(document.documentElement).colorScheme;

    let isDark = false;
    if (appScheme === 'dark' || htmlStyle.includes('color-scheme: dark') || computedScheme === 'dark') {
      isDark = true;
    } else if (appScheme === 'light' || htmlStyle.includes('color-scheme: light') || computedScheme === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      card.classList.add('theme-dark');
      card.classList.remove('theme-light');
    } else {
      card.classList.add('theme-light');
      card.classList.remove('theme-dark');
    }
  }

  function initThemeObserver() {
    const observer = new MutationObserver(() => updateTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'color-scheme'] });

    const espApp = document.querySelector('esp-app');
    if (espApp) {
      observer.observe(espApp, { attributes: true, attributeFilter: ['scheme', 'class'] });
    }

    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => updateTheme());
    } catch (e) {}

    updateTheme();
  }

  function updateUI() {
    const container = document.getElementById('comfoair-custom-container');
    if (!container) return;

    const bypass = state.bypassOpen;
    const isFilterFull = state.filterStatus === 'Full' || state.filterStatus === 'full';

    // Temperature colors
    const outsideClr = getTempColor(state.outsideTemp);
    const exhaustClr = getTempColor(state.exhaustTemp);
    const returnClr = getTempColor(state.returnTemp);
    const supplyClr = getTempColor(state.supplyTemp);

    // Indoor upper/lower values based on bypass
    const upperIndoorStr = bypass ? state.supplyStr : state.returnStr;
    const upperIndoorClr = bypass ? supplyClr : returnClr;
    const upperIndoorLvl = bypass ? state.supplyLvl : state.returnLvl;

    const lowerIndoorStr = bypass ? state.returnStr : state.supplyStr;
    const lowerIndoorClr = bypass ? returnClr : supplyClr;
    const lowerIndoorLvl = bypass ? state.returnLvl : state.supplyLvl;

    const currentFanMode = (state.fanMode || 'OFF').toUpperCase();

    const html = `
      <div class="comfoair-card">
        <!-- Header -->
        <div class="card-header-row">
          <div class="card-title">
            <span class="status-dot"></span> ComfoAir
          </div>
          <div class="header-icons">
            <div class="header-icon" title="Summer Mode: ${state.summerMode ? 'ON' : 'OFF'}">
              ${state.summerMode ? ICONS.sun : ICONS.snowflake}
            </div>
          </div>
        </div>

        <!-- SVG Diagram -->
        <div class="diagram-wrapper">
          <svg class="diagram" viewBox="0 0 440 230" xmlns="http://www.w3.org/2000/svg">
            <defs>
              ${renderGradients(bypass, outsideClr, exhaustClr, returnClr, supplyClr)}
            </defs>

            <!-- House silhouette -->
            <path class="house-fill" d="M130,68 L275,12 L420,68 V222 H130 Z"/>
            <path class="house-outline" d="M130,68 L275,12 L420,68 V222 H130 Z"/>

            <!-- Section labels -->
            <text class="label" x="75" y="68" text-anchor="middle">OUTDOOR</text>
            <text class="label" x="295" y="68" text-anchor="middle">INDOOR</text>

            <!-- Change Filter Warning Badge -->
            ${isFilterFull ? `
              <g class="filter-badge clickable" id="btn-reset-filter" title="Click to Reset Filter">
                <rect class="filter-badge-bg" x="124" y="67" width="122" height="22" rx="11"/>
                <path class="filter-badge-icon" transform="translate(132, 71) scale(0.58)" d="M19,18.31V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V16.3C4.54,16.12 3.95,16 3,16A1,1 0 0,1 2,15A1,1 0 0,1 3,14C3.82,14 4.47,14.08 5,14.21V12.3C4.54,12.12 3.95,12 3,12A1,1 0 0,1 2,11A1,1 0 0,1 3,10C3.82,10 4.47,10.08 5,10.21V8.3C4.54,8.12 3.95,8 3,8A1,1 0 0,1 2,7A1,1 0 0,1 3,6C3.82,6 4.47,6.08 5,6.21V4A2,2 0 0,1 7,2H17A2,2 0 0,1 19,4V6.16C20.78,6.47 21.54,7.13 21.71,7.29C22.1,7.68 22.1,8.32 21.71,8.71C21.32,9.1 20.8,9.09 20.29,8.71V8.71C20.29,8.71 19.25,8 17,8C15.74,8 14.91,8.41 13.95,8.9C12.91,9.41 11.74,10 10,10C9.64,10 9.31,10 9,9.96V7.95C9.3,8 9.63,8 10,8C11.26,8 12.09,7.59 13.05,7.11C14.09,6.59 15.27,6 17,6V4H7V20H17V18C18.5,18 18.97,18.29 19,18.31M17,10C15.27,10 14.09,10.59 13.05,11.11C12.09,11.59 11.26,12 10,12C9.63,12 9.3,12 9,11.95V13.96C9.31,14 9.64,14 10,14C11.74,14 12.91,13.41 13.95,12.9C14.91,12.42 15.74,12 17,12C20.29,12 20.29,12.71 20.29,12.71V12.71C20.8,13.1 21.32,13.1 21.71,12.71C22.1,12.32 22.1,11.69 21.71,11.29C21.5,11.08 20.25,10 17,10M17,14C15.27,14 14.09,14.59 13.05,15.11C12.09,15.59 11.26,16 10,16C9.63,16 9.3,16 9,15.95V17.96C9.31,18 9.64,18 10,18C11.74,18 12.91,17.41 13.95,16.9C14.91,16.42 15.74,16 17,16C19.25,16 20.29,16.71 20.29,16.71V16.71C20.8,17.1 21.32,17.1 21.71,15.29C21.5,15.08 20.25,14 17,14Z"/>
                <text class="filter-badge-text" x="192" y="82" text-anchor="middle">CHANGE FILTER</text>
              </g>
            ` : ''}

            <!-- Ducts -->
            ${renderDucts(bypass, outsideClr, exhaustClr, returnClr, supplyClr)}

            <!-- Bypass badge -->
            ${bypass ? `
              <g class="bypass-badge">
                <rect class="bypass-badge-bg" x="145" y="138" width="80" height="20" rx="10"/>
                <text class="bypass-badge-text" x="185" y="152" text-anchor="middle">⇌ BYPASS</text>
              </g>
            ` : ''}

            <!-- Flow Arrows -->
            ${renderFlowArrows(bypass)}

            <!-- Temperatures -->
            <text class="temp-text" x="75" y="91" text-anchor="middle" fill="${outsideClr}">${state.outsideStr}°C</text>
            <text class="temp-text" x="295" y="91" text-anchor="middle" fill="${upperIndoorClr}">${upperIndoorStr}°C</text>
            <text class="temp-text" x="75" y="169" text-anchor="middle" fill="${exhaustClr}">${state.exhaustStr}°C</text>
            <text class="temp-text" x="295" y="169" text-anchor="middle" fill="${lowerIndoorClr}">${lowerIndoorStr}°C</text>

            <!-- Fan RPM & Levels -->
            <text class="fan-text" x="75" y="134" text-anchor="middle">${state.intakeRpm} rpm</text>
            <text class="fan-text" x="295" y="134" text-anchor="middle">${upperIndoorLvl}%</text>
            <text class="fan-text" x="75" y="212" text-anchor="middle">${state.exhaustRpm} rpm</text>
            <text class="fan-text" x="295" y="212" text-anchor="middle">${lowerIndoorLvl}%</text>
          </svg>
        </div>

        <!-- Controls Bar -->
        <div class="controls-bar">
          <div class="fan-buttons">
            <button class="fan-btn ${currentFanMode === 'OFF' ? 'active' : ''}" data-mode="OFF">
              ${ICONS.fanOff} <span>Off</span>
            </button>
            <button class="fan-btn ${currentFanMode === 'LOW' ? 'active' : ''}" data-mode="LOW">
              ${ICONS.fanLow} <span>Low</span>
            </button>
            <button class="fan-btn ${currentFanMode === 'MEDIUM' ? 'active' : ''}" data-mode="MEDIUM">
              ${ICONS.fanMedium} <span>Med</span>
            </button>
            <button class="fan-btn ${currentFanMode === 'HIGH' ? 'active' : ''}" data-mode="HIGH">
              ${ICONS.fanHigh} <span>High</span>
            </button>
          </div>

          <div class="action-buttons">
            <button class="action-btn ${state.boostActive ? 'boost-active' : ''}" id="btn-boost" title="Trigger 30-min High Boost">
              ${ICONS.fanClock} <span>${state.boostActive ? 'Boost Active' : 'Start Boost'}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    updateTheme();
    bindEvents();
  }

  // Helper to post commands using full name_id path
  function sendPostCommand(path, params) {
    const fullPath = '/' + encodeURI(path.replace(/^\//, '')) + (params ? '?' + params : '');
    return fetch(fullPath, { method: 'POST' });
  }

  function bindEvents() {
    const container = document.getElementById('comfoair-custom-container');
    if (!container) return;

    // Fan speed mode buttons
    container.querySelectorAll('.fan-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode) {
          const path = state.climateNameId || 'climate/ComfoAir 180';
          sendPostCommand(`${path}/set`, `fan_mode=${mode}`)
            .then(res => {
              if (res.ok) {
                state.fanMode = mode;
                updateUI();
              } else {
                console.error('Fan mode command failed:', res.status, res.statusText);
              }
            })
            .catch(err => console.error('Failed to set fan mode:', err));
        }
      });
    });

    // Boost button
    const boostBtn = container.querySelector('#btn-boost');
    if (boostBtn) {
      boostBtn.addEventListener('click', () => {
        const path = state.boostButtonNameId || 'button/Start Fan Boost';
        sendPostCommand(`${path}/press`)
          .then(res => {
            if (res.ok) {
              state.boostActive = true;
              updateUI();
            }
          })
          .catch(err => console.error('Failed to start boost:', err));
      });
    }

    // Reset filter button
    const filterBtn = container.querySelector('#btn-reset-filter');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        if (confirm('Reset filter status?')) {
          const path = state.resetFilterButtonNameId || 'button/Reset Filter';
          sendPostCommand(`${path}/press`)
            .catch(err => console.error('Failed to reset filter:', err));
        }
      });
    }
  }

  function handleStateUpdate(data) {
    if (!data) return;

    const id = (data.id || '').toLowerCase();
    const name = (data.name || '').toLowerCase();
    const nameId = data.name_id || '';

    // Capture name_id for commands if matching climate or action buttons
    if (nameId) {
      if (id.startsWith('climate') || name.includes('comfoair')) {
        state.climateNameId = nameId;
      } else if (id.includes('boost') && (id.startsWith('button') || name.includes('boost'))) {
        if (nameId.startsWith('button/')) state.boostButtonNameId = nameId;
      } else if (id.includes('filter') && (id.startsWith('button') || name.includes('filter'))) {
        if (nameId.startsWith('button/')) state.resetFilterButtonNameId = nameId;
      }
    }

    // Match entities strictly by domain and object_id/name to avoid cross-entity collisions
    if ((id.includes('outside_temperature') || id.includes('outside_air_temperature') || name === 'outside temperature') && !id.includes('hours')) {
      state.outsideTemp = parseTemp(data.value);
      state.outsideStr = data.state != null ? String(data.state).replace('°C', '').trim() : state.outsideTemp.toFixed(1);
    } else if ((id.includes('supply_temperature') || id.includes('supply_air_temperature') || name === 'supply temperature') && !id.includes('hours')) {
      state.supplyTemp = parseTemp(data.value);
      state.supplyStr = data.state != null ? String(data.state).replace('°C', '').trim() : state.supplyTemp.toFixed(1);
    } else if ((id.includes('return_temperature') || id.includes('return_air_temperature') || name === 'return temperature') && !id.includes('hours')) {
      state.returnTemp = parseTemp(data.value);
      state.returnStr = data.state != null ? String(data.state).replace('°C', '').trim() : state.returnTemp.toFixed(1);
    } else if ((id.includes('exhaust_temperature') || id.includes('exhaust_air_temperature') || name === 'exhaust temperature') && !id.includes('hours')) {
      state.exhaustTemp = parseTemp(data.value);
      state.exhaustStr = data.state != null ? String(data.state).replace('°C', '').trim() : state.exhaustTemp.toFixed(1);
    } else if (id.includes('intake_fan_rpm') || id.includes('intake_fan_speed_rpm') || name === 'intake fan rpm') {
      state.intakeRpm = Math.round(parseTemp(data.value));
    } else if (id.includes('exhaust_fan_rpm') || id.includes('exhaust_fan_speed_rpm') || name === 'exhaust fan rpm') {
      state.exhaustRpm = Math.round(parseTemp(data.value));
    } else if ((id.includes('supply_air_level') || id.includes('intake_fan_speed') || name === 'supply air level') && !id.includes('rpm')) {
      state.supplyLvl = Math.round(parseTemp(data.value));
    } else if ((id.includes('return_air_level') || id.includes('exhaust_fan_speed') || name === 'return air level') && !id.includes('rpm')) {
      state.returnLvl = Math.round(parseTemp(data.value));
    } else if (id.startsWith('binary_sensor') && (id.includes('bypass') || name === 'bypass open') && !id.includes('hours')) {
      state.bypassOpen = data.value === true || String(data.state).toUpperCase() === 'ON';
    } else if ((id.startsWith('binary_sensor') && id.includes('summer')) || name === 'summer mode') {
      state.summerMode = data.value === true || String(data.state).toUpperCase() === 'ON';
    } else if ((id.includes('filter_status') || name === 'filter status') && !id.includes('hours')) {
      state.filterStatus = data.state || 'OK';
    } else if (id.startsWith('climate') || name.includes('comfoair')) {
      if (data.fan_mode) {
        state.fanMode = data.fan_mode;
      }
    } else if ((id.includes('boost_status') || name === 'fan boost status') && !id.includes('duration')) {
      state.boostActive = data.value === true || String(data.state).toUpperCase() === 'ON';
    }

    updateUI();
  }

  function initSSE() {
    try {
      const sse = new EventSource('/events');
      const handler = (e) => {
        try {
          const data = JSON.parse(e.data);
          handleStateUpdate(data);
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      sse.addEventListener('state', handler);
      sse.addEventListener('state_detail_all', handler);
      sse.addEventListener('ping', () => {});
    } catch (err) {
      console.error('Failed to initialize EventSource:', err);
    }
  }

  function init() {
    if (document.getElementById('comfoair-custom-container')) return;

    const container = document.createElement('div');
    container.id = 'comfoair-custom-container';

    const espApp = document.querySelector('esp-app');
    if (espApp && espApp.parentNode) {
      espApp.parentNode.insertBefore(container, espApp);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }

    updateUI();
    initThemeObserver();
    initSSE();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
