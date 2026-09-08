# Siddam Kalyan — Portfolio

A multi-page personal portfolio site for Siddam Kalyan (DevOps & AI Engineer), built with
Vite and Three.js. Carries the same dark, glowing visual identity as the earlier CONTINUUM
showcase (ribbon/particle ambient background, glass cards, bold display type), restructured
as a real multi-page site: a persistent top navigation bar, and separate pages for Home,
About (resume), Projects, and Contact.

## Stack

- [Vite](https://vitejs.dev/) — multi-page build (see `vite.config.js`)
- [Three.js](https://threejs.org/) — lightweight ambient WebGL background (ribbon + particles),
  shared across every page via `src/ambient-scene.js`
- Vanilla JS/CSS — no framework

## Pages

| Page | File | Content |
|---|---|---|
| Home | `index.html` | Hero, key stats, strengths preview, featured projects |
| About | `about.html` | Summary, core strengths, experience timeline, certifications, education |
| Projects | `projects.html` | Full project grid (BiteNXT, Vation AURA, V-OpsOra/V-Opsly, eSanchaya) |
| Contact | `contact.html` | Email, phone, LinkedIn, location |

## Structure

```
index.html, about.html, projects.html, contact.html   Page markup
src/content.js       Single source of truth for all resume-derived content
src/nav.js           Shared top navigation bar + footer, mounted on every page
src/ambient-scene.js Shared Three.js ambient background (ribbon + particles)
src/home.js          Page-specific rendering logic for index.html
src/about.js         Page-specific rendering logic for about.html
src/projects.js      Page-specific rendering logic for projects.html
src/contact.js       Page-specific rendering logic for contact.html
src/style.css        Shared design system: tokens, nav, cards, timeline, grids, footer
```

## Editing content

All resume-derived content (profile, stats, strengths, experience, certifications,
education, projects) lives in `src/content.js`. Edit it there — every page renders from
this one file, so nothing needs to be duplicated.

## Development

```bash
npm install
npm run dev       # start dev server (http://localhost:5173)
npm run build      # production build to dist/ (all four pages)
npm run preview    # preview the production build
```
