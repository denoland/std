// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/**
 * Do a deep assign of objects
 * Object.assign() only do shallow assign
 * @param target Object receiving the assign
 * @param sources array of objects to be merged in
 */
export function deepAssign(target: object, ...sources: object[]): object {
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    if (!source || typeof source !== `object`) {
      return;
    }
    Object.entries(source).forEach(
      ([key, value]): void => {
        if (value instanceof Date) {
          target[key] = new Date(value);
          return;
        }
        if (!value || typeof value !== `object`) {
          target[key] = value;
          return;
        }
        if (Array.isArray(value)) {
          target[key] = [];
        }
        // value is an Object
        if (typeof target[key] !== `object` || !target[key]) {
          target[key] = {};
        }
        deepAssign(target[key], value);
      }
    );
  }
  return target;
}
