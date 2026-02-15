# TheOpenLawLab Public Website Vision & Implementation Checklist

## Vision
Build a static-first, accessible, civic-tech public website that clearly explains TheOpenLawLab mission and makes it easy to discover, evaluate, and access open-source legal aid projects.

## Status Legend
- [x] Implemented
- [ ] Planned / pending

## Architecture
- [x] Static build output generated into `dist/`
- [x] No server-side rendering
- [x] No auth, no backend API, no database
- [x] Content stored in-repo

## Data Model (`/data/projects`)
- [x] Projects stored as structured JSON files
- [x] Required fields validation in build script (`slug`, `title`, `short_description`, `full_description`, `tags`, `github_url`, `download_url`, `maintainer`, `created_at`, `updated_at`)
- [x] Optional fields supported (`category`, `license`)

## Pages
- [x] Home page with hero, mission summary, CTAs, and featured projects
- [x] Projects page with search/filter/sort and project cards
- [x] Project detail pages statically generated at `/projects/[slug]/`
- [x] About page with mission and organizational rationale
- [x] Contribute placeholder page

## Search & Catalog UX
- [x] Client-side search over title, short/full descriptions, and tags
- [x] Debounced search input
- [x] Category filter
- [x] Multi-select tag filter
- [x] Sort options (newest, alphabetical, recently updated)
- [x] Combined search + filters (AND logic)
- [x] Pagination support
- [x] Single prebuilt `search-index.json` used at runtime

## SEO & Metadata
- [x] Per-page title and meta description
- [x] OpenGraph metadata
- [x] Twitter card metadata
- [x] Canonical URLs

## Accessibility
- [x] Semantic HTML structure
- [x] Heading hierarchy
- [x] Search form labels
- [x] Keyboard-navigable filters and controls
- [x] Visible focus states
- [ ] Add automated accessibility test script (future enhancement)

## Performance & Scalability
- [x] Static generation pipeline (`npm run build`)
- [x] Minimal JavaScript footprint
- [x] Design remains compatible with future CMS/API/database migration
- [ ] Add Lighthouse CI in pipeline

## Next Milestones
1. Add contribution docs and project proposal flow details.
2. Add richer related-project logic on project detail pages.
3. Add CI checks for accessibility/performance thresholds.
