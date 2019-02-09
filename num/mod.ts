// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
export interface ClampConfig {
  min?: number;
  max?: number;
}

/**
 * Clamps a number between a minimum and maximum value
 * @param {number} number - The input number
 * @param {Object} config - A ClampConfig
 * @param {number} [min] - The minimum value. Defaults to negative infinity.
 * @param {number} [max] - The maximum value. Defaults to positive infinity.
 */
export function clamp(number: number, config: ClampConfig): number {
  let { max, min } = config;

  if (max === undefined) {
    max = Number.POSITIVE_INFINITY;
  }

  if (min === undefined) {
    min = Number.NEGATIVE_INFINITY;
  }

  if (max < min || (max === min && Object.is(max, -0))) {
    let tmp = max;
    max = min;
    min = tmp;
  }

  if (number === 0 && min === 0) {
    return Object.is(min, -0) ? number : min;
  } else if (number === 0 && max === 0) {
    return Object.is(max, -0) ? max : number;
  } else {
    number = number > max ? max : number;
    number = number < min ? min : number;
    return number;
  }
}
