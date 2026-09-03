# AXIOM — Interactive 3D Studio Site

A single-page, scroll-driven 3D portfolio site in the vein of glossy creative-agency
showcases (glowing looping hero animation, floating glass panels with colored
particle "smoke", a scroll-controlled camera flythrough through project cards,
and a persistent sidebar nav with search). Built from scratch with Three.js —
original branding, copy, and project data.

## Stack

- [Vite](https://vitejs.dev/) for dev server / bundling
- [Three.js](https://threejs.org/) for the WebGL scene (ribbon hero, particle field,
  glass panels, bloom post-processing via `EffectComposer` + `UnrealBloomPass`)
- Vanilla JS/CSS — no framework

## Structure

```
index.html        Page markup: topbar, sidebar nav, hero/showcase/contact sections
src/main.js       Scroll-progress math, DOM overlay updates, nav/search wiring
src/scene.js      Three.js scene: ribbon, particles, panels, scroll-driven camera
src/texture.js    Procedural canvas "smoke" texture for panel materials
src/data.js       Project list shown in the showcase (title, category, tagline, colors)
src/style.css     Layout, typography, glow effects
```

## How it works

The whole experience lives on one tall page. `main.js` computes a 0–1 progress
value for each of the three sections (hero / showcase / contact) from
`window.scrollY`, and `scene.js` uses those to drive a continuous camera dolly:
hero shows a glowing infinity-loop ribbon, showcase flies the camera down a
"corridor" of project panels (title text overlaid via DOM, crossfading as the
focal project changes), and contact fades the scene out.

The left sidebar's category links and the "ASK ME ANYTHING" search both work
by scrolling the camera to the matching project's position along that corridor.

## Development

```bash
npm install
npm run dev       # start dev server (http://localhost:5173)
npm run build      # production build to dist/
npm run preview    # preview the production build
```
