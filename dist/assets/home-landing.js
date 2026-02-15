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
    let simulationTime = 0;
    let lastRenderTime = 0;
    const MAX_TIMESTEP_SECONDS = 1 / 24;
    const COMET_SPEED_FACTOR = 0.6;

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
        travelSpeed: (0.008 + Math.random() * 0.018) * COMET_SPEED_FACTOR,
        travelTilt: 0.24 + Math.random() * 0.28,
        driftSpeed: (0.002 + Math.random() * 0.008) * COMET_SPEED_FACTOR,
        driftAmountX: 0.006 + Math.random() * 0.02,
        driftAmountY: 0.004 + Math.random() * 0.016,
        size: 0.7 + sizeScale * 4.1,
        phase: Math.random() * Math.PI * 2,
        tailLength: 26 + Math.random() * 110,
        tailPulse: (0.35 + Math.random() * 0.95) * (0.72 + Math.random() * 0.2),
        tailAngle: -(0.62 + Math.random() * 0.34),
        color: cometPalette[index % cometPalette.length]
      };
    });

    let viewportWidth = 0;
    let viewportHeight = 0;

    const getViewport = () => {
      const visualViewport = window.visualViewport;
      const nextWidth = Math.round(visualViewport?.width || window.innerWidth || document.documentElement.clientWidth || viewportWidth || 0);
      const nextHeight = Math.round(visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || viewportHeight || 0);
      return { nextWidth, nextHeight };
    };

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const { nextWidth, nextHeight } = getViewport();

      if (!viewportWidth || !viewportHeight) {
        viewportWidth = nextWidth;
        viewportHeight = nextHeight;
      } else {
        const widthChanged = nextWidth > 220 && Math.abs(nextWidth - viewportWidth) > 1;
        const meaningfulHeightChange = nextHeight > 220 && Math.abs(nextHeight - viewportHeight) > 48;
        if (widthChanged) viewportWidth = nextWidth;
        if (meaningfulHeightChange) viewportHeight = nextHeight;
      }

      width = viewportWidth;
      height = Math.max(viewportHeight * 1.2, 560);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawComet = (comet, timeSeconds) => {
      const progress = (timeSeconds * comet.travelSpeed + comet.phase * 0.12) % 1;
      const lifecycle = Math.min(progress / 0.16, (1 - progress) / 0.22, 1);
      const visibility = Math.max(0, lifecycle);
      if (visibility <= 0) return;

      const orbitX = (comet.x + progress * comet.travelTilt) % 1;
      const orbitY = -0.16 + progress * 1.34;
      const driftX = Math.sin(timeSeconds * comet.driftSpeed + comet.phase) * width * comet.driftAmountX;
      const driftY = Math.cos(timeSeconds * comet.driftSpeed * 1.25 + comet.phase) * height * comet.driftAmountY;

      const headX = width * orbitX + driftX;
      const headY = height * (0.08 + orbitY * 0.74) + driftY;

      const tailMotion = 0.66 + Math.sin(timeSeconds * comet.tailPulse + comet.phase) * 0.22;
      const tail = comet.tailLength * tailMotion;
      const angle = comet.tailAngle + Math.sin(timeSeconds * comet.tailPulse * 0.42 + comet.phase) * 0.12;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const tailX = headX - dirX * tail;
      const tailY = headY - dirY * tail;

      const headAlpha = comet.color.alpha * visibility;
      const gradient = context.createLinearGradient(headX, headY, tailX, tailY);
      gradient.addColorStop(0, `hsla(${comet.color.hue}, 100%, ${comet.color.lightness}%, ${headAlpha})`);
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
      headGlow.addColorStop(0, `hsla(${comet.color.hue}, 100%, 92%, ${0.42 * visibility})`);
      headGlow.addColorStop(1, `hsla(${comet.color.hue}, 90%, 70%, 0)`);
      context.fillStyle = headGlow;
      context.beginPath();
      context.arc(headX, headY, comet.size * 8, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const render = (time) => {
      const now = time * 0.001;
      if (!lastRenderTime) lastRenderTime = now;
      const delta = Math.min(now - lastRenderTime, MAX_TIMESTEP_SECONDS);
      lastRenderTime = now;
      simulationTime += Math.max(delta, 0);

      const t = simulationTime;
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
    let resizeQueued = false;
    const queueResize = () => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        resize();
      });
    };

    window.addEventListener('resize', queueResize, { passive: true });
    window.visualViewport?.addEventListener('resize', queueResize, { passive: true });
    frame = requestAnimationFrame(render);

    window.addEventListener('beforeunload', () => cancelAnimationFrame(frame), { once: true });
  }
}
