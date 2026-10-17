// One composition per style. «Parts» shows the logo parts with their ids, so you can group them; «Skeleton» checks the letter skeletons.
import React from "react";
import { Composition } from "remotion";
import { CONFIG } from "./config";
import { Parts } from "./Parts";
import { Skeleton } from "./Skeleton";
import { STYLES } from "./styles";

export const Root: React.FC = () => (
  <>
    <Composition id="Parts" component={Parts} durationInFrames={30} fps={CONFIG.fps} width={CONFIG.width} height={CONFIG.height} />
    <Composition id="Skeleton" component={Skeleton} durationInFrames={30} fps={CONFIG.fps} width={CONFIG.width} height={CONFIG.height} />
    {STYLES.map((s) => (
      <Composition key={s.id} id={s.id} component={s.comp} durationInFrames={Math.round(s.dur * CONFIG.fps)} fps={CONFIG.fps} width={CONFIG.width} height={CONFIG.height} />
    ))}
  </>
);
