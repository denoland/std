// Copyright 2023 the Deno authors. All rights reserved. MIT license.

export function isValidUrl(string: string): boolean {
  try {
    const { protocol } = new URL(string);
    return protocol.startsWith("http");
  } catch {
    return false;
  }
}

export function isPublicUrl(string: string): boolean {
  try {
    const { hostname } = new URL(string);
    const ranges = [
      /^localhost$/,
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^::1$/,
      /^0:0:0:0:0:0:0:1$/,
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
    ];

    return !ranges.some((range) => range.test(hostname));
  } catch (_) {
    return false;
  }
}
