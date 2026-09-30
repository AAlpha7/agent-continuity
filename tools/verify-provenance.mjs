// Read-only offline check. Requires an authorized checkout containing source_revision.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { digest } from '../lib/ledger-write.mjs';

try {
  const [checkout, extra] = process.argv.slice(2);
  if (!checkout || extra) throw new Error('Usage: node tools/verify-provenance.mjs SOURCE_CHECKOUT');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const provenance = JSON.parse(await readFile(new URL('../PROVENANCE.json', import.meta.url), 'utf8'));
  if (provenance.schema !== 2 || !/^[a-f0-9]{40}$/.test(provenance.source_revision)) throw new Error('invalid provenance version/revision');
  for (const row of provenance.files) {
    for (const path of [row.source_path, row.exported_path]) {
      if (typeof path !== 'string' || !/^[a-zA-Z0-9_.\/-]+$/.test(path) || path.startsWith('/') || path.split('/').includes('..')) throw new Error('invalid provenance path');
    }
    const object = `${provenance.source_revision}:${row.source_path}`;
    const blob = execFileSync('git', ['-C', resolve(checkout), 'show', object], { windowsHide: true });
    const oid = execFileSync('git', ['-C', resolve(checkout), 'rev-parse', object], { windowsHide: true, encoding: 'utf8' }).trim();
    if (digest(blob) !== row.git_blob_sha256 || oid !== row.git_blob_oid) throw new Error(`source blob mismatch: ${row.source_path}`);
    let text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(blob);
    for (const rule of row.transformations) {
      if (rule.operation === 'replace_all') text = text.replaceAll(rule.from, rule.to);
      else if (rule.operation === 'remove_between') {
        const start = text.indexOf(rule.start); const end = text.indexOf(rule.end, start);
        if (start < 0 || end < 0) throw new Error('missing transformation boundary');
        text = text.slice(0, start) + text.slice(end);
      } else throw new Error('unknown transformation');
    }
    const exported = await readFile(resolve(root, row.exported_path));
    if (!exported.equals(Buffer.from(text, 'utf8')) || digest(exported) !== row.exported_sha256) throw new Error(`export mismatch: ${row.exported_path}`);
  }
  console.log(JSON.stringify({ files: provenance.files.length, git_blob_sha256: 'verified', exact_transformations: 'verified', workspace_hash: 'informational-only' }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
