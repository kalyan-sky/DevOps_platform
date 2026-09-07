import { mountNav, mountFooter } from './nav.js';
import { mountAmbientScene } from './ambient-scene.js';
import { PROFILE, STRENGTHS, EXPERIENCE, CERTIFICATIONS, EDUCATION } from './content.js';

mountNav('about.html');
mountAmbientScene(document.getElementById('bg'));

document.getElementById('summary').textContent = PROFILE.summary;

document.getElementById('strengths').innerHTML = STRENGTHS.map(
  (s) => `
  <div class="card strength-card" style="--accent-a:${s.colorA}; --accent-b:${s.colorB}">
    <p class="tag">${s.tag}</p>
    <h3>${s.title}</h3>
    <ul>${s.items.map((i) => `<li>${i}</li>`).join('')}</ul>
  </div>`
).join('');

document.getElementById('timeline').innerHTML = EXPERIENCE.map(
  (e) => `
  <div class="timeline-item">
    <p class="role">${e.role}</p>
    <p class="meta">${e.company} · ${e.location} · ${e.period}</p>
    <ul>${e.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
  </div>`
).join('');

document.getElementById('certs').innerHTML = CERTIFICATIONS.map(
  (c) => `<div class="card cert-card">${c}</div>`
).join('');

document.getElementById('education').innerHTML = `
  <p class="degree">${EDUCATION.degree}</p>
  <p class="school">${EDUCATION.school} — ${EDUCATION.location}</p>
`;

mountFooter();
