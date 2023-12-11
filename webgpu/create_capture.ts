// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { getRowPadding } from "./row_padding.ts";

/** Return value for {@linkcode createCapture}. */
export interface CreateCapture {
  /**
   * Texture to be used as view to render to.
   */
  texture: GPUTexture;

  /**
   * Represents the output buffer of the rendered texture.
   * Can then be used to access and retrieve raw image data.
   */
  outputBuffer: GPUBuffer;
}

/**
 * Creates a texture and buffer to use as a capture.
 *
 * @example
 * ```ts
 * import { createCapture } from "https://deno.land/std@$STD_VERSION/webgpu/create_capture.ts";
 *
 * const { texture, outputBuffer } = createCapture(device, dimensions);
 *
 * const encoder = device.createCommandEncoder();
 * encoder.beginRenderPass({
 *   colorAttachments: [
 *     {
 *       view: texture.createView(),
 *       storeOp: "store",
 *       loadOp: "clear",
 *       clearValue: [1, 0, 0, 1],
 *     },
 *   ],
 * }).end();
 *
 * copyToBuffer(encoder, texture, outputBuffer, dimensions);
 *
 * device.queue.submit([encoder.finish()]);
 *
 * // outputBuffer contains the raw image data, can then be used
 * // to save as png or other formats.
 * ```
 */
export function createCapture(
  device: GPUDevice,
  width: number,
  height: number,
): CreateCapture {
  const { padded } = getRowPadding(width);
  const outputBuffer = device.createBuffer({
    label: "Capture",
    size: padded * height,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  const texture = device.createTexture({
    label: "Capture",
    size: {
      width,
      height,
    },
    format: "rgba8unorm-srgb",
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
  });

  return { texture, outputBuffer };
}
