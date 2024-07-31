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
  direction: "rb" | "br" | "lt",
  callback: (x: number, y: number, isFirst: boolean) => Promise<void>
) {
  if (direction === "rb") {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        await callback(x, y, x === 0 && y === 0);
      }
    }
  } else if (direction === "lt") {
    for (let x = width - 1; x > -1; x--) {
      for (let y = height - 1; y > -1; y--) {
        await callback(x, y, x === width - 1 && y === height - 1);
      }
    }
  } else if (direction === "br") {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        await callback(x, y, x === 0 && y === 0);
      }
    }
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
