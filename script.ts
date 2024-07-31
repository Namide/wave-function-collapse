const NEAR = 2;
const REAL_COLOR = false;

type Color = {
  color: number /* top right color */;
  count: number;
  patterns: Pattern[];
};

type Pattern = {
  colors: number[]; // square colors
  count: number;
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
    (1 - Math.random() ** 2) *
    items.reduce((total, item) => total + item.count, 0);
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

function testPatternColors(
  patternColors: number[],
  pattern: Pattern,
  exact = false
) {
  for (let i = 0; i < patternColors.length; i++) {
    if (exact && patternColors[i] !== pattern.colors[i]) {
      return false;
    }
    if (
      !exact &&
      patternColors[i] !== -1 &&
      pattern.colors[i] !== -1 &&
      patternColors[i] !== pattern.colors[i]
    ) {
      return false;
    }
  }
  return true;
}

function addPattern(patternColors: number[], patterns: Pattern[]) {
  let near = patterns.find((pattern) =>
    testPatternColors(patternColors, pattern, true)
  );
  if (!near) {
    near = { count: 1, colors: patternColors };
    patterns.push(near);
  } else {
    near.count++;
  }
}

function sortColorCount<Item extends { count: number }>(a: Item, b: Item) {
  return b.count - a.count;
}

function getPatternColors(
  x: number,
  y: number,
  imageData: { width: number; height: number; data: Uint8ClampedArray }
) {
  let patternColors: number[] = [];
  for (let nearX = -NEAR; nearX <= 0; nearX++) {
    for (let nearY = -NEAR; nearY <= 0; nearY++) {
      if (!(nearX === 0 && nearY === 0)) {
        const nearAbsX = x + nearX;
        const nearAbsY = y + nearY;
        if (
          nearAbsX >= 0 &&
          nearAbsX < imageData.width &&
          nearAbsY >= 0 &&
          nearAbsY < imageData.height
        ) {
          patternColors.push(getPixel(nearAbsX, nearAbsY, imageData));
        } else {
          patternColors.push(-2);
        }
      }
    }
  }
  return patternColors;
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
          patterns: [],
        };
        colors.push(colorData);
      } else {
        colorData.count++;
      }

      if (!topLeftColor) {
        topLeftColor = colorData;
      }

      const patternColors = getPatternColors(x, y, imageData);
      addPattern(patternColors, colorData.patterns);
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
    colorData.patterns.sort(sortColorCount);
  }
  console.timeEnd("Sort image colors");

  console.time("Generate image colors");
  const dataArray = new Uint8ClampedArray(output.width * output.height * 4);
  const fakeImageData = {
    width: output.width,
    height: output.height,
    data: dataArray,
  };

  for (let y = 0; y < output.height; y++) {
    for (let x = 0; x < output.width; x++) {
      await pauseIfTooLong(() =>
        ctx.putImageData(new ImageData(dataArray, output.width), 0, 0)
      );

      let color = -1;
      if (x === 0 && y === 0) {
        color = topLeftColor.color;
      } else {
        const patternColors = getPatternColors(x, y, fakeImageData);
        let filteredColors = colors.filter((color) =>
          color.patterns.find((pattern) =>
            testPatternColors(patternColors, pattern, false)
          )
        );

        while (filteredColors.length === 0) {
          patternColors[Math.floor(Math.random() * patternColors.length)] = -1;
          filteredColors = colors.filter((color) =>
            color.patterns.find((pattern) =>
              testPatternColors(patternColors, pattern, false)
            )
          );
        }

        filteredColors.map((colorData) => {
          const patterns = colorData.patterns.filter((pattern) =>
            testPatternColors(patternColors, pattern, false)
          );
          return {
            color: colorData.color,
            patterns,
            count: patterns.reduce(
              (total, pattern) => total + pattern.count,
              colorData.count
            ),
          };
        });
        filteredColors.sort(sortColorCount);

        color = getRandomItem(filteredColors).color;
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
  const div = document.createElement("div");
  document.body.appendChild(div);
  const img = document.createElement("img");
  img.setAttribute("src", src);
  div.appendChild(img);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  div.appendChild(canvas);

  await new Promise((resolve) => {
    img.onload = () => resolve(process(img, canvas));
  });
}

(async () => {
  await start("assets/cave.png", { width: 128, height: 32 });
  await start("assets/square-2.png", { width: 64, height: 64 });
  await start("assets/square.png", { width: 32, height: 32 });
  await start("assets/flowers.png", { width: 64, height: 64 });
  await start("assets/houses.png", { width: 64, height: 64 });
  await start("assets/infinity.png", { width: 64, height: 64 });
  await start("assets/triangles.png", { width: 64, height: 64 });
  await start("assets/wall.png", { width: 64, height: 64 });
  await start("assets/input-4.png", { width: 128, height: 128 });
  await start("assets/input-5.png", { width: 128, height: 128 });
})();
