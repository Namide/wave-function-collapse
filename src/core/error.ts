import { Color, Options } from "../types";
import { errorToColor, loop, pauseIfTooLong } from "./helpers";
import { putGridColorsToImage } from "./image";
import { getPatternColors, testPatternScore } from "./pattern";

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

      // const newColor = newColorGrid[x][y];
      const newPattern = getPatternColors(x, y, newColorGrid, options);
      // const colorData = colors.find(c => c.color === newColor) as Color

      let filteredColors = colors.map(({ patterns }) => {
        const patternData = patterns.map((pattern) => {
          const score = testPatternScore(newPattern, pattern);
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

// export function setErrorsOnMap(
//   errorsMap: number[][],
//   newColorGrid: number[][],
//   x: number,
//   y: number,
//   power: number,
//   options: Options
// ) {
//   for (let nearX = -options.near; nearX <= options.near; nearX++) {
//     for (let nearY = -options.near; nearY <= options.near; nearY++) {
//       if (nearX === 0 && nearY === 0) {
//         errorsMap[x][y] = 1;
//       } else {
//         const nearAbsX = x + nearX;
//         const nearAbsY = y + nearY;

//         // Test all colors
//         if (
//           nearAbsX < 0 ||
//           nearAbsX >= newColorGrid.length ||
//           nearAbsY < 0 ||
//           nearAbsY >= newColorGrid[x].length
//         ) {
//           // Out of the screen
//         } else {
//           // Get color for pattern
//           if (newColorGrid[nearAbsX][nearAbsY] > -1) {
//             errorsMap[nearAbsX][nearAbsY]++;
//           }
//         }
//       }
//     }
//   }
// }
