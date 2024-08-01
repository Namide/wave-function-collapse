import { COLOR_ACCURACY } from "../config";

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
