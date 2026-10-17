// The styles built for the user's logo. Register every new style here.
import React from "react";
import { LightSweep } from "./LightSweep";

export type StyleDef = { id: string; dur: number; comp: React.FC };
export const STYLES: StyleDef[] = [
  // A working example that fits any logo (the light sweep)
  { id: "LightSweep", dur: 6, comp: LightSweep },
];
