const {
  getConfig,
  createBranch,
  createPullRequest,
  makeBranchName,
  putContentFile,
  putBinaryFile,
  buildAssetPath
} = require('./_catalogue-github');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const entry = payload.entry || {};
    if (!entry.slug || !entry.title || !entry.project_type || !entry.lastupdate || !entry.overview || !entry.full_description) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'missing_required_fields' }) };
    }

    entry.status = entry.status || 'published';
    const config = getConfig();
    const branch = makeBranchName('create', entry.slug);
    await createBranch(config, branch);

    if (payload.file && payload.file.base64 && payload.file.name) {
      const assetPath = buildAssetPath(payload.file.name);
      await putBinaryFile(config, {
        filePath: assetPath,
        branch,
        message: `Add asset for ${entry.slug}`,
        base64Contents: payload.file.base64
      });
      entry.file_url = `/${assetPath}`;
    }

    await putContentFile(config, {
      filePath: `entries/${entry.slug}.json`,
      branch,
      message: `Create entry ${entry.slug}`,
      textContents: `${JSON.stringify(entry, null, 2)}\n`
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
