function parseHex(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  
  function toHex(rgb: [number, number, number]): string {
    return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  }
  
  // Subject colors are saved once, but on the dark Night theme they are lightened a little
  // so dots and lines stay easy to see.
  export function tone(hex: string, isDark: boolean): string {
    if (!isDark) return hex;
    const [r, g, b] = parseHex(hex);
    const k = 0.28;
    return toHex([r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k]);
  }
  
  // '#rrggbb' plus an opacity from 0 to 1 gives '#rrggbbaa'.
  export function withAlpha(hex: string, alpha: number): string {
    const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
      .toString(16)
      .padStart(2, '0');
    return `${hex}${a}`;
  }