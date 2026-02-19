import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dataDir = path.join(root, 'data/projects');
const catalogueRepo = process.env.CATALOGUE_REPO || 'theopenlawlab/catalogue-public';
const entriesPath = `https://api.github.com/repos/${catalogueRepo}/contents/entries`;

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'theopenlawlab-site-build'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}): ${url}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'theopenlawlab-site-build'
    }
  });

  if (!response.ok) {
    throw new Error(`File download failed (${response.status}): ${url}`);
  }

  return response.text();
}

async function main() {
  await fs.mkdir(dataDir, { recursive: true });

  const existing = await fs.readdir(dataDir);
  await Promise.all(
    existing.filter((name) => name.endsWith('.json')).map((name) => fs.rm(path.join(dataDir, name), { force: true }))
  );

  const entries = await fetchJson(entriesPath);
  if (!Array.isArray(entries)) {
    throw new Error(`Unexpected GitHub API response for ${entriesPath}`);
  }

  const jsonEntries = entries.filter(
    (entry) => entry.type === 'file' && entry.name.endsWith('.json') && entry.download_url
  );

  await Promise.all(
    jsonEntries.map(async (entry) => {
      const fileContents = await fetchText(entry.download_url);
      await fs.writeFile(path.join(dataDir, entry.name), fileContents, 'utf8');
    })
  );

  console.log(`Fetched ${jsonEntries.length} catalogue files from ${catalogueRepo} into data/projects/.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
