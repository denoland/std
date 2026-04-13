// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Return value for {@linkcode getRowPadding}. */
export interface Padding {
  /** The number of bytes per row without padding calculated. */
  unpadded: number;
  /** The number of bytes per row with padding calculated. */
  padded: number;
}

/** Buffer-Texture copies must have [`bytes_per_row`] aligned to this number. */
export const COPY_BYTES_PER_ROW_ALIGNMENT = 256;

/** Number of bytes per pixel. */
export const BYTES_PER_PIXEL = 4;

/**
 * Calculates the number of bytes including necessary padding when passing a
 * {@linkcode GPUImageCopyBuffer}.
 *
 * Ref: https://en.wikipedia.org/wiki/Data_structure_alignment#Computing_padding
 *
 * @example Usage
 * ```ts
 * import { getRowPadding } from "@std/webgpu/row-padding";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(getRowPadding(1), { unpadded: 4, padded: 256 });
 * ```
 *
 * @param width The width to get the padding for
 * @returns The padded and unpadded values
 */
export function getRowPadding(width: number): Padding {
  // It is a WebGPU requirement that
  // GPUImageCopyBuffer.layout.bytesPerRow % COPY_BYTES_PER_ROW_ALIGNMENT == 0
  // So we calculate paddedBytesPerRow by rounding unpaddedBytesPerRow
  // up to the next multiple of COPY_BYTES_PER_ROW_ALIGNMENT.

  const unpaddedBytesPerRow = width * BYTES_PER_PIXEL;
  const paddedBytesPerRowPadding = (COPY_BYTES_PER_ROW_ALIGNMENT -
    (unpaddedBytesPerRow % COPY_BYTES_PER_ROW_ALIGNMENT)) %
    COPY_BYTES_PER_ROW_ALIGNMENT;
  const paddedBytesPerRow = unpaddedBytesPerRow + paddedBytesPerRowPadding;

  return {
    unpadded: unpaddedBytesPerRow,
    padded: paddedBytesPerRow,
  };
}

/**
 * Creates a new buffer while removing any unnecessary empty bytes.
 * Useful for when wanting to save an image as a specific format.
 *
 * @example Usage
 * ```ts
 * import { resliceBufferWithPadding } from "@std/webgpu/row-padding";
 * import { assertEquals } from "@std/assert";
 *
 * const input = new Uint8Array([0, 255, 0, 255, 120, 120, 120]);
 * const result = resliceBufferWithPadding(input, 1, 1);
 *
 * assertEquals(result, new Uint8Array([0, 255, 0, 255]));
 * ```
 *
 * @param buffer The buffer to reslice.
 * @param width The width of the output buffer.
 * @param height The height of the output buffer.
 * @returns The resliced buffer.
 */
// deno-lint-ignore deno-style-guide/exported-function-args-maximum
export function resliceBufferWithPadding(
  buffer: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const { padded, unpadded } = getRowPadding(width);
  const outputBuffer = new Uint8Array(unpadded * height);

  for (let i = 0; i < height; i++) {
    const slice = buffer
      .slice(i * padded, (i + 1) * padded)
      .slice(0, unpadded);

    outputBuffer.set(slice, i * unpadded);
  }

  return outputBuffer;
}
