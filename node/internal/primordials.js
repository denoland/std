// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

export const ArrayIsArray = Array.isArray;
export const ArrayPrototypeForEach = (that, ...args) => that.forEach(...args);
export const ArrayPrototypeIncludes = (that, ...args) => that.includes(...args);
export const ArrayPrototypeJoin = (that, ...args) => that.join(...args);
export const ArrayPrototypePush = (that, ...args) => that.push(...args);
export const ArrayPrototypeSome = (that, ...args) => that.some(...args);
export const ObjectAssign = Object.assign;
export const RegExpPrototypeTest = (that, ...args) => that.test(...args);
export const StringFromCharCode = String.fromCharCode;
export const StringPrototypeCharCodeAt = (that, ...args) =>
  that.charCodeAt(...args);
export const StringPrototypeEndsWith = (that, ...args) =>
  that.endsWith(...args);
export const StringPrototypeIncludes = (that, ...args) =>
  that.includes(...args);
export const StringPrototypeReplace = (that, ...args) => that.replace(...args);
export const StringPrototypeSlice = (that, ...args) => that.slice(...args);
export const StringPrototypeSplit = (that, ...args) => that.split(...args);
export const StringPrototypeStartsWith = (that, ...args) =>
  that.startsWith(...args);
