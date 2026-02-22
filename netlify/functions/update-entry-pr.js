const {
  getConfig,
  createBranch,
  createPullRequest,
  makeBranchName,
  putContentFile,
  putBinaryFile,
  getContentFile,
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
    const slug = String(payload.slug || payload.entry?.slug || '').trim();
    if (!slug) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'missing_slug' }) };
    }

    const maybeUploadedFile = payload.file && payload.file.base64 && payload.file.name;
    const validation = validateAndNormalizeEntry(payload.entry || {}, { expectedSlug: slug });
    if (!validation.ok) {
      if (validation.error === 'missing_file_url' && maybeUploadedFile) {
        // acceptable when file_url will be set from uploaded file
      } else {
        return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: validation.error }) };
      }
    }

    const entry = validation.entry || { ...(payload.entry || {}), slug };
    entry.slug = slug;
    entry.status = entry.status || 'published';

    const config = getConfig();
    const currentFile = await getContentFile(config, `entries/${slug}.json`);
    const branch = makeBranchName('update', slug);
    await createBranch(config, branch);

    if (maybeUploadedFile) {
      const assetPath = buildAssetPath(payload.file.name);
      await putBinaryFile(config, {
        filePath: assetPath,
        branch,
        message: `Add updated asset for ${slug}`,
        base64Contents: payload.file.base64
      });
      entry.file_url = `/${assetPath}`;
    }

    const finalValidation = validateAndNormalizeEntry(entry, { expectedSlug: slug });
    if (!finalValidation.ok) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: finalValidation.error }) };
    }

    await putContentFile(config, {
      filePath: `entries/${slug}.json`,
      branch,
      sha: currentFile.sha,
      message: `Update entry ${slug}`,
      textContents: `${JSON.stringify(finalValidation.entry, null, 2)}\n`
    });

    const prUrl = await createPullRequest(config, {
      branch,
      title: `Update entry: ${slug}`,
      body: `## Summary\n- Update catalogue entry for \`${slug}\`.\n- Status: \`${entry.status}\`.`
    });

    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prUrl }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: String(error.message || error) }) };
  }
};
