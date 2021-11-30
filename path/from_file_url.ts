/**
 * Converts a file URL to a path string.
 *
 * ```ts
 *      import { fromFileUrl } from "./from_file_url.ts";
 *      fromFileUrl("file:///home/foo", {os:"linux"}); // "/home/foo"
 *      fromFileUrl("file:///home/foo", {os:"windows"}); // "\\home\\foo"
 *      fromFileUrl("file:///C:/Users/foo", {os:"windows"}); // "C:\\Users\\foo"
 *      fromFileUrl("file://localhost/home/foo", {os:"windows"}); // "\\\\localhost\\home\\foo"
 * ```
 * @param url of a file URL
 */
export function fromFileUrl(
  url: string | URL,
  { os = Deno.build.os }: { os?: typeof Deno.build.os } = {},
): string {
  url = url instanceof URL ? url : new URL(url);
  if (url.protocol != "file:") {
    throw new TypeError("Must be a file URL.");
  }

  if (os === "windows") {
    let path = decodeURIComponent(
      url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25"),
    ).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
      // Note: The `URL` implementation guarantees that the drive letter and
      // hostname are mutually exclusive. Otherwise it would not have been valid
      // to append the hostname and path like this.
      path = `\\\\${url.hostname}${path}`;
    }
    return path;
  }

  return decodeURIComponent(
    url.pathname.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"),
  );
}
