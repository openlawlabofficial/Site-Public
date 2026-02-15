# TheOpenLawLab Public Site

Static-first public website implementation for project discovery and mission pages.

## Local usage

```bash
npm install
npm run build
npm run serve
```

Then open `http://localhost:4173`.

## Netlify deployment

This repo includes a `netlify.toml` so Netlify builds the site with `npm run build` and publishes the generated `dist/` directory.

- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

## Project layout

- `data/projects/` – project content source files
- `scripts/build.mjs` – static generation pipeline
- `src/` – shared CSS and browser JS for catalog interactions
- `dist/` – generated static website output
- `VISION_CHECKLIST.md` – implementation tracking checklist
