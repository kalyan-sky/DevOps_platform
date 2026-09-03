import * as THREE from 'three';

export function createSmokeTexture(colorA, colorB) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const blobs = 7;
  for (let i = 0; i < blobs; i++) {
    const color = i % 2 === 0 ? colorA : colorB;
    const x = size * (0.2 + Math.random() * 0.6);
    const y = size * (0.2 + Math.random() * 0.6);
    const r = size * (0.18 + Math.random() * 0.3);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, hexToRgba(color, 0.55));
    grad.addColorStop(0.5, hexToRgba(color, 0.22));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const centerGlow = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size * 0.55
  );
  centerGlow.addColorStop(0, hexToRgba('#ffffff', 0.12));
  centerGlow.addColorStop(1, hexToRgba('#ffffff', 0));
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hexToRgba(hex, alpha) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}
