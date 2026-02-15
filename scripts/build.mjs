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
        { label: 'Contact Us', href: '/contribute/' }
      ]
    },
    {
      title: 'Education',
      links: [
        { label: 'News', href: '/about/' },
        { label: 'Learn', href: '/projects/' },
        { label: 'Certification', href: '/contribute/volunteer/' },
        { label: 'Publications', href: '/about/' }
      ]
    },
    {
      title: 'Services',
      links: [
        { label: 'Web Design', href: '/projects/' },
        { label: 'Development', href: '/projects/' },
        { label: 'Consulting', href: '/contribute/' },
        { label: 'Support', href: '/contribute/donate/' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/about/' },
        { label: 'Documentation', href: '/projects/' },
        { label: 'Community', href: '/contribute/volunteer/' },
        { label: 'Help Center', href: '/contribute/' }
      ]
    }
  ],
  social: [
    { href: 'https://x.com', label: 'Twitter', icon: 'T' },
    { href: 'https://github.com', label: 'GitHub', icon: 'G' },
    { href: 'https://www.linkedin.com', label: 'LinkedIn', icon: 'L' }
  ],
  title: 'Open Law',
  subtitle: 'Open-source legal infrastructure for everyone',
  copyright: `©${new Date().getUTCFullYear()} TheOpenLawLab. All rights reserved.`
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

const brandIcon = `<svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
  <defs>
    <g id="star">
      <path d="M0,-20 L4,-6 L20,0 L4,6 L0,20 L-4,6 L-20,0 L-4,-6 Z" fill="currentColor"/>
      <path d="M-12,-12 L-4,-4 M12,-12 L4,-4 M12,12 L4,4 M-12,12 L-4,4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
    </g>
    <g id="anchorStar" fill="currentColor" stroke="currentColor" stroke-linecap="round">
      <path d="M0,-48 L5,-10 L50,0 L5,10 L0,48 L-5,10 L-50,0 L-5,-10 Z"/>
      <path d="M-32,-32 L-10,-10 M32,-32 L10,-10 M32,32 L10,10 M-32,32 L-10,10" fill="none" stroke-width="3.2"/>
    </g>
  </defs>
  <path d="M 735 745 A 331 331 0 1 1 805 635" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="10">
    <line x1="447" y1="267" x2="610" y2="396"/>
    <line x1="656" y1="452" x2="742" y2="640"/>
    <line x1="282" y1="410" x2="338" y2="449"/>
    <line x1="386" y1="477" x2="715" y2="660"/>
  </g>
  <g color="currentColor">
    <use href="#star" transform="translate(411 238) scale(1.18)"/>
    <use href="#star" transform="translate(246 394) scale(1.05)"/>
    <use href="#star" transform="translate(358 459) scale(0.62)"/>
    <use href="#star" transform="translate(642 421) scale(0.82)"/>
    <use href="#anchorStar" transform="translate(763 691) scale(1.30)"/>
  </g>
</svg>`;

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
    <footer class="sticky-footer" aria-label="Site footer">
      <div class="shell sticky-footer-shell">
        <div class="sticky-footer-grid">
          ${footerData.sections
            .map(
              (section) => `<section class="footer-nav-section">
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
        <div class="sticky-footer-bottom">
          <div>
            <p class="sticky-footer-title">${esc(footerData.title)}</p>
            <p class="sticky-footer-subtitle">${esc(footerData.subtitle)}</p>
          </div>
          <div class="sticky-footer-meta">
            <p>${esc(footerData.copyright)}</p>
            <ul class="social-list" aria-label="Social links">
              ${footerData.social
                .map(
                  (social) => `<li><a href="${esc(social.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(social.label)}">${esc(social.icon)}</a></li>`
                )
                .join('')}
            </ul>
          </div>
        </div>
      </div>
    </footer>
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
        <p><a class="btn" href="/contribute/">Back to Contribute</a></p>
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
        <p>If you have previously submitted a project that passed verification, you are encouraged to apply as a volunteer contributor.</p>
        <p>Volunteer roles may include security review, interoperability testing, documentation, and feature development.</p>
        <p><a class="btn" href="/contribute/">Back to Contribute</a></p>
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
        <p><a class="btn" href="/contribute/">Back to Contribute</a></p>
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
