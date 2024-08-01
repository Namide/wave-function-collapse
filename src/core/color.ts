import type { Color, Options } from "../types";
import { getRandomItem, compareItemCount } from "./helpers";
import { getPatternColors, getPatternScore } from "./pattern";

/**
 * Calculate optimal color depends on pixels arround
 */
export function searchBestColor(
  x: number,
  y: number,
  colors: Color[],
  newColorGrid: number[][],
  options: Options
) {
  // Get current pattern
  let patternColors = getPatternColors(x, y, newColorGrid, options);

  // Get all colors with this pattern
  let filteredColors = colors.map(({ color, count, patterns }) => {
    const patternData = patterns.map((pattern) => {
      const score = getPatternScore(patternColors, pattern);
      return {
        score,
        count: pattern.count,
      };
    });
    const maxScore = patternData.reduce(
      (max, { score }) => Math.max(max, score),
      0
    );
    return { score: maxScore, color, count };
  });

  filteredColors.sort((a, b) => b.score - a.score);
  filteredColors = filteredColors.filter(
    (item) => item.score === filteredColors[0].score
  );

  filteredColors.sort(compareItemCount);

  return getRandomItem(filteredColors).color;
}
