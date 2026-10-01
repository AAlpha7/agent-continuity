import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const moduleURL = new URL('../lib/safe-files.mjs', import.meta.url).href;
function scenario(platform, errors, exclusive = false) {
  const script = `
    import fs from 'node:fs/promises';
    import timers from 'node:timers/promises';
    import { syncBuiltinESMExports } from 'node:module';
    const config = ${JSON.stringify({ platform, errors, exclusive })};
    Object.defineProperty(process, 'platform', { value: config.platform });
    let now = 0, ownedTemporary;
    const report = { renames: 0, links: 0, writes: 0, syncs: 0, closes: 0, unlinks: [], delays: [], verified: 0 };
    const injected = [];
    Date.now = () => now;
    timers.setTimeout = async ms => { report.delays.push(ms); now += ms; };
    fs.open = async (path, flags, mode) => {
      if (flags !== 'wx' || mode !== 0o600) throw new Error('lost exclusive temporary');
      ownedTemporary = path;
      return { writeFile: async bytes => { report.writes++; }, sync: async () => { report.syncs++; }, close: async () => { report.closes++; } };
    };
    fs.rename = async (source, target) => {
      if (source !== ownedTemporary || target !== 'synthetic-target') throw new Error('changed replacement paths');
      report.renames++;
      const code = config.errors[Math.min(report.renames - 1, config.errors.length - 1)];
      if (code) { const e = Object.assign(new Error('injected ' + code), { code }); injected.push(e); throw e; }
    };
    fs.link = async (source, target) => { report.links++; throw Object.assign(new Error('target exists'), { code: 'EEXIST' }); };
    fs.unlink = async path => { if (path !== ownedTemporary) throw new Error('attempted to remove target'); report.unlinks.push('owned-temporary'); };
    fs.readFile = async path => { report.verified++; return Buffer.from('preserved synthetic bytes\\r\\n'); };
    syncBuiltinESMExports();
    const { atomicWrite } = await import(${JSON.stringify(moduleURL)});
    try { await atomicWrite('synthetic-target', 'preserved synthetic bytes\\r\\n', config.exclusive); report.ok = true; }
    catch (error) { report.code = error.code; report.originalError = injected.includes(error); }
    process.stdout.write(JSON.stringify(report));
  `;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], { windowsHide: true, encoding: 'utf8', timeout: 5000 });
  assert.equal(child.status, 0, child.stderr);
  const r = JSON.parse(child.stdout);
  assert.equal(r.writes, 1); assert.equal(r.syncs, 1); assert.equal(r.closes, 1);
  assert.deepEqual(r.unlinks, ['owned-temporary']);
  assert.ok(r.delays.every(ms => ms === 20));
  return r;
}
test('W01 transient Windows replacement EPERM retries the same durable temporary and verifies bytes', () => {
  const r = scenario('win32', ['EPERM', 'EPERM', null]);
  assert.equal(r.ok, true); assert.equal(r.renames, 3); assert.equal(r.links, 0); assert.equal(r.verified, 1);
});
test('W02 permanent replacement EPERM preserves its error and never deletes the target', () => {
  const r = scenario('win32', ['EPERM']);
  assert.equal(r.code, 'EPERM'); assert.equal(r.originalError, true); assert.equal(r.renames, 251);
  assert.equal(r.links, 0); assert.equal(r.verified, 0);
});
test('W03 other-platform EPERM and Windows EACCES remain immediate failures', () => {
  for (const [platform, code] of [['linux', 'EPERM'], ['win32', 'EACCES']]) {
    const r = scenario(platform, [code]);
    assert.equal(r.code, code); assert.equal(r.originalError, true); assert.equal(r.renames, 1); assert.equal(r.verified, 0);
  }
});
test('W04 immutable publication remains no-clobber link without rename fallback', () => {
  const r = scenario('win32', [null], true);
  assert.equal(r.code, 'EEXIST'); assert.equal(r.links, 1); assert.equal(r.renames, 0); assert.equal(r.verified, 0);
});
