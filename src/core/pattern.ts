import { NEAR } from "../config";
import type { Options, Pattern } from "../types";

/**
 * List of colors arround
 */
export function getPatternColors(
  x: number,
  y: number,
  colorGrid: number[][],
  options: Options
) {
  let patternColors: number[] = [];
  const imageWidth = colorGrid.length;
  const imageHeight = colorGrid[0].length;
  for (let nearY = -options.near; nearY <= options.near; nearY++) {
    for (let nearX = -options.near; nearX <= options.near; nearX++) {
      if (nearX === 0 && nearY === 0) {
        // don't keep central color
      } else {
        let nearAbsX = x + nearX;
        let nearAbsY = y + nearY;

        // Loop to other side
        nearAbsX = options.loopX
          ? (nearAbsX + imageWidth) % imageWidth
          : nearAbsX;
        nearAbsY = options.loopY
          ? (nearAbsY + imageHeight) % imageHeight
          : nearAbsY;

        // Test all colors
        if (
          nearAbsX < 0 ||
          nearAbsX >= colorGrid.length ||
          nearAbsY < 0 ||
          nearAbsY >= colorGrid[nearAbsX].length
        ) {
          // Out of the screen
          patternColors.push(options.importantBorder ? -2 : -1);
        } else {
          // Get color for pattern
          patternColors.push(colorGrid[nearAbsX][nearAbsY]);
        }
      }
    }
  }
  return patternColors;
}

/**
 * List of colors arround
 */
export function createSymetricPatternColors(
  patternColors: number[],
  symmetryX: boolean,
  symmetryY: boolean,
  options: Options
) {
  const infos: { i: number; color: number; x: Number; y: number }[] = [];
  let i = 0;
  for (let y = -options.near; y <= options.near; y++) {
    for (let x = -options.near; x <= options.near; x++) {
      if (x === 0 && y === 0) {
        // don't keep central color
      } else {
        infos.push({ i, x, y, color: patternColors[i] });
        i++;
      }
    }
  }

  let newPatternColors: number[] = [];
  for (let y = -options.near; y <= options.near; y++) {
    for (let x = -options.near; x <= options.near; x++) {
      if (x === 0 && y === 0) {
        // don't keep central color
      } else {
        const otherX = symmetryX ? -x : x;
        const otherY = symmetryY ? -y : y;

        newPatternColors.push(
          infos.find((info) => info.x === otherX && info.y === otherY)!.color
        );
      }
    }
  }

  return newPatternColors;
}

/**
 * Add pattern to list if not exist
 */
export function addPattern(patternColors: number[], patterns: Pattern[]) {
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

/**
 * Check patters similarities
 */
export function testPatternColors(
  patternColors: number[],
  pattern: Pattern,
  exact = false
) {
  for (let i = 0; i < patternColors.length; i++) {
    if (exact && patternColors[i] !== pattern.colors[i]) {
      // need exact same colors and borders
      return false;
    } else if (
      !exact &&
      patternColors[i] !== -1 &&
      pattern.colors[i] !== -1 &&
      patternColors[i] !== pattern.colors[i]
    ) {
      // If not same for defined pixels
      return false;
    }
  }
  return true;
}

/**
 * Big score between patterns is similar patterns.
 */
export function getPatternScore(patternColors: number[], pattern: Pattern) {
  let score = 0;
  const width = NEAR * 2 + 1;
  const maxDistance = Math.sqrt(NEAR * NEAR + NEAR * NEAR);
  for (let i = 0; i < patternColors.length; i++) {
    if (patternColors[i] === pattern.colors[i] && patternColors[i] !== -1) {
      score++;
    } else if (patternColors[i] === -1 || pattern.colors[i] === -1) {
      score++;
    } else {
      const nearX = (i % width) - NEAR;
      const nearY = Math.floor(i / width);

      // 0 = near ; 1 = far
      const distance = Math.sqrt(nearX * nearX + nearY * nearY) / maxDistance;
      score -= 1 - distance;
    }
  }
  return score;
}

/**
 * Remove 1 far color from pattern
 */
export function errodePattern(patternColors: number[]) {
  let patternData: { color: number; distance: number; index: number }[] = [];
  let index = 0;
  for (let nearX = -NEAR; nearX <= NEAR; nearX++) {
    for (let nearY = -NEAR; nearY <= NEAR; nearY++) {
      if (nearX === 0 && nearY === 0) {
        // don't keep central color
      } else {
        const distance = Math.sqrt(nearX * nearX + nearY * nearY);
        patternData.push({ color: patternColors[index], distance, index });
        index++;
      }
    }
  }

  patternData.sort((a, b) => b.distance - a.distance);
  patternData = patternData.filter(({ color }) => color !== -1);

  return patternColors.map((color, index) =>
    index === patternData[0].index ? -1 : color
  );
}
