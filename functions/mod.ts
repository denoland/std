// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Pure functions for common tasks around collection types like arrays and
 * objects.
 *
 * Inspired by
 * {@link https://kotlinlang.org/api/latest/jvm/stdlib/kotlin.collections/ | Kotlin's Collections}
 * package and {@link https://lodash.com/ | Lodash}.
 *
 * ```ts
 * import { intersect, sample, pick } from "@std/collections";
 * import { assertEquals, assertArrayIncludes } from "@std/assert";
 *
 * const lisaInterests = ["Cooking", "Music", "Hiking"];
 * const kimInterests = ["Music", "Tennis", "Cooking"];
 *
 * assertEquals(intersect(lisaInterests, kimInterests), ["Cooking", "Music"]);
 *
 * assertArrayIncludes(lisaInterests, [sample(lisaInterests)]);
 *
 * const cat = { name: "Lulu", age: 3, breed: "Ragdoll" };
 *
 * assertEquals(pick(cat, ["name", "breed"]), { name: "Lulu", breed: "Ragdoll"});
 * ```
 *
 * @module
 */

export * from "./curry.ts";
export * from "./pipe.ts";
