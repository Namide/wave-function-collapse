import { EXTRA_PASS } from "./config";
import { searchBestColor } from "./core/color";
import {
  getRandomItem,
  loop,
  pauseIfTooLong,
  sortColorCount,
} from "./core/helpers";
import { getPixel, putGridColorsToImage } from "./core/image";
import { addPattern, getPatternColors } from "./core/pattern";
import "./style.css";
import type { Color } from "./types";

async function extractColors(colorGrid: number[][], importantBorder: boolean) {
  const colors: Color[] = [];
  await loop(
    colorGrid.length,
    colorGrid[0].length,
    "lt",
    async (x: number, y: number) => {
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

      const patternColors = getPatternColors(x, y, colorGrid, {
        importantBorder,
      });
      addPattern(patternColors, colorData.patterns);
    }
  );
  return colors;
}

async function extraPass(
  outputCtx: CanvasRenderingContext2D,
  colors: Color[],
  importantBorder: boolean,
  newColorGrid: number[][],
  errorsMap: number[][]
) {
  const newErrorsMap: number[][] = new Array(errorsMap.length).fill([]);
  for (let x = 0; x < errorsMap.length; x++) {
    newErrorsMap[x] = new Array(errorsMap[x].length).fill(0);
  }

  // for (let y = newColorGrid[0].length - 1; y > -1; y--) {
  //   for (let x = newColorGrid.length - 1; x > -1; x--) {
  //     await pauseIfTooLong(() => {
  //       putGridColorsToImage(newColorGrid, outputCtx);
  //       putGridColorsToImage(
  //         newErrorsMap.map((line) => line.map(errorToColor)),
  //         errorsCtx
  //       );
  //     });

  //     // if (errorsMap[x][y] > 5) {
  //     newColorGrid[x][y] = searchBestColor(
  //       x,
  //       y,
  //       colors,
  //       newColorGrid,
  //       newErrorsMap,
  //       importantBorder,
  //       true
  //     );
  //     // }
  //   }
  // }

  // let maxError = 0;
  let sortedErrors: { x: number; y: number; count: number }[] = [];
  for (let x = 0; x < errorsMap.length; x++) {
    for (let y = 0; y < errorsMap[x].length; y++) {
      const count = errorsMap[x][y];
      if (count > 0) {
        sortedErrors.push({ x, y, count });
        // maxError = Math.max(maxError, count);
      }
    }
  }
  sortedErrors.sort(sortColorCount);
  for (const { x, y } of sortedErrors) {
    await pauseIfTooLong(() => {
      putGridColorsToImage(newColorGrid, outputCtx);
    });

    newColorGrid[x][y] = searchBestColor(
      x,
      y,
      colors,
      newColorGrid,
      newErrorsMap,
      importantBorder,
      false
    );
  }

  // Update error map
  for (let x = 0; x < errorsMap.length; x++) {
    errorsMap[x] = newErrorsMap[x];
  }
}

function getTotalErrors(errorMap: number[][]) {
  return errorMap.flat(2).reduce((total, count) => total + count, 0);
}

async function generateColors(
  output: HTMLCanvasElement,
  errors: HTMLCanvasElement,
  colors: Color[],
  colorGrid: number[][],
  importantBorder: boolean
) {
  const outputCtx = output.getContext("2d") as CanvasRenderingContext2D;
  const errorsCtx = errors.getContext("2d") as CanvasRenderingContext2D;

  const newColorGrid: number[][] = new Array(output.width).fill([]);
  const errorsMap: number[][] = new Array(output.width).fill([]);

  for (let x = 0; x < output.width; x++) {
    newColorGrid[x] = new Array(output.height).fill(-1);
    errorsMap[x] = new Array(output.height).fill(0);
  }

  await loop(output.width, output.height, "rb", async (x, y, isFirst) => {
    await pauseIfTooLong(() => {
      putGridColorsToImage(newColorGrid, outputCtx);
    });

    let color = -1;
    if (isFirst) {
      color = importantBorder ? colorGrid[x][y] : getRandomItem(colors).color;
    } else {
      color = searchBestColor(
        x,
        y,
        colors,
        newColorGrid,
        errorsMap,
        importantBorder,
        true
      );
    }

    newColorGrid[x][y] = color;
  });

  putGridColorsToImage(newColorGrid, outputCtx);
  putGridColorsToImage(
    errorsMap.map((line) => line.map(errorToColor)),
    errorsCtx
  );

  let totalErrors = getTotalErrors(errorsMap);
  console.log("totalErrors:", totalErrors);

  for (let num = 0; num < EXTRA_PASS && totalErrors > 0; num++) {
    await extraPass(
      outputCtx,
      colors,
      importantBorder,
      newColorGrid,
      errorsMap
    );

    putGridColorsToImage(newColorGrid, outputCtx);
    putGridColorsToImage(
      errorsMap.map((line) => line.map(errorToColor)),
      errorsCtx
    );

    totalErrors = getTotalErrors(errorsMap);
    console.log("cleaned totalErrors:", totalErrors);
  }
}

function errorToColor(error: number) {
  return error === 0 ? 0x00ff00 : 0x000000 + 0x010000 * error * 30;
}

async function extractColorGrid(input: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = input.naturalWidth;
  canvas.height = input.naturalHeight;
  const outputCtx = canvas.getContext("2d") as CanvasRenderingContext2D;
  outputCtx.drawImage(input, 0, 0);
  const imageData = outputCtx.getImageData(
    0,
    0,
    input.naturalWidth,
    input.naturalHeight
  );

  const colorGrid: number[][] = [];
  for (let x = 0; x < imageData.width; x++) {
    colorGrid[x] = [];
    for (let y = 0; y < imageData.height; y++) {
      await pauseIfTooLong();
      colorGrid[x][y] = getPixel(x, y, imageData);
    }
  }

  return colorGrid;
}

async function fullProcess(
  input: HTMLImageElement,
  output: HTMLCanvasElement,
  errors: HTMLCanvasElement,
  importantBorder: boolean
) {
  console.time("Extract grid colors");
  const colorGrid = await extractColorGrid(input);
  console.timeEnd("Extract grid colors");

  console.time("Extract image colors");
  const colors = await extractColors(colorGrid, importantBorder);
  console.timeEnd("Extract image colors");

  console.log("Colors");
  console.log(
    colors.map(({ color, count, patterns }) => ({
      color: "#" + color.toString(16),
      count,
      patterns: patterns.map(({ colors, count }) => ({
        count,
        colors: colors.map((color) => "#" + color.toString(16)),
      })),
    }))
  );

  console.time("Sort image colors");
  colors.sort(sortColorCount);
  // for (const colorData of colors) {
  //   colorData.patterns.sort(sortColorCount);
  // }
  console.timeEnd("Sort image colors");

  console.time("Generate image colors");
  await generateColors(output, errors, colors, colorGrid, importantBorder);
  console.timeEnd("Generate image colors");
}

/**
 * Generate image and canvas and start fullProcess
 */
async function start(
  src: string,
  {
    width,
    height,
    importantBorder,
  }: { width: number; height: number; importantBorder: boolean }
) {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const img = document.createElement("img");
  img.setAttribute("src", src);
  div.appendChild(img);
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  output.setAttribute(
    "style",
    `width: ${output.width * 4}px; height: ${output.height * 4}px;`
  );
  div.appendChild(output);
  const errors = document.createElement("canvas");
  errors.width = width;
  errors.height = height;
  errors.setAttribute(
    "style",
    `width: ${errors.width * 4}px; height: ${errors.height * 4}px;`
  );
  div.appendChild(errors);

  await new Promise((resolve) => {
    img.onload = () => {
      img.setAttribute(
        "style",
        `width: ${img.width * 4}px; height: ${img.height * 4}px;`
      );
      resolve(fullProcess(img, output, errors, importantBorder));
    };
  });
}

(async () => {
  await start("assets/cave.png", {
    width: 72,
    height: 42,
    importantBorder: true,
  });
  // await start("assets/square-2.png", {
  //   width: 64,
  //   height: 64,
  //   importantBorder: false,
  // });
  // await start("assets/square.png", {
  //   width: 32,
  //   height: 32,
  //   importantBorder: false,
  // });
  // await start("assets/flowers.png", {
  //   width: 64,
  //   height: 64,
  //   importantBorder: true,
  // });
  // await start("assets/houses.png", {
  //   width: 64,
  //   height: 64,
  //   importantBorder: false,
  // });
  // await start("assets/infinity.png", {
  //   width: 64,
  //   height: 64,
  //   importantBorder: false,
  // });
  // await start("assets/triangles.png", {
  //   width: 64,
  //   height: 64,
  //   importantBorder: false,
  // });
  // await start("assets/wall.png", {
  //   width: 64,
  //   height: 64,
  //   importantBorder: false,
  // });
  // await start("assets/input-4.png", {
  //   width: 64,
  //   height: 64,
  //   importantBorder: false,
  // });
  // await start("assets/input-5.png", {
  //   width: 64,
  //   height: 64,
  //   importantBorder: false,
  // });
})();
