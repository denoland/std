// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { describeTextureFormat } from "./describe_texture_format.ts";

function textureDimensionArrayLayerCount(
  texture: GPUTextureDescriptor,
): number {
  switch (texture.dimension) {
    case "1d":
    case "3d":
      return 1;
    case undefined:
    case "2d":
      return normalizeExtent3D(texture.size).depthOrArrayLayers ?? 1;
  }
}

function normalizeExtent3D(size: GPUExtent3D): GPUExtent3DDict {
  if (Array.isArray(size)) {
    return {
      width: size[0],
      height: size[1],
      depthOrArrayLayers: size[2],
    };
  } else {
    return size;
  }
}

function extent3DPhysicalSize(
  size: GPUExtent3D,
  format: GPUTextureFormat,
): GPUExtent3DDict {
  const [blockWidth, blockHeight] =
    describeTextureFormat(format).blockDimensions;
  const nSize = normalizeExtent3D(size);

  const width = Math.floor((nSize.width + blockWidth - 1) / blockWidth) *
    blockWidth;
  const height =
    Math.floor(((nSize.height ?? 1) + blockHeight - 1) / blockHeight) *
    blockHeight;

  return {
    width,
    height,
    depthOrArrayLayers: nSize.depthOrArrayLayers,
  };
}

function extent3DMipLevelSize(
  size: GPUExtent3D,
  level: number,
  is3D: boolean,
): GPUExtent3DDict {
  const nSize = normalizeExtent3D(size);
  return {
    height: Math.max(1, nSize.width >> level),
    width: Math.max(1, (nSize.height ?? 1) >> level),
    depthOrArrayLayers: is3D
      ? Math.max(1, (nSize.depthOrArrayLayers ?? 1) >> level)
      : (nSize.depthOrArrayLayers ?? 1),
  };
}

function textureMipLevelSize(
  descriptor: GPUTextureDescriptor,
  level: number,
): GPUExtent3DDict | undefined {
  if (level >= (descriptor.mipLevelCount ?? 1)) {
    return undefined;
  }

  return extent3DMipLevelSize(
    descriptor.size,
    level,
    descriptor.dimension === "3d",
  );
}

/**
 * Create a {@linkcode GPUTexture} with data.
 *
 * @example
 * ```ts
 * import { createTextureWithData } from "https://deno.land/std@$STD_VERSION/webgpu/texture_with_data.ts";
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
 */
export function createTextureWithData(
  device: GPUDevice,
  descriptor: GPUTextureDescriptor,
  data: Uint8Array,
): GPUTexture {
  descriptor.usage |= GPUTextureUsage.COPY_DST;

  const texture = device.createTexture(descriptor);
  const layerIterations = textureDimensionArrayLayerCount(descriptor);
  const formatInfo = describeTextureFormat(descriptor.format);

  let binaryOffset = 0;
  for (let layer = 0; layer < layerIterations; layer++) {
    for (let mip = 0; mip < (descriptor.mipLevelCount ?? 1); mip++) {
      const mipSize = textureMipLevelSize(descriptor, mip)!;
      if (descriptor.dimension !== "3d") {
        mipSize.depthOrArrayLayers = 1;
      }

      const mipPhysical = extent3DPhysicalSize(mipSize, descriptor.format);
      const widthBlocks = Math.floor(
        mipPhysical.width / formatInfo.blockDimensions[0],
      );
      const heightBlocks = Math.floor(
        mipPhysical.height! / formatInfo.blockDimensions[1],
      );

      const bytesPerRow = widthBlocks * formatInfo.blockSize;
      const dataSize = bytesPerRow * heightBlocks * mipSize.depthOrArrayLayers!;

      const endOffset = binaryOffset + dataSize;

      device.queue.writeTexture(
        {
          texture,
          mipLevel: mip,
          origin: {
            x: 0,
            y: 0,
            z: layer,
          },
        },
        data.subarray(binaryOffset, endOffset),
        {
          bytesPerRow,
          rowsPerImage: heightBlocks,
        },
        mipPhysical,
      );

      binaryOffset = endOffset;
    }
  }

  return texture;
}
