// Copyright 2018-2025 the Deno authors. MIT license.
import { assert } from "@std/assert";

/**
 * A 2d array. Unlike a normal array, it does not grow dynamically,
 * and needs to be manually resized with the {@linkcode D2Array.prototype.resize | `resize`} method.
 * It can never have the width or height be 0.
 *
 * @example Usage
 * ```ts
 * import { D2Array } from "@std/data-structures/unstable-2d-array";
 * import { assertEquals } from "@std/assert";
 *
 * const arr = new D2Array<boolean>(3, 3, false);
 * arr.raw[0]![0] = true; // set the top left to true
 * const slice = arr.slice(0, 0, 2, 2);
 * assertEquals(slice.width, 2);
 * assertEquals(slice.height, 2);
 * assertEquals(arr.raw[0]![0], true);
 *
 * arr.insert(0, 0, new D2Array<boolean>(2, 2, true)); // set all values from 0,0 to 1,1 to true
 *
 * for (const row of arr) {
 *   console.log(row);
 * }
 * ```
 *
 * @typeparam T The type of the values stored in the 2d array.
 */
export class D2Array<T> implements Iterable<T[]> {
  /** The initial value used when initializing or resizing the array
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   *
   * const arr = new D2Array<boolean>(3, 3, false);
   * assertEquals(arr.initialValue, false);
   * ```
   */
  initialValue: T;
  /** The raw underlying value
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   *
   * const arr = new D2Array<boolean>(3, 3, false);
   * assertEquals(arr.raw, [
   *   [false, false, false],
   *   [false, false, false],
   *   [false, false, false],
   * ]);
   * ```
   */
  raw: T[][];

  /**
   * Create a new blank 2d array with the provided value as init value
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   *
   * const arr = new D2Array<boolean>(3, 3, false);
   * assertEquals(arr.raw, [
   *   [false, false, false],
   *   [false, false, false],
   *   [false, false, false],
   * ]);
   * ```
   *
   * @param width The width of the 2d array
   * @param height The height of the 2d array
   * @param initialValue The value to use to initialize the 2d array, also used when resizing
   */
  constructor(width: number, height: number, initialValue: T);
  /**
   * Create a new 2d array from an existing array
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   *
   * const arr = new D2Array<boolean>([
   *   [false, false, false],
   *   [false, false, false],
   *   [false, false, false],
   * ], false);
   * assertEquals(arr.raw, [
   *   [false, false, false],
   *   [false, false, false],
   *   [false, false, false],
   * ]);
   * ```
   *
   * @param value The array to use
   * @param initialValue The value to use when resizing
   */
  constructor(value: readonly T[][], initialValue: T);
  /** implementation
   * TODO(kt3k): Remove this jsdoc when the issue below is resolved.
   * https://github.com/denoland/deno/issues/30037
   *
   * @param widthOrValue The width of the 2d array, or the array to use
   * @param heightOrInitialValue The height of the 2d array, or the initial value to use
   * @param initialValue The initial value to use when resizing the
   */
  constructor(
    widthOrValue: number | (readonly T[][]),
    heightOrInitialValue: number | T,
    initialValue?: T,
  ) {
    if (Array.isArray(widthOrValue)) {
      assert((widthOrValue.length) > 0, "Height must be greater than 0");
      assert((widthOrValue[0].length) > 0, "Width must be greater than 0");

      this.raw = [];

      for (let i = 0; i < widthOrValue.length; i++) {
        this.raw.push(widthOrValue[i]!.slice());
      }

      this.initialValue = heightOrInitialValue as T;
    } else {
      assert((widthOrValue as number) > 0, "Width must be greater than 0");
      assert(
        (heightOrInitialValue as number) > 0,
        "Height must be greater than 0",
      );

      this.raw = Array.from(
        { length: heightOrInitialValue as number },
        () => Array(widthOrValue as number).fill(initialValue as number),
      );
      this.initialValue = initialValue!;
    }
  }

  /**
   * Slice the 2D array. Like slice on a normal array, this will create a new D2Array.
   * If no arguments are specified, it will slice the entire D2Array.
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   *
   * const arr = new D2Array<boolean>(3, 3, false);
   * arr.raw[0]![0] = true; // set the top left to true
   * const slice = arr.slice(0, 0, 2, 2);
   * assertEquals(slice.width, 2);
   * assertEquals(slice.height, 2);
   * assertEquals(arr.raw[0]![0], true);
   * ```
   *
   * @param x 0-based index at which to start on the X axis (0 is left-most)
   * @param y 0-based index at which to start on the Y axis (0 is top-most)
   * @param width the amount of elements to take on the X axis
   * @param height the amount of elements to take on the X axis
   * @returns A new {@linkcode D2Array} containing the sliced values.
   */
  slice(
    x: number = 0,
    y: number = 0,
    width?: number,
    height?: number,
  ): D2Array<T> {
    const actualHeight = Math.min(height ?? Infinity, this.raw.length - y);
    const actualWidth = Math.min(width ?? Infinity, this.raw[0]!.length - x);

    assert((actualWidth as number) > 0, "Width must be greater than 0");
    assert((actualHeight as number) > 0, "Height must be greater than 0");

    const out: T[][] = [];

    for (let i = y; i < y + actualHeight; i++) {
      const row = this.raw[i]!;
      out.push(row.slice(x, x + actualWidth));
    }

    return new D2Array(out, this.initialValue);
  }

  /**
   * Resize the 2D array.
   * The origin for the resize is the top left corner, or rather the first element.
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   *
   * const arr = new D2Array<boolean>(3, 3, false);
   * arr.raw[0]![0] = true; // set the top left to true
   * arr.resize(2, 2);
   * assertEquals(arr.width, 2);
   * assertEquals(arr.height, 2);
   * assertEquals(arr.raw[0]![0], true);
   * ```
   *
   * @param width the new width of the 2d array.
   * If smaller than current width, the 2d array will lose items.
   * If larger than current width, the 2d array will add instances of {@linkcode D2Array.prototype.initialValue | `initialValue`} to fill up.
   * @param height the new width of the 2d array.
   * If smaller than current height, the 2d array will lose items.
   * If larger than current height, the 2d array will add instances of {@linkcode D2Array.prototype.initialValue | `initialValue`} to fill up.
   */
  resize(width: number, height: number) {
    assert((width as number) > 0, "Width must be greater than 0");
    assert((height as number) > 0, "Height must be greater than 0");

    if (height == this.raw.length && width == this.raw[0]!.length) {
      return;
    } else if (height < this.raw.length && width < this.raw[0]!.length) {
      this.raw = this.raw.slice(0, height);

      for (let i = 0; i < this.raw.length; i++) {
        this.raw[i] = this.raw[i]!.slice(0, width);
      }
    } else {
      if (width <= this.raw[0]!.length) {
        for (let i = 0; i < this.raw.length; i++) {
          this.raw[i] = this.raw[i]!.slice(0, width);
        }
      } else {
        for (let i = 0; i < this.raw.length; i++) {
          this.raw[i]!.push(
            ...Array(width - this.raw[i]!.length).fill(this.initialValue),
          );
        }
      }

      if (height <= this.raw.length) {
        this.raw = this.raw.slice(0, height);
      } else {
        this.raw.push(
          ...Array.from(
            { length: height - this.raw.length },
            () => Array(this.raw[0]!.length).fill(this.initialValue),
          ),
        );
      }
    }
  }

  /**
   * Insert another 2d array at specific coordinates.
   * If the inserted 2d array is greater than the 2d array this method is called on,
   * the inserted value will be trimmed to fit the current 2d array.
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   *
   * const arr = new D2Array<boolean>(5, 5, false);
   * arr.insert(2, 2, new D2Array<boolean>(3, 3, true));
   * assertEquals(arr.raw, [
   *   [false, false, false, false, false],
   *   [false, false, false, false, false],
   *   [false, false,  true,  true,  true],
   *   [false, false,  true,  true,  true],
   *   [false, false,  true,  true,  true],
   * ]);
   * ```
   *
   * @param x The X coordinate to place the 2d array, 0-based.
   * @param y The Y coordinate to place the 2d array, 0-based.
   * @param value The 2d array to insert at the provided coordinates.
   */
  insert(x: number, y: number, value: readonly T[][] | D2Array<T>) {
    if (value instanceof D2Array) {
      value = value.raw;
    }

    for (let i = y; i < Math.min(this.raw.length, y + value.length); i++) {
      const thisRow = this.raw[i]!;
      const valueRow = value[i - y]!;

      for (let j = x; j < Math.min(thisRow.length, x + valueRow.length); j++) {
        thisRow[j] = valueRow[j - x]!;
      }
    }
  }

  /**
   * The width of the 2d array.
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   *
   * const arr = new D2Array<boolean>(3, 4, false);
   * assertEquals(arr.width, 3);
   * ```
   *
   * @returns The width of the 2d array.
   */
  get width(): number {
    return this.raw[0]!.length;
  }

  /**
   * The height of the 2d array.
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   *
   * const arr = new D2Array<boolean>(3, 4, false);
   * assertEquals(arr.height, 4);
   * ```
   *
   * @returns The height of the 2d array.
   */
  get height(): number {
    return this.raw.length;
  }

  /**
   * Iterate over the underlying raw array
   *
   * @example Usage
   * ```ts
   * import { D2Array } from "@std/data-structures/unstable-2d-array";
   * import { assertEquals } from "@std/assert";
   * const arr = new D2Array<boolean>(3, 3, false);
   *
   * for (const row of arr) {
   *   assertEquals(row.length, 3);
   * }
   * ```
   *
   * @returns An iterator over the rows of the 2d array.
   */
  [Symbol.iterator](): Iterator<T[]> {
    return this.raw[Symbol.iterator]();
  }
}
