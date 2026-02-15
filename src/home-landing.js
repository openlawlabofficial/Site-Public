const canvas = document.querySelector('[data-landing-canvas]');

if (!canvas) {
  // Not on home page.
} else {
  const context = canvas.getContext('2d');

  if (!context) {
    // Canvas unsupported.
  } else {
    let width = 0;
    let height = 0;
    let frame = 0;

    const blobs = [
      { speed: 0.21, radius: 0.55, offset: 0.0, hue: 204 },
      { speed: 0.16, radius: 0.45, offset: 1.8, hue: 268 },
      { speed: 0.12, radius: 0.62, offset: 3.2, hue: 181 },
      { speed: 0.1, radius: 0.38, offset: 4.6, hue: 228 }
    ];

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      width = window.innerWidth;
      height = Math.max(window.innerHeight * 1.2, 560);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const render = (time) => {
      const t = time * 0.001;
      frame = requestAnimationFrame(render);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#06070b');
      gradient.addColorStop(0.5, '#121528');
      gradient.addColorStop(1, '#0b0f1a');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      for (const blob of blobs) {
        const x = width * (0.5 + Math.sin(t * blob.speed + blob.offset) * 0.28);
        const y = height * (0.42 + Math.cos(t * (blob.speed * 1.4) + blob.offset) * 0.22);
        const r = Math.min(width, height) * blob.radius;

        const glow = context.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, `hsla(${blob.hue}, 92%, 62%, 0.28)`);
        glow.addColorStop(0.4, `hsla(${blob.hue}, 88%, 55%, 0.15)`);
        glow.addColorStop(1, `hsla(${blob.hue}, 100%, 40%, 0)`);
        context.fillStyle = glow;
        context.fillRect(x - r, y - r, r * 2, r * 2);
      }

      context.fillStyle = 'rgba(255,255,255,0.03)';
      for (let i = 0; i < 45; i += 1) {
        const px = ((i * 197.33 + t * 23) % width);
        const py = ((i * 121.77 + t * 17) % height);
        context.fillRect(px, py, 1.5, 1.5);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    frame = requestAnimationFrame(render);

    window.addEventListener('beforeunload', () => cancelAnimationFrame(frame), { once: true });
  }
}
