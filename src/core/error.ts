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

      const currentPattern = getPatternColors(x, y, newColorGrid, options);
      const goodPatterns = colors.find(
        (data) => data.color === newColorGrid[x][y]
      )!.patterns;

      const patternData = goodPatterns.map((pattern) => {
        const score = getPatternScore(currentPattern, pattern);
        return {
          score,
          count: pattern.count,
        };
      });

      const maxScore = patternData.reduce(
        (max, { score }) => Math.max(max, score),
        0
      );

      const errors = -(maxScore - MAXIMAL_PATTERN_POINTS);

      errorGrid[x][y] = Math.ceil(Math.max(0, errors - 1));
    }
  );

  putGridColorsToImage(
    errorGrid.map((line) => line.map(errorToColor)),
    errorCtx
  );
}
