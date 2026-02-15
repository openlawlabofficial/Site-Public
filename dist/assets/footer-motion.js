const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const footer = document.querySelector('[data-sticky-footer]');
const panel = document.querySelector('[data-footer-panel]');
const items = [...document.querySelectorAll('[data-footer-item]')];

if (!footer || !panel) {
  // No sticky footer on this page.
} else if (prefersReducedMotion) {
  panel.style.setProperty('--footer-reveal', '1');
  items.forEach((item) => item.classList.add('is-visible'));
} else {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const update = () => {
    const rect = footer.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const start = viewportHeight;
    const end = viewportHeight - rect.height;
    const raw = (start - rect.top) / (start - end || 1);
    const progress = clamp(raw, 0, 1);

    panel.style.setProperty('--footer-reveal', progress.toFixed(4));

    items.forEach((item, index) => {
      const threshold = 0.18 + index * 0.08;
      if (progress > threshold) {
        item.classList.add('is-visible');
      } else {
        item.classList.remove('is-visible');
      }
    });
  };

  let ticking = false;
  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }
  };

  update();
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
}
