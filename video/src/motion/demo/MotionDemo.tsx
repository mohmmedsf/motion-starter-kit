import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CameraDirector } from '../CameraDirector';
import { KineticText } from '../KineticText';
import { WhiteboardPath } from '../WhiteboardPath';
import { SmartLayout } from '../SmartLayout';

const arrow = 'M 20 80 C 110 0 180 160 280 80 M 255 55 L 280 80 L 248 98';
const box = 'M 20 20 L 280 20 L 280 160 L 20 160 Z';

export const MotionDemo: React.FC = () => <AbsoluteFill style={{ background: '#f7f5ee' }}>
  <CameraDirector keyframes={[{ at: 0, x: 0, y: 20, zoom: 0.94 },
    { at: 1.5, x: 0, y: 0, zoom: 1 }, { at: 5, x: 0, y: 0, zoom: 1 }]}>
    <SmartLayout width={1920} height={1080} columns={2} padding={130} gap={40} items={[
      { id: 'text', width: 700, height: 380, node: <div style={{ paddingTop: 100 }}>
        <KineticText text="تطوير الأعمال" fontSize={92} startSeconds={0.3} />
        <KineticText text="من الفكرة إلى النمو" fontSize={49} color="#2563eb" startSeconds={1.1} />
      </div> },
      { id: 'drawing', width: 700, height: 380, node: <svg viewBox="0 0 340 200" width="700" height="380">
        <WhiteboardPath d={box} color="#2563eb" startSeconds={0.8} durationSeconds={1.8} />
        <WhiteboardPath d={arrow} color="#ea580c" startSeconds={2.4} durationSeconds={2.1} />
      </svg> },
    ]} />
  </CameraDirector>
</AbsoluteFill>;
