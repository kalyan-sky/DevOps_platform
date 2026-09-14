import { mountNav, mountFooter } from './nav.js';
import { mountAmbientScene } from './ambient-scene.js';
import { mountScrollReveal } from './reveal.js';
import { PROFILE } from './content.js';

mountNav('contact.html');
mountAmbientScene(document.getElementById('bg'));

const cards = [
  { label: 'EMAIL', value: PROFILE.email, href: `mailto:${PROFILE.email}`, colorA: '#8b5cf6', colorB: '#ec4899' },
  { label: 'PHONE', value: PROFILE.phone, href: `tel:${PROFILE.phone.replace(/\s+/g, '')}`, colorA: '#2dd4bf', colorB: '#60a5fa' },
  { label: 'LINKEDIN', value: PROFILE.linkedinLabel, href: PROFILE.linkedin, colorA: '#60a5fa', colorB: '#8b5cf6', external: true },
  { label: 'LOCATION', value: PROFILE.location, href: null, colorA: '#f59e0b', colorB: '#ec4899' },
];

document.getElementById('contact-grid').innerHTML = cards
  .map((c) => {
    const inner = `
      <p class="label">${c.label}</p>
      <p class="value">${c.value}</p>`;
    const style = `--accent-a:${c.colorA}; --accent-b:${c.colorB}`;
    if (c.href) {
      return `<a class="card contact-card" style="${style}" href="${c.href}" ${c.external ? 'target="_blank" rel="noopener"' : ''}>${inner}</a>`;
    }
    return `<div class="card contact-card" style="${style}">${inner}</div>`;
  })
  .join('');

mountFooter();
mountScrollReveal();
