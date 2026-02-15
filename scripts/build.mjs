import fs from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';

const root = process.cwd();
const dataDir = path.join(root, 'data/projects');
const distDir = path.join(root, 'dist');

const site = {
  name: 'TheOpenLawLab',
  description:
    'Open-source civic technology projects focused on legal aid and structural system efficiency.',
  baseUrl: 'https://theopenlawlab.org'
};

const requiredFields = [
  'slug',
  'title',
  'short_description',
  'full_description',
  'tags',
  'github_url',
  'download_url',
  'maintainer',
  'created_at',
  'updated_at'
];

const ensureDir = async (directory) => fs.mkdir(directory, { recursive: true });

const formatDate = (value) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

const normalizeMaintainer = (maintainer) =>
  Array.isArray(maintainer) ? maintainer.join(', ') : maintainer;

const esc = (str) =>
  String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const layout = ({ title, description, canonicalPath, content }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${site.baseUrl}${canonicalPath}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <link rel="canonical" href="${site.baseUrl}${canonicalPath}" />
    <link rel="stylesheet" href="/assets/styles.css" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="shell nav-wrap">
        <a class="brand" href="/">TheOpenLawLab</a>
        <nav aria-label="Primary">
          <ul class="nav-list">
            <li><a href="/projects/">Projects</a></li>
            <li><a href="/about/">About</a></li>
            <li><a href="/contribute/">Contribute</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main id="main" class="shell">${content}</main>
    <footer class="site-footer shell">Open-source tools for legal aid operations.</footer>
  </body>
</html>`;

const projectCard = (project) => `<article class="project-card" data-project-card>
  <h3><a href="/projects/${project.slug}/">${esc(project.title)}</a></h3>
  <p>${esc(project.short_description)}</p>
  <p class="meta"><strong>Category:</strong> ${esc(project.category || 'General')}</p>
  <p class="meta"><strong>Updated:</strong> ${esc(formatDate(project.updated_at))}</p>
  <ul class="tag-list">${project.tags
    .map((tag) => `<li class="tag">${esc(tag)}</li>`)
    .join('')}</ul>
</article>`;

async function loadProjects() {
  const files = (await fs.readdir(dataDir)).filter((name) => name.endsWith('.json'));
  const projects = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(dataDir, file), 'utf8');
    const project = JSON.parse(raw);
    for (const field of requiredFields) {
      if (project[field] === undefined || project[field] === null || project[field] === '') {
        throw new Error(`Missing required field \"${field}\" in ${file}`);
      }
    }
    if (!Array.isArray(project.tags)) {
      throw new Error(`Field tags must be an array in ${file}`);
    }
    project.featured = Boolean(project.featured);
    projects.push(project);
  }
  return projects.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

async function writeFile(relativePath, contents) {
  const fullPath = path.join(distDir, relativePath);
  await ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, contents, 'utf8');
}

async function main() {
  await fs.rm(distDir, { recursive: true, force: true });
  await ensureDir(distDir);
  const projects = await loadProjects();

  await writeFile('assets/styles.css', await fs.readFile(path.join(root, 'src/styles.css'), 'utf8'));
  await writeFile('assets/projects.js', await fs.readFile(path.join(root, 'src/projects.js'), 'utf8'));

  const featured = projects.slice(0, 3).map(projectCard).join('');
  await writeFile(
    'index.html',
    layout({
      title: 'TheOpenLawLab | Public Projects',
      description: site.description,
      canonicalPath: '/',
      content: `<section class="hero">
        <h1>Open-source tools for legal aid systems</h1>
        <p>We build practical civic-tech infrastructure that improves legal aid operations and structural efficiency.</p>
        <div class="cta-row">
          <a class="btn" href="/projects/">Browse Projects</a>
          <a class="btn btn-secondary" href="/contribute/">Contribute</a>
        </div>
      </section>
      <section>
        <h2>What is TheOpenLawLab?</h2>
        <p>TheOpenLawLab is a public-interest engineering initiative focused on open, reusable legal-aid tooling. Volunteers and domain practitioners collaborate to ship practical tools for intake, communications, and case preparation.</p>
      </section>
      <section>
        <h2>Featured Projects</h2>
        <div class="grid">${featured}</div>
      </section>`
    })
  );

  await writeFile(
    'projects/index.html',
    layout({
      title: 'Projects | TheOpenLawLab',
      description: 'Search and browse open-source legal aid projects from TheOpenLawLab.',
      canonicalPath: '/projects/',
      content: `<section>
        <h1>Project Catalog</h1>
        <p>Search and filter projects by title, description, tags, and category.</p>
        <form class="controls" role="search" aria-label="Project search form">
          <label for="search-input">Search projects</label>
          <div class="search-popover">
            <input id="search-input" name="q" type="search" autocomplete="off" placeholder="Search title, tags, description" aria-expanded="false" aria-controls="search-popover-content" aria-autocomplete="list" />
            <div id="search-popover-content" class="search-popover-content" role="listbox" hidden></div>
          </div>
          <label for="category-filter">Category</label>
          <select id="category-filter" name="category"><option value="">All categories</option></select>
          <fieldset>
            <legend>Tags</legend>
            <div id="tag-filter" class="tag-filter"></div>
          </fieldset>
          <label for="sort-by">Sort by</label>
          <select id="sort-by" name="sort">
            <option value="newest">Newest</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="updated">Recently updated</option>
          </select>
        </form>
        <p id="result-count" aria-live="polite"></p>
        <div id="project-results" class="grid"></div>
        <nav id="pagination" aria-label="Pagination" class="pagination"></nav>
      </section>
      <script type="module" src="/assets/projects.js"></script>`
    })
  );

  for (const project of projects) {
    const html = marked.parse(project.full_description);
    await writeFile(
      `projects/${project.slug}/index.html`,
      layout({
        title: `${project.title} | TheOpenLawLab`,
        description: project.short_description,
        canonicalPath: `/projects/${project.slug}/`,
        content: `<article>
          <h1>${esc(project.title)}</h1>
          <ul class="tag-list">${project.tags.map((tag) => `<li class="tag">${esc(tag)}</li>`).join('')}</ul>
          <p><strong>Maintainer:</strong> ${esc(normalizeMaintainer(project.maintainer))}</p>
          <p><strong>Updated:</strong> ${esc(formatDate(project.updated_at))}</p>
          <div class="markdown">${html}</div>
          <div class="cta-row">
            <a class="btn" href="${esc(project.github_url)}" target="_blank" rel="noopener noreferrer">View on GitHub</a>
            <a class="btn btn-secondary" href="${esc(project.download_url)}" target="_blank" rel="noopener noreferrer">Download</a>
          </div>
        </article>`
      })
    );
  }

  await writeFile(
    'about/index.html',
    layout({
      title: 'About | TheOpenLawLab',
      description: 'Learn about the mission and operating model behind TheOpenLawLab.',
      canonicalPath: '/about/',
      content: `<section>
        <h1>About TheOpenLawLab</h1>
        <h2>Mission statement</h2>
        <p>Our mission is to build open digital infrastructure that strengthens legal aid systems and improves access to justice through structural efficiency.</p>
        <h2>What we build</h2>
        <p>We focus on practical software for intake, case workflow, and client communication that can be adopted by legal organizations with minimal overhead.</p>
        <h2>Why structural efficiency matters</h2>
        <p>When legal aid teams spend less time on avoidable operational friction, they can serve more people with higher quality support.</p>
        <h2>Volunteer philosophy</h2>
        <p>Our work is volunteer-led and practitioner-informed, combining technical contributions with legal domain expertise.</p>
        <h2>Transparency commitment</h2>
        <p>We build in the open, document decisions, and publish source code so organizations can audit, adapt, and improve every project.</p>
      </section>`
    })
  );

  await writeFile(
    'contribute/index.html',
    layout({
      title: 'Contribute | TheOpenLawLab',
      description: 'Contributing to TheOpenLawLab will be documented here soon.',
      canonicalPath: '/contribute/',
      content: `<section>
        <h1>Contribute</h1>
        <p>This page is a placeholder for contribution guidelines, onboarding, and project proposal workflows.</p>
      </section>`
    })
  );

  const indexData = projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    short_description: project.short_description,
    full_description: project.full_description,
    tags: project.tags,
    category: project.category || '',
    updated_at: project.updated_at,
    featured: Boolean(project.featured)
  }));

  await writeFile('search-index.json', JSON.stringify(indexData, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
