#!/usr/bin/env node
/** Multi-format rendering; requires explicit user approval, just like render.mjs. */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

export const PROFILES = Object.freeze({
  youtube: {width:1920,height:1080,fps:30},
  shorts: {width:1080,height:1920,fps:30},
  square: {width:1080,height:1080,fps:30},
});
const args=process.argv.slice(2);
const option=(flag, fallback)=>{const i=args.indexOf(flag);return i<0?fallback:args[i+1];};
if(!args.includes('--approved')){
  console.error('Explicit user approval required: --approved (after Studio review).');
  process.exit(1);
}
const ids=(option('--profiles','youtube')||'').split(',').filter(Boolean);
if(!ids.length||ids.some(id=>!Object.hasOwn(PROFILES,id))) {
  console.error('Unknown profile. Use youtube,shorts,square');process.exit(1);
}
const composition=option('--id','Main');
if(!/^[A-Za-z0-9_-]+$/.test(composition)){console.error('Invalid composition ID');process.exit(1);}
mkdirSync(path.resolve('out/profiles'),{recursive:true});
for(const id of ids){
  const profile=PROFILES[id];
  const file=path.resolve('out/profiles',`${composition}-${id}.mp4`);
  const cli=['remotion','render','src/index.ts',composition,file,
    '--width',String(profile.width),'--height',String(profile.height),
    '--fps',String(profile.fps),'--codec','h264'];
  console.log('Rendering',id,file);
  const result=spawnSync('npx',cli,{stdio:'inherit',shell:process.platform==='win32'});
  if(result.error||result.status!==0) process.exit(result.status||1);
}
