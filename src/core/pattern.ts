import { NEAR } from "../config";
import type { Pattern } from "../types";

export function getPatternColors(
  x: number,
  y: number,
  colorGrid: number[][],
  {
    importantBorder,
    loopX,
    loopY,
  }: {
    importantBorder: boolean;
    loopX: boolean;
    loopY: boolean;
  }
) {
  let patternColors: number[] = [];
  const imageWidth = colorGrid.length;
  const imageHeight = colorGrid[0].length;
  for (let nearY = -NEAR; nearY <= NEAR; nearY++) {
    for (let nearX = -NEAR; nearX <= NEAR; nearX++) {
      if (nearX === 0 && nearY === 0) {
        // don't keep central color
      } else {
        let nearAbsX = x + nearX;
        let nearAbsY = y + nearY;

        // Loop to other side
        nearAbsX = loopX ? (nearAbsX + imageWidth) % imageWidth : nearAbsX;
        nearAbsY = loopY ? (nearAbsY + imageHeight) % imageHeight : nearAbsY;

        // Test all colors
        if (
          nearAbsX < 0 ||
          nearAbsX >= colorGrid.length ||
          nearAbsY < 0 ||
          nearAbsY >= colorGrid[nearAbsX].length
        ) {
          // Out of the screen
          patternColors.push(importantBorder ? -2 : -1);
        } else {
          // Get color for pattern
          patternColors.push(colorGrid[nearAbsX][nearAbsY]);
        }
      }
    }
  }
  return patternColors;
}

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

export function testPatternScore(patternColors: number[], pattern: Pattern) {
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

export function errasePattern(patternColors: number[]) {
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
