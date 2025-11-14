export const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  };
  
  export const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
  };

  export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };