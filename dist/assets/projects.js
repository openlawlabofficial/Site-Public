const PAGE_SIZE = 12;
const SEARCH_PREVIEW_LIMIT = 6;

const debounce = (fn, delay = 200) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const state = {
  projects: [],
  filtered: [],
  previewResults: [],
  page: 1,
  activeSuggestion: -1
};

const els = {
  searchInput: document.getElementById('search-input'),
  searchPopover: document.getElementById('search-popover-content'),
  categoryFilter: document.getElementById('category-filter'),
  tagFilter: document.getElementById('tag-filter'),
  sortBy: document.getElementById('sort-by'),
  results: document.getElementById('project-results'),
  count: document.getElementById('result-count'),
  pagination: document.getElementById('pagination')
};

const sortResults = (items) => {
  const sorted = [...items];
  const sort = els.sortBy.value;

  sorted.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (sort === 'alphabetical') return a.title.localeCompare(b.title);
    return b.lastupdate.localeCompare(a.lastupdate);
  });

  return sorted;
};

const fuzzyMatch = (project, query) => {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    project.title,
    project.overview,
    project.highlights.join(' '),
    project.states_and_territories.join(' '),
    project.topic,
    project.legal_area
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q) || q.split(/\s+/).every((part) => haystack.includes(part));
};

const renderCards = () => {
  const total = state.filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (state.page > pages) state.page = pages;

  const pageItems = state.filtered.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
  els.results.innerHTML = pageItems
    .map(
      (project) => `<article class="project-card">
      <h2><a href="/projects/${project.slug}/">${project.title}</a></h2>
      <p>${project.overview}</p>
      <p class="meta"><strong>Topic:</strong> ${project.topic || 'General'}</p>
      <p class="meta"><strong>Legal Area:</strong> ${project.legal_area || 'General'}</p>
      <p class="meta"><strong>Project Type:</strong> ${project.project_type}</p>
      <p class="meta"><strong>Updated:</strong> ${new Date(project.lastupdate + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</p>
      <ul class="tag-list">${project.states_and_territories.map((item) => `<li class="tag">${item}</li>`).join('')}</ul>
      </article>`
    )
    .join('');

  els.count.textContent = `${total} project${total === 1 ? '' : 's'} found.`;

  els.pagination.innerHTML = Array.from({ length: pages }, (_, i) => i + 1)
    .map(
      (pageNo) =>
        `<button type="button" data-page="${pageNo}" ${pageNo === state.page ? 'aria-current="page"' : ''}>${pageNo}</button>`
    )
    .join('');
};

const closeSearchPopover = () => {
  els.searchPopover.hidden = true;
  els.searchInput.setAttribute('aria-expanded', 'false');
  state.activeSuggestion = -1;
};

const openSearchPopover = () => {
  if (!state.previewResults.length) {
    closeSearchPopover();
    return;
  }
  els.searchPopover.hidden = false;
  els.searchInput.setAttribute('aria-expanded', 'true');
};

const renderSearchPopover = () => {
  const list = state.previewResults.slice(0, SEARCH_PREVIEW_LIMIT);

  if (!list.length) {
    closeSearchPopover();
    return;
  }

  els.searchPopover.innerHTML = list
    .map((project, index) => {
      const isActive = index === state.activeSuggestion;
      return `<button type="button" class="search-popover-item" data-suggestion-index="${index}" role="option" aria-selected="${isActive ? 'true' : 'false'}">
        <span class="search-popover-title">${project.title}</span>
        <span class="search-popover-meta">${project.topic || 'General'}${project.featured ? ' • Featured' : ''}</span>
      </button>`;
    })
    .join('');

  openSearchPopover();
};

const applyFilters = () => {
  const query = els.searchInput.value.trim();
  const category = els.categoryFilter.value;
  const tags = Array.from(els.tagFilter.querySelectorAll('input:checked')).map((input) => input.value);

  let filtered = state.projects.filter((project) => fuzzyMatch(project, query));
  if (category) filtered = filtered.filter((project) => project.topic === category);
  if (tags.length) filtered = filtered.filter((project) => tags.every((tag) => project.states_and_territories.includes(tag)));

  state.filtered = sortResults(filtered);
  state.previewResults = state.filtered;
  state.page = 1;
  renderCards();
  renderSearchPopover();
};

async function init() {
  const response = await fetch('/search-index.json');
  state.projects = await response.json();

  const categories = [...new Set(state.projects.map((project) => project.topic).filter(Boolean))].sort();
  const tags = [...new Set(state.projects.flatMap((project) => project.states_and_territories))].sort();

  els.categoryFilter.insertAdjacentHTML('beforeend', categories.map((c) => `<option value="${c}">${c}</option>`).join(''));
  els.tagFilter.innerHTML = tags.map((tag) => `<label><input type="checkbox" value="${tag}" /> ${tag}</label>`).join('');

  const debouncedFilter = debounce(applyFilters, 220);
  els.searchInput.addEventListener('input', debouncedFilter);
  els.searchInput.addEventListener('focus', renderSearchPopover);
  els.searchInput.addEventListener('keydown', (event) => {
    if (els.searchPopover.hidden) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      state.activeSuggestion = Math.min(state.activeSuggestion + 1, Math.min(state.previewResults.length, SEARCH_PREVIEW_LIMIT) - 1);
      renderSearchPopover();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      state.activeSuggestion = Math.max(state.activeSuggestion - 1, 0);
      renderSearchPopover();
    } else if (event.key === 'Enter' && state.activeSuggestion >= 0) {
      event.preventDefault();
      const project = state.previewResults[state.activeSuggestion];
      if (!project) return;
      els.searchInput.value = project.title;
      applyFilters();
      closeSearchPopover();
    } else if (event.key === 'Escape') {
      closeSearchPopover();
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target === els.searchInput || els.searchPopover.contains(event.target)) return;
    closeSearchPopover();
  });

  els.searchPopover.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-suggestion-index]');
    if (!button) return;
    const project = state.previewResults[Number(button.dataset.suggestionIndex)];
    if (!project) return;
    els.searchInput.value = project.title;
    applyFilters();
    closeSearchPopover();
  });

  els.categoryFilter.addEventListener('change', applyFilters);
  els.sortBy.addEventListener('change', applyFilters);
  els.tagFilter.addEventListener('change', applyFilters);
  els.pagination.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-page]');
    if (!button) return;
    state.page = Number(button.dataset.page);
    renderCards();
  });

  state.filtered = sortResults(state.projects);
  state.previewResults = state.filtered;
  renderCards();
  renderSearchPopover();
}

init();
