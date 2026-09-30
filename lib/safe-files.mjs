import { lstat, mkdir, open, readFile, rename, link, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

export function fault(code, message) {
  return Object.assign(new Error(message), { code });
}

// Never replace malformed byte sequences with U+FFFD. Keep a real BOM as data.
export function decodeUtf8(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { throw fault('CORRUPT', 'invalid UTF-8; original bytes preserved'); }
}

export function utf8Bytes(value) {
  if (typeof value === 'string' && !value.isWellFormed()) throw fault('INVALID', 'unpaired UTF-16 surrogate');
  const bytes = Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(value, 'utf8');
  decodeUtf8(bytes);
  return bytes;
}

export function parseJsonBytes(bytes) {
  try { return JSON.parse(decodeUtf8(bytes)); }
  catch (error) {
    if (error instanceof SyntaxError) throw fault('CORRUPT', 'invalid JSON; original bytes preserved');
    throw error;
  }
}

export async function regularFile(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
    throw fault('UNSAFE_PATH', 'expected an unlinked regular file');
  }
}

// All writers must cooperate. Never steal a lock based on age or PID alone.
export async function withFileLock(path, action, timeoutMs = 5000) {
  const lock = `${path}.lock`;
  const deadline = Date.now() + timeoutMs;
  let handle;
  while (!handle) {
    try { handle = await open(lock, 'wx', 0o600); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) throw fault('BUSY', 'writer lock busy; inspect before recovery');
      await delay(20);
    }
  }
  try { return await action(); }
  finally { await handle.close(); await unlink(lock); }
}

export async function readJson(path, missing) {
  try {
    await regularFile(path);
    return parseJsonBytes(await readFile(path));
  } catch (error) {
    if (error.code === 'ENOENT') return missing;
    if (error instanceof SyntaxError) throw fault('CORRUPT', 'invalid JSON; original preserved');
    throw error;
  }
}

// Same-directory temporary + rename for replacement; hard link for atomic
// no-clobber publication. Unsupported filesystems fail closed (no wx fallback).
export async function atomicWrite(path, text, exclusive = false) {
  const bytes = utf8Bytes(text);
  const temporary = join(dirname(path), `.pending-${randomUUID()}`);
  const handle = await open(temporary, 'wx', 0o600);
  try {
    try { await handle.writeFile(bytes); await handle.sync(); }
    finally { await handle.close(); }
    if (exclusive) await link(temporary, path);
    else await rename(temporary, path);
  } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
  if (!bytes.equals(await readFile(path))) throw fault('VERIFY_FAILED', 'full readback mismatch');
}

export async function projectDirectory(root, project) {
  if (typeof project !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(project)) {
    throw fault('INVALID', 'invalid project');
  }
  const base = resolve(root);
  for (const path of [base, join(base, 'projects'), join(base, 'projects', project)]) {
    const stat = await lstat(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw fault('UNSAFE_PATH', 'project directory must not be a link');
  }
  await regularFile(join(base, 'projects', project, 'CURRENT_STATE.md'));
  return join(base, 'projects', project);
}

export async function receiptDirectory(root, project) {
  const dir = join(await projectDirectory(root, project), 'receipts');
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const stat = await lstat(dir);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw fault('UNSAFE_PATH', 'receipt directory must not be a link');
  return dir;
}
