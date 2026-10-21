#!/usr/bin/env node
/** Measure the duration of a real still-render batch; not a synthetic benchmark. */
import {spawnSync} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
const args=process.argv.slice(2);
const id=args[0]||'MotionEngineDemo';
if(!/^[A-Za-z0-9_-]+$/.test(id))throw new Error('Invalid composition');
const started=performance.now();
const result=spawnSync('node',['scripts/visual-qa.mjs','--id',id,'--frames','6'],{
  cwd:process.cwd(),stdio:'inherit',
});
const seconds=Number(((performance.now()-started)/1000).toFixed(2));
await mkdir('out/qa',{recursive:true});
const report={composition:id,seconds,frames:6,passed:result.status===0&&!result.error,
  node:process.version,platform:process.platform,arch:process.arch,
  note:'Includes bundle and render overhead; compare only on the same machine and environment.'};
await writeFile('out/qa/performance.json',JSON.stringify(report,null,2));
console.log(report);
if(!report.passed)process.exitCode=result.status||1;
