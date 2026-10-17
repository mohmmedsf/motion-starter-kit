// Settings for the animated logo (the agent sets them from the user's answers)
export const CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  // background colour, or null for a transparent version (no background at all)
  background: "#F3F2EE" as string | null,
  // swap logo colours (e.g. black text turns white on a dark background): { "#000000": "#FFFFFF" }
  recolor: {} as Record<string, string>,
  // logo width in the frame (px)
  logoWidth: 1080,
};
