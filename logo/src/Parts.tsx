// The logo parts with their ids (open it in Studio or make a still) to see which parts are the mark, the word and the tagline
import React from "react";
import { AbsoluteFill } from "remotion";
import { Logo, PARTS, VIEW } from "./logo";
import { CONFIG } from "./config";

const COLORS = ["#FF4F5C", "#0056D2", "#2EA57C", "#EE702E", "#00B6FF", "#FFB300", "#1F3D63", "#47B6CC"];

export const Parts: React.FC = () => {
  const w = Math.min(CONFIG.width * 0.85, 1500);
  const fs = VIEW.w / 70;
  return (
    <AbsoluteFill style={{ background: "#fff", alignItems: "center", justifyContent: "center" }}>
      <Logo
        width={w}
        part={(p, i) => ({ fill: COLORS[i % COLORS.length], fillOpacity: 0.55, stroke: COLORS[i % COLORS.length], strokeWidth: VIEW.w / 600 })}
        over={
          <>
            {PARTS.map((p) => (
              <text key={p.id} x={p.box.x + p.box.w / 2} y={p.box.y + p.box.h / 2} fontSize={fs} fontFamily="monospace" fontWeight={700} textAnchor="middle" dominantBaseline="middle" fill="#000" stroke="#fff" strokeWidth={fs / 6} paintOrder="stroke">
                {p.id}
              </text>
            ))}
          </>
        }
      />
    </AbsoluteFill>
  );
};
