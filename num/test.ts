// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test, assertEqual, assert } from "../testing/mod.ts";
import {isNegativeZero, clamp} from "mod.ts";

test(function checkNegativeZero() {
    assertEqual(isNegativeZero(-0), true);
    assertEqual(isNegativeZero(+0), false);
    assertEqual(isNegativeZero(-1), false);
    assertEqual(isNegativeZero(+1), false);
    assertEqual(isNegativeZero(Number.NEGATIVE_INFINITY), false);
    assertEqual(isNegativeZero(Number.POSITIVE_INFINITY), false);
    assertEqual(isNegativeZero(NaN), false);
});

test(function clampNumber() {
    // Numbers between ranges go untouched

    assertEqual(
        clamp(50, {min: 25, max: 75}),
        50
    );

    assertEqual(
        clamp(-50, {min: -75, max: -25}),
        -50
    );

    assertEqual(
        isNegativeZero(clamp(0, {min: -0, max: 100})),
        false
    );

    assertEqual(
        clamp(Number.MAX_SAFE_INTEGER, {min: 0, max: Infinity}),
        Number.MAX_SAFE_INTEGER
    );

    assertEqual(
        clamp(Number.MIN_SAFE_INTEGER, {min: Number.NEGATIVE_INFINITY, max: 0}),
        Number.MIN_SAFE_INTEGER
    );

    // Numbers below range are bumped upwards

    assertEqual(
        clamp(0, {min: 25, max: 75}),
        25
    );

    assertEqual(
        clamp(-50, {min: 0, max: 50}),
        0
    );

    assertEqual(
        clamp(Number.NEGATIVE_INFINITY, {min: Number.MIN_SAFE_INTEGER, max: 0}),
        Number.MIN_SAFE_INTEGER
    );

    assertEqual(
        isNegativeZero(clamp(-0, {min: 0, max: 100})),
        false
    );

    // Numbers above range are bumped downwards

    assertEqual(
        clamp(100, {min: 25, max: 75}),
        75
    );

    assertEqual(
        clamp(-10, {min: -75, max: -25}),
        -25
    );

    assertEqual(
        isNegativeZero(clamp(+0, {min: -100, max: -0})),
        true
    );

    // NaN is left as is
    assertEqual(
        clamp(NaN, {min: 0, max: 100}), 
        NaN
    );

    // Swaps min & max if wrong way around

    assertEqual(
        clamp(75, {min: 50, max: 0}),
        50
    );

    assertEqual(
        clamp(75, {min: -50, max: -100}),
        -50
    );

    assertEqual(
        isNegativeZero(clamp(+0, {min: -0, max: -100})),
        true
    );

    // Min defaults to minus infinity
    
    assertEqual(
        clamp(Number.MIN_SAFE_INTEGER, {max: 50}),
        Number.MIN_SAFE_INTEGER
    );

    // Max defaults to plus infinity

    assertEqual(
        clamp(Number.MAX_SAFE_INTEGER, {min: 0}),
        Number.MAX_SAFE_INTEGER
    );

    // If min & max equal, returns it
    assertEqual(
        clamp(100, {min: 50, max: 50}),
        50
    );
})