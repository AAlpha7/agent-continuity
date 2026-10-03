import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Minimal examples inspect the account before creation and every destination before handoff writes or push',async()=>{
  for(const path of ['README.md','README.zh-CN.md','ONBOARDING.md']) {
    const text=await read(path);
    const block=[...text.matchAll(/```sh\r?\n([\s\S]*?)```/g)].map(m=>m[1]).find(b=>b.includes('gh repo create'));
    assert.ok(block,`${path}: missing Setup command block`);
    const position=command=>{const at=block.indexOf(command);assert.ok(at>=0,`${path}: missing ${command}`);return at;};
    assert.ok(position('gh api user')<position('gh repo create'),path);
    const checks=['gh repo view --json url,visibility','git remote get-url --all origin','git remote get-url --push --all origin'];
    for(const check of checks) {
      assert.ok(position(check)<position('mkdir -p docs projects/PROJECT'),`${path}: ${check} must precede ledger directory setup`);
      assert.ok(position(check)<position('cp /path/to/inspected-toolkit/.gitattributes'),`${path}: ${check} must precede real-data setup`);
      assert.ok(position(check)<position('git push -u origin HEAD'),`${path}: ${check} must precede publication`);
    }
    assert.match(block,/# Stop unless owner, private visibility and ALL effective URLs match approval\./);
    assert.ok(position('cp /path/to/inspected-toolkit/PROTOCOL.md docs/PROTOCOL.md')<position('git add'),path);
    assert.ok(position('cp /path/to/inspected-toolkit/templates/HOW_WE_COORDINATE.md docs/HOW_WE_COORDINATE.md')<position('git add'),path);
    assert.match(block,/git add \.gitattributes docs\/PROTOCOL\.md docs\/HOW_WE_COORDINATE\.md projects\/PROJECT\/CURRENT_STATE\.md/);
  }
});

test('Minimal onboarding keeps Node and distribution outside completion requirements and does not select the historical release',async()=>{
  const onboarding=await read('ONBOARDING.md');
  const minimal=onboarding.slice(onboarding.indexOf('## 2. Minimal:'),onboarding.indexOf('## Optional checks'));
  assert.ok(minimal.length>0);
  assert.doesNotMatch(minimal,/^\s*(?:node|npm|npx)\s/m);
  assert.match(onboarding,/Node\.js is not required\./);
  assert.doesNotMatch(onboarding,/Use the inspected `v0\.1\.0-rc\.3` release/);
  assert.match(onboarding,/exact toolkit commit you inspected/);
  const joinBlocks=[...minimal.matchAll(/```text\r?\n([\s\S]*?)```/g)].map(m=>m[1]).filter(b=>b.startsWith('Join our continuity ledger.'));
  assert.equal(joinBlocks.length,2,'Minimal onboarding must provide remote and local Join prompts');
  for(const block of joinBlocks) {
    const handoff=block.indexOf('projects/PROJECT/CURRENT_STATE.md');
    assert.ok(handoff>=0,'Join must identify the project handoff');
    for(const path of ['docs/HOW_WE_COORDINATE.md','docs/PROTOCOL.md']) {
      const at=block.indexOf(path);
      assert.ok(at>=0&&at<handoff,`Join must read ${path} before the handoff`);
    }
    assert.match(block,/Follow that protocol\./);
    assert.match(block,/Do not clone the public toolkit\./);
  }
  const distribution=await read('r2/DISTRIBUTION.md');
  assert.match(distribution,/\*\*Optional tooling only\.\*\*/);
  assert.doesNotMatch(distribution,/Before calling an adopter ledger ready/);
});
