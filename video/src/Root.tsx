import React from 'react';
import { Composition } from 'remotion';
import {ProductionVideo,DEFAULT_PRODUCTION,getProductionDuration} from './production/ProductionVideo';
import type {ProductionProps} from './production/ProductionVideo';
import {validateManifest} from './production/manifest';
import { Video } from './Video';
import { VIDEO } from './config';
import { DURATION_FRAMES } from './timing';
import { MotionDemo } from './motion/demo/MotionDemo';
import { StyleShowcase, STYLE_IDS, ExtraStyleShowcase, EXTRA_STYLE_IDS } from './styles';

export const Root: React.FC = () => <>
  <Composition id="Main" component={Video} durationInFrames={DURATION_FRAMES} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
  <Composition id="ProductionDemo" component={ProductionVideo} defaultProps={DEFAULT_PRODUCTION} calculateMetadata={({props})=>{const manifest=validateManifest(props);return {durationInFrames:getProductionDuration(manifest.scenes,30),props:manifest};}} durationInFrames={getProductionDuration(DEFAULT_PRODUCTION.scenes,30)} calculateMetadata={({props})=>({durationInFrames:getProductionDuration((props as ProductionProps).scenes,30)})} fps={30} width={1920} height={1080} />
  <Composition id="MotionEngineDemo" component={MotionDemo} durationInFrames={180} fps={30} width={1920} height={1080} />
  {EXTRA_STYLE_IDS.map(styleId => <Composition key={styleId} id={`Style-${styleId}`}
    component={ExtraStyleShowcase} defaultProps={{styleId}}
    durationInFrames={180} fps={30} width={1920} height={1080} />)}
  {STYLE_IDS.map(styleId => <Composition key={styleId} id={`Style-${styleId}`}
    component={StyleShowcase} defaultProps={{styleId}}
    durationInFrames={180} fps={30} width={1920} height={1080} />)}
</>;
