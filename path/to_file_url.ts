import { encodeWhitespace } from "./_util.ts";
import { isAbsolute } from "./is_absolute.ts";

/**
 * Converts a path string to a file URL.
 *
 * ```ts
 *      import { toFileUrl } from "./to_file_url.ts";
 *      toFileUrl("/home/foo", {os:"linux"}); // new URL("file:///home/foo")
 *      toFileUrl("\\home\\foo", {os:"windows"}); // new URL("file:///home/foo")
 *      toFileUrl("C:\\Users\\foo", {os:"windows"}); // new URL("file:///C:/Users/foo")
 *      toFileUrl("\\\\127.0.0.1\\home\\foo", {os:"windows"}); // new URL("file://127.0.0.1/home/foo")
 * ```
 * @param path to convert to file URL
 */
export function toFileUrl(
  path: string,
  { os = Deno.build.os }: { os?: typeof Deno.build.os } = {},
): URL {
  if (!isAbsolute(path, { os })) {
    throw new TypeError("Must be an absolute path.");
  }
  const url = new URL("file:///");
  if (os === "windows") {
    const [, hostname, pathname] = path.match(
      /^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/,
    )!;
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
      url.hostname = hostname;
      if (!url.hostname) {
        throw new TypeError("Invalid hostname.");
      }
    }
  } else {
    url.pathname = encodeWhitespace(
      path.replace(/%/g, "%25").replace(/\\/g, "%5C"),
    );
  }
  return url;
}
