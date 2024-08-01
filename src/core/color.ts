import type { Color, Options } from "../types";
import { getRandomItem, sortColorCount } from "./helpers";
import { getPatternColors, testPatternScore } from "./pattern";

export function searchBestColor(
  x: number,
  y: number,
  colors: Color[],
  newColorGrid: number[][],
  // errorsMap: number[][],
  retry: boolean,
  options: Options
) {
  // Get current pattern
  let patternColors = getPatternColors(x, y, newColorGrid, options);

  // Get all colors with this pattern
  let filteredColors = colors.map(({ color, count, patterns }) => {
    const patternData = patterns.map((pattern) => {
      const score = testPatternScore(patternColors, pattern);
      return {
        score,
        count: pattern.count,
      };
    });
    const maxScore = patternData.reduce(
      (max, { score }) => Math.max(max, score),
      0
    );
    return { score: maxScore, color, count };
  });

  filteredColors.sort((a, b) => b.score - a.score);
  filteredColors = filteredColors.filter(
    (item) => item.score === filteredColors[0].score
  );

  // const errors = (NEAR * 2 + 1) ** 2 - 1 - filteredColors[0].score;
  // if (errors > 0) {
  //   setErrorsOnMap(errorsMap, newColorGrid, x, y, errors);
  // }

  // setErrorsOnMap(errorsMap, newColorGrid, x, y);

  // // Randomize if no patterns found
  // if (filteredColors.length === 0 && retry) {
  //   setErrorsOnMap(errorsMap, newColorGrid, x, y);

  //   // let goodColorsIndex = [-1];
  //   while (
  //     filteredColors.length === 0 &&
  //     patternColors.filter((color) => color > -1).length > 0
  //   ) {
  //     // && goodColorsIndex.length > 0) {
  //     patternColors = errasePattern(patternColors);
  //     /* errorsMap[x][y]++;
  //     goodColorsIndex = patternColors
  //       .map((color, index) => (color > -1 ? index : -1))
  //       .filter((code) => code > -1);
  //     patternColors[
  //       goodColorsIndex[Math.floor(Math.random() * goodColorsIndex.length)]
  //     ] = -1;
  //     filteredColors = colors.filter((color) =>
  //       color.patterns.find((pattern) =>
  //         testPatternColors(patternColors, pattern, false)
  //       )
  //     ); */
  //   }

  //   if (filteredColors.length === 0) {
  //     errorsMap[x][y]++;
  //     filteredColors = [getRandomItem(colors)];
  //   }
  // } else if (!retry) {
  //   // Keep old color if no force solutions
  //   setErrorsOnMap(errorsMap, newColorGrid, x, y);
  //   return newColorGrid[x][y];
  // }

  // filteredColors.map((colorData) => {
  //   const patterns = colorData.patterns.filter((pattern) =>
  //     testPatternColors(patternColors, pattern, false)
  //   );
  //   return {
  //     color: colorData.color,
  //     patterns,
  //     count: patterns.reduce(
  //       (total, pattern) => total + pattern.count,
  //       colorData.count
  //     ),
  //   };
  // });

  filteredColors.sort(sortColorCount);

  return getRandomItem(filteredColors).color;
}
