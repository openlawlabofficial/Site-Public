const state = {
  entries: [],
  mode: 'edit',
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
  createModal: document.getElementById('entry-create-modal'),
  createModalOverlay: document.getElementById('entry-create-modal-overlay'),
  createModalClose: document.getElementById('entry-create-modal-close'),
  createForm: document.getElementById('entry-create-form'),
  createSubmit: document.getElementById('entry-create-submit'),
  archive: document.getElementById('entry-archive'),
  hardDelete: document.getElementById('entry-hard-delete'),
  prResult: document.getElementById('pr-result'),
  message: document.getElementById('admin-message'),
  fileInput: document.getElementById('entry-file'),
  createFileInput: document.getElementById('entry-create-file'),
  passwordInput: document.getElementById('admin-password-confirm'),
  loadButton: document.getElementById('admin-load'),
  createToast: document.getElementById('admin-toast')
};

function setMessage(message) {
  if (els.message) els.message.textContent = message;
}

function showToast(message, type = 'info') {
  if (!els.createToast) return;
  els.createToast.textContent = message;
  els.createToast.dataset.kind = type;
  els.createToast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    if (els.createToast) els.createToast.hidden = true;
  }, 3600);
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

function getFormEntry(form) {
  const formData = new FormData(form);
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

function validateEntry(entry) {
  if (!entry.slug || !entry.title || !entry.overview || !entry.full_description || !entry.lastupdate) {
    return 'Please fill in all required fields.';
  }
  if (!['published', 'draft', 'archived', 'coming_soon'].includes(entry.status)) {
    return 'Status must be published, draft, archived, or coming soon.';
  }
  if (entry.project_type === 'repository' && !entry.repository_url) {
    return 'Repository URL is required for repository projects.';
  }
  if (entry.project_type === 'file' && !entry.file_url) {
    return 'File URL is required for file projects.';
  }
  return null;
}

function openCreateModal() {
  if (!els.createModal || !els.createForm) return;
  els.createForm.reset();
  for (const field of fields) {
    const input = els.createForm.elements.namedItem(field);
    if (!input) continue;
    input.value = field === 'lastupdate' ? new Date().toISOString().slice(0, 10) : '';
  }
  const defaultStatus = els.createForm.elements.namedItem('status');
  if (defaultStatus) defaultStatus.value = 'published';
  const defaultType = els.createForm.elements.namedItem('project_type');
  if (defaultType) defaultType.value = 'file';
  els.createModal.hidden = false;
  document.body.classList.add('dialog-open');
}

function closeCreateModal() {
  if (!els.createModal) return;
  els.createModal.hidden = true;
  document.body.classList.remove('dialog-open');
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
  els.submit.textContent = 'Create a new PR';
  els.archive.disabled = mode !== 'edit';
}

async function submitEntry({ form, fileInput, mode }) {
  const entry = getFormEntry(form);
  const validationError = validateEntry(entry);
  if (validationError) {
    setMessage(validationError);
    showToast(validationError, 'error');
    return;
  }

  const file = await readFileAsBase64(fileInput.files[0]);

  if (!getAdminPassword()) {
    setMessage('Enter admin password to continue.');
    return;
  }

  const endpoint = mode === 'edit' ? 'update-entry-pr' : 'create-entry-pr';
  const payload = mode === 'edit' ? { slug: state.activeSlug, entry, file } : { entry, file };

  const actionLabel = mode === 'edit' ? 'Updating entry PR...' : 'Creating entry PR...';
  setMessage(actionLabel);
  const data = await fetchJson(`/.netlify/functions/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  els.prResult.innerHTML = `<a href="${data.prUrl}" target="_blank" rel="noopener noreferrer">Open Pull Request</a>`;
  showToast('PR created successfully.', 'success');
  setMessage('PR created successfully.');
  await refreshEntries();
  if (mode === 'create') closeCreateModal();
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
  showToast('Archive PR created successfully.', 'success');
  await refreshEntries();
}

function wireEvents() {
  els.search.addEventListener('input', renderList);
  els.loadButton.addEventListener('click', () => {
    refreshEntries().catch((error) => setMessage(error.message));
  });
  els.create.addEventListener('click', () => {
    openCreateModal();
  });
  els.createModalClose?.addEventListener('click', closeCreateModal);
  els.createModalOverlay?.addEventListener('click', closeCreateModal);
  els.submit.addEventListener('click', () => {
    if (!state.activeSlug) {
      const message = 'Select a project before creating an edit PR.';
      setMessage(message);
      showToast(message, 'error');
      return;
    }
    submitEntry({ form: els.form, fileInput: els.fileInput, mode: 'edit' }).catch((error) => {
      setMessage(error.message);
      showToast(error.message, 'error');
    });
  });
  els.createSubmit?.addEventListener('click', () => {
    submitEntry({ form: els.createForm, fileInput: els.createFileInput, mode: 'create' }).catch((error) => {
      setMessage(error.message);
      showToast(error.message, 'error');
    });
  });
  els.archive.addEventListener('click', () => {
    if (!state.activeSlug) return;
    archiveEntry(state.activeSlug).catch((error) => {
      setMessage(error.message);
      showToast(error.message, 'error');
    });
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
      showToast(`Editing ${selected.entry.title || slug}.`, 'info');
      return;
    }

    const archive = event.target.closest('[data-archive]');
    if (archive) {
      archiveEntry(archive.dataset.archive).catch((error) => {
        setMessage(error.message);
        showToast(error.message, 'error');
      });
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
  setMessage('Select an entry to edit, or create a new one from the modal.');
}
