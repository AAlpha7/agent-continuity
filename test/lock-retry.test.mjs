import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Patch built-ins only inside a disposable child, before importing the real
// module. Production exposes no override for platform, clock or lock ownership.
const moduleURL = new URL('../lib/safe-files.mjs', import.meta.url).href;
async function scenario({ platform, errors, timeout = 100, actionError = false }) {
  const script = `
    import fs from 'node:fs/promises';
    import timers from 'node:timers/promises';
    import { syncBuiltinESMExports } from 'node:module';
    const config = ${JSON.stringify({ platform, errors, timeout, actionError })};
    Object.defineProperty(process, 'platform', { value: config.platform });
    const report = { opens: 0, actions: 0, closes: 0, unlinks: 0, flags: [], delays: [] };
    let now = 0;
    Date.now = () => now;
    timers.setTimeout = async ms => { report.delays.push(ms); now += ms; };
    const injected = [];
    fs.open = async (path, flags, mode) => {
      report.opens++; report.flags.push([path, flags, mode]);
      const code = config.errors[Math.min(report.opens - 1, config.errors.length - 1)];
      if (code) { const error = Object.assign(new Error('injected ' + code), { code }); injected.push(error); throw error; }
      return { close: async () => { report.closes++; } };
    };
    fs.unlink = async () => { report.unlinks++; };
    syncBuiltinESMExports();
    const { withFileLock } = await import(${JSON.stringify(moduleURL)});
    try {
      report.result = await withFileLock('synthetic-target', async () => {
        report.actions++;
        if (config.actionError) throw Object.assign(new Error('action failed'), { code: 'ACTION_FAILED' });
        return 'done';
      }, config.timeout);
    } catch (error) {
      report.code = error.code;
      report.originalError = injected.includes(error);
    }
    process.stdout.write(JSON.stringify(report));
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', script], {
    cwd: fileURLToPath(new URL('../', import.meta.url)), windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '', stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const watchdog = setTimeout(() => child.kill(), 5000);
  try {
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject); child.once('close', resolve);
    });
    assert.equal(code, 0, stderr);
    const result = JSON.parse(stdout);
    assert.ok(result.flags.every(([path, flags, mode]) => path === 'synthetic-target.lock' && flags === 'wx' && mode === 0o600));
    assert.ok(result.delays.every(ms => ms === 20));
    return result;
  } finally { clearTimeout(watchdog); }
}

test('L01 Windows transient EPERM retries but executes only after exclusive open', async () => {
  const r = await scenario({ platform: 'win32', errors: ['EPERM', 'EPERM', null] });
  assert.equal(r.opens, 3); assert.equal(r.actions, 1); assert.equal(r.result, 'done');
  assert.equal(r.closes, 1); assert.equal(r.unlinks, 1);
});
test('L02 permanent Windows EPERM expires with original error and never executes or removes lock', async () => {
  const r = await scenario({ platform: 'win32', errors: ['EPERM'], timeout: 30 });
  assert.ok(r.opens >= 2 && r.opens < 10); assert.equal(r.code, 'EPERM'); assert.equal(r.originalError, true);
  assert.equal(r.actions, 0); assert.equal(r.closes, 0); assert.equal(r.unlinks, 0);
});
test('L03 non-Windows EPERM is immediate and does not remove lock', async () => {
  const r = await scenario({ platform: 'linux', errors: ['EPERM'] });
  assert.equal(r.opens, 1); assert.equal(r.code, 'EPERM'); assert.equal(r.originalError, true);
  assert.equal(r.actions, 0); assert.equal(r.unlinks, 0);
});
test('L04 EACCES is never swallowed or retried', async () => {
  const r = await scenario({ platform: 'win32', errors: ['EACCES'] });
  assert.equal(r.opens, 1); assert.equal(r.code, 'EACCES'); assert.equal(r.originalError, true);
  assert.equal(r.actions, 0); assert.equal(r.unlinks, 0);
});
test('L05 existing abandoned lock remains BUSY and is not stolen', async () => {
  const r = await scenario({ platform: 'win32', errors: ['EEXIST'], timeout: 30 });
  assert.ok(r.opens >= 2 && r.opens < 10); assert.equal(r.code, 'BUSY');
  assert.equal(r.actions, 0); assert.equal(r.unlinks, 0);
});
test('L06 action failure after recovered lock still releases only its acquired lock', async () => {
  const r = await scenario({ platform: 'win32', errors: ['EPERM', null], actionError: true });
  assert.equal(r.opens, 2); assert.equal(r.actions, 1); assert.equal(r.code, 'ACTION_FAILED');
  assert.equal(r.closes, 1); assert.equal(r.unlinks, 1);
});
