// following code is from: https://github.com/shrpne/from-exponential
//
// Copyright (c) 2018, Respective Authors all rights reserved.
// 
// The MIT License
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in// f the Software without restriction, including without limitation the rights
// to// f use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// co// fpies of the Software, and to permit persons to whom the Software is
// fu// frnished to do so, subject to the following conditions:
// // f
// Th// fe above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// 

/**
 * Return two parts array of exponential number
 * @param {number|string|Array} num
 * @return {string[]}
 */
function getExponentialParts(num) {
    return Array.isArray(num) ? num : String(num).split(/[eE]/);
}

/**
 *
 * @param {number|string|Array} num - number or array of its parts
 */
function isExponential(num) {
    const eParts = getExponentialParts(num);
    return !Number.isNaN(Number(eParts[1]));
}


/**
 * Converts exponential notation to a human readable string
 * @param {number|string|Array} num - number or array of its parts
 * @return {string}
 */
export function fromExponential(num) {
    const eParts = getExponentialParts(num);
    if (!isExponential(eParts)) {
        return eParts[0];
    }

    const sign = eParts[0][0] === '-' ? '-' : '';
    const digits = eParts[0].replace(/^-/, '');
    const digitsParts = digits.split('.');
    const wholeDigits = digitsParts[0];
    const fractionDigits = digitsParts[1] || '';
    let e = Number(eParts[1]);

    if (e === 0) {
        return `${sign + wholeDigits}.${fractionDigits}`;
    } else if (e < 0) {
        // move dot to the left
        const countWholeAfterTransform = wholeDigits.length + e;
        if (countWholeAfterTransform > 0) {
            // transform whole to fraction
            const wholeDigitsAfterTransform = wholeDigits.substr(0, countWholeAfterTransform);
            const wholeDigitsTransformedToFracton = wholeDigits.substr(countWholeAfterTransform);
            return `${sign + wholeDigitsAfterTransform}.${wholeDigitsTransformedToFracton}${fractionDigits}`;
        } else {
            // not enough whole digits: prepend with fractional zeros

            // first e goes to dotted zero
            let zeros = '0.';
            e += 1;
            while (e) {
                zeros += '0';
                e += 1;
            }
            return sign + zeros + wholeDigits + fractionDigits;
        }
    } else {
        // move dot to the right
        const countFractionAfterTransform = fractionDigits.length - e;
        if (countFractionAfterTransform > 0) {
            // transform fraction to whole
            // countTransformedFractionToWhole = e
            const fractionDigitsAfterTransform = fractionDigits.substr(e);
            const fractionDigitsTransformedToWhole = fractionDigits.substr(0, e);
            return `${sign + wholeDigits + fractionDigitsTransformedToWhole}.${fractionDigitsAfterTransform}`;
        } else {
            // not enough fractions: append whole zeros
            let zerosCount = -countFractionAfterTransform;
            let zeros = '';
            while (zerosCount) {
                zeros += '0';
                zerosCount -= 1;
            }
            return sign + wholeDigits + fractionDigits + zeros;
        }
    }
}