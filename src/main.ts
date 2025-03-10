import { NEAR } from "./config";
import { compareItemCount } from "./core/helpers";
import { extractColorGrid } from "./core/image";
import { extractColors, generateColors } from "./core/process";
import "./style.css";
import type { Options } from "./types";

/**
 * Launch all calculations
 */
async function fullProcess(
  input: HTMLImageElement,
  output: HTMLCanvasElement,
  errors: HTMLCanvasElement,
  options: Options
) {
  console.time("Extract grid colors");
  const colorGrid = await extractColorGrid(input);
  console.timeEnd("Extract grid colors");

  console.time("Extract image colors");
  const colors = await extractColors(colorGrid, options);
  console.timeEnd("Extract image colors");

  console.time("Sort image colors");
  colors.sort(compareItemCount);
  console.timeEnd("Sort image colors");

  console.time("Generate image colors");
  await generateColors(output, errors, colors, colorGrid, options);
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
    loopX,
    loopY,
    near,
    symmetryX,
    symmetryY,
  }: {
    width: number;
    height: number;
    importantBorder: boolean;
    loopX: boolean;
    loopY: boolean;
    near: number;
    symmetryX: boolean;
    symmetryY: boolean;
  }
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
      resolve(
        fullProcess(img, output, errors, {
          importantBorder,
          loopX,
          loopY,
          near,
          symmetryX,
          symmetryY,
        })
      );
    };
  });
}

/**
 * All images and configuration for each image
 */
(async () => {
  await start("assets/cave.png", {
    width: 72,
    height: 42,
    importantBorder: true,
    loopX: false,
    loopY: false,
    near: NEAR,
    symmetryX: true,
    symmetryY: false,
  });
  await start("assets/square-2.png", {
    width: 64,
    height: 64,
    importantBorder: false,
    loopX: true,
    loopY: true,
    near: NEAR,
    symmetryX: true,
    symmetryY: true,
  });
  await start("assets/square.png", {
    width: 32,
    height: 32,
    importantBorder: false,
    loopX: true,
    loopY: true,
    near: NEAR,
    symmetryX: true,
    symmetryY: true,
  });
  await start("assets/flowers.png", {
    width: 64,
    height: 64,
    importantBorder: true,
    loopX: false,
    loopY: false,
    near: NEAR,
    symmetryX: true,
    symmetryY: false,
  });
  await start("assets/houses.png", {
    width: 64,
    height: 64,
    importantBorder: false,
    loopX: true,
    loopY: true,
    near: NEAR,
    symmetryX: true,
    symmetryY: false,
  });
  await start("assets/infinity.png", {
    width: 64,
    height: 64,
    importantBorder: false,
    loopX: true,
    loopY: true,
    near: NEAR,
    symmetryX: false,
    symmetryY: false,
  });
  await start("assets/triangles.png", {
    width: 64,
    height: 64,
    importantBorder: false,
    loopX: false,
    loopY: false,
    near: NEAR,
    symmetryX: true,
    symmetryY: false,
  });
  await start("assets/wall.png", {
    width: 64,
    height: 64,
    importantBorder: false,
    loopX: true,
    loopY: true,
    near: NEAR,
    symmetryX: false,
    symmetryY: false,
  });
  await start("assets/sand.png", {
    width: 64,
    height: 128,
    importantBorder: false,
    loopX: false,
    loopY: false,
    near: NEAR,
    symmetryX: true,
    symmetryY: false,
  });
  await start("assets/water.png", {
    width: 64,
    height: 64,
    importantBorder: false,
    loopX: false,
    loopY: false,
    near: NEAR,
    symmetryX: true,
    symmetryY: true,
  });
})();
