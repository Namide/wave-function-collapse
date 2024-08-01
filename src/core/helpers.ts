import { COLORS_WEIGHT } from "../config";

let time = Date.now();

/**
 * Add requestAnimationFrame if elapsed time > 1/60 sec and call1 callback
 */
export const pauseIfTooLong = async (callback?: () => void) => {
  const dt = Date.now() - time;
  if (dt >= 1000 / 60) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (callback) {
      callback();
    }
    time = Date.now();
  }
};

export async function loop(
  width: number,
  height: number,
  direction: "rb" | "br" | "lt" | "spiral",
  callback: (x: number, y: number, isFirst: boolean) => Promise<void>
) {
  switch (direction) {
    case "rb":
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          await callback(x, y, x === 0 && y === 0);
        }
      }
      break;
    case "lt":
      for (let x = width - 1; x > -1; x--) {
        for (let y = height - 1; y > -1; y--) {
          await callback(x, y, x === width - 1 && y === height - 1);
        }
      }
      break;
    case "br":
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          await callback(x, y, x === 0 && y === 0);
        }
      }
      break;
    case "spiral":
      {
        const DIRS = [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ];
        const pos = [Math.floor(width / 2), Math.floor(height / 2)];
        let distToDo = 1;
        let distDone = 0;
        let currentDir = 0;

        const done = {
          tl: false,
          tr: false,
          bl: false,
          br: false,
        };

        while (!done.tl || !done.tr || !done.bl || !done.br) {
          const inside =
            pos[0] > -1 && pos[0] < width && pos[1] > -1 && pos[1] < height;
          if (inside) {
            const isFirst =
              distToDo === 1 && distDone === 0 && currentDir === 0;
            await callback(pos[0], pos[1], isFirst);
          }

          if (distDone === Math.floor(distToDo)) {
            done.tl ||= pos[0] < 0 && pos[1] < 0;
            done.tr ||= pos[0] >= width && pos[1] < 0;
            done.bl ||= pos[0] < 0 && pos[1] >= height;
            done.br ||= pos[0] >= width && pos[1] >= height;

            currentDir = (currentDir + 1) % DIRS.length;
            distToDo += 0.5;
            distDone = 0;
          } else {
            pos[0] += DIRS[currentDir][0];
            pos[1] += DIRS[currentDir][1];
            distDone++;
          }
        }
      }
      break;
  }
}

export function getRandomItem<Item extends { count: number }>(items: Item[]) {
  if (COLORS_WEIGHT) {
    // Keep proportions
    const rand =
      (1 - Math.random() ** 1) *
      items.reduce((total, item) => total + item.count, 0);
    let add = 0;
    for (const item of items) {
      if (rand <= add + item.count) {
        return item;
      }
      add += item.count;
    }
  }

  // Force big variations
  return items[Math.floor(Math.random() * items.length)];
}

export function sortColorCount<Item extends { count: number }>(
  a: Item,
  b: Item
) {
  return b.count - a.count;
}

export function uintColorToString(color: number) {
  return color === -2
    ? "wall"
    : color === -1
    ? "empty"
    : "#" + color.toString(16);
}

export function errorToColor(error: number) {
  return error === 0
    ? 0x00ff00
    : 0x000000 + 0x010000 * error * 4 + 0x00ff00 - 0x000100 * error * 4;
}

export function getTotalErrors(errorMap: number[][]) {
  return errorMap.flat(2).reduce((total, count) => total + count, 0);
}
