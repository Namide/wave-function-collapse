import { COLOR_ACCURACY } from "../config";
import { pauseIfTooLong } from "./helpers";

/**
 * Get pixel from ImageData
 */
export function getPixel(
  x: number,
  y: number,
  { width, data }: { width: number; data: Uint8ClampedArray }
) {
  const index = (x + y * width) * 4;

  switch (COLOR_ACCURACY) {
    case 1:
      // Full color
      return (data[index] << 16) | (data[index + 1] << 8) | data[index + 2];
    case 8:
      // Big approximation color #FFFFFF => #1F1F1F (x8)
      return (
        (((data[index] >> 3) & 0x1f) << 19) |
        (((data[index + 1] >> 3) & 0x1f) << 11) |
        (((data[index + 2] >> 3) & 0x1f) << 3)
      );
    case 16:
      // Big approximation color #FFFFFF => #FFF (x16)
      return (
        (((data[index] >> 4) & 0xf) << 20) |
        (((data[index + 1] >> 4) & 0xf) << 12) |
        (((data[index + 2] >> 4) & 0xf) << 4)
      );
  }
}

/**
 * Display image from grids to canvas
 */
export function putGridColorsToImage(
  gridColors: number[][],
  outputCtx: CanvasRenderingContext2D
) {
  const width = gridColors.length;
  const height = gridColors[0].length;
  const dataArray = new Uint8ClampedArray(width * height * 4);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < gridColors[x].length; y++) {
      const index = (x + y * width) * 4;
      const color = gridColors[x][y];
      dataArray[index] = (color >> 16) & 0xff;
      dataArray[index + 1] = (color >> 8) & 0xff;
      dataArray[index + 2] = color & 0xff;
      dataArray[index + 3] = 0xff;
    }
  }

  outputCtx.putImageData(new ImageData(dataArray, width), 0, 0);
}

/**
 * Convert image to a grid of colors
 */
export async function extractColorGrid(input: HTMLImageElement) {
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
