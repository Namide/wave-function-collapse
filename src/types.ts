export type Color = {
  color: number /* top right color */;
  count: number;
  patterns: Pattern[];
};

export type Pattern = {
  colors: number[]; // square colors
  count: number;
};

export type Options = {
  importantBorder: boolean;
  loopX: boolean;
  loopY: boolean;
  near: number;
};
