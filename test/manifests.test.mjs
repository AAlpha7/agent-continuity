import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
async function paths(dir,prefix='') {let out=[];for(const n of await readdir(dir)){if(n==='.git')continue;const p=join(dir,n),rel=prefix+n;const st=await lstat(p);assert.ok(!st.isSymbolicLink(),rel);if(st.isDirectory())out.push(...await paths(p,rel+'/'));else if(st.isFile())out.push(rel);else assert.fail('special file '+rel);}return out;}
test('manifests cover every distributed file exactly once with matching size and SHA256',async()=>{
 const all=await paths(fileURLToPath(root));
 for(const name of ['MANIFEST.json','r2/MANIFEST.json']){
  const m=JSON.parse(await readFile(new URL(name,root),'utf8'));assert.equal(m.algorithm,'sha256');const seen=new Set();
  for(const x of m.files){assert.match(x.path,/^[A-Za-z0-9_.\/-]+$/);assert.ok(!x.path.startsWith('/')&&!x.path.split('/').includes('..'));assert.ok(!seen.has(x.path));seen.add(x.path);const b=await readFile(new URL(x.path,root));assert.equal(b.length,x.bytes,x.path);assert.equal(createHash('sha256').update(b).digest('hex'),x.sha256,x.path);}
  const expected=all.filter(p=>name==='MANIFEST.json'?p!==name:p.startsWith('r2/')&&p!==name);
  assert.deepEqual([...seen].sort(),expected.sort(),name+' coverage');
 }
});
