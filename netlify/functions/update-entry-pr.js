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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const slug = String(payload.slug || payload.entry?.slug || '');
    const entry = payload.entry || {};
    if (!slug) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'missing_slug' }) };
    }

    entry.slug = slug;
    entry.status = entry.status || 'published';
    const config = getConfig();
    const currentFile = await getContentFile(config, `entries/${slug}.json`);

    const branch = makeBranchName('update', slug);
    await createBranch(config, branch);

    if (payload.file && payload.file.base64 && payload.file.name) {
      const assetPath = buildAssetPath(payload.file.name);
      await putBinaryFile(config, {
        filePath: assetPath,
        branch,
        message: `Add updated asset for ${slug}`,
        base64Contents: payload.file.base64
      });
      entry.file_url = `/${assetPath}`;
    }

    await putContentFile(config, {
      filePath: `entries/${slug}.json`,
      branch,
      sha: currentFile.sha,
      message: `Update entry ${slug}`,
      textContents: `${JSON.stringify(entry, null, 2)}\n`
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
