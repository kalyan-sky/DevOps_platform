import { mountNav, mountFooter } from './nav.js';
import { mountAmbientScene } from './ambient-scene.js';
import { PROJECTS } from './content.js';

mountNav('projects.html');
mountAmbientScene(document.getElementById('bg'));

document.getElementById('projects').innerHTML = PROJECTS.map(
  (p) => `
  <div class="card project-card" style="--accent-a:${p.colorA}; --accent-b:${p.colorB}">
    <p class="eyebrow">${p.subtitle} · ${p.roles.join(' / ')}</p>
    <h3>${p.title}</h3>
    <div class="badges">${p.tags.map((t) => `<span class="badge">${t}</span>`).join('')}</div>
    <ul>${p.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
  </div>`
).join('');

mountFooter();
