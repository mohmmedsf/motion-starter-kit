import React from 'react';
import {AbsoluteFill,Easing,interpolate,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';

// 30-second Tajweed explainer, built with the same animated SVG drawing
// technique as Style-whiteboard-explainer, not a pre-rendered slideshow.
const chapters=[
  {heading:'ما هو التجويد؟',detail:'إعطاء كل حرف حقه ومستحقه',symbol:'book'},
  {heading:'الاستعاذة',detail:'أعوذ بالله من الشيطان الرجيم',symbol:'shield'},
  {heading:'البسملة',detail:'بسم الله الرحمن الرحيم',symbol:'sun'},
  {heading:'مخارج الحروف',detail:'نتعلم من أين يخرج كل حرف',symbol:'voice'},
  {heading:'التطبيق العملي',detail:'اسمع · كرر · صحح تلاوتك',symbol:'check'},
] as const;
const shape=(symbol:string)=> {
  if(symbol==='book')return <><path d="M-170 -100 Q-80 -135 0 -70 Q80 -135 170 -100 V105 Q80 65 0 125 Q-80 65 -170 105 Z"/><path d="M0 -70 V125"/></>;
  if(symbol==='shield')return <path d="M0 -145 L145 -95 V10 Q130 105 0 155 Q-130 105 -145 10 V-95 Z"/>;
  if(symbol==='sun')return <><circle r="85"/>{Array.from({length:8},(_,i)=><path key={i} d="M0 -120 V-155" transform={`rotate(${i*45})`}/>)}</>;
  if(symbol==='voice')return <><path d="M-100 -60 Q-20 -155 75 -65 Q125 -10 80 55 Q0 145 -95 55"/><path d="M-35 -50 Q20 -75 40 -15 Q55 35 0 65"/></>;
  return <path d="M-145 0 L-35 105 L155 -120"/>;
};
const Chapter:React.FC<{index:number}>=({index})=>{
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
  const ease=(start:number,end:number)=>interpolate(t,[start,end],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
  const entry=ease(.15,1),draw=ease(.55,3.3),line=ease(2.8,4.1);
  const c=chapters[index];
  return <AbsoluteFill style={{background:'#faf8f1',color:'#213545',fontFamily:'Tahoma,Arial,sans-serif',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:32,border:'3px solid #e2dfd3',borderRadius:30}}/>
    <div style={{position:'absolute',top:60,right:95,fontSize:34,color:'#167c83',fontWeight:700}}>رحلة التجويد</div>
    <div style={{position:'absolute',top:115,left:95,right:95,height:5,background:'#e4e0d5',borderRadius:9}}>
      <div style={{width:`${(index+t/6)/5*100}%`,height:'100%',background:'#167c83',borderRadius:9}}/>
    </div>
    <div dir="rtl" style={{position:'absolute',top:175,right:120,left:120,textAlign:'center',fontSize:92,fontWeight:900,opacity:entry,transform:`translateY(${(1-entry)*45}px)`}}>{c.heading}</div>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
      <g transform="translate(960 590)" fill="none" stroke="#177e87" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1400" strokeDashoffset={1400*(1-draw)}>{shape(c.symbol)}</g>
      <path d="M580 825 H1340" stroke="#e4a84f" strokeWidth="9" strokeLinecap="round" strokeDasharray="760" strokeDashoffset={760*(1-line)}/>
    </svg>
    <div dir="rtl" style={{position:'absolute',bottom:125,right:140,left:140,textAlign:'center',fontSize:59,fontWeight:700,opacity:line,lineHeight:1.45}}>{c.detail}</div>
    <div style={{position:'absolute',bottom:53,left:85,fontSize:24,color:'#8d9699'}}>WHITEBOARD EXPLAINER / TAJWEED</div>
    <div style={{position:'absolute',bottom:53,right:85,fontSize:27,color:'#8d9699'}}>{String(index+1).padStart(2,'0')} / 05</div>
  </AbsoluteFill>;
};
export const TajweedWhiteboard30:React.FC=()=> <AbsoluteFill>
  {chapters.map((_,i)=><Sequence key={i} from={i*180} durationInFrames={180}><Chapter index={i}/></Sequence>)}
</AbsoluteFill>;
