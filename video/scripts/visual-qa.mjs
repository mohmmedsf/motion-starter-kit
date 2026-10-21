#!/usr/bin/env node
/** Screenshot sampling for human QA. Does not pretend to detect text clipping. */
import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';
import {mkdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2);
const option=(name,def)=>{const i=args.indexOf(name);return i<0?def:args[i+1];};
const id=option('--id','MotionEngineDemo');
const count=Number(option('--frames','8'));
if(!/^[A-Za-z0-9_-]+$/.test(id)||!Number.isInteger(count)||count<2||count>100)throw new Error('Invalid id or frames');
const folder=path.resolve('out/qa',id);
await mkdir(folder,{recursive:true});
let serveUrl;
try{
  serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
  const composition=await selectComposition({serveUrl,id});
  const samples=[];
  for(let i=0;i<count;i++){
    const frame=Math.round((composition.durationInFrames-1)*i/(count-1));
    const file=path.join(folder,`frame-${String(i).padStart(3,'0')}.png`);
    await renderStill({serveUrl,composition,frame,output:file,scale:0.5});
    samples.push({frame,seconds:Number((frame/composition.fps).toFixed(3)),file:path.basename(file)});
  }
  await writeFile(path.join(folder,'manifest.json'),JSON.stringify({id,width:composition.width,height:composition.height,fps:composition.fps,samples},null,2));
  console.log(`Created ${samples.length} QA frames in ${folder}`);
}finally{if(serveUrl)await rm(serveUrl,{recursive:true,force:true});}
