export type Color = {
  color: number /* top right color */;
  count: number;
  patterns: Pattern[];
};

export type Pattern = {
  colors: number[]; // square colors
  count: number;
};
