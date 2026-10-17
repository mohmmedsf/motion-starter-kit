// Names for groups of logo parts. The ids come from `npm run split` (see the Parts composition); the agent
// fills these in for the user's logo, and styles use the names instead of raw ids.
// The default below is the example logo (Motalim): a blue circle with a cup and a hat, the Arabic word «متعلم»,
// its dots and diacritics, and the tagline «حان وقت الإبداع».
import { PARTS, Part, part } from "./logo";

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => `p${a + i}`);

export const GROUPS: Record<string, string[]> = {
  mark: ["p0", "p1", "p2"], // the symbol (back shape first)
  word: ["p8"], // the name: one connected Arabic word is one part (or a few, one per connected piece)
  dots: range(3, 7), // the word's dots and diacritics
  tag: range(9, 24), // the tagline
};

// The parts of a group, in the order listed
export const G = (name: string): Part[] => {
  const ids = GROUPS[name];
  if (!ids) throw new Error(`no group «${name}» in src/groups.ts`);
  return ids.map(part);
};
// The group a part belongs to (or null)
export const groupOf = (id: string) => Object.keys(GROUPS).find((g) => GROUPS[g].includes(id)) ?? null;
// Parts sorted right to left (Arabic reading order) by the centre of their box
export const rightToLeft = (ps: Part[]) => [...ps].sort((a, b) => b.box.x + b.box.w / 2 - (a.box.x + a.box.w / 2));
export { PARTS };
