import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,readFile,readdir,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { bootstrap,verifyPackage } from '../bootstrap-toolkit.mjs';
const hash=(b,algo='sha256')=>createHash(algo).update(b).digest('hex');
const row=(path,bytes=Buffer.from('Synthetic source only\r\n'))=>({path,mode:'100644',bytes:bytes.length,sha256:hash(bytes),git_blob_sha:hash(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes]),'sha1'),base64:bytes.toString('base64')});
const required=['LICENSE','package.json','ONBOARDING.md','GUIDE.md','RECEIPT-SCHEMA.md','PROTOCOL.md','scripts/agent-receipt.mjs','scripts/build-continuity-snapshot.mjs'];
const pack=files=>Buffer.from(JSON.stringify({format:'continuity-toolkit-source-v1',source_commit:'1'.repeat(40),source_tree:'2'.repeat(40),files}));
async function fixture(t,bytes) {
  const base=await mkdtemp(join(tmpdir(),'continuity-bootstrap-test-'));t.after(()=>rm(base,{recursive:true,force:true}));
  const ledger=join(base,'ledger'),dest=join(base,'toolkit');await mkdir(join(ledger,'.continuity'),{recursive:true});await writeFile(join(ledger,'.continuity','toolkit-pack.json'),bytes);return {base,ledger,dest};
}
test('B01 source-only bootstrap preserves bytes outside ledger and never executes package code',async t=>{
  const files=required.map(p=>row(p));files.push(row('throw-on-execution.mjs',Buffer.from('throw new Error("must not execute")\n')));
  const bytes=pack(files),f=await fixture(t,bytes),result=await bootstrap(f.ledger,f.dest,hash(bytes));
  assert.equal(result.package_code_executed,false);assert.equal(result.network_used,false);assert.equal(result.git_history_included,false);
  for(const file of files)assert.deepEqual(await readFile(join(f.dest,file.path)),Buffer.from(file.base64,'base64'));
  assert.ok(!(await readdir(f.dest)).includes('.git'));
});
test('B02 wrong whole-package or per-file bytes fail before any destination write',async t=>{
  const bytes=pack(required.map(p=>row(p))),f=await fixture(t,bytes);
  await assert.rejects(bootstrap(f.ledger,f.dest,'0'.repeat(64)),{code:'DIGEST'});assert.deepEqual(await readdir(f.base),['ledger']);
  const parsed=JSON.parse(bytes);parsed.files[0].base64=Buffer.from('changed').toString('base64');const changed=Buffer.from(JSON.stringify(parsed));await writeFile(join(f.ledger,'.continuity/toolkit-pack.json'),changed);
  await assert.rejects(bootstrap(f.ledger,f.dest,hash(changed)),{code:'DIGEST'});assert.deepEqual(await readdir(f.base),['ledger']);
});
test('B03 traversal, git metadata, case collisions and file-directory overlaps are rejected',()=>{
  for(const path of ['../outside','/absolute','C:/absolute','.git/config','docs/../../outside','CON.txt','docs\\outside']) {
    const bytes=pack([...required.map(p=>row(p)),row(path)]);assert.throws(()=>verifyPackage(bytes,hash(bytes)),{code:'PATH'});
  }
  for(const additions of [[row('guide.md')],[row('scripts')]]) {
    const bytes=pack([...required.map(p=>row(p)),...additions]);assert.throws(()=>verifyPackage(bytes,hash(bytes)),{code:'PATH'});
  }
});
test('B04 extraction refuses existing destination and every ledger-internal destination',async t=>{
  const bytes=pack(required.map(p=>row(p))),f=await fixture(t,bytes);await mkdir(f.dest);await writeFile(join(f.dest,'retained'),'original');
  await assert.rejects(bootstrap(f.ledger,f.dest,hash(bytes)),{code:'EEXIST'});assert.equal(await readFile(join(f.dest,'retained'),'utf8'),'original');
  for(const dest of [join(f.ledger,'toolkit'),join(f.ledger,'..toolkit')])await assert.rejects(bootstrap(f.ledger,dest,hash(bytes)),{code:'PATH'});
});
test('B05 incomplete onboarding dependency set is rejected rather than claiming toolkit readiness',()=>{
  const bytes=pack(required.slice(1).map(p=>row(p)));assert.throws(()=>verifyPackage(bytes,hash(bytes)),{code:'PACKAGE'});
});
