// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { sumOf } from "./sum_of.ts";

Deno.test("[collections/sumOf] On object properties", () => {
    const object = [
        { name: "Kyle", age: 34 },
        { name: "John", age: 42 },
        { name: "Anna", age: 23 },
    ]

    const actual = sumOf(object, i => i.age);

    assertEquals(actual, 99);
})

Deno.test("[collections/sumOf] Add 2 to each num", () => {
    const array = [1, 2, 3];

    const actual = sumOf(array, i => i + 2);

    assertEquals(actual, 12);
})

Deno.test("[collections/sumOf] Regular sum", () => {
    const array = [1, 2, 3];
    
    const actual = sumOf(array, i => i);

    assertEquals(actual, 6);
})