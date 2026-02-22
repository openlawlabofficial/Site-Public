const {
  getConfig,
  createBranch,
  createPullRequest,
  makeBranchName,
  putContentFile,
  deleteFile,
  getContentFile
} = require('./_catalogue-github');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const slug = String(payload.slug || '');
    const mode = payload.mode === 'hard_delete' ? 'hard_delete' : 'archive';

    if (!slug) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'missing_slug' }) };
    }

    const config = getConfig();
    const existing = await getContentFile(config, `entries/${slug}.json`);
    const branch = makeBranchName(mode === 'archive' ? 'archive' : 'delete', slug);
    await createBranch(config, branch);

    if (mode === 'archive') {
      const entry = JSON.parse(Buffer.from(existing.content || '', 'base64').toString('utf8'));
      entry.status = 'archived';

      await putContentFile(config, {
        filePath: `entries/${slug}.json`,
        branch,
        sha: existing.sha,
        message: `Archive entry ${slug}`,
        textContents: `${JSON.stringify(entry, null, 2)}\n`
      });
    } else {
      await deleteFile(config, {
        filePath: `entries/${slug}.json`,
        branch,
        sha: existing.sha,
        message: `Hard delete entry ${slug}`
      });
    }

    const prUrl = await createPullRequest(config, {
      branch,
      title: mode === 'archive' ? `Archive entry: ${slug}` : `Delete entry: ${slug}`,
      body:
        mode === 'archive'
          ? `## Summary\n- Set \`${slug}\` status to \`archived\`.`
          : `## Summary\n- Hard delete \`entries/${slug}.json\`.\n- Asset cleanup is intentionally not automatic.`
    });

    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prUrl, mode }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: String(error.message || error) }) };
  }
};
