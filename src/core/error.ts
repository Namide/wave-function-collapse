import { Color, Options } from "../types";
import { errorToColor, loop, pauseIfTooLong } from "./helpers";
import { putGridColorsToImage } from "./image";
import { getPatternColors, getPatternScore } from "./pattern";

/**
 * Calculate a grid of errors levels.
 * Errors is bad near pixels.
 */
export async function calculateErrorMap(
  newColorGrid: number[][],
  errorGrid: number[][],
  colors: Color[],
  errorCtx: CanvasRenderingContext2D,
  options: Options
) {
  const MAXIMAL_PATTERN_POINTS = (options.near * 2 + 1) ** 2 - 1;

  await loop(
    newColorGrid.length,
    newColorGrid[0].length,
    "rb",
    async (x: number, y: number) => {
      await pauseIfTooLong(() => {
        putGridColorsToImage(
          errorGrid.map((line) => line.map(errorToColor)),
          errorCtx
        );
      });

      const newPattern = getPatternColors(x, y, newColorGrid, options);

      let filteredColors = colors.map(({ patterns }) => {
        const patternData = patterns.map((pattern) => {
          const score = getPatternScore(newPattern, pattern);
          return {
            score,
            count: pattern.count,
          };
        });

        const maxScore = patternData.reduce(
          (max, { score }) => Math.max(max, score),
          0
        );

        return -(maxScore - MAXIMAL_PATTERN_POINTS);
      });

      filteredColors.sort((a, b) => a - b);
      errorGrid[x][y] = Math.ceil(filteredColors[0]);
    }
  );

  putGridColorsToImage(
    errorGrid.map((line) => line.map(errorToColor)),
    errorCtx
  );
}
