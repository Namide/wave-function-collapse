/**
 * Distance pixels for pattern recognize
 * - 1 pixel arround (will check 8 pixels)
 * - 2 pixel arround (will check 24 pixels)
 * - ...
 */
export const NEAR = 3;

/**
 * Use aproximative color or real color.
 * Can not use real color if too mush colors in image.
 * - 1 = real color
 * - 8 = 8x less colors
 * - 16 = 16x less colors (#FFFFFF => #FFF)
 */
export const COLOR_ACCURACY: 1 | 8 | 16 = 8;

/**
 * Disable colors proportions
 */
export const COLORS_WEIGHT = true;

/**
 * Number of pass to clean the image
 */
export const MAX_EXTRA_PASS = 10;

/**
 * Change near for each pass
 */
export const COMPLEX_EXTRA_PASS = false;
