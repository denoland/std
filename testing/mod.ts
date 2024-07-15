// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * This package provides utilities for testing.
 *
 * - {@link https://jsr.io/@std/testing/doc/bdd/~ | BDD style testing}
 * - {@link https://jsr.io/@std/testing/doc/mock/~ | Test doubles (mocking)}
 * - {@link https://jsr.io/@std/testing/doc/time/~ | Faking time and timers}
 * - {@link https://jsr.io/@std/testing/doc/snapshot/~ | Snapshot testing}
 * - {@link https://jsr.io/@std/testing/doc/types/~ | Type assertions}
 *
 * ```ts no-assert
 * import { assertSpyCalls, spy, FakeTime } from "@std/testing";
 *
 * function secondInterval(cb: () => void): number {
 *   return setInterval(cb, 1000);
 * }
 *
 * Deno.test("secondInterval calls callback every second and stops after being cleared", () => {
 *   using time = new FakeTime();
 *
 *   const cb = spy();
 *   const intervalId = secondInterval(cb);
 *   assertSpyCalls(cb, 0);
 *   time.tick(500);
 *   assertSpyCalls(cb, 0);
 *   time.tick(500);
 *   assertSpyCalls(cb, 1);
 *   time.tick(3500);
 *   assertSpyCalls(cb, 4);
 *
 *   clearInterval(intervalId);
 *   time.tick(1000);
 *   assertSpyCalls(cb, 4);
 * });
 * ```
 *
 * @module
 */
export * from "./bdd.ts";
export * from "./mock.ts";
export * from "./snapshot.ts";
export * from "./time.ts";
export * from "./types.ts";
