/** Per-project brand tokens. Agents may override tokens, not modify every scene. */
export type BrandKit = {
  name: string; primary: string; secondary: string; background: string;
  foreground: string; fontFamily: string; logo?: string;
};
export const DEFAULT_BRAND: BrandKit = {
  name:'Motion Starter Kit',primary:'#2563eb',secondary:'#ea580c',
  background:'#f7f5ee',foreground:'#23272e',fontFamily:'sans-serif',
};
export const withBrand = (overrides: Partial<BrandKit> = {}): BrandKit => ({
  ...DEFAULT_BRAND,...overrides,
});
