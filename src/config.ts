/**
 * Distance pixels for pattern recognize
 * - 1 pixel arround (will check 8 pixels)
 * - 2 pixel arround (will check 24 pixels)
 * - ...
 */
export const NEAR = 3;

/**
 * Use aproximative color or real color.
 * Can not use real color if too mush colors in image
 */
export const REAL_COLOR = false;

/**
 * Disable colors proportions
 */
export const COLORS_WEIGHT = true;

/**
 * Number of pass
 */
export const EXTRA_PASS = 10;
