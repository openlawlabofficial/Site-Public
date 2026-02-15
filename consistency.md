# Consistency Guide

This file tracks reusable UI components so we keep a consistent interface across the site.

## Reusable components

- **Tag component**
  - Use existing `.tag` pills in `src/styles.css` for metadata and filters.
  - Use `.tag-token` and `.tag-token-remove` for selected filter tags in the search experience.

- **Search component**
  - Reuse the project catalog search pattern: `.search-popover`, `.search-popover-content`, `.search-popover-item`, and supporting input styling.
  - Keep keyboard navigation and suggestion behavior from `src/projects.js` when extending search.

- **Modal component**
  - Reuse modal shell and behavior from `.dialog-root`, `.dialog-overlay`, `.dialog-content`, and `src/modal.js`.
  - This modal visual style is now the default modal style for the site.

- **X button standard**
  - Reuse `.dialog-close` from the modal as the default close (X) button style anywhere a close icon/button is required.
