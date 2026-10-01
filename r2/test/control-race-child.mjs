import { readFile } from 'node:fs/promises';
import { Controller } from '../controller.mjs';
import { decode } from '../codec.mjs';
const [ledger,control,input,pause='']=process.argv.slice(2);
const controller=new Controller(ledger,control,{binding:'worker',endpoint:'endpoint-worker',clock:()=>Date.parse('2030-01-01T00:00:00.000Z'),lockTimeoutMs:3000,
  checkpoint:async label=>{if(label===pause){console.log('HELD');await new Promise(resolve=>process.stdin.once('data',resolve));}}});
try {console.log(JSON.stringify(await controller.command(decode(await readFile(input)))));}
catch(error){console.error(JSON.stringify({code:error.code,message:error.message}));process.exitCode=1;}
finally {process.stdin.destroy();}
