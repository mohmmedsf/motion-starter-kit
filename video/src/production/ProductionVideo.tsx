import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {STYLE_PALETTES} from '../styles';
import type {StyleId, ExtraStyleId} from '../styles';

import type {CaptionCue} from './manifest';
export type ProductionScene={title:string;subtitle?:string;style:StyleId|ExtraStyleId;seconds:number};
export type ProductionProps={
  scenes:ProductionScene[];
  brand?:string;
  accent?:string;
  voiceover?:string;
  subtitles?:boolean;
  captions?:CaptionCue[];
};
export const DEFAULT_PRODUCTION:ProductionProps={
  brand:'MOTION STUDIO',
  accent:'#ffb454',
  subtitles:true,
  scenes:[
    {title:'من الفكرة إلى الفيديو',subtitle:'قوالب متحركة جاهزة للتخصيص',style:'editorial-motion',seconds:4},
    {title:'احكِ قصتك بصورة أقوى',subtitle:'حركة وتصميم ومحتوى باللغة العربية',style:'cinematic-documentary',seconds:5},
    {title:'ابدأ الآن',subtitle:'أضف النص والصوت وهوية مشروعك',style:'product-launch',seconds:4},
  ],
};
export const getProductionDuration=(scenes:ProductionScene[],fps:number)=>
  Math.max(1,Math.round(scenes.reduce((sum,s)=>sum+Math.max(.5,s.seconds),0)*fps));
export const ProductionVideo:React.FC<ProductionProps>=({scenes,brand='MOTION STUDIO',accent='#ffb454',voiceover,subtitles=true,captions=[]})=>{
  const frame=useCurrentFrame(),{fps}=useVideoConfig();
  let offset=0;
  return <AbsoluteFill style={{background:'#090d16',fontFamily:'Arial, Tahoma, sans-serif'}}>
    {voiceover?<Audio src={staticFile(voiceover)}/>:null}
    {scenes.map((scene,index)=>{
      const start=offset;
      const frames=Math.max(1,Math.round(Math.max(.5,scene.seconds)*fps));
      offset+=frames;
      const hasCaption= captions.some(c=>c.start< (start+frames)/fps && c.end>start/fps);
      const distinctSubtitle=scene.subtitle?.trim() && scene.subtitle.trim()!==scene.title.trim() && !hasCaption;
      const colors=STYLE_PALETTES[scene.style as StyleId];
      const background=colors?.bg || '#101d29';
      return <Sequence key={index} from={start} durationInFrames={frames}>
        <AbsoluteFill>
          <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 35%,#244354,${background} 75%)`}}/>
          <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}} aria-hidden="true"><path d="M250 620 C540 350 820 780 1130 500 S1530 330 1690 590" stroke={accent} strokeWidth="11" strokeLinecap="round" fill="none" strokeDasharray="2200" strokeDashoffset={2200*Math.max(0,1-Math.min(1,(frame-start)/(fps*2.2)))}/><circle cx="1500" cy="380" r="125" stroke={accent} strokeWidth="9" fill="none" opacity="0.35"/></svg>
          <AbsoluteFill style={{background:'linear-gradient(0deg,rgba(0,0,0,.87),rgba(0,0,0,0) 62%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:38,left:65,padding:'12px 22px',background:'#0009',borderLeft:`6px solid ${accent}`,color:'#fff',fontSize:25,letterSpacing:2}}>{brand}</div>
          <div dir="rtl" style={{position:'absolute',right:100,left:100,bottom:distinctSubtitle?230:160,color:'#fff',fontSize:74,fontWeight:900,textAlign:'center',textShadow:'0 6px 18px #000',lineHeight:1.4}}>{scene.title}</div>
          {subtitles&&distinctSubtitle?<div dir="rtl" style={{position:'absolute',bottom:58,left:230,right:230,textAlign:'center',background:'#000b',borderRadius:20,padding:'17px 30px',color:'#ffffff',fontSize:39,lineHeight:1.35}}>{scene.subtitle}</div>:null}
        </AbsoluteFill>
      </Sequence>;
    })}
    {subtitles&&captions.filter(c=>frame>=Math.round(c.start*fps)&&frame<Math.round(c.end*fps)).map((c,i)=>
      <div key={i} dir="rtl" style={{position:'absolute',bottom:45,left:170,right:170,textAlign:'center',color:'#fff',fontSize:45,fontWeight:700,textShadow:'0 3px 8px #000',background:'#000b',padding:'14px 25px',borderRadius:16}}>{c.text}</div>)}
    <div style={{position:'absolute',bottom:0,left:0,height:6,background:accent,width:`${interpolate(frame,[0,Math.max(1,getProductionDuration(scenes,fps)-1)],[0,100],{extrapolateRight:'clamp'})}%`}}/>
  </AbsoluteFill>;
};
