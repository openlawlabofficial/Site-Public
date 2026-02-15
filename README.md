# TheOpenLawLab Public Site

Static-first public website implementation for project discovery and mission pages.

## Local usage

```bash
npm install
npm run build
npm run serve
```

Then open `http://localhost:4173`.

## Project layout

- `data/projects/` – project content source files
- `scripts/build.mjs` – static generation pipeline
- `src/` – shared CSS and browser JS for catalog interactions
- `dist/` – generated static website output
- `VISION_CHECKLIST.md` – implementation tracking checklist
