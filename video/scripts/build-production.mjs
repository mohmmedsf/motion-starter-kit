#!/usr/bin/env node
// Deterministic storyboard builder. No AI claims: each paragraph becomes a scene.
import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);return i>=0?args[i+1]:fallback};
const input=option('--script',null);
if(!input){console.error('Usage: node scripts/build-production.mjs --script script.txt [--output out/storyboard.json] [--words-per-minute 125] [--brand NAME]');process.exit(2)}
const wpm=Number(option('--words-per-minute','125'));
if(!Number.isFinite(wpm)||wpm<=0){throw new Error('words-per-minute must be positive')}
const text=fs.readFileSync(input,'utf8').trim();
if(!text)throw new Error('Script is empty');
const paragraphs=text.split(/\n\s*\n/g).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean);
const styles=['editorial-motion','cinematic-documentary','whiteboard-explainer','data-storytelling','product-launch','isometric-3d'];
const scenes=paragraphs.map((paragraph,i)=>{
  const words=paragraph.split(/\s+/).length;
  const seconds=Math.max(3,Math.round(words/wpm*60*10)/10);
  return {title:paragraph.length>85?paragraph.slice(0,82)+'…':paragraph,subtitle:paragraph,style:styles[i%styles.length],seconds};
});
const output={brand:option('--brand','MOTION STUDIO'),accent:'#ffb454',subtitles:true,scenes};
const destination=option('--output','out/storyboard.json');
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,JSON.stringify(output,null,2)+'\n');
console.log('Wrote '+destination+' with '+scenes.length+' scenes, '+scenes.reduce((n,s)=>n+s.seconds,0).toFixed(1)+' seconds (estimated)');
