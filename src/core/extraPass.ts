import type { Color, Options } from "../types";
import { searchBestColor } from "./color";
import { pauseIfTooLong, compareItemCount } from "./helpers";
import { putGridColorsToImage } from "./image";

/**
 * Corrective modifications to errors parts
 */
export async function extraPass(
  outputCtx: CanvasRenderingContext2D,
  colors: Color[],
  newColorGrid: number[][],
  errorsMap: number[][],
  options: Options
) {
  let sortedErrors: { x: number; y: number; count: number }[] = [];
  for (let x = 0; x < errorsMap.length; x++) {
    for (let y = 0; y < errorsMap[x].length; y++) {
      const count = errorsMap[x][y];
      if (count > 3) {
        sortedErrors.push({ x, y, count });
      }
    }
  }
  sortedErrors.sort(compareItemCount);

  for (const { x, y } of sortedErrors) {
    await pauseIfTooLong(() => {
      putGridColorsToImage(newColorGrid, outputCtx);
    });

    newColorGrid[x][y] = searchBestColor(x, y, colors, newColorGrid, options);
  }
}
