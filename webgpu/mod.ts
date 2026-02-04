// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Utilities for interacting with the
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API | WebGPU API}.
 *
 * ```ts ignore
 * import { createTextureWithData } from "@std/webgpu";
 *
 * const adapter = await navigator.gpu.requestAdapter();
 * const device = await adapter?.requestDevice()!;
 *
 * createTextureWithData(device, {
 *   format: "bgra8unorm-srgb",
 *   size: {
 *     width: 3,
 *     height: 2,
 *   },
 *   usage: GPUTextureUsage.COPY_SRC,
 * }, new Uint8Array([1, 1, 1, 1, 1, 1, 1]));
 * ```
 *
 * @module
 */

export * from "./create_capture.ts";
export * from "./describe_texture_format.ts";
export * from "./row_padding.ts";
export * from "./texture_with_data.ts";
