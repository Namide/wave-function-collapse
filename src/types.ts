export type Color = {
  color: number;
  count: number; // Number of repeated color
  patterns: Pattern[]; // All colors arround the color
};

export type Pattern = {
  colors: number[]; // square of colors (without the center color)
  count: number; // Number of repeated same colors
};

export type Options = {
  importantBorder: boolean; // The colors near border is important
  loopX: boolean; // The image is a loop of left and right
  loopY: boolean; // The image is a loop of top and bottom
  near: number; // Distance of colors check
};
