// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { getRowPadding } from "./row_padding.ts";

/** Return value for {@linkcode createCapture}. */
export interface CreateCapture {
  texture: GPUTexture;

  outputBuffer: GPUBuffer;
}

/**
 * Creates a texture and buffer to use as a capture.
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
