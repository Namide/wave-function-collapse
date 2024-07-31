import { NEAR } from "../config";

export function setErrorsOnMap(
  errorsMap: number[][],
  newColorGrid: number[][],
  x: number,
  y: number
) {
  for (let nearX = -NEAR; nearX <= NEAR; nearX++) {
    for (let nearY = -NEAR; nearY <= NEAR; nearY++) {
      if (nearX === 0 && nearY === 0) {
        errorsMap[x][y] = 1;
      } else {
        const nearAbsX = x + nearX;
        const nearAbsY = y + nearY;

        // Test all colors
        if (
          nearAbsX < 0 ||
          nearAbsX >= newColorGrid.length ||
          nearAbsY < 0 ||
          nearAbsY >= newColorGrid[x].length
        ) {
          // Out of the screen
        } else {
          // Get color for pattern
          if (newColorGrid[nearAbsX][nearAbsY] > -1) {
            errorsMap[nearAbsX][nearAbsY]++;
          }
        }
      }
    }
  }
}
