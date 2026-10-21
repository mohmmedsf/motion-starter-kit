#!/usr/bin/env node
/** Compare exact binary screenshot hashes; for visual review use the images themselves. */
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
const [a,b,...rest]=process.argv.slice(2);
if(!a||!b||rest.length)throw new Error('Usage: node scripts/compare-frames.mjs before.png after.png');
const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
const x=await hash(a),y=await hash(b);
const result={reference:a,candidate:b,exactMatch:x===y,referenceSha256:x,candidateSha256:y};
console.log(JSON.stringify(result,null,2));
if(process.env.COMPARE_REPORT)await writeFile(process.env.COMPARE_REPORT,JSON.stringify(result,null,2));
process.exitCode=x===y?0:2;
