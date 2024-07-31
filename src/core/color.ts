import type { Color } from "../types";
import { setErrorsOnMap } from "./error";
import { getRandomItem, sortColorCount } from "./helpers";
import { errasePattern, getPatternColors, testPatternColors } from "./pattern";

export function searchBestColor(
  x: number,
  y: number,
  colors: Color[],
  newColorGrid: number[][],
  errorsMap: number[][],
  importantBorder: boolean,
  retry: boolean
) {
  // Get current pattern
  let patternColors = getPatternColors(x, y, newColorGrid, {
    importantBorder,
  });

  // Get all colors with this pattern
  let filteredColors = colors.filter((color) =>
    color.patterns.find((pattern) =>
      testPatternColors(patternColors, pattern, false)
    )
  );

  // Randomize if no patterns found
  if (filteredColors.length === 0 && retry) {
    setErrorsOnMap(errorsMap, newColorGrid, x, y);

    // let goodColorsIndex = [-1];
    while (
      filteredColors.length === 0 &&
      patternColors.filter((color) => color > -1).length > 0
    ) {
      // && goodColorsIndex.length > 0) {
      patternColors = errasePattern(patternColors);
      /* errorsMap[x][y]++;
      goodColorsIndex = patternColors
        .map((color, index) => (color > -1 ? index : -1))
        .filter((code) => code > -1);
      patternColors[
        goodColorsIndex[Math.floor(Math.random() * goodColorsIndex.length)]
      ] = -1;
      filteredColors = colors.filter((color) =>
        color.patterns.find((pattern) =>
          testPatternColors(patternColors, pattern, false)
        )
      ); */
    }

    if (filteredColors.length === 0) {
      errorsMap[x][y]++;
      filteredColors = [getRandomItem(colors)];
    }
  } else if (!retry) {
    // Keep old color if no force solutions
    setErrorsOnMap(errorsMap, newColorGrid, x, y);
    return newColorGrid[x][y];
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

  return getRandomItem(filteredColors).color;
}
