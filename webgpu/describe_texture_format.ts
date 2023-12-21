// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/** Return type for {@linkcode describeTextureFormat}. */
export interface TextureFormatInfo {
  /** The specific feature needed to use the format, if any. */
  requiredFeature?: GPUFeatureName;
  /** Type of sampling that is valid for the texture. */
  sampleType: GPUTextureSampleType;
  /** Valid bits of {@linkcode GPUTextureUsage}. */
  allowedUsages: number;
  /** Dimension of a "block" of texels. This is always `[1, 1]` on
   * uncompressed textures. */
  blockDimensions: [number, number];
  /** Size in bytes of a "block" of texels. This is the size per pixel on
   * uncompressed textures. */
  blockSize: number;
  /** Count of components in the texture. This determines which components
   * there will be actual data in the shader for. */
  components: number;
}

const basic = GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST |
  GPUTextureUsage.TEXTURE_BINDING;
const attachment = basic | GPUTextureUsage.RENDER_ATTACHMENT;
const storage = basic | GPUTextureUsage.STORAGE_BINDING;
const allFlags = GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST |
  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING |
  GPUTextureUsage.RENDER_ATTACHMENT;

/**
 * Get various information about a specific {@linkcode GPUTextureFormat}.
 *
 * @example
 * ```ts
 * import { describeTextureFormat } from "https://deno.land/std@$STD_VERSION/webgpu/describe_texture_format.ts";
 *
 * describeTextureFormat("rgba8unorm-srgb");
 * ```
 */
export function describeTextureFormat(
  format: GPUTextureFormat,
): TextureFormatInfo {
  let info: [
    requiredFeatures: GPUFeatureName | undefined,
    sampleType: GPUTextureSampleType,
    usage: number,
    blockDimensions: [number, number],
    blockSize: number,
    components: number,
  ];

  switch (format) {
    case "r8unorm":
      info = [undefined, "float", attachment, [1, 1], 1, 1];
      break;
    case "r8snorm":
      info = [undefined, "float", basic, [1, 1], 1, 1];
      break;
    case "r8uint":
      info = [undefined, "uint", attachment, [1, 1], 1, 1];
      break;
    case "r8sint":
      info = [undefined, "sint", attachment, [1, 1], 1, 1];
      break;

    case "r16uint":
      info = [undefined, "uint", attachment, [1, 1], 2, 1];
      break;
    case "r16sint":
      info = [undefined, "sint", attachment, [1, 1], 2, 1];
      break;
    case "r16float":
      info = [undefined, "float", attachment, [1, 1], 2, 1];
      break;
    case "rg8unorm":
      info = [undefined, "float", attachment, [1, 1], 2, 2];
      break;
    case "rg8snorm":
      info = [undefined, "float", attachment, [1, 1], 2, 2];
      break;
    case "rg8uint":
      info = [undefined, "uint", attachment, [1, 1], 2, 2];
      break;
    case "rg8sint":
      info = [undefined, "sint", basic, [1, 1], 2, 2];
      break;

    case "r32uint":
      info = [undefined, "uint", allFlags, [1, 1], 4, 1];
      break;
    case "r32sint":
      info = [undefined, "sint", allFlags, [1, 1], 4, 1];
      break;
    case "r32float":
      info = [undefined, "unfilterable-float", allFlags, [1, 1], 4, 1];
      break;
    case "rg16uint":
      info = [undefined, "uint", attachment, [1, 1], 4, 2];
      break;
    case "rg16sint":
      info = [undefined, "sint", attachment, [1, 1], 4, 2];
      break;
    case "rg16float":
      info = [undefined, "float", attachment, [1, 1], 4, 2];
      break;
    case "rgba8unorm":
      info = [undefined, "float", allFlags, [1, 1], 4, 4];
      break;
    case "rgba8unorm-srgb":
      info = [undefined, "float", attachment, [1, 1], 4, 4];
      break;
    case "rgba8snorm":
      info = [undefined, "float", storage, [1, 1], 4, 4];
      break;
    case "rgba8uint":
      info = [undefined, "uint", allFlags, [1, 1], 4, 4];
      break;
    case "rgba8sint":
      info = [undefined, "sint", allFlags, [1, 1], 4, 4];
      break;
    case "bgra8unorm":
      info = [undefined, "float", attachment, [1, 1], 4, 4];
      break;
    case "bgra8unorm-srgb":
      info = [undefined, "float", attachment, [1, 1], 4, 4];
      break;

    case "rgb9e5ufloat":
      info = [undefined, "float", basic, [1, 1], 4, 3];
      break;

    case "rgb10a2unorm":
      info = [undefined, "float", attachment, [1, 1], 4, 4];
      break;
    case "rg11b10ufloat":
      info = [undefined, "float", basic, [1, 1], 4, 3];
      break;

    case "rg32uint":
      info = [undefined, "uint", allFlags, [1, 1], 8, 2];
      break;
    case "rg32sint":
      info = [undefined, "sint", allFlags, [1, 1], 8, 2];
      break;
    case "rg32float":
      info = [undefined, "unfilterable-float", allFlags, [1, 1], 8, 2];
      break;
    case "rgba16uint":
      info = [undefined, "uint", allFlags, [1, 1], 8, 4];
      break;
    case "rgba16sint":
      info = [undefined, "sint", allFlags, [1, 1], 8, 4];
      break;
    case "rgba16float":
      info = [undefined, "float", allFlags, [1, 1], 8, 4];
      break;

    case "rgba32uint":
      info = [undefined, "uint", allFlags, [1, 1], 16, 4];
      break;
    case "rgba32sint":
      info = [undefined, "sint", allFlags, [1, 1], 16, 4];
      break;
    case "rgba32float":
      info = [undefined, "float", allFlags, [1, 1], 16, 4];
      break;

    case "stencil8":
      info = [undefined, "uint", attachment, [1, 1], 1, 1];
      break;
    case "depth16unorm":
      info = [undefined, "depth", attachment, [1, 1], 2, 1];
      break;
    case "depth24plus":
      info = [undefined, "depth", attachment, [1, 1], 4, 1];
      break;
    case "depth24plus-stencil8":
      info = [undefined, "depth", attachment, [1, 1], 4, 2];
      break;
    case "depth32float":
      info = [undefined, "depth", attachment, [1, 1], 4, 1];
      break;

    case "depth32float-stencil8":
      info = ["depth32float-stencil8", "depth", attachment, [1, 1], 4, 2];
      break;

    case "bc1-rgba-unorm":
      info = ["texture-compression-bc", "float", basic, [4, 4], 8, 4];
      break;
    case "bc1-rgba-unorm-srgb":
      info = ["texture-compression-bc", "float", basic, [4, 4], 8, 4];
      break;
    case "bc2-rgba-unorm":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 4];
      break;
    case "bc2-rgba-unorm-srgb":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 4];
      break;
    case "bc3-rgba-unorm":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 4];
      break;
    case "bc3-rgba-unorm-srgb":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 4];
      break;
    case "bc4-r-unorm":
      info = ["texture-compression-bc", "float", basic, [4, 4], 8, 1];
      break;
    case "bc4-r-snorm":
      info = ["texture-compression-bc", "float", basic, [4, 4], 8, 1];
      break;
    case "bc5-rg-unorm":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 2];
      break;
    case "bc5-rg-snorm":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 2];
      break;
    case "bc6h-rgb-ufloat":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 3];
      break;
    case "bc6h-rgb-float":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 3];
      break;
    case "bc7-rgba-unorm":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 4];
      break;
    case "bc7-rgba-unorm-srgb":
      info = ["texture-compression-bc", "float", basic, [4, 4], 16, 4];
      break;

    case "etc2-rgb8unorm":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 8, 3];
      break;
    case "etc2-rgb8unorm-srgb":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 8, 3];
      break;
    case "etc2-rgb8a1unorm":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 8, 4];
      break;
    case "etc2-rgb8a1unorm-srgb":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 8, 4];
      break;
    case "etc2-rgba8unorm":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 16, 4];
      break;
    case "etc2-rgba8unorm-srgb":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 16, 4];
      break;
    case "eac-r11unorm":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 8, 1];
      break;
    case "eac-r11snorm":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 8, 1];
      break;
    case "eac-rg11unorm":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 16, 2];
      break;
    case "eac-rg11snorm":
      info = ["texture-compression-etc2", "float", basic, [4, 4], 16, 2];
      break;

    case "astc-4x4-unorm":
      info = ["texture-compression-astc", "float", basic, [4, 4], 16, 4];
      break;
    case "astc-4x4-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [4, 4], 16, 4];
      break;
    case "astc-5x4-unorm":
      info = ["texture-compression-astc", "float", basic, [5, 4], 16, 4];
      break;
    case "astc-5x4-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [5, 4], 16, 4];
      break;
    case "astc-5x5-unorm":
      info = ["texture-compression-astc", "float", basic, [5, 5], 16, 4];
      break;
    case "astc-5x5-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [5, 5], 16, 4];
      break;
    case "astc-6x5-unorm":
      info = ["texture-compression-astc", "float", basic, [6, 5], 16, 4];
      break;
    case "astc-6x5-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [6, 5], 16, 4];
      break;
    case "astc-6x6-unorm":
      info = ["texture-compression-astc", "float", basic, [6, 6], 16, 4];
      break;
    case "astc-6x6-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [6, 6], 16, 4];
      break;
    case "astc-8x5-unorm":
      info = ["texture-compression-astc", "float", basic, [8, 5], 16, 4];
      break;
    case "astc-8x5-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [8, 5], 16, 4];
      break;
    case "astc-8x6-unorm":
      info = ["texture-compression-astc", "float", basic, [8, 6], 16, 4];
      break;
    case "astc-8x6-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [8, 6], 16, 4];
      break;
    case "astc-8x8-unorm":
      info = ["texture-compression-astc", "float", basic, [8, 8], 16, 4];
      break;
    case "astc-8x8-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [8, 8], 16, 4];
      break;
    case "astc-10x5-unorm":
      info = ["texture-compression-astc", "float", basic, [10, 5], 16, 4];
      break;
    case "astc-10x5-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [10, 5], 16, 4];
      break;
    case "astc-10x6-unorm":
      info = ["texture-compression-astc", "float", basic, [10, 6], 16, 4];
      break;
    case "astc-10x6-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [10, 6], 16, 4];
      break;
    case "astc-10x8-unorm":
      info = ["texture-compression-astc", "float", basic, [10, 8], 16, 4];
      break;
    case "astc-10x8-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [10, 8], 16, 4];
      break;
    case "astc-10x10-unorm":
      info = ["texture-compression-astc", "float", basic, [10, 10], 16, 4];
      break;
    case "astc-10x10-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [10, 10], 16, 4];
      break;
    case "astc-12x10-unorm":
      info = ["texture-compression-astc", "float", basic, [12, 10], 16, 4];
      break;
    case "astc-12x10-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [12, 10], 16, 4];
      break;
    case "astc-12x12-unorm":
      info = ["texture-compression-astc", "float", basic, [12, 12], 16, 4];
      break;
    case "astc-12x12-unorm-srgb":
      info = ["texture-compression-astc", "float", basic, [12, 12], 16, 4];
      break;

    default:
      throw new TypeError(`Unsupported GPUTextureFormat '${format}'`);
  }

  return {
    requiredFeature: info[0],
    sampleType: info[1],
    allowedUsages: info[2],
    blockDimensions: info[3],
    blockSize: info[4],
    components: info[5],
  };
}
