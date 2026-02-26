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
    const COMET_SPEED = 0.006;
    const COMET_DIRECTION = { x: 1, y: 1 };

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
      const color = cometPalette[index % cometPalette.length];
      return {
        x: Math.random(),
        y: Math.random(),
        driftPhase: Math.random() * Math.PI * 2,
        size: 0.9 + sizeScale * 2.6,
        tailLength: 38 + Math.random() * 34,
        color,
        trailColorHead: `hsla(${color.hue}, 100%, ${color.lightness}%, ${color.alpha})`,
        trailColorMid: `hsla(${color.hue}, 92%, ${Math.max(color.lightness - 10, 46)}%, 0.32)`,
        glowColorCore: `hsla(${color.hue}, 100%, 92%, 0.4)`
      };
    });

    const heroSection = canvas.closest('.landing-hero');

    const getCanvasRect = () => {
      if (!heroSection) {
        return { width: 1, height: 1 };
      }

      const rect = heroSection.getBoundingClientRect();
      return {
        width: Math.max(Math.round(rect.width || heroSection.clientWidth || 1), 1),
        height: Math.max(Math.round(rect.height || heroSection.clientHeight || 1), 1)
      };
    };

    let active = false;
    const updateActive = () => {
      const rect = heroSection?.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const nextActive = Boolean(rect && rect.bottom > 0 && rect.top < viewportHeight);
      if (nextActive === active) return;
      active = nextActive;
      heroSection?.classList.toggle('landing-hero-active', active);
    };

    const resize = () => {
      const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
      const nextSize = getCanvasRect();

      width = nextSize.width;
      height = nextSize.height;

      canvas.width = Math.max(Math.floor(width * ratio), 1);
      canvas.height = Math.max(Math.floor(height * ratio), 1);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const drawComet = (comet, timeSeconds) => {
      const xProgress = (comet.x + timeSeconds * COMET_SPEED * COMET_DIRECTION.x) % 1;
      const yProgress = (comet.y + timeSeconds * COMET_SPEED * COMET_DIRECTION.y) % 1;

      const drift = Math.sin(timeSeconds * 0.2 + comet.driftPhase) * 0.012;
      const headX = width * xProgress;
      const headY = height * yProgress + drift * height;

      const angle = Math.atan2(COMET_DIRECTION.y, COMET_DIRECTION.x);
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const tailX = headX - dirX * comet.tailLength;
      const tailY = headY - dirY * comet.tailLength;

      const gradient = context.createLinearGradient(headX, headY, tailX, tailY);
      gradient.addColorStop(0, comet.trailColorHead);
      gradient.addColorStop(0.32, comet.trailColorMid);
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

      const headGlow = context.createRadialGradient(headX, headY, 0, headX, headY, comet.size * 8);
      headGlow.addColorStop(0, comet.glowColorCore);
      headGlow.addColorStop(1, `hsla(${comet.color.hue}, 90%, 70%, 0)`);
      context.fillStyle = headGlow;
      context.beginPath();
      context.arc(headX, headY, comet.size * 7, 0, Math.PI * 2);
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
      if (!active) return;

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
        const px = (i * 197.33 + t * 23) % width;
        const py = (i * 121.77 + t * 17) % height;
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

    let tickQueued = false;
    const queueTick = () => {
      if (tickQueued) return;
      tickQueued = true;
      requestAnimationFrame(() => {
        tickQueued = false;
        updateActive();
      });
    };

    updateActive();
    window.addEventListener('scroll', queueTick, { passive: true });
    window.addEventListener('resize', queueResize, { passive: true });
    window.visualViewport?.addEventListener('resize', queueResize, { passive: true });

    if ('ResizeObserver' in window && heroSection) {
      const heroResizeObserver = new ResizeObserver(queueResize);
      heroResizeObserver.observe(heroSection);
      window.addEventListener('beforeunload', () => heroResizeObserver.disconnect(), { once: true });
    }

    let heroObserver;
    if ('IntersectionObserver' in window && heroSection) {
      heroObserver = new IntersectionObserver(updateActive, { threshold: [0, 0.01, 0.25, 0.75, 1] });
      heroObserver.observe(heroSection);
    }

    frame = requestAnimationFrame(render);

    window.addEventListener('beforeunload', () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queueTick);
      window.removeEventListener('resize', queueResize);
      window.visualViewport?.removeEventListener('resize', queueResize);
      heroObserver?.disconnect();
    }, { once: true });
  }
}
