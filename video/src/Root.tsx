import React from 'react';
import { Composition } from 'remotion';
import { Video } from './Video';
import { VIDEO } from './config';
import { DURATION_FRAMES } from './timing';
import { MotionDemo } from './motion/demo/MotionDemo';

export const Root: React.FC = () => <>
  <Composition id="Main" component={Video} durationInFrames={DURATION_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
  <Composition id="MotionEngineDemo" component={MotionDemo} durationInFrames={180} fps={30} width={1920} height={1080} />
</>;
