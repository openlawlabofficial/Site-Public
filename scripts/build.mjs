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

const footerData = {
  sections: [
    {
      title: 'About',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects/' },
        { label: 'Our Mission', href: '/about/' },
        { label: 'Contact Us', href: '/contact/' },
        { label: 'Admin', href: '/admin/login/' }
      ]
    }
  ],
  social: [
    { href: 'https://x.com', label: 'Twitter', icon: 'T' },
    { href: 'https://github.com', label: 'GitHub', icon: 'G' },
    { href: 'https://www.linkedin.com', label: 'LinkedIn', icon: 'L' }
  ],
  title: 'The Open Law Lab',
  subtitle: 'Open-source legal infrastructure for everyone'
};

const requiredFields = [
  'slug',
  'title',
  'overview',
  'full_description',
  'project_type',
  'lastupdate'
];

const ensureDir = async (directory) => fs.mkdir(directory, { recursive: true });

const formatDate = (value) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

const optionalText = (value, fallback = 'Not specified') => (value ? String(value) : fallback);

const esc = (str) =>
  String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const brandIcon = '<img class="brand-icon" src="/assets/brand-icon.svg" alt="" />';

const footerIcon = '<img class="brand-icon" src="/assets/footer-o-icon.svg" alt="" />';

const footerTitle = footerData.title.replace(
  'O',
  `<span class="sticky-footer-title-icon" aria-hidden="true">${footerIcon}</span><span class="sr-only">O</span>`
);

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
        <a class="brand" href="/">${brandIcon}<span>TheOpenLawLab</span></a>
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

    <div class="dialog-root" data-dialog-root hidden>
      <div class="dialog-overlay" data-dialog-overlay></div>
      <section
        class="dialog-content"
        data-dialog-content
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        tabindex="-1"
      >
        <button class="dialog-close" type="button" data-dialog-close aria-label="Close dialog">
          ×
        </button>
        <div class="dialog-header">
          <h2 id="dialog-title">Welcome to TheOpenLawLab</h2>
          <p id="dialog-description">We just launched. Thanks for visiting — more projects, tools, and resources are coming soon.</p>
        </div>
      </section>
    </div>

    <footer class="sticky-footer" aria-label="Site footer" data-sticky-footer>
      <div class="sticky-footer-clip">
        <div class="sticky-footer-track">
          <div class="shell sticky-footer-shell sticky-footer-panel" data-footer-panel>
            <div class="sticky-footer-grid" data-footer-item>
          ${footerData.sections
            .map(
              (section, index) => `<section class="footer-nav-section" data-footer-item style="--footer-item-delay:${index * 0.06}s">
              <h2>${esc(section.title)}</h2>
              <ul>
                ${section.links
                  .map((link) => `<li><a href="${esc(link.href)}">${esc(link.label)}</a></li>`)
                  .join('')}
              </ul>
            </section>`
            )
            .join('')}
            </div>
            <div class="sticky-footer-bottom" data-footer-item style="--footer-item-delay:0.32s">
              <div>
            <p class="sticky-footer-title">${footerTitle}</p>
            <p class="sticky-footer-subtitle">${esc(footerData.subtitle)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
    <script type="module" src="/assets/modal.js"></script>
    <script type="module" src="/assets/footer-motion.js"></script>
  </body>
</html>`;

const projectCard = (project) => `<article class="project-card" data-project-card>
  <h3><a href="/projects/${project.slug}/">${esc(project.title)}</a></h3>
  <p>${esc(project.overview)}</p>
  <p class="meta"><strong>Topic:</strong> ${esc(project.topic || 'General')}</p>
  <p class="meta"><strong>Legal Area:</strong> ${esc(project.legal_area || 'General')}</p>
  <p class="meta"><strong>Project Type:</strong> ${esc(project.project_type)}</p>
  <p class="meta"><strong>Updated:</strong> ${esc(formatDate(project.lastupdate))}</p>
  <ul class="tag-list">${project.states_and_territories
    .map((tag) => `<li class="tag">${esc(tag)}</li>`)
    .join('')}</ul>
</article>`;

async function loadProjects() {
  let files = [];
  try {
    files = (await fs.readdir(dataDir)).filter((name) => name.endsWith('.json'));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const projects = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(dataDir, file), 'utf8');
    const project = JSON.parse(raw);
    for (const field of requiredFields) {
      if (project[field] === undefined || project[field] === null || project[field] === '') {
        throw new Error(`Missing required field \"${field}\" in ${file}`);
      }
    }

    if (!['file', 'repository'].includes(project.project_type)) {
      throw new Error(`Field project_type must be either "file" or "repository" in ${file}`);
    }
    if (project.project_type === 'repository' && !project.repository_url) {
      throw new Error(`Field repository_url is required when project_type is "repository" in ${file}`);
    }
    if (project.project_type === 'file' && !project.file_url) {
      throw new Error(`Field file_url is required when project_type is "file" in ${file}`);
    }
    if (project.highlights !== undefined && !Array.isArray(project.highlights)) {
      throw new Error(`Field highlights must be an array when provided in ${file}`);
    }
    if (project.states_and_territories !== undefined && !Array.isArray(project.states_and_territories)) {
      throw new Error(`Field states_and_territories must be an array when provided in ${file}`);
    }
    project.highlights = project.highlights || [];
    project.states_and_territories = project.states_and_territories || [];
    project.author = project.author || '';
    project.topic = project.topic || '';
    project.legal_area = project.legal_area || '';
    project.featured = Boolean(project.featured);
    project.status = project.status || 'published';
    projects.push(project);
  }
  return projects.sort((a, b) => b.lastupdate.localeCompare(a.lastupdate));
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
  const publishedProjects = projects.filter((project) => project.status === 'published');

  await writeFile('assets/styles.css', await fs.readFile(path.join(root, 'src/styles.css'), 'utf8'));
  await writeFile('assets/projects.js', await fs.readFile(path.join(root, 'src/projects.js'), 'utf8'));
  await writeFile('assets/footer-motion.js', await fs.readFile(path.join(root, 'src/footer-motion.js'), 'utf8'));
  await writeFile('assets/modal.js', await fs.readFile(path.join(root, 'src/modal.js'), 'utf8'));
  await writeFile('assets/home-landing.js', await fs.readFile(path.join(root, 'src/home-landing.js'), 'utf8'));
  await writeFile('assets/admin.js', await fs.readFile(path.join(root, 'src/admin.js'), 'utf8'));
  await writeFile('assets/brand-icon.svg', await fs.readFile(path.join(root, 'src/assets/brand-icon.svg'), 'utf8'));
  await writeFile('assets/footer-o-icon.svg', await fs.readFile(path.join(root, 'src/assets/footer-o-icon.svg'), 'utf8'));

  const featured = publishedProjects.slice(0, 3).map(projectCard).join('');
  const featuredSection = featured
    ? `<div class="grid">${featured}</div>`
    : '<p class="empty-state">Sorry we can’t find you any projects right now, check back soon!</p>';
  await writeFile(
    'index.html',
    layout({
      title: 'TheOpenLawLab | Public Projects',
      description: site.description,
      canonicalPath: '/',
      content: `<section class="landing-hero" aria-label="TheOpenLawLab landing section">
        <canvas class="landing-hero-canvas" data-landing-canvas aria-hidden="true"></canvas>
        <div class="landing-hero-overlay"></div>
        <div class="landing-hero-content">
          <p class="landing-kicker">TheOpenLawLab</p>
          <h1>Open-source tools for legal aid systems</h1>
          <p>We build practical civic-tech infrastructure that improves legal aid operations and structural efficiency.</p>
          <div class="cta-row">
            <a class="btn" href="/projects/">Browse Projects</a>
            <a class="btn btn-secondary" href="/contribute/">Contribute</a>
          </div>
          <p class="landing-scroll">Scroll to explore ↓</p>
        </div>
      </section>
      <section class="hero">
        <h2>What is TheOpenLawLab?</h2>
        <p>TheOpenLawLab is a public-interest engineering initiative focused on open, reusable legal-aid tooling. Volunteers and domain practitioners collaborate to ship practical tools for intake, communications, and case preparation.</p>
      </section>
      <section>
        <h2>Featured Projects</h2>
        ${featuredSection}
      </section>
      <script type="module" src="/assets/home-landing.js"></script>`
    })
  );


  await writeFile(
    'admin/login/index.html',
    layout({
      title: 'Admin Login | TheOpenLawLab',
      description: 'Admin access portal for TheOpenLawLab.',
      canonicalPath: '/admin/login/',
      content: `<section class="admin-shell">
        <h1>Admin Access</h1>
        <p>Enter the admin password to continue.</p>
        <form id="admin-login-form" class="admin-form" novalidate>
          <label for="admin-password">Admin password</label>
          <input id="admin-password" name="password" type="password" required autocomplete="current-password" />
          <label class="admin-honeypot" for="admin-bot-trap">
            <input id="admin-bot-trap" name="botTrap" type="checkbox" />
            Don’t check this box - to prevent bots
          </label>
          <button class="btn" type="submit">Continue</button>
          <p id="admin-login-message" class="admin-message" role="status" aria-live="polite"></p>
        </form>
      </section>
      <script type="module">
        const form = document.querySelector('#admin-login-form');
        const message = document.querySelector('#admin-login-message');

        const setMessage = (text) => {
          if (message) message.textContent = text;
        };

        form?.addEventListener('submit', async (event) => {
          event.preventDefault();
          const formData = new FormData(form);
          const payload = {
            password: String(formData.get('password') || ''),
            botTrap: formData.get('botTrap') === 'on'
          };

          setMessage('Checking credentials...');

          try {
            const response = await fetch('/.netlify/functions/admin-auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.authorized) {
              setMessage('Access denied.');
              return;
            }

            sessionStorage.setItem('adminAuthorized', 'true');
            window.location.assign('/admin/');
          } catch (error) {
            setMessage('Unable to verify credentials right now.');
          }
        });
      </script>`
    })
  );

  await writeFile(
    'admin/index.html',
    layout({
      title: 'Admin | TheOpenLawLab',
      description: 'Admin area for TheOpenLawLab.',
      canonicalPath: '/admin/',
      content: `<section class="admin-shell admin-shell-wide">
        <h1>Admin Catalog Manager</h1>
        <p id="admin-message" class="admin-message" role="status" aria-live="polite"></p>
        <div class="admin-row-actions">
          <label>Admin Password<input id="admin-password-confirm" type="password" autocomplete="current-password" /></label>
          <button id="admin-load" class="btn" type="button">Load Entries</button>
        </div>
        <div class="admin-grid">
          <section>
            <h2>Entries</h2>
            <label for="admin-search">Search</label>
            <input id="admin-search" type="search" placeholder="Search title, slug, type, status" />
            <table class="admin-table">
              <thead><tr><th>Title</th><th>Slug</th><th>Type</th><th>Last Update</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody id="admin-entry-list"></tbody>
            </table>
          </section>
          <section>
            <h2>Create / Edit Entry</h2>
            <div class="admin-row-actions">
              <button id="entry-create" class="btn" type="button">Create New</button>
            </div>
            <form id="entry-form" class="admin-form" novalidate>
              <label>Slug<input name="slug" required /></label>
              <label>Title<input name="title" required /></label>
              <label>Project Type<select name="project_type"><option value="file">file</option><option value="repository">repository</option></select></label>
              <label>Last Update<input name="lastupdate" type="date" required /></label>
              <label>Status<select name="status"><option value="published">published</option><option value="draft">draft</option><option value="archived">archived</option></select></label>
              <label>Overview<textarea name="overview" rows="3" required></textarea></label>
              <label>Full Description (Markdown)<textarea name="full_description" rows="5" required></textarea></label>
              <label>Author<input name="author" /></label>
              <label>Topic<input name="topic" /></label>
              <label>Legal Area<input name="legal_area" /></label>
              <label>Repository URL<input name="repository_url" /></label>
              <label>File URL<input name="file_url" /></label>
              <label>States/Territories (comma-separated)<input name="states_and_territories" /></label>
              <label>Highlights (comma-separated)<input name="highlights" /></label>
              <label>Upload File (optional)<input id="entry-file" type="file" /></label>
            </form>
            <div class="admin-row-actions">
              <button id="entry-submit" class="btn" type="button">Create PR for New Entry</button>
              <button id="entry-archive" class="btn btn-secondary" type="button" disabled>Archive</button>
              <button id="entry-hard-delete" class="btn btn-secondary" type="button">Hard Delete</button>
            </div>
            <p id="pr-result" class="admin-message"></p>
          </section>
        </div>
      </section>
      <script type="module" src="/assets/admin.js"></script>`
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
        <p>Search and filter projects by title, overview, highlights, topic, and states/territories.</p>
        <form class="controls" role="search" aria-label="Project search form">
          <label for="search-input">Search projects</label>
          <div class="search-popover">
            <input id="search-input" name="q" type="search" autocomplete="off" placeholder="Search title, overview, highlights" aria-expanded="false" aria-controls="search-popover-content" aria-autocomplete="list" />
            <div id="search-popover-content" class="search-popover-content" role="listbox" hidden></div>
          </div>
          <label for="category-filter">Topic</label>
          <select id="category-filter" name="category"><option value="">All topics</option></select>
          <fieldset>
            <legend>States and Territories</legend>
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

  for (const project of publishedProjects) {
    const html = marked.parse(project.full_description);
    const highlights = project.highlights.length
      ? `<section><h2>Highlights</h2><ul>${project.highlights.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></section>`
      : '';
    const resourceCta =
      project.project_type === 'repository'
        ? `<a class="btn" href="${esc(project.repository_url)}" target="_blank" rel="noopener noreferrer">View Repository</a>`
        : `<a class="btn" href="${esc(project.file_url)}" target="_blank" rel="noopener noreferrer">Open File</a>`;
    await writeFile(
      `projects/${project.slug}/index.html`,
      layout({
        title: `${project.title} | TheOpenLawLab`,
        description: project.overview,
        canonicalPath: `/projects/${project.slug}/`,
        content: `<article>
          <h1>${esc(project.title)}</h1>
          <ul class="tag-list">${project.states_and_territories.map((item) => `<li class="tag">${esc(item)}</li>`).join('')}</ul>
          <p><strong>Author:</strong> ${esc(optionalText(project.author))}</p>
          <p><strong>Topic:</strong> ${esc(optionalText(project.topic))}</p>
          <p><strong>Legal Area:</strong> ${esc(optionalText(project.legal_area))}</p>
          <p><strong>Project Type:</strong> ${esc(project.project_type)}</p>
          <p><strong>Updated:</strong> ${esc(formatDate(project.lastupdate))}</p>
          <section>
            <h2>Overview</h2>
            <p>${esc(project.overview)}</p>
          </section>
          ${highlights}
          <div class="markdown">${html}</div>
          <div class="cta-row">
            ${resourceCta}
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
        <p><strong>Open-source tools for legal aid operations.</strong></p>
        <h2>Our Mission</h2>
        <p>Our mission is to provide free, open-source, high-quality solutions for legal problems, whether broad or highly specific, created by and for the public-interest community.</p>
        <ul>
          <li><strong>Free and open source:</strong> Every project is intended to be transparent, reusable, and adaptable by legal-aid practitioners and civic technologists.</li>
          <li><strong>Quality solutions:</strong> We prioritize reliability and usability so tools are practical in real legal workflows, not just prototypes.</li>
          <li><strong>Made by anyone:</strong> Contributions are welcome from developers, legal workers, researchers, and community members with lived experience.</li>
          <li><strong>Legal aid + systems:</strong> We focus on the intersection of direct legal support and systems design, so improvements can scale and serve more people.</li>
        </ul>
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
      description: 'Learn how to submit projects, volunteer, or donate to support TheOpenLawLab.',
      canonicalPath: '/contribute/',
      content: `<section>
        <h1>Contribute</h1>
        <p>Contribution at TheOpenLawLab includes <strong>submission + verification</strong>, <strong>volunteering</strong>, and <strong>donation</strong>.</p>
        <div class="grid">
          <article class="project-card">
            <h2><a href="/contribute/submit/">Submit a Project</a></h2>
            <p>Share a project for verification and potential publication on the site.</p>
          </article>
          <article class="project-card">
            <h2><a href="/contribute/volunteer/">Volunteer</a></h2>
            <p>Apply to support reviews and development after you have a verified submission.</p>
          </article>
          <article class="project-card">
            <h2><a href="/contribute/donate/">Donate</a></h2>
            <p>Help sustain open legal-aid infrastructure through financial support.</p>
          </article>
        </div>

        <h2>How submissions work</h2>
        <ul>
          <li>To submit a new project, contact us with a GitHub link (if code), the document (if documentation), or a clear outline of the project scope.</li>
          <li>If your project passes verification, it will be added to the site.</li>
          <li>If your project does not pass verification, our team will try to provide feedback and support so you can improve and resubmit.</li>
          <li>If you have a previously verified project, you can submit an application to become a volunteer reviewer or builder.</li>
          <li>Submissions are partially anonymous to the public; you may use a first name or pseudonym.</li>
        </ul>

        <h2>Submission rules</h2>
        <div class="rules-box">
          <h3>Security</h3>
          <p>Local-only systems are preferred. If a system is networked, it must be secure, especially when handling sensitive information.</p>
          <ul>
            <li>Row-level security and encryption for sensitive data</li>
            <li>API security and authentication controls</li>
            <li>Basic protections and hardened defaults</li>
            <li>OAuth support where applicable</li>
            <li>SQL injection prevention and secure query patterns</li>
          </ul>

          <h3>Interoperability</h3>
          <p>All systems must be open source and should support straightforward data transfer in and out, so no single ecosystem is enforced.</p>
          <ul>
            <li>CSV information load</li>
            <li>Import and export capacity</li>
            <li>DOCX and PDF output</li>
            <li>Comments: projects are easiest to iterate on when comments are consistent, simple, and clarifying.</li>
          </ul>

          <h3>Value</h3>
          <p>Systems should provide distinct value through significantly better quality/cost or by serving an important niche purpose. If a system no longer has a distinct role, or has been outcompeted on the platform, it may be retired.</p>

          <h3>Elegance</h3>
          <p>Systems should solve their target problem in a direct and efficient way.</p>
        </div>

        <h3>Vibe-coding and AI-assisted code</h3>
        <p>AI-assisted contributions are welcome. We recognize that they can make contributing significantly easier and faster, and we support their responsible use.</p>
        <ul>
          <li>We generally recommend IDE-based AI assistance, and we also accept work created with coding agents like Claude Code, Codex, and similar tools.</li>
          <li>We discourage full-stack one-shot generators (for example Lovable or Bolt) when output is not meaningfully reviewed by a contributor.</li>
          <li>Coding agents can produce bloated or inefficient implementations if edits are not reviewed carefully. Please review generated code for size, relevance, and maintainability.</li>
          <li>Some inefficiency is acceptable, but submissions should remain practical for iteration and review, not excessively large, unstructured code dumps.</li>
          <li>As long as the code is reviewable, follows the project rules, and works well, we are flexible about how much was written by an agent.</li>
          <li>We especially encourage using agents for code review support and for improving or standardizing comments.</li>
        </ul>
      </section>`
    })
  );

  await writeFile(
    'contribute/submit/index.html',
    layout({
      title: 'Submit | Contribute | TheOpenLawLab',
      description: 'Submission and verification guidance for contributing projects to TheOpenLawLab.',
      canonicalPath: '/contribute/submit/',
      content: `<section>
        <h1>Submit a Project</h1>
        <p>Send us your project using one of the following:</p>
        <ul>
          <li>A GitHub repository link for software projects</li>
          <li>A document for documentation-driven projects</li>
          <li>An outline describing the project scope and intended users</li>
        </ul>
        <p>Submissions go through verification before publication. Approved projects are listed on the site, and non-approved projects receive feedback when possible so they can be improved and resubmitted.</p>
        <p>Submissions are partially anonymous to the public. You may use your first name or a pseudonym.</p>
        <p>Want to submit a project now? Get in touch.</p>
        <div class="cta-row">
          <a class="btn" href="/contact/">Contact Us</a>
          <a class="btn btn-secondary" href="/contribute/">Back to Contribute</a>
        </div>
      </section>`
    })
  );

  await writeFile(
    'contribute/volunteer/index.html',
    layout({
      title: 'Volunteer | Contribute | TheOpenLawLab',
      description: 'Volunteer pathways for contributors with verified submissions.',
      canonicalPath: '/contribute/volunteer/',
      content: `<section>
        <h1>Volunteer</h1>
        <p>Volunteering supports project review, maintenance, and new development for open legal-aid systems.</p>
        <p>If you would like to become a volunteer, please apply here and we’ll get back to you as soon as possible.</p>
        <div class="cta-row">
          <a class="btn" href="/contact/">Contact Us</a>
          <a class="btn btn-secondary" href="/contribute/">Back to Contribute</a>
        </div>
      </section>`
    })
  );

  await writeFile(
    'contact/index.html',
    layout({
      title: 'Contact Us | TheOpenLawLab',
      description: 'Reach out to TheOpenLawLab with questions, collaboration ideas, or contribution inquiries.',
      canonicalPath: '/contact/',
      content: `<section>
        <div class="contact-card">
          <div class="contact-card-main">
            <h1>Contact Us</h1>
            <p>If you have any questions regarding our work or need help, please fill out the form. We do our best to respond within one business day.</p>
            <div class="contact-highlights" aria-label="Suggested reasons to contact us">
              <span>Volunteer</span>
              <span>Submit a Project</span>
              <span>Help</span>
              <span>Complaint</span>
              <span>Other</span>
            </div>
          </div>
          <div class="contact-card-form-wrap">
            <form class="controls contact-form" name="contact" method="POST" netlify>
              <input type="hidden" name="form-name" value="contact" />
              <label for="contact-name">Name</label>
              <input id="contact-name" name="name" type="text" autocomplete="name" required />
              <label for="contact-email">Email</label>
              <input id="contact-email" name="email" type="email" autocomplete="email" required />
              <label for="contact-topic">Topic</label>
              <input id="contact-topic" name="topic" type="text" list="contact-topic-suggestions" placeholder="Choose or type a topic" required />
              <datalist id="contact-topic-suggestions">
                <option value="Volunteer"></option>
                <option value="Submit a Project"></option>
                <option value="Help"></option>
                <option value="Complaint"></option>
                <option value="Other"></option>
              </datalist>
              <label for="contact-message">Message</label>
              <textarea id="contact-message" name="message" rows="6" required></textarea>
              <button class="btn" type="submit">Submit</button>
            </form>
          </div>
        </div>
      </section>`
    })
  );

  await writeFile(
    'contribute/donate/index.html',
    layout({
      title: 'Donate | Contribute | TheOpenLawLab',
      description: 'Support TheOpenLawLab with donations to sustain open legal-aid infrastructure.',
      canonicalPath: '/contribute/donate/',
      content: `<section>
        <h1>Donate</h1>
        <p>Donations help sustain hosting, maintenance, and review capacity for open-source legal-aid systems.</p>
        <p>Financial support allows the project to continue publishing free tools and documentation for legal service providers and the communities they serve.</p>
        <p><strong>Note:</strong> We haven’t configured donations yet.</p>
        <p><a class="btn" href="/contribute/">Back to Contribute</a></p>
      </section>`
    })
  );

  const indexData = publishedProjects.map((project) => ({
    slug: project.slug,
    title: project.title,
    overview: project.overview,
    highlights: project.highlights,
    states_and_territories: project.states_and_territories,
    topic: project.topic || '',
    legal_area: project.legal_area || '',
    project_type: project.project_type,
    lastupdate: project.lastupdate,
    featured: Boolean(project.featured)
  }));

  await writeFile('search-index.json', JSON.stringify(indexData, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
