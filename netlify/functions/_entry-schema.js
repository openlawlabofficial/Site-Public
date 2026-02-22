const REQUIRED_FIELDS = ['slug', 'title', 'overview', 'full_description', 'project_type', 'lastupdate'];
const VALID_STATUS = ['published', 'draft', 'archived'];
const VALID_PROJECT_TYPES = ['file', 'repository'];

function ensureString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function ensureArrayOfStrings(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const normalized = value.map((item) => ensureString(item)).filter(Boolean);
  return normalized;
}

function validateAndNormalizeEntry(input, { expectedSlug } = {}) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'invalid_entry_payload' };
  }

  const entry = {
    slug: ensureString(input.slug),
    title: ensureString(input.title),
    overview: ensureString(input.overview),
    full_description: ensureString(input.full_description),
    project_type: ensureString(input.project_type),
    lastupdate: ensureString(input.lastupdate),
    status: ensureString(input.status) || 'published',
    author: ensureString(input.author),
    topic: ensureString(input.topic),
    legal_area: ensureString(input.legal_area),
    repository_url: ensureString(input.repository_url),
    file_url: ensureString(input.file_url)
  };

  const highlights = ensureArrayOfStrings(input.highlights);
  const states = ensureArrayOfStrings(input.states_and_territories);
  if (!highlights || !states) {
    return { ok: false, error: 'invalid_array_fields' };
  }

  entry.highlights = highlights;
  entry.states_and_territories = states;

  for (const field of REQUIRED_FIELDS) {
    if (!entry[field]) {
      return { ok: false, error: `missing_required_field:${field}` };
    }
  }

  if (!VALID_PROJECT_TYPES.includes(entry.project_type)) {
    return { ok: false, error: 'invalid_project_type' };
  }

  if (!VALID_STATUS.includes(entry.status)) {
    return { ok: false, error: 'invalid_status' };
  }

  if (expectedSlug && entry.slug !== expectedSlug) {
    return { ok: false, error: 'slug_mismatch' };
  }

  if (entry.project_type === 'repository' && !entry.repository_url) {
    return { ok: false, error: 'missing_repository_url' };
  }

  if (entry.project_type === 'file' && !entry.file_url) {
    return { ok: false, error: 'missing_file_url' };
  }

  return { ok: true, entry };
}

module.exports = { validateAndNormalizeEntry };
