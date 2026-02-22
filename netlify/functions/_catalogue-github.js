const DEFAULT_REPO = process.env.CATALOGUE_REPO || 'openlawlabofficial/catalogue-public';
const DEFAULT_BASE_BRANCH = process.env.CATALOGUE_BASE_BRANCH || 'main';

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('missing_github_token');
  }

  const [owner, repo] = DEFAULT_REPO.split('/');
  if (!owner || !repo) {
    throw new Error('invalid_catalogue_repo');
  }

  return { owner, repo, token, baseBranch: DEFAULT_BASE_BRANCH };
}

async function githubRequest(config, endpoint, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'User-Agent': 'theopenlawlab-admin-functions',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`github_${response.status}:${details}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function getRefSha(config, branchName) {
  const ref = await githubRequest(config, `/git/ref/heads/${branchName}`);
  return ref.object.sha;
}

function makeBranchName(prefix, slug = '') {
  const cleanSlug = String(slug || 'entry')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'entry';
  const stamp = Date.now();
  return `admin/${prefix}-${cleanSlug}-${stamp}`;
}

async function createBranch(config, branchName) {
  const sha = await getRefSha(config, config.baseBranch);
  await githubRequest(config, '/git/refs', {
    method: 'POST',
    body: {
      ref: `refs/heads/${branchName}`,
      sha
    }
  });
}

function toBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

async function getContentFile(config, filePath, ref = config.baseBranch) {
  return githubRequest(config, `/contents/${filePath}?ref=${encodeURIComponent(ref)}`);
}

async function putContentFile(config, { filePath, branch, message, textContents, sha }) {
  return githubRequest(config, `/contents/${filePath}`, {
    method: 'PUT',
    body: {
      message,
      branch,
      content: toBase64(textContents),
      sha
    }
  });
}

async function putBinaryFile(config, { filePath, branch, message, base64Contents }) {
  return githubRequest(config, `/contents/${filePath}`, {
    method: 'PUT',
    body: {
      message,
      branch,
      content: base64Contents
    }
  });
}

async function deleteFile(config, { filePath, branch, message, sha }) {
  return githubRequest(config, `/contents/${filePath}`, {
    method: 'DELETE',
    body: {
      message,
      branch,
      sha
    }
  });
}

async function createPullRequest(config, { branch, title, body }) {
  const pr = await githubRequest(config, '/pulls', {
    method: 'POST',
    body: {
      title,
      head: branch,
      base: config.baseBranch,
      body
    }
  });

  return pr.html_url;
}

function buildAssetPath(filename) {
  const cleaned = String(filename || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '-');
  const dotIndex = cleaned.lastIndexOf('.');
  const base = dotIndex > 0 ? cleaned.slice(0, dotIndex) : cleaned;
  const ext = dotIndex > 0 ? cleaned.slice(dotIndex) : '';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `assets/${base}-${stamp}${ext}`;
}

module.exports = {
  getConfig,
  githubRequest,
  getContentFile,
  putContentFile,
  putBinaryFile,
  deleteFile,
  createPullRequest,
  createBranch,
  makeBranchName,
  buildAssetPath
};
