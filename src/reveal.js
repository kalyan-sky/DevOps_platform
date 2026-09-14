// Staggered scroll-reveal for the repeated card/list groups across pages.
// Call after a page's dynamic content has been injected into the DOM.
const GROUP_SELECTORS = '#stats-row, #strengths-preview, #projects-preview, #strengths, #timeline, #certs, #projects, #contact-grid';

export function mountScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const groups = document.querySelectorAll(GROUP_SELECTORS);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  groups.forEach((group) => {
    Array.from(group.children).forEach((el, i) => {
      el.classList.add('reveal-item');
      el.style.transitionDelay = `${Math.min(i, 6) * 60}ms`;
      observer.observe(el);
    });
  });
}
