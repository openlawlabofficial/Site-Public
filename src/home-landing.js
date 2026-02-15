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
      { speed: 0.045, radius: 0.58, offset: 0.0, hue: 32, lightness: 64, alpha: 0.24 },
      { speed: 0.035, radius: 0.46, offset: 1.7, hue: 24, lightness: 56, alpha: 0.18 },
      { speed: 0.03, radius: 0.66, offset: 3.4, hue: 42, lightness: 58, alpha: 0.16 },
      { speed: 0.04, radius: 0.4, offset: 5.1, hue: 14, lightness: 52, alpha: 0.15 }
    ];

    const cometPalette = [
      { hue: 33, lightness: 76, alpha: 0.78 },
      { hue: 24, lightness: 70, alpha: 0.72 },
      { hue: 18, lightness: 65, alpha: 0.7 },
      { hue: 42, lightness: 80, alpha: 0.74 }
    ];

    const comets = Array.from({ length: 28 }, (_, index) => {
      const sizeScale = Math.random();
      return {
        x: Math.random(),
        y: Math.random(),
        driftSpeed: 0.002 + Math.random() * 0.008,
        driftAmountX: 0.006 + Math.random() * 0.02,
        driftAmountY: 0.004 + Math.random() * 0.016,
        size: 0.7 + sizeScale * 4.1,
        phase: Math.random() * Math.PI * 2,
        tailLength: 26 + Math.random() * 110,
        tailPulse: 0.35 + Math.random() * 0.95,
        tailAngle: -(0.62 + Math.random() * 0.34),
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
      const driftX = Math.sin(timeSeconds * comet.driftSpeed + comet.phase) * width * comet.driftAmountX;
      const driftY = Math.cos(timeSeconds * comet.driftSpeed * 1.25 + comet.phase) * height * comet.driftAmountY;

      const headX = width * comet.x + driftX;
      const headY = height * (0.08 + comet.y * 0.74) + driftY;

      const tailMotion = 0.66 + Math.sin(timeSeconds * comet.tailPulse + comet.phase) * 0.22;
      const tail = comet.tailLength * tailMotion;
      const angle = comet.tailAngle + Math.sin(timeSeconds * comet.tailPulse * 0.42 + comet.phase) * 0.12;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const tailX = headX - dirX * tail;
      const tailY = headY - dirY * tail;

      const gradient = context.createLinearGradient(headX, headY, tailX, tailY);
      gradient.addColorStop(0, `hsla(${comet.color.hue}, 100%, ${comet.color.lightness}%, ${comet.color.alpha})`);
      gradient.addColorStop(0.26, `hsla(${comet.color.hue}, 92%, ${Math.max(comet.color.lightness - 10, 46)}%, 0.34)`);
      gradient.addColorStop(1, `hsla(${comet.color.hue}, 80%, 30%, 0)`);

      context.save();
      context.globalCompositeOperation = 'lighter';
      context.strokeStyle = gradient;
      context.lineWidth = comet.size;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(headX, headY);
      context.stroke();

      const headGlow = context.createRadialGradient(headX, headY, 0, headX, headY, comet.size * 9);
      headGlow.addColorStop(0, `hsla(${comet.color.hue}, 100%, 92%, 0.42)`);
      headGlow.addColorStop(1, `hsla(${comet.color.hue}, 90%, 70%, 0)`);
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
      gradient.addColorStop(0, '#140d08');
      gradient.addColorStop(0.42, '#21140d');
      gradient.addColorStop(0.78, '#16100f');
      gradient.addColorStop(1, '#0f0d0d');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      for (const blob of blobs) {
        const x = width * (0.5 + Math.sin(t * blob.speed + blob.offset) * 0.22);
        const y = height * (0.4 + Math.cos(t * (blob.speed * 1.2) + blob.offset) * 0.18);
        const r = Math.min(width, height) * blob.radius;

        const glow = context.createRadialGradient(x, y, 0, x, y, r);
        glow.addColorStop(0, `hsla(${blob.hue}, 90%, ${blob.lightness}%, ${blob.alpha})`);
        glow.addColorStop(0.42, `hsla(${blob.hue}, 84%, ${Math.max(blob.lightness - 10, 40)}%, ${blob.alpha * 0.5})`);
        glow.addColorStop(1, `hsla(${blob.hue}, 78%, 30%, 0)`);
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
