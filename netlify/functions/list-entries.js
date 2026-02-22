const { getConfig, githubRequest } = require('./_catalogue-github');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  try {
    const config = getConfig();
    const entries = await githubRequest(config, '/contents/entries');
    const jsonEntries = (Array.isArray(entries) ? entries : []).filter((entry) => entry.type === 'file' && entry.name.endsWith('.json'));

    const detailed = await Promise.all(
      jsonEntries.map(async (entry) => {
        const file = await githubRequest(config, `/contents/entries/${entry.name}`);
        const text = Buffer.from(file.content || '', 'base64').toString('utf8');
        const parsed = JSON.parse(text);
        return {
          name: entry.name,
          path: `entries/${entry.name}`,
          sha: entry.sha,
          slug: parsed.slug,
          title: parsed.title,
          project_type: parsed.project_type,
          lastupdate: parsed.lastupdate,
          status: parsed.status || 'published',
          entry: parsed
        };
      })
    );

    detailed.sort((a, b) => String(b.lastupdate || '').localeCompare(String(a.lastupdate || '')));

    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ entries: detailed }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: String(error.message || error) }) };
  }
};
