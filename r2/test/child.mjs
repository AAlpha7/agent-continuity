import { readFile } from 'node:fs/promises';
import { Controller } from '../controller.mjs';
import { decode } from '../codec.mjs';
const [ledger,control,commandFile,binding='operator',stopAt='']=process.argv.slice(2);
const controller=new Controller(ledger,control,{binding,endpoint:`endpoint-${binding}`,clock:()=>Date.parse('2030-01-01T00:00:00.000Z'),
  checkpoint:async label=>{if(label===stopAt){console.log(`STOP:${label}`);setInterval(()=>{},1000);await new Promise(()=>{});}}});
try {console.log(JSON.stringify(await controller.command(decode(await readFile(commandFile)))));}
catch(error){console.error(JSON.stringify({code:error.code,message:error.message}));process.exitCode=1;}
