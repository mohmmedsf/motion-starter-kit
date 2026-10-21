import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticText } from '../motion/KineticText';
import { WhiteboardPath } from '../motion/WhiteboardPath';

export const STYLE_IDS = ['glass-motion', 'editorial-motion', 'paper-cutout', 'exploded-view',
  'data-storytelling', 'ui-walkthrough', 'timeline-documentary', 'network-visualization'] as const;
export type StyleId = typeof STYLE_IDS[number];
export const STYLE_LABELS: Record<StyleId, string> = {
  'glass-motion': 'Glass Motion', 'editorial-motion': 'Editorial Motion',
  'paper-cutout': 'Paper Cutout', 'exploded-view': 'Exploded View',
  'data-storytelling': 'Data Storytelling', 'ui-walkthrough': 'UI Walkthrough',
  'timeline-documentary': 'Timeline Documentary', 'network-visualization': 'Network Visualization',
};
export const STYLE_PALETTES: Record<StyleId, {bg: string; fg: string; accent: string}> = {
  'glass-motion': {bg:'#101e43',fg:'#f7fbff',accent:'#61e4ee'},
  'editorial-motion': {bg:'#f5f0e8',fg:'#171717',accent:'#ff573d'},
  'paper-cutout': {bg:'#fbefd8',fg:'#213c37',accent:'#e86e54'},
  'exploded-view': {bg:'#0f172a',fg:'#e2e8f0',accent:'#38bdf8'},
  'data-storytelling': {bg:'#111827',fg:'#f9fafb',accent:'#a3e635'},
  'ui-walkthrough': {bg:'#edf4ff',fg:'#152647',accent:'#2563eb'},
  'timeline-documentary': {bg:'#f6f2e9',fg:'#262626',accent:'#c2410c'},
  'network-visualization': {bg:'#0b1120',fg:'#e2e8f0',accent:'#22d3ee'},
};

const card: React.CSSProperties = {borderRadius:28,padding:36,boxSizing:'border-box'};
const ease = (frame:number, fps:number, at:number, duration=0.9) =>
  interpolate(frame,[at*fps,(at+duration)*fps],[0,1],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});
const slide = (p:number, x=80):React.CSSProperties=>({opacity:p,transform:`translateY(${(1-p)*x}px)`});

export const StyleShowcase: React.FC<{styleId:StyleId}> = ({styleId}) => {
  const frame=useCurrentFrame(),{fps}=useVideoConfig();
  const t=frame/fps,p=ease(frame,fps,0.3),q=ease(frame,fps,1.4);
  const palette=STYLE_PALETTES[styleId];
  const item:React.CSSProperties={color:palette.fg,fontFamily:'sans-serif'};
  const heading=<div style={{position:'absolute',right:105,top:80,width:1100,zIndex:3}}>
    <div style={{fontSize:25,letterSpacing:3,color:palette.accent}}>MOTION STARTER KIT / 03</div>
    <KineticText text={STYLE_LABELS[styleId]} direction="ltr" fontSize={82} color={palette.fg}/>
  </div>;
  let visual:React.ReactNode=null;
  switch(styleId){
    case 'glass-motion':
      visual=<div style={{position:'absolute',top:320,left:320,width:1280,height:580,display:'flex',gap:35,alignItems:'center',justifyContent:'center'}}>
        {[0,1,2].map(i=><div key={i} style={{...card,width:320,height:370,background:'rgba(255,255,255,.11)',border:'1px solid rgba(255,255,255,.4)',boxShadow:'0 30px 70px #0005',backdropFilter:'blur(16px)',...slide(ease(frame,fps,.5+i*.24),60),transform:`translateY(${(1-ease(frame,fps,.5+i*.24))*70+Math.sin(t*1.3+i)*9}px)`}}>
          <div style={{width:65,height:65,borderRadius:18,background:palette.accent,opacity:.9}}/>
          <div style={{fontSize:42,marginTop:40,...item}}>0{i+1}</div>
          <div style={{height:10,width:'80%',background:'#ffffff88',borderRadius:6,marginTop:40}}/>
          <div style={{height:10,width:'55%',background:'#ffffff66',borderRadius:6,marginTop:22}}/>
        </div>)}
      </div>;break;
    case 'editorial-motion':
      visual=<div style={{position:'absolute',left:120,top:350,width:1660,...slide(p)}}>
        <div style={{fontSize:200,fontWeight:900,lineHeight:.9,letterSpacing:-12,...item}}>MAKE IT</div>
        <div style={{fontSize:210,fontWeight:900,lineHeight:1,color:palette.accent,transform:`translateX(${(1-q)*-240}px)`}}>MOVE.</div>
        <div style={{height:8,width:1300,background:palette.fg,marginTop:30}}/>
      </div>;break;
    case 'paper-cutout':
      visual=<div style={{position:'absolute',left:510,top:270,width:900,height:650}}>
        {[0,1,2,3,4].map(i=><div key={i} style={{position:'absolute',left:i*52,top:i*35,width:650-i*40,height:500-i*45,background:['#e86e54','#f6b960','#8bb8a4','#406d69','#e9ddbc'][i],borderRadius:'45% 55% 45% 50%',boxShadow:'16px 20px 24px #3324',transform:`rotate(${(i-2)*9}deg) translateY(${(1-ease(frame,fps,.3+i*.25))*-120+Math.sin(t+i)*6}px)`}} />)}
      </div>;break;
    case 'exploded-view':
      visual=<div style={{position:'absolute',left:300,top:360,width:1400,height:540}}>
        {[0,1,2,3].map(i=><div key={i} style={{position:'absolute',left:120+i*300,top:100+(i%2)*55,width:210,height:240,background:i%2?'#1e40af':'#0e7490',border:`3px solid ${palette.accent}`,borderRadius:28,boxShadow:'16px 20px 35px #0008',transform:`translateX(${(1-p)*(2-i)*150}px) rotateY(${(1-p)*55}deg)`}}>
          <div style={{textAlign:'center',fontSize:100,paddingTop:45,color:palette.fg}}>{i+1}</div>
        </div>)}
        <svg width="1400" height="500" style={{position:'absolute',pointerEvents:'none'}}>
          <WhiteboardPath d="M 330 240 L 425 240 M 640 240 L 730 240 M 940 240 L 1030 240" color={palette.accent} startSeconds={1.2} durationSeconds={1.5} marker={false}/>
        </svg>
      </div>;break;
    case 'data-storytelling':
      visual=<div style={{position:'absolute',left:300,top:330,width:1400,height:600,display:'flex',alignItems:'end',gap:48}}>
        {[36,64,48,88,72,98].map((v,i)=><div key={i} style={{width:150,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
          <div style={{fontSize:36,...item}}>{Math.round(v*ease(frame,fps,.4+i*.12))}%</div>
          <div style={{width:'100%',height:v*4.5*ease(frame,fps,.4+i*.12),background:i===5?palette.accent:'#3b82f6',borderRadius:'15px 15px 0 0'}}/>
          <div style={{fontSize:28,...item}}>Q{i+1}</div>
        </div>)}
      </div>;break;
    case 'ui-walkthrough':
      visual=<div style={{position:'absolute',left:350,top:290,width:1200,height:660,background:'white',borderRadius:26,boxShadow:'0 40px 90px #102a4c40',overflow:'hidden',...slide(p)}}>
        <div style={{height:76,background:'#152647',display:'flex',alignItems:'center',gap:14,paddingLeft:30}}>
          {['#fb7185','#facc15','#4ade80'].map(c=><div key={c} style={{width:18,height:18,borderRadius:20,background:c}}/>)}
        </div>
        <div style={{display:'flex',padding:45,gap:40}}>
          <div style={{width:240,height:470,background:'#dbeafe',borderRadius:18}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:58,color:'#152647',fontWeight:800}}>Dashboard</div>
            {[0,1,2].map(i=><div key={i} style={{marginTop:30,height:78,borderRadius:14,background:i===1?'#bfdbfe':'#eff6ff',border:i===1?'3px solid #2563eb':undefined}}/>)}
          </div>
        </div>
        <div style={{position:'absolute',left:630,top:260,fontSize:80,transform:`translate(${(1-q)*-250}px,${(1-q)*140}px)`,filter:'drop-shadow(2px 4px 2px #0005)'}}>↖</div>
      </div>;break;
    case 'timeline-documentary':
      visual=<div style={{position:'absolute',left:180,top:470,width:1550}}>
        <div style={{height:9,background:palette.fg,opacity:.2}}/>
        <div style={{position:'absolute',top:0,height:9,width:`${p*100}%`,background:palette.accent}}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:-28}}>
          {[1990,2005,2020,2035].map((y,i)=><div key={y} style={{textAlign:'center',opacity:ease(frame,fps,.3+i*.5)}}>
            <div style={{width:52,height:52,borderRadius:30,background:palette.accent,border:'8px solid #fff',margin:'0 auto'}}/>
            <div style={{fontSize:60,marginTop:65,fontWeight:800,...item}}>{y}</div>
            <div style={{fontSize:27,...item}}>Milestone {i+1}</div>
          </div>)}
        </div>
      </div>;break;
    case 'network-visualization': {
      const points=Array.from({length:11},(_,i)=>({x:960+Math.cos(i*2.399)*((i%3)+1)*165,y:630+Math.sin(i*2.399)*((i%3)+1)*105}));
      visual=<svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
        {points.slice(1).map((v,i)=><line key={i} x1={points[0].x} y1={points[0].y} x2={v.x} y2={v.y} stroke={palette.accent} strokeWidth={3} opacity={p*.5}/>)}
        {points.map((v,i)=><circle key={i} cx={v.x} cy={v.y} r={(i===0?46:19)*ease(frame,fps,.2+i*.12)} fill={i===0?palette.accent:'#2563eb'} stroke="#fff" strokeWidth={4}/>)}
      </svg>;break;
    }
  }
  return <AbsoluteFill style={{background:palette.bg,overflow:'hidden'}}>
    <div style={{position:'absolute',width:800,height:800,borderRadius:800,background:palette.accent,opacity:.07,filter:'blur(120px)',left:600,top:200}}/>
    {heading}{visual}
    <div style={{position:'absolute',left:110,bottom:65,fontSize:26,opacity:.7,...item}}>CODE-DRIVEN MOTION / {styleId.toUpperCase()}</div>
  </AbsoluteFill>;
};
