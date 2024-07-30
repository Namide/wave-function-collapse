const NEAR = 2;
// const DIAGONALS = false;
const REAL_COLOR = false;

type Color = { color: number; count: number; nears: Near[] };

type Near = {
  colors: { color: number; count: number }[];
  x: number;
  y: number;
};

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

  if (REAL_COLOR) {
    // Full color
    return (data[index] << 16) | (data[index + 1] << 8) | data[index + 2];
  } else {
    // Approximation color
    return (
      (((data[index] >> 4) & 0xf) << 20) |
      (((data[index + 1] >> 4) & 0xf) << 12) |
      (((data[index + 2] >> 4) & 0xf) << 4)
    );
  }
}

function addNear(color: number, nears: Near[], x: number, y: number) {
  let near = nears.find((n) => n.x === x && n.y === y);
  if (!near) {
    near = { x, y, colors: [] };
    nears.push(near);
  }

  const colorData = near.colors.find((data) => data.color === color);
  if (colorData) {
    colorData.count++;
  } else {
    near.colors.push({ color, count: 1 });
  }
}

function sortColorCount<Item extends { count: number }>(a: Item, b: Item) {
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
  let topLeftColor: Color;
  for (let x = 0; x < imageData.width; x++) {
    for (let y = 0; y < imageData.height; y++) {
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

      if (!topLeftColor) {
        topLeftColor = colorData;
      }

      for (let nearX = 0; nearX <= NEAR; nearX++) {
        for (let nearY = 0; nearY <= NEAR; nearY++) {
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

  return { colors, topLeftColor };
}

async function process(input: HTMLImageElement, output: HTMLCanvasElement) {
  output.width = output.width || input.width;
  output.height = output.height || input.height;

  const ctx = output.getContext("2d");

  console.time("Extract image colors");
  const { colors, topLeftColor } = await extractColorList(input);
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

      if (x === 0 && y === 0) {
        color = topLeftColor.color;
      } else {
        const nearColors: { x: number; y: number; color: number }[] = [];
        for (let nearX = -NEAR; nearX <= 0; nearX++) {
          for (let nearY = -NEAR; nearY <= 0; nearY++) {
            const nearAbsX = x + nearX;
            const nearAbsY = y + nearY;

            if (
              nearAbsX >= 0 &&
              nearAbsY >= 0 &&
              nearAbsX <= x &&
              !(nearAbsY === y && nearAbsX === x)
            ) {
              nearColors.push({
                x: nearX,
                y: nearY,
                color: getPixel(nearAbsX, nearAbsY, {
                  width: output.width,
                  data: dataArray,
                }),
              });
            }
          }
        }

        let nearList: { color: number; count: number }[][] = [];
        for (const nearColor of nearColors) {
          const colorData = colors.find(
            (colorData) => colorData.color === nearColor.color
          );

          const list = colorData?.nears.find(
            (near) => near.x === -nearColor.x && near.y === -nearColor.y
          )?.colors;

          if (list && list.length > 0) {
            nearList.push(list);
          }
        }

        let cleanList = nearList.reduce((fullList, addList, index) => {
          if (index === 0) {
            return fullList;
          }
          const newList = fullList
            .filter((item) => addList.find((it) => item.color === it.color))
            .map((item) => ({
              ...item,
              count:
                item.count +
                addList.find((it) => item.color === it.color).count,
            }));
          return newList;
        }, nearList[0]);

        // Fallback if not found
        if (cleanList.length === 0) {
          cleanList = nearList.flat(2).reduce((list, color) => {
            const item = list.find((item) => item.color === color.color);
            if (item) {
              item.count += color.count;
            } else {
              list.push(color);
            }
            return list;
          }, [] as typeof cleanList);
        }

        cleanList.sort(sortColorCount);

        color = getRandomItem(cleanList).color;
      }

      const index = (x + y * output.width) * 4;
      dataArray[index] = (color >> 16) & 0xff;
      dataArray[index + 1] = (color >> 8) & 0xff;
      dataArray[index + 2] = color & 0xff;
      dataArray[index + 3] = 0xff;
    }
  }
  console.timeEnd("Generate image colors");

  ctx.putImageData(new ImageData(dataArray, output.width), 0, 0);
}

async function start(src, { width, height }) {
  const img = document.createElement("img");
  img.setAttribute("src", src);
  document.body.appendChild(img);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  document.body.appendChild(document.createElement("br"));

  await new Promise((resolve) => {
    img.onload = () => resolve(process(img, canvas));
  });
}

(async () => {
  await start("assets/cave.png", { width: 128, height: 32 });
  await start("assets/square-2.png", { width: 128, height: 128 });
  await start("assets/square.png", { width: 32, height: 32 });
  await start("assets/input-4.png", { width: 128, height: 128 });
  await start("assets/input-5.png", { width: 128, height: 128 });
})();
