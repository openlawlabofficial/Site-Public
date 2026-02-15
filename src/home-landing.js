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

    const cometPalette = [
      { hue: 188, lightness: 72, alpha: 0.95 },
      { hue: 226, lightness: 68, alpha: 0.9 },
      { hue: 276, lightness: 72, alpha: 0.88 },
      { hue: 198, lightness: 65, alpha: 0.9 }
    ];

    const comets = Array.from({ length: 6 }, (_, index) => {
      const lane = index / 6;
      return {
        lane,
        speed: 0.08 + Math.random() * 0.14,
        wobble: 0.015 + Math.random() * 0.05,
        size: 1.4 + Math.random() * 2.3,
        phase: Math.random() * Math.PI * 2,
        startOffset: Math.random(),
        tailLength: 0.15 + Math.random() * 0.2,
        color: cometPalette[index % cometPalette.length]
      };
    });

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

    const drawComet = (comet, timeSeconds) => {
      const diagonal = Math.hypot(width, height);
      const travel = ((timeSeconds * comet.speed + comet.startOffset) % 1 + 1) % 1;

      const startX = -width * 0.32;
      const endX = width * 1.15;
      const startY = height * (0.06 + comet.lane * 0.2);
      const endY = height * (0.3 + comet.lane * 0.16);

      const wobbleY = Math.sin(timeSeconds * 1.6 + comet.phase) * height * comet.wobble;
      const headX = startX + (endX - startX) * travel;
      const headY = startY + (endY - startY) * travel + wobbleY;

      const dx = endX - startX;
      const dy = endY - startY;
      const mag = Math.hypot(dx, dy) || 1;
      const dirX = dx / mag;
      const dirY = dy / mag;

      const tail = diagonal * comet.tailLength;
      const tailX = headX - dirX * tail;
      const tailY = headY - dirY * tail;

      const gradient = context.createLinearGradient(headX, headY, tailX, tailY);
      gradient.addColorStop(0, `hsla(${comet.color.hue}, 100%, ${comet.color.lightness}%, ${comet.color.alpha})`);
      gradient.addColorStop(0.3, `hsla(${comet.color.hue}, 96%, ${Math.max(comet.color.lightness - 8, 50)}%, 0.46)`);
      gradient.addColorStop(1, `hsla(${comet.color.hue}, 88%, 40%, 0)`);

      context.save();
      context.globalCompositeOperation = 'lighter';
      context.strokeStyle = gradient;
      context.lineWidth = comet.size;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(headX, headY);
      context.stroke();

      const headGlow = context.createRadialGradient(headX, headY, 0, headX, headY, comet.size * 8);
      headGlow.addColorStop(0, `hsla(${comet.color.hue}, 100%, 90%, 0.7)`);
      headGlow.addColorStop(1, `hsla(${comet.color.hue}, 100%, 70%, 0)`);
      context.fillStyle = headGlow;
      context.beginPath();
      context.arc(headX, headY, comet.size * 8, 0, Math.PI * 2);
      context.fill();
      context.restore();
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

      for (const comet of comets) {
        drawComet(comet, t);
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
