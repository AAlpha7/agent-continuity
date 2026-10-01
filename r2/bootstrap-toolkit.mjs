// Standalone, local-only extraction. Review this file before executing it.
// No imported package code is run, no network/Git/settings/credentials are used.
import { readFile,writeFile,mkdir,lstat,realpath } from 'node:fs/promises';
import { resolve,relative,isAbsolute,dirname,join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const digest=(algorithm,bytes)=>createHash(algorithm).update(bytes).digest('hex');
const fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const check=(ok,code,message)=>{if(!ok)fail(code,message);};
const within=(parent,child)=>{const r=relative(parent,child);return r===''||r!=='..'&&!r.startsWith('../')&&!r.startsWith('..\\')&&!isAbsolute(r);};
const keys=(v,names)=>check(v&&Object.getPrototypeOf(v)===Object.prototype&&Object.keys(v).length===names.length&&names.every(n=>Object.hasOwn(v,n)),'PACKAGE','Unexpected package fields');
export function verifyPackage(bytes,expectedSha256) {
  check(Buffer.isBuffer(bytes)&&bytes.length<=16*1024*1024,'PACKAGE','Package exceeds byte bound');
  check(typeof expectedSha256==='string'&&/^[a-f0-9]{64}$/.test(expectedSha256)&&digest('sha256',bytes)===expectedSha256,'DIGEST','Package does not match independently selected distribution digest');
  let p;try{p=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('PACKAGE','Invalid UTF-8/JSON package');}
  keys(p,['format','source_commit','source_tree','files']);
  check(p.format==='continuity-toolkit-source-v1'&&/^[a-f0-9]{40}$/.test(p.source_commit)&&/^[a-f0-9]{40}$/.test(p.source_tree)&&Array.isArray(p.files)&&p.files.length>0&&p.files.length<=250,'PACKAGE','Invalid source manifest');
  const seen=new Set(),files=[];
  for(const row of p.files) {
    keys(row,['path','mode','bytes','sha256','git_blob_sha','base64']);
    check(typeof row.path==='string'&&row.path.length<=240&&/^[A-Za-z0-9._/-]+$/.test(row.path)&&!row.path.startsWith('/')&&!row.path.endsWith('/'),'PATH','Unsafe package path');
    const parts=row.path.split('/');
    check(parts.every(s=>s!==''&&s!=='.'&&s!=='..'&&!s.endsWith('.')&&!/^\.git$/i.test(s)&&!/^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(s)),'PATH','Unsafe/reserved package path');
    const lower=row.path.toLowerCase();check(!seen.has(lower),'PATH','Duplicate/case-colliding package path');seen.add(lower);
    check(row.mode==='100644'&&Number.isSafeInteger(row.bytes)&&row.bytes>=0&&row.bytes<=2*1024*1024&&typeof row.base64==='string','PACKAGE','Only bounded regular source files supported');
    const b=Buffer.from(row.base64,'base64');check(b.toString('base64')===row.base64&&b.length===row.bytes&&digest('sha256',b)===row.sha256&&digest('sha1',Buffer.concat([Buffer.from(`blob ${b.length}\0`),b]))===row.git_blob_sha,'DIGEST','Source file bytes differ from manifest');
    files.push({path:row.path,bytes:b});
  }
  for(const f of files)for(const part of f.path.split('/').slice(0,-1).map((_,i)=>f.path.split('/').slice(0,i+1).join('/').toLowerCase()))check(!seen.has(part),'PATH','File/directory collision');
  for(const required of ['LICENSE','package.json','ONBOARDING.md','GUIDE.md','RECEIPT-SCHEMA.md','PROTOCOL.md','scripts/agent-receipt.mjs','scripts/build-continuity-snapshot.mjs'])check(seen.has(required.toLowerCase()),'PACKAGE',`Missing onboarding dependency: ${required}`);
  return {source_commit:p.source_commit,source_tree:p.source_tree,files};
}
export async function bootstrap(ledgerRoot,newToolkitRoot,expectedSha256) {
  const ledger=resolve(ledgerRoot),dest=resolve(newToolkitRoot),directory=join(ledger,'.continuity');
  for(const path of [ledger,directory,dirname(dest)]) {
    const stat=await lstat(path);check(stat.isDirectory()&&!stat.isSymbolicLink()&&await realpath(path)===path,'PATH','Expected explicit real directory without aliases');
  }
  check(!within(ledger,dest),'PATH','Toolkit destination must be outside the ledger');
  const pack=join(directory,'toolkit-pack.json'),stat=await lstat(pack);
  check(stat.isFile()&&!stat.isSymbolicLink()&&stat.nlink===1,'PATH','Package must be an unlinked regular file');
  const verified=verifyPackage(await readFile(pack),expectedSha256);
  // Validate the entire package before creating even the destination directory.
  // mkdir without recursive refuses existing destinations rather than merging.
  await mkdir(dest,{mode:0o700});
  for(const file of verified.files) {
    const target=join(dest,...file.path.split('/'));await mkdir(dirname(target),{recursive:true});
    await writeFile(target,file.bytes,{flag:'wx',mode:0o600});
    check((await readFile(target)).equals(file.bytes),'VERIFY','Extracted file readback differs');
  }
  return {toolkit_root:dest,source_commit:verified.source_commit,source_tree:verified.source_tree,files_verified:verified.files.length,package_sha256:expectedSha256,
    git_history_included:false,package_code_executed:false,network_used:false,authority:'source provenance is a distributor assertion; hashes are byte integrity, not identity'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const args=process.argv.slice(2);check(args.length===3,'USAGE','node bootstrap-toolkit.mjs LEDGER NEW_TOOLKIT_DIRECTORY EXPECTED_PACKAGE_SHA256');console.log(JSON.stringify(await bootstrap(...args),null,2));}
  catch(error){console.error(JSON.stringify({ok:false,code:error.code||'ERROR',message:error.message}));process.exitCode=1;}
}
