const {
  getConfig,
  createBranch,
  createPullRequest,
  makeBranchName,
  putContentFile,
  putBinaryFile,
  buildAssetPath
} = require('./_catalogue-github');
const { requireAdminPassword } = require('./_admin-auth');
const { validateAndNormalizeEntry } = require('./_entry-schema');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  const auth = requireAdminPassword(event);
  if (!auth.ok) return auth.response;

  try {
    const payload = JSON.parse(event.body || '{}');
    const maybeUploadedFile = payload.file && payload.file.base64 && payload.file.name;
    const validation = validateAndNormalizeEntry(payload.entry || {});
    if (!validation.ok) {
      if (validation.error === 'missing_file_url' && maybeUploadedFile) {
        // acceptable when file_url will be set from uploaded file
      } else {
        return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: validation.error }) };
      }
    }

    const entry = validation.entry || { ...(payload.entry || {}) };
    entry.status = entry.status || 'published';
    const config = getConfig();
    const branch = makeBranchName('create', entry.slug);
    await createBranch(config, branch);

    if (maybeUploadedFile) {
      const assetPath = buildAssetPath(payload.file.name);
      await putBinaryFile(config, {
        filePath: assetPath,
        branch,
        message: `Add asset for ${entry.slug}`,
        base64Contents: payload.file.base64
      });
      entry.file_url = `/${assetPath}`;
    }

    const finalValidation = validateAndNormalizeEntry(entry);
    if (!finalValidation.ok) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: finalValidation.error }) };
    }

    await putContentFile(config, {
      filePath: `entries/${entry.slug}.json`,
      branch,
      message: `Create entry ${entry.slug}`,
      textContents: `${JSON.stringify(finalValidation.entry, null, 2)}\n`
    });

    const prUrl = await createPullRequest(config, {
      branch,
      title: `Create entry: ${entry.title}`,
      body: `## Summary\n- Create new catalogue entry for \`${entry.slug}\`.\n- Status: \`${entry.status}\`.`
    });

    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prUrl }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: String(error.message || error) }) };
  }
};
