import type {ProductionProps,ProductionScene} from './ProductionVideo';
import {STYLE_IDS,EXTRA_STYLE_IDS} from '../styles';

export type CaptionCue={start:number;end:number;text:string};
export type ProductionManifest=ProductionProps & {captions?:CaptionCue[]};
const allowed=new Set<string>([...STYLE_IDS,...EXTRA_STYLE_IDS]);
export const validateManifest=(value:unknown):ProductionManifest=>{
  if(!value||typeof value!=='object')throw Error('Manifest must be an object');
  const obj=value as Record<string,unknown>;
  if(!Array.isArray(obj.scenes)||obj.scenes.length===0||obj.scenes.length>100)throw Error('Provide 1-100 scenes');
  const scenes:ProductionScene[]=obj.scenes.map((raw,index)=>{
    if(!raw||typeof raw!=='object')throw Error(`Scene ${index} is invalid`);
    const s=raw as Record<string,unknown>;
    if(typeof s.title!=='string'||!s.title.trim()||s.title.length>500)throw Error(`Scene ${index} needs a title (max 500 chars)`);
    if(typeof s.style!=='string'||!allowed.has(s.style))throw Error(`Scene ${index} has unknown style`);
    if(typeof s.seconds!=='number'||!Number.isFinite(s.seconds)||s.seconds<.5||s.seconds>120)throw Error(`Scene ${index} duration must be .5-120 seconds`);
    if(s.subtitle!==undefined&&(typeof s.subtitle!=='string'||s.subtitle.length>1000))throw Error(`Scene ${index} subtitle is invalid`);
    return {title:s.title,style:s.style as ProductionScene['style'],seconds:s.seconds,...(typeof s.subtitle==='string'?{subtitle:s.subtitle}:{})};
  });
  const duration=scenes.reduce((n,s)=>n+s.seconds,0);
  const captions:Array<CaptionCue>=Array.isArray(obj.captions)?obj.captions.map((raw,index)=>{
    if(!raw||typeof raw!=='object')throw Error(`Caption ${index} is invalid`);
    const c=raw as Record<string,unknown>;
    if(typeof c.start!=='number'||typeof c.end!=='number'||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start||c.end>duration+.05||typeof c.text!=='string'||!c.text.trim())throw Error(`Caption ${index} has invalid timing/text`);
    return {start:c.start,end:c.end,text:c.text};
  }):[];
  const brand=typeof obj.brand==='string'?obj.brand:'MOTION STUDIO';
  const accent=typeof obj.accent==='string'&&/^#[0-9a-fA-F]{6}$/.test(obj.accent)?obj.accent:'#ffb454';
  const voiceover=typeof obj.voiceover==='string'&&/^[\w./-]+\.(wav|mp3|m4a)$/i.test(obj.voiceover)&&!obj.voiceover.includes('..')?obj.voiceover:undefined;
  return {scenes,brand,accent,voiceover,subtitles:obj.subtitles!==false,captions};
};
