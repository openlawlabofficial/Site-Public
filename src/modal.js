const dialogRoot = document.querySelector('[data-dialog-root]');

if (dialogRoot) {
  const trigger = document.querySelector('[data-dialog-trigger]');
  const overlay = dialogRoot.querySelector('[data-dialog-overlay]');
  const closeButtons = dialogRoot.querySelectorAll('[data-dialog-close]');
  const content = dialogRoot.querySelector('[data-dialog-content]');

  let lastActive = null;

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function openDialog() {
    lastActive = document.activeElement;
    dialogRoot.hidden = false;
    document.body.classList.add('dialog-open');

    const focusables = content.querySelectorAll(focusableSelector);
    const firstFocusable = focusables[0] || content;
    firstFocusable.focus();
  }

  function closeDialog() {
    dialogRoot.hidden = true;
    document.body.classList.remove('dialog-open');
    if (lastActive instanceof HTMLElement) {
      lastActive.focus();
    }
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;

    const focusables = [...content.querySelectorAll(focusableSelector)].filter(
      (node) => node.offsetParent !== null
    );

    if (!focusables.length) {
      event.preventDefault();
      content.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  trigger?.addEventListener('click', openDialog);
  overlay?.addEventListener('click', closeDialog);
  closeButtons.forEach((button) => button.addEventListener('click', closeDialog));

  document.addEventListener('keydown', (event) => {
    if (dialogRoot.hidden) return;
    if (event.key === 'Escape') {
      closeDialog();
      return;
    }
    trapFocus(event);
  });
}
