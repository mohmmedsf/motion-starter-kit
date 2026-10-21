import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const EXTRA_STYLE_IDS = ['isometric-3d','cinematic-documentary','whiteboard-explainer','product-launch'] as const;
export type ExtraStyleId = typeof EXTRA_STYLE_IDS[number];
export const EXTRA_STYLE_LABELS: Record<ExtraStyleId,string> = {
  'isometric-3d':'3D Isometric',
  'cinematic-documentary':'Cinematic Documentary',
  'whiteboard-explainer':'Whiteboard Explainer',
  'product-launch':'Product Launch',
};
const progress=(f:number,fps:number,start:number,duration=0.9)=>
  interpolate(f,[start*fps,(start+duration)*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
const text:React.CSSProperties={fontFamily:'Arial, sans-serif',fontWeight:800};
export const ExtraStyleShowcase:React.FC<{styleId:ExtraStyleId}>=({styleId})=>{
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),time=frame/fps;
  const p=progress(frame,fps,.3),q=progress(frame,fps,1.2);
  if(styleId==='isometric-3d')return <AbsoluteFill style={{background:'radial-gradient(circle at 50% 55%,#193e62,#070f21)',color:'#f5fcff',overflow:'hidden'}}>
    <div style={{position:'absolute',top:100,left:110,fontSize:74,...text}}>BUILD IN DIMENSIONS</div>
    <div style={{position:'absolute',top:240,left:670,width:590,height:580,perspective:1300}}>
      <div style={{position:'absolute',inset:50,transform:`rotateX(56deg) rotateZ(-42deg) scale(${.65+.35*p})`,transformStyle:'preserve-3d'}}>
        {[0,1,2,3].map((i)=><div key={i} style={{position:'absolute',width:240,height:240,left:(i%2)*230,top:Math.floor(i/2)*230,background:['#0c87a1','#356de1','#17b4ac','#9c6de5'][i],border:'12px solid #9be7fa',boxShadow:'18px 25px 0 #081d3d, 28px 38px 35px #0008',transform:`translateZ(${30+q*(i+1)*48}px) translateY(${Math.sin(time+i)*7}px)`,borderRadius:22}}/>)}
      </div>
    </div>
    <div style={{position:'absolute',left:110,bottom:100,fontSize:36,opacity:.8}}>ISOMETRIC LAYERS / CSS 3D</div>
  </AbsoluteFill>;
  if(styleId==='cinematic-documentary')return <AbsoluteFill style={{background:'#0b1014',color:'#f4e9d3',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 70% 45%,#7b4b2760,transparent 58%)',transform:`scale(${1+time*.015})`}}/>
    <div style={{position:'absolute',left:110,top:100,fontSize:28,letterSpacing:9,color:'#cba977'}}>A DOCUMENTARY ORIGINAL</div>
    <div style={{position:'absolute',left:110,top:340,opacity:p,transform:`translateY(${(1-p)*90}px)`}}>
      <div style={{fontSize:120,letterSpacing:-4,...text}}>THE UNTOLD</div>
      <div style={{fontSize:146,letterSpacing:-5,...text,color:'#d6ad75'}}>STORY.</div>
      <div style={{width:900,height:3,background:'#d6ad75',marginTop:30,transformOrigin:'left',transform:`scaleX(${q})`}}/>
    </div>
    <div style={{position:'absolute',bottom:70,left:110,fontSize:27,letterSpacing:4}}>CHAPTER 01  —  THE BEGINNING</div>
    <div style={{position:'absolute',top:0,bottom:0,left:70,width:3,background:'#d6ad7544'}}/>
  </AbsoluteFill>;
  if(styleId==='whiteboard-explainer')return <AbsoluteFill style={{background:'#faf8f1',color:'#202b37',overflow:'hidden'}}>
    <div style={{position:'absolute',left:110,top:95,fontSize:77,...text}}>HOW IDEAS CONNECT</div>
    <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
      <path d="M 520 575 C 650 380 810 380 920 575 S 1190 780 1410 575" fill="none" stroke="#1f6a7b" strokeWidth="13" strokeLinecap="round" strokeDasharray="1200" strokeDashoffset={1200*(1-q)}/>
      {[{x:420,y:575,c:'#f4bb55',label:'IDEA'},{x:960,y:575,c:'#7bd1c3',label:'BUILD'},{x:1470,y:575,c:'#f09d8c',label:'LAUNCH'}].map((n,i)=><g key={i} opacity={progress(frame,fps,.4+i*.55)}><circle cx={n.x} cy={n.y} r={110} fill={n.c} stroke="#263d49" strokeWidth="9"/><text x={n.x} y={n.y+15} textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="35" fill="#202b37">{n.label}</text></g>)}
    </svg>
    <div style={{position:'absolute',bottom:95,left:110,fontSize:30}}>STEP BY STEP · DRAWN WITH SVG</div>
  </AbsoluteFill>;
  return <AbsoluteFill style={{background:'radial-gradient(circle at 50% 42%,#30353d,#080b10 75%)',color:'#fff',overflow:'hidden'}}>
    <div style={{position:'absolute',left:110,top:105,fontSize:28,letterSpacing:8,color:'#c9ced7'}}>INTRODUCING THE NEXT GENERATION</div>
    <div style={{position:'absolute',top:265,left:630,width:660,height:510,perspective:1300}}>
      <div style={{width:600,height:370,borderRadius:50,background:'linear-gradient(135deg,#4b5563,#0b0f18 45%,#a1a1aa)',border:'8px solid #cbd5e1',boxShadow:'0 70px 100px #000c',transform:`rotateY(${-25+25*p}deg) rotateX(${12-12*p}deg) scale(${.65+.35*q})`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{width:160,height:160,borderRadius:100,background:'radial-gradient(circle at 30% 30%,#9ef1ff,#2471aa 55%,#0b234e)',boxShadow:'0 0 65px #54d7ff80'}}/>
      </div>
    </div>
    <div style={{position:'absolute',bottom:145,left:110,fontSize:98,letterSpacing:-4,...text,opacity:p}}>SIMPLY. BETTER.</div>
    <div style={{position:'absolute',bottom:95,left:110,fontSize:25,color:'#b8c1cd'}}>PRODUCT REVEAL / CONCEPT DEMO</div>
  </AbsoluteFill>;
};
