import { NAV_LINKS, PROFILE } from './content.js';
import { mountChatWidget } from './chat-widget.js';

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
