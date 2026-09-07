import { mountNav, mountFooter } from './nav.js';
import { mountAmbientScene } from './ambient-scene.js';
import { STATS, STRENGTHS, PROJECTS, PROFILE } from './content.js';

mountNav('index.html');
mountAmbientScene(document.getElementById('bg'));

document.title = `${PROFILE.name} — ${PROFILE.role}`;

const statsRow = document.getElementById('stats-row');
statsRow.innerHTML = STATS.map(
  (s) => `
  <div class="stat-tile">
    <div class="stat-value">${s.value}</div>
    <div class="stat-label">${s.label}</div>
  </div>`
).join('');

const strengthsPreview = document.getElementById('strengths-preview');
strengthsPreview.innerHTML = STRENGTHS.slice(0, 3)
  .map(
    (s) => `
    <div class="card strength-card" style="--accent-a:${s.colorA}; --accent-b:${s.colorB}">
      <p class="tag">${s.tag}</p>
      <h3>${s.title}</h3>
      <ul>${s.items.slice(0, 3).map((i) => `<li>${i}</li>`).join('')}</ul>
    </div>`
  )
  .join('');

const projectsPreview = document.getElementById('projects-preview');
projectsPreview.innerHTML = PROJECTS.filter((p) => p.featured)
  .slice(0, 3)
  .map(
    (p) => `
    <div class="card project-card" style="--accent-a:${p.colorA}; --accent-b:${p.colorB}">
      <p class="eyebrow">${p.subtitle}</p>
      <h3>${p.title}</h3>
      <div class="badges">${p.tags.map((t) => `<span class="badge">${t}</span>`).join('')}</div>
      <ul>${p.bullets.slice(0, 2).map((b) => `<li>${b}</li>`).join('')}</ul>
    </div>`
  )
  .join('');

mountFooter();
