import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,readFile,readdir,rm,stat,copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bootstrap,verifyPackage } from '../bootstrap-toolkit.mjs';
const hash=(b,algo='sha256')=>createHash(algo).update(b).digest('hex');
const row=(path,bytes=Buffer.from('Synthetic source only\r\n'))=>({path,mode:'100644',bytes:bytes.length,sha256:hash(bytes),git_blob_sha:hash(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes]),'sha1'),base64:bytes.toString('base64')});
const required=['LICENSE','package.json','ONBOARDING.md','GUIDE.md','RECEIPT-SCHEMA.md','PROTOCOL.md','.gitattributes','examples/init-project.mjs','lib/safe-files.mjs','lib/ledger-write.mjs','scripts/agent-receipt.mjs','scripts/build-continuity-snapshot.mjs','templates/HOW_WE_COORDINATE.md'];
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
test('B05 each missing workflow dependency is rejected before destination creation',async t=>{
  const files=await Promise.all(required.map(async p=>row(p,await readFile(new URL(`../../${p}`,import.meta.url)))));
  for(const missing of required) {
    const bytes=pack(files.filter(f=>f.path!==missing)),f=await fixture(t,bytes);
    await assert.rejects(bootstrap(f.ledger,f.dest,hash(bytes)),{code:'PACKAGE'},missing);
    assert.deepEqual(await readdir(f.base),['ledger']);
  }
});

test('B06 complete source extraction runs initializer, exact replay and snapshot checks without original checkout dependencies',async t=>{
  const root=fileURLToPath(new URL('../../',import.meta.url));
  const manifest=JSON.parse(await readFile(join(root,'MANIFEST.json'),'utf8'));
  const files=await Promise.all(['MANIFEST.json',...manifest.files.map(f=>f.path)].map(async p=>({
    ...row(p,await readFile(join(root,p))),mode:p==='scripts/ledger-smoke.sh'?'100755':'100644'
  })));
  const bytes=pack(files),f=await fixture(t,bytes),extracted=await bootstrap(f.ledger,f.dest,hash(bytes));
  assert.equal(extracted.files_verified,files.length);
  for(const file of files)assert.deepEqual(await readFile(join(f.dest,file.path)),Buffer.from(file.base64,'base64'));
  const handoff=join(f.base,'handoff.md'),workspace=join(f.base,'project-ledger');
  const original=Buffer.from('\uFEFF# Synthetic extracted workflow\r\nPreserve these bytes.\r\n');
  await writeFile(handoff,original);
  const run=(entry,...args)=>JSON.parse(execFileSync(process.execPath,[join(f.dest,entry),...args],{cwd:f.base,windowsHide:true,encoding:'utf8'}));
  run('examples/init-project.mjs',workspace,'test-project',handoff,'3'.repeat(40));
  assert.deepEqual(await readFile(join(workspace,'projects/test-project/CURRENT_STATE.md')),original);
  const receipt=join(workspace,'receipt-input.json');
  assert.equal(run('scripts/agent-receipt.mjs',workspace,receipt).duplicate,false);
  assert.equal(run('scripts/agent-receipt.mjs',workspace,receipt).duplicate,true);
  assert.equal(run('scripts/build-continuity-snapshot.mjs',workspace,'test-project').snapshot,'current');
  assert.equal(run('scripts/build-continuity-snapshot.mjs',workspace,'test-project','--check').snapshot,'current');
  assert.deepEqual(await readFile(join(workspace,'projects/test-project/CURRENT_STATE.md')),original);
});

test('B07 executable regular files retain eligibility but links and special Git modes fail before writes',async t=>{
  const files=required.map(p=>row(p));
  const executable={...row('scripts/example.sh',Buffer.from('#!/bin/sh\nexit 0\n')),mode:'100755'};
  const bytes=pack([...files,executable]),f=await fixture(t,bytes);
  assert.equal(verifyPackage(bytes,hash(bytes)).files.find(f=>f.path===executable.path).mode,'100755');
  await bootstrap(f.ledger,f.dest,hash(bytes));
  assert.deepEqual(await readFile(join(f.dest,executable.path)),Buffer.from(executable.base64,'base64'));
  if(process.platform!=='win32') {
    assert.equal((await stat(join(f.dest,executable.path))).mode&0o777,0o700);
    assert.equal((await stat(join(f.dest,'LICENSE'))).mode&0o777,0o600);
  }
  for(const mode of ['120000','160000','040000','104755','100664','100777']) {
    const invalid=pack([...files,{...executable,mode}]),other=await fixture(t,invalid);
    await assert.rejects(bootstrap(other.ledger,other.dest,hash(invalid)),{code:'PACKAGE'},mode);
    assert.deepEqual(await readdir(other.base),['ledger']);
  }
});

test('B08 required runtime paths must have exact casing for portable imports',async t=>{
  const bytes=pack(required.map(p=>row(p==='lib/safe-files.mjs'?'Lib/safe-files.mjs':p))),f=await fixture(t,bytes);
  await assert.rejects(bootstrap(f.ledger,f.dest,hash(bytes)),{code:'PACKAGE'});
  assert.deepEqual(await readdir(f.base),['ledger']);
});

test('B09 extracted Minimal protocol and coordination template survive a fresh ledger clone without toolkit access',async t=>{
  const files=await Promise.all([...required,'templates/LEDGER-README.md'].map(async p=>row(p,await readFile(new URL(`../../${p}`,import.meta.url)))));
  const bytes=pack(files),f=await fixture(t,bytes);await bootstrap(f.ledger,f.dest,hash(bytes));
  const minimal=join(f.base,'minimal'),clone=join(f.base,'joined'),config=join(f.base,'empty-gitconfig'),hooks=join(f.base,'empty-hooks');
  await mkdir(join(minimal,'docs'),{recursive:true});await mkdir(join(minimal,'projects','sample'),{recursive:true});
  await mkdir(hooks);await writeFile(config,'');
  await copyFile(join(f.dest,'.gitattributes'),join(minimal,'.gitattributes'));
  await copyFile(join(f.dest,'PROTOCOL.md'),join(minimal,'docs/PROTOCOL.md'));
  const template=await readFile(join(f.dest,'templates/HOW_WE_COORDINATE.md'),'utf8');
  assert.match(template,/<commit or unset>/);
  await writeFile(join(minimal,'docs/HOW_WE_COORDINATE.md'),template.replace('<commit or unset>','unset'));
  await writeFile(join(minimal,'projects/sample/CURRENT_STATE.md'),'# Synthetic handoff\nGoal: test ledger shape, not agent literacy.\n');
  const rootTemplate=await readFile(join(f.dest,'templates/LEDGER-README.md'),'utf8');
  await writeFile(join(minimal,'README.md'),rootTemplate.replaceAll('PROJECT','sample'));
  const env={...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:config};
  const git=(...args)=>execFileSync('git',['-c',`core.hooksPath=${hooks}`,'-c',`core.excludesFile=${config}`,'-c','user.name=Synthetic Fixture','-c','user.email=fixture@invalid','-c','commit.gpgsign=false',...args],{cwd:f.base,env,windowsHide:true,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  git('init','--template=',minimal);git('-C',minimal,'add','.');git('-C',minimal,'commit','-m','Synthetic Minimal ledger');
  git('clone','--no-local','--config','core.autocrlf=true',minimal,clone);
  const expected=['.gitattributes','README.md','docs/HOW_WE_COORDINATE.md','docs/PROTOCOL.md','projects/sample/CURRENT_STATE.md'];
  assert.deepEqual(git('-C',clone,'ls-files').trim().split(/\r?\n/),expected);
  for(const path of expected)assert.deepEqual(await readFile(join(clone,path)),await readFile(join(minimal,path)));
  assert.deepEqual(await readFile(join(clone,'docs/PROTOCOL.md')),await readFile(new URL('../../PROTOCOL.md',import.meta.url)));
  const rootEntry=await readFile(join(clone,'README.md'),'utf8');
  for(const match of rootEntry.matchAll(/\]\(([^)]+)\)/g)) assert.ok((await readFile(join(clone,match[1]))).length);
  assert.match(rootEntry,/projects\/sample\/CURRENT_STATE\.md/);
  const entry=await readFile(join(clone,'docs/HOW_WE_COORDINATE.md'),'utf8');
  assert.match(entry,/docs\/PROTOCOL\.md/);assert.match(entry,/CURRENT_STATE\.md/);
  assert.match(entry,/Toolkit docs revision \(optional\): unset/);assert.doesNotMatch(entry,/<commit or unset>/);
  assert.equal(git('-C',clone,'status','--porcelain'),'');
});
