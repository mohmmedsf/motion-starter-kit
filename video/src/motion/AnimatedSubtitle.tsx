import React from 'react';
import {interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
export type SubtitleCue={text:string;start:number;end:number};
export const AnimatedSubtitle:React.FC<{cues:SubtitleCue[];color?:string;fontSize?:number}> = ({
  cues,color='#fff',fontSize=60,
})=>{
  const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
  const cue=cues.find(c=>t>=c.start&&t<c.end);
  if(!cue)return null;
  const alpha=interpolate(t,[cue.start,Math.min(cue.start+.16,cue.end)],[0,1],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',
  });
  return <div dir="auto" style={{position:'absolute',bottom:'7%',left:'8%',width:'84%',
    textAlign:'center',fontSize,color,fontFamily:'sans-serif',fontWeight:800,
    whiteSpace:'pre-wrap',unicodeBidi:'plaintext',opacity:alpha,
    textShadow:'0 3px 12px #000a',pointerEvents:'none'}}>{cue.text}</div>;
};
