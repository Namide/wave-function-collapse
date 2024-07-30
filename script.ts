const DIST = 5;
const NEAR = 5;
const ITERATIONS_MAX = 20000;

type Color = { color: number; count: number; nears: Near[] };

type Near = {
  colors: { color: number; count: number }[];
  x: number;
  y: number;
};

const wait = () => new Promise((resolve) => requestAnimationFrame(resolve));

let time = Date.now();
const pauseIfTooLong = async (callback?: () => void) => {
  const dt = Date.now() - time;
  if (dt >= 1000 / 60) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (callback) {
      callback();
    }
    time = Date.now();
  }
};

function getRandomItem<Item extends { count: number }>(items: Item[]) {
  const rand =
    Math.random() * items.reduce((total, item) => total + item.count, 0);
  let add = 0;
  for (const item of items) {
    if (rand <= add + item.count) {
      return item;
    }
    add += item.count;
  }
}

function getPixel(
  x: number,
  y: number,
  { width, data }: { width: number; data: Uint8ClampedArray }
) {
  const index = (x + y * width) * 4;

  // Approximation color
  return (
    (((data[index] >> 4) & 0xf) << 20) |
    (((data[index + 1] >> 4) & 0xf) << 12) |
    (((data[index + 2] >> 4) & 0xf) << 4)
  );

  // Full color
  // return data[index] << 16 | data[index+1] << 8 | data[index+2]
}

function addNear(color: number, nears: Near[], nearX: number, nearY: number) {
  let near = nears.find((n) => n.x === nearX && n.y === nearY);
  if (!near) {
    near = { x: nearX, y: nearY, colors: [] };
    nears.push(near);
  }

  const colorData = near.colors.find((data) => data.color === color);
  if (colorData) {
    colorData.count++;
  } else {
    near.colors.push({ color, count: 1 });
  }
}

function mixRefs(as, bs) {
  const list = as.filter((a) => bs.find((b) => b.color === a.color));
  if (list.length === 0) {
    return as;
  }
  return list;
}

function sortColorCount(a, b) {
  return b.count - a.count;
}

async function extractColorList(input: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = input.width;
  canvas.height = input.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(input, 0, 0);
  const imageData = ctx.getImageData(0, 0, input.width, input.height);

  const colors: Color[] = [];
  for (let x = DIST; x < imageData.width - DIST; x++) {
    for (let y = DIST; y < imageData.height - DIST; y++) {
      await pauseIfTooLong();
      const color = getPixel(x, y, imageData);
      let colorData = colors.find((data) => data.color === color);
      if (!colorData) {
        colorData = {
          color,
          count: 1,
          nears: [],
        };
        colors.push(colorData);
      } else {
        colorData.count++;
      }

      for (let nearX = -NEAR; nearX <= NEAR; nearX++) {
        for (let nearY = -NEAR; nearY <= NEAR; nearY++) {
          if (!(nearX === 0 && nearY === 0)) {
            const nearAbsX = x + nearX;
            const nearAbsY = y + nearY;
            if (
              nearAbsX >= 0 &&
              nearAbsX < imageData.width &&
              nearAbsY >= 0 &&
              nearAbsY < imageData.height
            ) {
              addNear(
                getPixel(nearAbsX, nearAbsY, imageData),
                colorData.nears,
                nearX,
                nearY
              );
            }
          }
        }
      }
    }
  }
  return colors;
}

async function process(input: HTMLImageElement, output: HTMLCanvasElement) {
  output.width = output.width || input.width;
  output.height = output.height || input.height;

  const ctx = output.getContext("2d");

  console.time("Extract image colors");
  const colors = await extractColorList(input);
  console.timeEnd("Extract image colors");

  console.time("Sort image colors");
  colors.sort(sortColorCount);
  for (const colorData of colors) {
    for (const near of colorData.nears) {
      near.colors.sort(sortColorCount);
    }
  }
  console.timeEnd("Sort image colors");

  console.time("Generate image colors");
  const dataArray = new Uint8ClampedArray(output.width * output.height * 4);
  for (let y = 0; y < output.height; y++) {
    for (let x = 0; x < output.width; x++) {
      await pauseIfTooLong(() =>
        ctx.putImageData(new ImageData(dataArray, output.width), 0, 0)
      );

      let color = -1;
      const index = (x + y * output.width) * 4;

      if (x === 0 && y === 0) {
        color = getRandomItem(colors).color;
      } else {
        const nearColors: { x: number; y: number; color: number }[] = [];
        for (let nearX = -NEAR; nearX <= NEAR; nearX++) {
          for (let nearY = -NEAR; nearY <= NEAR; nearY++) {
            const nearAbsX = x + nearX;
            const nearAbsY = y + nearY;
            if (
              nearAbsX >= 0 &&
              nearAbsX < output.width &&
              nearAbsY >= 0 &&
              nearAbsY < output.height &&
              !(nearAbsY >= y && nearAbsX >= x)
            ) {
              nearColors.push({
                x: nearX,
                y: nearX,
                color: getPixel(nearAbsX, nearAbsY, {
                  width: output.width,
                  data: dataArray,
                }),
              });
            }
          }
        }

        let nearList: { color: number; count: number }[] = [];
        for (const nearColor of nearColors) {
          const colorData = colors.find(
            (colorData) => colorData.color === nearColor.color
          );
          const list = colorData?.nears
            .find((near) => near.x === -nearColor.x && near.y === -nearColor.y)
            ?.colors?.map((colors) => ({
              ...colors,
              count: colors.count / Math.abs(nearColor.x * nearColor.y),
            }));

          if (list) {
            nearList.push(...list);
          }
        }

        nearList = nearList.reduce((list, color) => {
          const item = list.find((item) => item.color === color.color);
          if (item) {
            item.count += color.count;
          } else {
            list.push(color);
          }
          return list;
        }, [] as typeof nearList);
        nearList.sort(sortColorCount);

        color = getRandomItem(nearList).color;
      }

      // Approximation color
      // dataArray[index] = (color >> 8) & 0xF
      // dataArray[index + 1] = (color >> 4) & 0xF
      // dataArray[index + 2] = (color) & 0xF
      // dataArray[index + 3] = 0xFF

      // Full color

      dataArray[index] = (color >> 16) & 0xff;
      dataArray[index + 1] = (color >> 8) & 0xff;
      dataArray[index + 2] = color & 0xff;
      dataArray[index + 3] = 0xff;
    }
  }
  console.timeEnd("Generate image colors");

  ctx.putImageData(new ImageData(dataArray, output.width), 0, 0);
}

async function start(input, output) {
  if (input.complete) {
    await process(input, output);
  } else {
    await new Promise((resolve) => {
      input.onload = () => resolve(process(input, output));
    });
  }
}

(async () => {
  await start(
    document.getElementById("input"),
    document.getElementById("output")
  );
  await start(
    document.getElementById("input-2"),
    document.getElementById("output-2")
  );
})();
