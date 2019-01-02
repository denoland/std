// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/** Generates naive 42-character unique ID  */
export function generateID() {
  return new Date().toJSON() + Math.random();
}
