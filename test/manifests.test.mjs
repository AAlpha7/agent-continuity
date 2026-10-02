import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('distributed manifests match every listed file including the nested R2 manifest',async()=>{
  const root=new URL('../',import.meta.url);
  for(const path of ['MANIFEST.json','r2/MANIFEST.json']) {
    const manifest=JSON.parse(await readFile(new URL(path,root),'utf8'));
    assert.equal(manifest.algorithm,'sha256');
    const seen=new Set();
    for(const entry of manifest.files) {
      assert.match(entry.path,/^[A-Za-z0-9_.\/-]+$/);
      assert.ok(!entry.path.startsWith('/')&&!entry.path.split('/').includes('..'));
      assert.ok(!seen.has(entry.path),`${path}: duplicate ${entry.path}`);seen.add(entry.path);
      const bytes=await readFile(new URL(entry.path,root));
      assert.equal(bytes.length,entry.bytes,`${path}: size ${entry.path}`);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,`${path}: digest ${entry.path}`);
    }
    assert.ok(seen.has(path==='MANIFEST.json'?'r2/MANIFEST.json':'r2/bootstrap-toolkit.mjs'));
  }
});
