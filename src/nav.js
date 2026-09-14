import { NAV_LINKS, PROFILE } from './content.js';
import { mountChatWidget } from './chat-widget.js';

const THEME_KEY = 'theme';

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function applyTheme(theme, themeToggleBtn) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === 'light' ? '🌙' : '☀️';
    themeToggleBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }
}

export function mountNav(activeHref) {
  mountChatWidget();
  const nav = document.createElement('nav');
  nav.className = 'topbar';
  nav.innerHTML = `
    <a href="index.html" class="brand"><span class="brand-mark">${initials(PROFILE.name)}</span><span class="brand-full">${PROFILE.name}</span></a>
    <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
    <ul class="nav-links" id="nav-links">
      ${NAV_LINKS.map(
        (l) => `<li><a href="${l.href}" class="${l.href === activeHref ? 'active' : ''}">${l.label}</a></li>`
      ).join('')}
      <li><button class="theme-toggle" id="theme-toggle" type="button" aria-label="Switch to light theme"></button></li>
    </ul>
  `;
  document.body.prepend(nav);

  const toggle = nav.querySelector('#nav-toggle');
  const links = nav.querySelector('#nav-links');
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    })
  );

  const themeToggle = nav.querySelector('#theme-toggle');
  applyTheme(currentTheme(), themeToggle);
  themeToggle.addEventListener('click', () => {
    applyTheme(currentTheme() === 'light' ? 'dark' : 'light', themeToggle);
  });
}

export function mountFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-name">${PROFILE.name}</div>
      <div class="footer-links">
        <a href="mailto:${PROFILE.email}">${PROFILE.email}</a>
        <span class="footer-dot">·</span>
        <a href="${PROFILE.linkedin}" target="_blank" rel="noopener">${PROFILE.linkedinLabel}</a>
        <span class="footer-dot">·</span>
        <span>${PROFILE.location}</span>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
}

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('');
}
