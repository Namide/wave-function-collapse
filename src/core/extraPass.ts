import type { Color, Options } from "../types";
import { searchBestColor } from "./color";
import { pauseIfTooLong, sortColorCount } from "./helpers";
import { putGridColorsToImage } from "./image";

export async function extraPass(
  outputCtx: CanvasRenderingContext2D,
  colors: Color[],
  newColorGrid: number[][],
  errorsMap: number[][],
  options: Options
) {
  // const newErrorsMap: number[][] = new Array(errorsMap.length).fill([]);
  // for (let x = 0; x < errorsMap.length; x++) {
  //   newErrorsMap[x] = new Array(errorsMap[x].length).fill(0);
  // }

  const ONLY_ERRORS = true;
  if (ONLY_ERRORS) {
    // let maxError = 0;
    let sortedErrors: { x: number; y: number; count: number }[] = [];
    for (let x = 0; x < errorsMap.length; x++) {
      for (let y = 0; y < errorsMap[x].length; y++) {
        const count = errorsMap[x][y];
        if (count > 3) {
          sortedErrors.push({ x, y, count });
          // maxError = Math.max(maxError, count);
        }
      }
    }
    sortedErrors.sort(sortColorCount);
    // sortedErrors = sortedErrors.filter(
    //   ({ count }) => count > sortedErrors[0].count / 2
    // );

    for (const { x, y } of sortedErrors) {
      await pauseIfTooLong(() => {
        putGridColorsToImage(newColorGrid, outputCtx);
      });

      newColorGrid[x][y] = searchBestColor(
        x,
        y,
        colors,
        newColorGrid,
        // newErrorsMap,
        false,
        options
      );
    }
  } else {
    for (let y = newColorGrid[0].length - 1; y > -1; y--) {
      for (let x = newColorGrid.length - 1; x > -1; x--) {
        await pauseIfTooLong(() => {
          putGridColorsToImage(newColorGrid, outputCtx);
        });

        // if (errorsMap[x][y] > 5) {
        newColorGrid[x][y] = searchBestColor(
          x,
          y,
          colors,
          newColorGrid,
          // newErrorsMap,
          true,
          options
        );
        // }
      }
    }
  }

  // Update error map
  // for (let x = 0; x < errorsMap.length; x++) {
  //   errorsMap[x] = newErrorsMap[x];
  // }
}
