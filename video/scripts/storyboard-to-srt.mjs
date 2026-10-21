#!/usr/bin/env node
// Export subtitle cues from the same scene timing used by the production composition.
import fs from 'node:fs';
import path from 'node:path';
const [source,destination='out/subtitles.srt']=process.argv.slice(2);
if(!source)throw new Error('Usage: node scripts/storyboard-to-srt.mjs storyboard.json [output.srt]');
const storyboard=JSON.parse(fs.readFileSync(source,'utf8'));
if(!Array.isArray(storyboard.scenes)||!storyboard.scenes.length)throw new Error('Storyboard must contain scenes');
const stamp=(seconds)=>{
  const ms=Math.round(seconds*1000);
  const h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;
  return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');
};
let elapsed=0;
const cues=storyboard.scenes.map((scene,index)=>{
  const start=elapsed;
  const duration=Number(scene.seconds);
  if(!Number.isFinite(duration)||duration<.5)throw new Error('Invalid duration in scene '+(index+1));
  elapsed+=duration;
  return `${index+1}\n${stamp(start)} --> ${stamp(elapsed)}\n${String(scene.subtitle||scene.title).replace(/\r?\n/g,' ')}\n`;
});
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,cues.join('\n'),'utf8');
console.log('Wrote '+destination);
