import { MAX_EXTRA_PASS } from "../config";
import type { Color, Options } from "../types";
import { searchBestColor } from "./color";
import { calculateErrorMap } from "./error";
import { extraPass } from "./extraPass";
import { getRandomItem, getTotalErrors, loop, pauseIfTooLong } from "./helpers";
import { putGridColorsToImage } from "./image";
import { addPattern, getPatternColors } from "./pattern";

/**
 * Extract a list of colors and patterns from a grid
 */
export async function extractColors(colorGrid: number[][], options: Options) {
  const colors: Color[] = [];
  await loop(
    colorGrid.length,
    colorGrid[0].length,
    "lt",
    async (x: number, y: number) => {
      // Avoid some pixels tests
      if (
        !options.importantBorder &&
        !options.loopX &&
        (x < options.near || x > colorGrid.length - options.near)
      ) {
        return;
      }

      // Avoid some pixels tests
      if (
        !options.importantBorder &&
        !options.loopY &&
        (y < options.near || y > colorGrid[0].length - options.near)
      ) {
        return;
      }

      await pauseIfTooLong();

      const color = colorGrid[x][y];
      let colorData = colors.find((data) => data.color === color);
      if (!colorData) {
        colorData = {
          color,
          count: 1,
          patterns: [],
        };
        colors.push(colorData);
      } else {
        colorData.count++;
      }

      const patternColors = getPatternColors(x, y, colorGrid, options);
      addPattern(patternColors, colorData.patterns);
    }
  );
  return colors;
}

/**
 * Generate all grid of pixels
 */
export async function generateColors(
  output: HTMLCanvasElement,
  errors: HTMLCanvasElement,
  colors: Color[],
  colorGrid: number[][],
  options: Options
) {
  const outputCtx = output.getContext("2d") as CanvasRenderingContext2D;
  const errorsCtx = errors.getContext("2d") as CanvasRenderingContext2D;

  const newColorGrid: number[][] = new Array(output.width).fill([]);
  const errorsMap: number[][] = new Array(output.width).fill([]);

  for (let x = 0; x < output.width; x++) {
    newColorGrid[x] = new Array(output.height).fill(-1);
    errorsMap[x] = new Array(output.height).fill(0);
  }

  await loop(output.width, output.height, "spiral", async (x, y, isFirst) => {
    await pauseIfTooLong(() => {
      putGridColorsToImage(newColorGrid, outputCtx);
    });

    let color = -1;
    if (isFirst) {
      if (options.importantBorder) {
        const originalX = Math.round((x / output.width) * colorGrid.length);
        const originalY = Math.round(
          (y / output.height) * colorGrid[originalX].length
        );
        color = colorGrid[originalX][originalY];
      } else {
        color = getRandomItem(colors).color;
      }
    } else {
      color = searchBestColor(x, y, colors, newColorGrid, options);
    }

    newColorGrid[x][y] = color;
  });

  putGridColorsToImage(newColorGrid, outputCtx);

  await calculateErrorMap(newColorGrid, errorsMap, colors, errorsCtx, {
    ...options,
    near: 1,
  });

  let totalErrors = getTotalErrors(errorsMap);
  console.log("totalErrors:", totalErrors);

  for (let num = 0; num < MAX_EXTRA_PASS && totalErrors > 10; num++) {
    const near = (num % 3) + 1;
    await extraPass(outputCtx, colors, newColorGrid, errorsMap, options);

    putGridColorsToImage(newColorGrid, outputCtx);

    await calculateErrorMap(newColorGrid, errorsMap, colors, errorsCtx, {
      ...options,
      near,
    });

    totalErrors = getTotalErrors(errorsMap);
    console.log("cleaned totalErrors:", totalErrors, "near:", near);
  }
}
