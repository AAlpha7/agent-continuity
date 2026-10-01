import { readFile } from 'node:fs/promises';
import { Controller } from './controller.mjs';
import { initialize } from './store.mjs';
import { decode } from './codec.mjs';
import { inspectLedger, reconcileFixture } from './local-files.mjs';

try {
  const [op,...args]=process.argv.slice(2);let result;
  if(op==='init'&&args.length===3) result=await initialize(args[0],args[1],decode(await readFile(args[2])));
  else if(op==='command'&&args.length===5) result=await new Controller(args[0],args[1],{binding:args[2],endpoint:args[3]}).command(decode(await readFile(args[4])));
  else if(op==='status'&&args.length===6) result=await new Controller(args[0],args[1],{binding:args[2],endpoint:args[3]}).status(args[4],args[5]);
  else if(op==='inspect'&&args.length===2) result=await inspectLedger(args[0],args[1]);
  else if(op==='scan-local-inbox'&&args.length===1) result=await reconcileFixture(args[0]);
  else throw Object.assign(new Error('Usage: init LEDGER NEW_CONTROL CANONICAL_POLICY | command LEDGER CONTROL LOCAL_BINDING ENDPOINT CANONICAL_COMMAND | status LEDGER CONTROL LOCAL_BINDING ENDPOINT EXCHANGE RECIPIENT | inspect LEDGER PROJECT | scan-local-inbox DIRECTORY'),{code:'USAGE'});
  console.log(JSON.stringify(result,null,2));
} catch(error) {
  console.error(JSON.stringify({ok:false,code:error.code||'ERROR',message:error.message}));process.exitCode=1;
}
