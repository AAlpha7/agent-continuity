import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
const source=fileURLToPath(new URL('..',import.meta.url));
const shellTest=(name,fn)=>test(name,{skip:process.platform==='win32'?'POSIX fixture; use Git Bash/WSL shell smoke on Windows':false},fn);
async function fixture(t) {
 const base=await mkdtemp(join(tmpdir(),'ac-onboarding-safety-'));t.after(()=>rm(base,{recursive:true,force:true}));
 const ledger=join(base,'ledger'),bin=join(base,'bin'),handoff=join(base,'handoff.md'),config=join(base,'empty-config');
 await mkdir(bin);await writeFile(config,'');await writeFile(handoff,'# Synthetic project\nNext: inspect a fictional item.\n');
 const env={...process.env,GIT_CONFIG_GLOBAL:config,GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0',PATH:bin+delimiter+process.env.PATH,MOCK_OWNER:'sample-owner',MOCK_VISIBILITY:'PRIVATE'};
 const git=(...args)=>execFileSync('git',args,{env,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 git('init','--template=',ledger);git('-C',ledger,'remote','add','origin','https://github.com/sample-owner/sample-ledger.git');
 await writeFile(join(bin,'gh'),'#!/bin/sh\nif [ "$1" = api ]; then printf "%s\\n" "$MOCK_OWNER"; else printf "%s\\tsample-ledger\\t%s\\n" "$MOCK_OWNER" "$MOCK_VISIBILITY"; fi\n',{mode:0o700});
 return {base,ledger,env,git,run:()=>spawnSync('sh',[join(source,'scripts/prepare-new-ledger.sh'),source,ledger,'sample-project',handoff,'sample-owner/sample-ledger'],{env,encoding:'utf8'})};
}
async function inventory(dir,prefix='') {
 const out={};for(const name of (await readdir(join(dir,prefix))).sort()) {const p=join(prefix,name);const {lstat}=await import('node:fs/promises');const st=await lstat(join(dir,p));if(st.isDirectory())Object.assign(out,await inventory(dir,p));else out[p]=(await readFile(join(dir,p))).toString('base64');}return out;
}
shellTest('new empty ledger gets a root-discoverable five-file handoff without changing Git config',async t=>{
 const f=await fixture(t);f.git('-C',f.ledger,'config','user.name','Existing Author');f.git('-C',f.ledger,'config','user.email','synthetic@example.invalid');
 const config=await readFile(join(f.ledger,'.git/config'));const result=f.run();assert.equal(result.status,0,result.stderr);
 assert.deepEqual(await readFile(join(f.ledger,'.git/config')),config);
 const entry=await readFile(join(f.ledger,'README.md'),'utf8');let links=0;
 for(const match of entry.matchAll(/\]\(([^)]+)\)/g)){links++;assert.ok((await readFile(join(f.ledger,match[1]))).length);}assert.equal(links,3);assert.ok(entry.includes('projects/sample-project/CURRENT_STATE.md'));
 assert.deepEqual(await readFile(join(f.ledger,'docs/PROTOCOL.md')),await readFile(join(source,'PROTOCOL.md')));
 assert.equal(f.git('-C',f.ledger,'status','--porcelain').split('\n').filter(Boolean).length,4);
 const before=await inventory(f.ledger);assert.notEqual(f.run().status,0);assert.deepEqual(await inventory(f.ledger),before);
});
for(const scenario of ['wrong-account','public','unknown','wrong-fetch','wrong-push','rewrite','push-selector','hosting-unavailable']) {
 shellTest(`new setup rejects ${scenario} before any ledger write`,async t=>{
  const f=await fixture(t);
  if(scenario==='wrong-account')f.env.MOCK_OWNER='wrong-owner';
  if(scenario==='public')f.env.MOCK_VISIBILITY='PUBLIC';if(scenario==='unknown')f.env.MOCK_VISIBILITY='UNKNOWN';
  if(scenario==='wrong-fetch')f.git('-C',f.ledger,'remote','set-url','origin','https://github.com/other/repo.git');
  if(scenario==='wrong-push')f.git('-C',f.ledger,'config','--add','remote.origin.pushurl','https://github.com/other/repo.git');
  if(scenario==='rewrite')f.git('-C',f.ledger,'config','url.https://github.com/other/.pushInsteadOf','https://github.com/sample-owner/');
  if(scenario==='push-selector')f.git('-C',f.ledger,'config','remote.pushDefault','other');
  if(scenario==='hosting-unavailable')await writeFile(join(f.base,'bin/gh'),'#!/bin/sh\nexit 1\n',{mode:0o700});
  const before=await inventory(f.ledger);const result=f.run();assert.notEqual(result.status,0);assert.deepEqual(await inventory(f.ledger),before);
 });
}
for(const path of ['.gitattributes','README.md','docs/PROTOCOL.md','projects/sample-project/CURRENT_STATE.md'])shellTest(`existing ${path} is preserved and never treated as a new ledger`,async t=>{
 const f=await fixture(t);await mkdir(join(f.ledger,path,'..'),{recursive:true});await writeFile(join(f.ledger,path),'Existing private synthetic bytes\n');const before=await inventory(f.ledger);assert.notEqual(f.run().status,0);assert.deepEqual(await inventory(f.ledger),before);
});
test('one-line entry and explicit operation boundaries are documented without a Node gate',async()=>{
 for(const name of ['README.md','README.zh-CN.md','ONBOARDING.md']){const s=await readFile(join(source,name),'utf8');assert.match(s,/Set up /);assert.match(s,/```text\nJoin LEDGER_URL\n```/);assert.ok(s.includes('templates/LEDGER-README.md'));}
 const s=await readFile(join(source,'ONBOARDING.md'),'utf8');assert.match(s,/\*\*Migration:\*\*/);assert.match(s,/does not establish the user's intent/);assert.match(s,/not automatic permission/);assert.doesNotMatch(s,/copy that file over it/);
});
shellTest('new setup rejects a clone with other refs even when HEAD is unborn',async t=>{
 const f=await fixture(t);const tree=f.git('-C',f.ledger,'write-tree').trim();
 const commit=f.git('-C',f.ledger,'-c','user.name=Synthetic','-c','user.email=synthetic@example.invalid','commit-tree',tree,'-m','Synthetic existing history').trim();
 f.git('-C',f.ledger,'update-ref','refs/remotes/origin/old',commit);
 const before=await inventory(f.ledger);assert.notEqual(f.run().status,0);assert.deepEqual(await inventory(f.ledger),before);
});
shellTest('documented new-repository command stops before creation if its local path exists',async t=>{
 const f=await fixture(t);const text=await readFile(join(source,'ONBOARDING.md'),'utf8');
 const block=[...text.matchAll(/```sh\n([\s\S]*?)```/g)].map(m=>m[1]).find(x=>x.includes('gh repo create'));
 assert.ok(block);const log=join(f.base,'creation-called');
 await writeFile(join(f.base,'bin/gh'),`#!/bin/sh\nif [ "$1" = api ]; then echo sample-owner; else touch '${log}'; fi\n`,{mode:0o700});
 const script=block.replace('approved_owner=OWNER','approved_owner=sample-owner').replace('approved_repo=LEDGER','approved_repo=ledger');
 const result=spawnSync('sh',['-c',script],{cwd:f.base,env:f.env,encoding:'utf8'});assert.notEqual(result.status,0);assert.ok(!(await readdir(f.base)).includes('creation-called'));
});

shellTest('hosting verification is pinned to github.com even with another GH_HOST',async t=>{
 const f=await fixture(t);f.env.GH_HOST='enterprise.invalid';
 await writeFile(join(f.base,'bin/gh'),'#!/bin/sh\n[ "$GH_HOST" = github.com ] || exit 75\nif [ "$1" = api ]; then printf sample-owner; else printf "sample-owner\\tsample-ledger\\tPRIVATE\\n"; fi\n',{mode:0o700});
 const result=f.run();assert.equal(result.status,0,result.stderr);
});
