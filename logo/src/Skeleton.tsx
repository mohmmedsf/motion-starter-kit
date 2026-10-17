// Checks the letter skeletons (src/skeleton.json): the logo faint, each group's drawn moves in colour with their
// order number at the start, lifted moves dashed. A good skeleton runs through the middle of every stroke, has no
// stray branches, and starts on the right for Arabic.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Logo, VIEW } from "./logo";
import { CONFIG } from "./config";
import { SKEL, polyD } from "./strokes";

const COLORS = ["#FF4F5C", "#0056D2", "#2EA57C", "#EE702E", "#00B6FF", "#FFB300", "#1F3D63", "#47B6CC"];

export const Skeleton: React.FC = () => {
  const w = Math.min(CONFIG.width * 0.85, 1500);
  const sw = VIEW.w / 500;
  const fs = VIEW.w / 90;
  const groups = Object.entries(SKEL);
  return (
    <AbsoluteFill style={{ background: "#fff", alignItems: "center", justifyContent: "center" }}>
      <Logo
        width={w}
        part={() => ({ fillOpacity: 0.16 })}
        over={
          <>
            {groups.map(([name, g], gi) =>
              g.moves.map((m, i) =>
                m.lift ? (
                  <path key={`${name}${i}`} d={polyD(m.pts)} fill="none" stroke="#999" strokeWidth={sw * 0.5} strokeDasharray={`${sw * 2} ${sw * 2}`} />
                ) : (
                  <g key={`${name}${i}`}>
                    <path d={polyD(m.pts)} fill="none" stroke={COLORS[gi % COLORS.length]} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={m.pts[0][0]} cy={m.pts[0][1]} r={sw * 1.4} fill={COLORS[gi % COLORS.length]} />
                    <text x={m.pts[0][0]} y={m.pts[0][1] - sw * 2.5} fontSize={fs} fontFamily="monospace" fontWeight={700} textAnchor="middle" fill="#000" stroke="#fff" strokeWidth={fs / 6} paintOrder="stroke">
                      {i}
                    </text>
                  </g>
                ),
              ),
            )}
          </>
        }
      />
      <div style={{ position: "absolute", left: 40, top: 30, fontFamily: "monospace", fontSize: 26, color: "#333" }}>
        {groups.length ? groups.map(([name], gi) => <span key={name} style={{ color: COLORS[gi % COLORS.length], marginRight: 28 }}>■ {name}</span>) : "no skeleton yet: run scripts/skeleton.py --group name=p8 ..."}
      </div>
    </AbsoluteFill>
  );
};
