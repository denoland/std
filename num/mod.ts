// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
export interface ClampConfig {
    min?: number,
    max?: number
}

 /**
 * Clamps a number between a minimum and maximum value
 * @param {number} number - The input number
 * @param {Object} config - A ClampConfig
 * @param {number} [min] - The minimum value. Defaults to negative infinity.
 * @param {number} [max] - The maximum value. Defaults to positive infinity.
 */
export function clamp(number: number, config: ClampConfig): number {
    let {max, min} = config;

    if (max === undefined) {
        max = Number.POSITIVE_INFINITY;
    }

    if (min === undefined) {
        min = Number.NEGATIVE_INFINITY;
    }

    if (max < min || (max === 0 && isNegativeZero(max))) {
        let tmp = max;
        max = min;
        min = tmp;
    }

    // If number & max are both zero, make sure a maximum of negative zero is respected
    if (number === max && max === 0 && isNegativeZero(max)) {
        number = max;
    }

    if (number > max) {
        number = max;
    }

    // Similarly, if number and min are both zero, make sure a minimum of positive zero is respected
    if (number === min && min === 0 && !isNegativeZero(min)) {
        number = min;
    }

    if (number < min) {
        number = min;
    }

    return number;
}

/**
 * Is this number negative zero?
 * @param {number} number - Number to test 
 */
export function isNegativeZero(number: number): boolean {
    return 1 / number === Number.NEGATIVE_INFINITY;
}