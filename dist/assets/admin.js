const state = {
  entries: [],
  mode: 'create',
  activeSlug: null
};

const fields = [
  'slug',
  'title',
  'overview',
  'full_description',
  'project_type',
  'lastupdate',
  'status',
  'author',
  'topic',
  'legal_area',
  'repository_url',
  'file_url'
];

const els = {
  search: document.getElementById('admin-search'),
  list: document.getElementById('admin-entry-list'),
  form: document.getElementById('entry-form'),
  submit: document.getElementById('entry-submit'),
  create: document.getElementById('entry-create'),
  archive: document.getElementById('entry-archive'),
  hardDelete: document.getElementById('entry-hard-delete'),
  prResult: document.getElementById('pr-result'),
  message: document.getElementById('admin-message'),
  fileInput: document.getElementById('entry-file'),
  passwordInput: document.getElementById('admin-password-confirm'),
  loadButton: document.getElementById('admin-load')
};

function setMessage(message) {
  if (els.message) els.message.textContent = message;
}

function getAdminPassword() {
  return String(els.passwordInput?.value || '').trim();
}

function withAdminHeaders(headers = {}) {
  const password = getAdminPassword();
  return {
    ...headers,
    'x-admin-password': password
  };
}

function emptyEntry() {
  return {
    slug: '',
    title: '',
    overview: '',
    full_description: '',
    project_type: 'file',
    lastupdate: new Date().toISOString().slice(0, 10),
    status: 'published',
    author: '',
    topic: '',
    legal_area: '',
    repository_url: '',
    file_url: '',
    states_and_territories: [],
    highlights: []
  };
}

function getFormEntry() {
  const formData = new FormData(els.form);
  const entry = emptyEntry();
  for (const field of fields) {
    entry[field] = String(formData.get(field) || '').trim();
  }
  entry.states_and_territories = String(formData.get('states_and_territories') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  entry.highlights = String(formData.get('highlights') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return entry;
}

function setFormEntry(entry) {
  const normalized = { ...emptyEntry(), ...entry };
  for (const field of fields) {
    const input = els.form.elements.namedItem(field);
    if (input) input.value = normalized[field] || '';
  }
  els.form.elements.namedItem('states_and_territories').value = (normalized.states_and_territories || []).join(', ');
  els.form.elements.namedItem('highlights').value = (normalized.highlights || []).join(', ');
}

function renderList() {
  const q = (els.search.value || '').trim().toLowerCase();
  const filtered = state.entries.filter((entry) => {
    if (!q) return true;
    return [entry.title, entry.slug, entry.project_type, entry.status].join(' ').toLowerCase().includes(q);
  });

  els.list.innerHTML = filtered
    .map(
      (entry) => `<tr>
      <td>${entry.title || '-'}</td>
      <td>${entry.slug}</td>
      <td>${entry.project_type}</td>
      <td>${entry.lastupdate || '-'}</td>
      <td>${entry.status || 'published'}</td>
      <td>
        <button type="button" data-edit="${entry.slug}">Edit</button>
        <button type="button" data-archive="${entry.slug}">Archive</button>
        <button type="button" data-delete="${entry.slug}">Delete</button>
      </td>
    </tr>`
    )
    .join('');
}

async function readFileAsBase64(file) {
  if (!file) return null;
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return {
    name: file.name,
    type: file.type,
    base64: btoa(binary)
  };
}

async function fetchJson(url, options = {}) {
  const merged = { ...options, headers: withAdminHeaders(options.headers || {}) };
  const response = await fetch(url, merged);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'request_failed');
  return data;
}

async function refreshEntries() {
  if (!getAdminPassword()) {
    setMessage('Enter admin password to load entries.');
    return;
  }

  setMessage('Loading entries...');
  const data = await fetchJson('/.netlify/functions/list-entries');
  state.entries = data.entries || [];
  renderList();
  setMessage(`Loaded ${state.entries.length} entries.`);
}

function setMode(mode, slug = null) {
  state.mode = mode;
  state.activeSlug = slug;
  els.submit.textContent = mode === 'edit' ? 'Create PR for Edit' : 'Create PR for New Entry';
  els.archive.disabled = mode !== 'edit';
}

async function submitEntry() {
  const entry = getFormEntry();
  const file = await readFileAsBase64(els.fileInput.files[0]);

  if (!getAdminPassword()) {
    setMessage('Enter admin password to continue.');
    return;
  }

  const endpoint = state.mode === 'edit' ? 'update-entry-pr' : 'create-entry-pr';
  const payload = state.mode === 'edit' ? { slug: state.activeSlug, entry, file } : { entry, file };

  setMessage('Creating PR...');
  const data = await fetchJson(`/.netlify/functions/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  els.prResult.innerHTML = `<a href="${data.prUrl}" target="_blank" rel="noopener noreferrer">Open Pull Request</a>`;
  await refreshEntries();
}

async function archiveEntry(slug) {
  if (!getAdminPassword()) {
    setMessage('Enter admin password to continue.');
    return;
  }

  setMessage('Archiving entry...');
  const data = await fetchJson('/.netlify/functions/archive-entry-pr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, mode: 'archive' })
  });
  els.prResult.innerHTML = `<a href="${data.prUrl}" target="_blank" rel="noopener noreferrer">Open Pull Request</a>`;
  await refreshEntries();
}

function wireEvents() {
  els.search.addEventListener('input', renderList);
  els.loadButton.addEventListener('click', () => {
    refreshEntries().catch((error) => setMessage(error.message));
  });
  els.create.addEventListener('click', () => {
    setMode('create');
    setFormEntry(emptyEntry());
  });
  els.submit.addEventListener('click', submitEntry);
  els.archive.addEventListener('click', () => {
    if (!state.activeSlug) return;
    archiveEntry(state.activeSlug).catch((error) => setMessage(error.message));
  });
  els.hardDelete.addEventListener('click', () => {
    alert('We can’t verify your credentials, this feature is turned off temporarily.');
  });

  els.list.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit]');
    if (edit) {
      const slug = edit.dataset.edit;
      const selected = state.entries.find((entry) => entry.slug === slug);
      if (!selected) return;
      setMode('edit', slug);
      setFormEntry(selected.entry);
      return;
    }

    const archive = event.target.closest('[data-archive]');
    if (archive) {
      archiveEntry(archive.dataset.archive).catch((error) => setMessage(error.message));
      return;
    }

    const del = event.target.closest('[data-delete]');
    if (del) {
      alert('We can’t verify your credentials, this feature is turned off temporarily.');
    }
  });
}

if (sessionStorage.getItem('adminAuthorized') !== 'true') {
  window.location.replace('/admin/login/');
} else {
  wireEvents();
  setFormEntry(emptyEntry());
}
