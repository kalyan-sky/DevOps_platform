import { SceneController } from './scene.js';
import { PROJECTS } from './data.js';

const canvas = document.getElementById('bg');
const scene = new SceneController(canvas);

const sidebar = document.getElementById('sidebar');
const navList = document.getElementById('nav-list');
const askForm = document.getElementById('ask-form');
const askInput = document.getElementById('ask-input');
const askFeedback = document.getElementById('ask-feedback');
const projectFrame = document.getElementById('project-frame');
const projectTitle = document.getElementById('project-title');
const projectEyebrow = document.getElementById('project-eyebrow');
const projectMeta = document.getElementById('project-meta');
const heroTitleEl = document.querySelector('.hero-title');
const heroSubEl = document.querySelector('.hero-sub');
const scrollCueEl = document.querySelector('.scroll-cue');
const contactTitleEl = document.querySelector('.contact-title');
const contactEmailEl = document.querySelector('.contact-email');
const contactNoteEl = document.querySelector('.contact-note');

const heroEl = document.getElementById('hero');
const showcaseEl = document.getElementById('showcase');
const contactEl = document.getElementById('contact');

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function getSections() {
  const heroStart = 0;
  const heroH = heroEl.offsetHeight;
  const showcaseH = showcaseEl.offsetHeight;
  const contactH = contactEl.offsetHeight;
  const showcaseStart = heroStart + heroH;
  const contactStart = showcaseStart + showcaseH;
  const y = window.scrollY;

  const contactRange = Math.max(1, contactH - window.innerHeight);

  return {
    heroProgress: clamp01(y / heroH),
    showcaseProgress: clamp01((y - showcaseStart) / showcaseH),
    contactProgress: clamp01((y - contactStart) / contactRange),
    showcaseStart,
    showcaseH,
  };
}

let currentFocal = -1;

scene.onFocalChange = (index, visibility) => {
  if (index !== currentFocal) {
    currentFocal = index;
    if (index >= 0) {
      const p = PROJECTS[index];
      projectEyebrow.textContent = p.tag.toUpperCase();
      projectTitle.textContent = p.title;
      projectMeta.textContent = p.meta;
    }
  }
  const visible = index >= 0 && visibility > 0.05;
  projectFrame.style.opacity = visible ? Math.min(1, visibility * 1.6) : 0;
};

function scrollToProjectIndex(index) {
  const { showcaseStart, showcaseH } = getSections();
  const t = scene.scrollTargetForIndex(index);
  const targetY = showcaseStart + t * showcaseH;
  window.scrollTo({ top: targetY, behavior: 'smooth' });
}

navList.querySelectorAll('li').forEach((li) => {
  li.addEventListener('click', () => {
    navList.querySelectorAll('li').forEach((el) => el.classList.remove('active'));
    li.classList.add('active');
    const filter = li.dataset.filter;
    scene.setCategoryFilter(filter);
    if (filter !== 'all') {
      const idx = PROJECTS.findIndex((p) => p.category === filter);
      if (idx >= 0) scrollToProjectIndex(idx);
    } else {
      scrollToProjectIndex(0);
    }
  });
});

let feedbackTimer = null;
askForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = askInput.value.trim().toLowerCase();
  if (!query) return;

  const idx = PROJECTS.findIndex(
    (p) =>
      p.title.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.tag.toLowerCase().includes(query)
  );

  clearTimeout(feedbackTimer);
  if (idx >= 0) {
    askFeedback.textContent = `→ FOUND: ${PROJECTS[idx].title}`;
    navList.querySelectorAll('li').forEach((el) => el.classList.remove('active'));
    scene.setCategoryFilter('all');
    scrollToProjectIndex(idx);
  } else {
    askFeedback.textContent = 'NO MATCHING SYSTEMS — TRY "CLOUD" OR "SECURITY"';
  }
  askFeedback.classList.add('show');
  feedbackTimer = setTimeout(() => askFeedback.classList.remove('show'), 3200);
});

document.querySelectorAll('[data-scroll-to]').forEach((el) => {
  el.addEventListener('click', () => {
    const target = document.getElementById(el.dataset.scrollTo);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

function render() {
  const sections = getSections();
  const { heroProgress, showcaseProgress, contactProgress } = sections;

  const sidebarVisible = heroProgress > 0.45 && contactProgress < 0.2;
  sidebar.classList.toggle('visible', sidebarVisible);

  const heroFade = clamp01(1 - heroProgress * 1.6);
  heroTitleEl.style.opacity = heroFade;
  heroSubEl.style.opacity = heroFade;
  scrollCueEl.style.opacity = heroFade;
  heroTitleEl.style.transform = `translateY(${(1 - heroFade) * -30}px)`;

  const contactFade = clamp01((contactProgress - 0.05) / 0.4);
  contactTitleEl.style.opacity = contactFade;
  contactEmailEl.style.opacity = contactFade;
  contactNoteEl.style.opacity = contactFade;

  scene.update(sections);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
