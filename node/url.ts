// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

import {
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_INVALID_FILE_URL_HOST,
  ERR_INVALID_FILE_URL_PATH,
  ERR_INVALID_URL_SCHEME,
} from "./_errors.ts";
import {
  CHAR_BACKWARD_SLASH,
  CHAR_FORWARD_SLASH,
  CHAR_LOWERCASE_A,
  CHAR_LOWERCASE_Z,
} from "../path/_constants.ts";
import * as path from "./path.ts";
import { isWindows, osType } from "../_util/os.ts";

const forwardSlashRegEx = /\//g;
const percentRegEx = /%/g;
const backslashRegEx = /\\/g;
const newlineRegEx = /\n/g;
const carriageReturnRegEx = /\r/g;
const tabRegEx = /\t/g;

const _url = URL;
export { _url as URL };

/**
 * The URL object has both a `toString()` method and `href` property that return string serializations of the URL.
 * These are not, however, customizable in any way.
 * This method allows for basic customization of the output.
 * @param urlObject
 * @param options
 * @param options.auth `true` if the serialized URL string should include the username and password, `false` otherwise. **Default**: `true`.
 * @param options.fragment `true` if the serialized URL string should include the fragment, `false` otherwise. **Default**: `true`.
 * @param options.search `true` if the serialized URL string should include the search query, **Default**: `true`.
 * @param options.unicode `true` if Unicode characters appearing in the host component of the URL string should be encoded directly as opposed to being Punycode encoded. **Default**: `false`.
 * @returns a customizable serialization of a URL `String` representation of a `WHATWG URL` object.
 */
export function format(
  urlObject: URL,
  options?: {
    auth: boolean;
    fragment: boolean;
    search: boolean;
    unicode: boolean;
  },
): string {
  if (options) {
    if (typeof options !== "object") {
      throw new ERR_INVALID_ARG_TYPE("options", "object", options);
    }
  }

  options = {
    auth: true,
    fragment: true,
    search: true,
    unicode: false,
    ...options,
  };

  let ret = urlObject.protocol;
  if (urlObject.host !== null) {
    ret += "//";
    const hasUsername = urlObject.username !== "";
    const hasPassword = urlObject.password !== "";
    if (options.auth && (hasUsername || hasPassword)) {
      if (hasUsername) {
        ret += urlObject.username;
      }
      if (hasPassword) {
        ret += `:${urlObject.password}`;
      }
      ret += "@";
    }
    // TODO(wafuwfu13): Support unicode option
    // ret += options.unicode ?
    //   domainToUnicode(urlObject.host) : urlObject.host;
    ret += urlObject.host;
    if (urlObject.port) {
      ret += `:${urlObject.port}`;
    }
  }

  ret += urlObject.pathname;

  if (options.search) {
    ret += urlObject.search;
  }
  if (options.fragment) {
    ret += urlObject.hash;
  }

  return ret;
}

/**
 * Get fully resolved platform-specific file path from the given URL string/ object
 * @param path The file URL string or URL object to convert to a path
 */
export function fileURLToPath(path: string | URL): string {
  if (typeof path === "string") path = new URL(path);
  else if (!(path instanceof URL)) {
    throw new ERR_INVALID_ARG_TYPE("path", ["string", "URL"], path);
  }
  if (path.protocol !== "file:") {
    throw new ERR_INVALID_URL_SCHEME("file");
  }
  return isWindows ? getPathFromURLWin(path) : getPathFromURLPosix(path);
}

function getPathFromURLWin(url: URL): string {
  const hostname = url.hostname;
  let pathname = url.pathname;
  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      const third = pathname.codePointAt(n + 2)! | 0x20;
      if (
        (pathname[n + 1] === "2" && third === 102) || // 2f 2F /
        (pathname[n + 1] === "5" && third === 99) // 5c 5C \
      ) {
        throw new ERR_INVALID_FILE_URL_PATH(
          "must not include encoded \\ or / characters",
        );
      }
    }
  }

  pathname = pathname.replace(forwardSlashRegEx, "\\");
  pathname = decodeURIComponent(pathname);
  if (hostname !== "") {
    // TODO(bartlomieju): add support for punycode encodings
    return `\\\\${hostname}${pathname}`;
  } else {
    // Otherwise, it's a local path that requires a drive letter
    const letter = pathname.codePointAt(1)! | 0x20;
    const sep = pathname[2];
    if (
      letter < CHAR_LOWERCASE_A ||
      letter > CHAR_LOWERCASE_Z || // a..z A..Z
      sep !== ":"
    ) {
      throw new ERR_INVALID_FILE_URL_PATH("must be absolute");
    }
    return pathname.slice(1);
  }
}

function getPathFromURLPosix(url: URL): string {
  if (url.hostname !== "") {
    throw new ERR_INVALID_FILE_URL_HOST(osType);
  }
  const pathname = url.pathname;
  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      const third = pathname.codePointAt(n + 2)! | 0x20;
      if (pathname[n + 1] === "2" && third === 102) {
        throw new ERR_INVALID_FILE_URL_PATH(
          "must not include encoded / characters",
        );
      }
    }
  }
  return decodeURIComponent(pathname);
}

/**
 *  The following characters are percent-encoded when converting from file path
 *  to URL:
 *  - %: The percent character is the only character not encoded by the
 *       `pathname` setter.
 *  - \: Backslash is encoded on non-windows platforms since it's a valid
 *       character but the `pathname` setters replaces it by a forward slash.
 *  - LF: The newline character is stripped out by the `pathname` setter.
 *        (See whatwg/url#419)
 *  - CR: The carriage return character is also stripped out by the `pathname`
 *        setter.
 *  - TAB: The tab character is also stripped out by the `pathname` setter.
 */
function encodePathChars(filepath: string): string {
  if (filepath.includes("%")) {
    filepath = filepath.replace(percentRegEx, "%25");
  }
  // In posix, backslash is a valid character in paths:
  if (!isWindows && filepath.includes("\\")) {
    filepath = filepath.replace(backslashRegEx, "%5C");
  }
  if (filepath.includes("\n")) {
    filepath = filepath.replace(newlineRegEx, "%0A");
  }
  if (filepath.includes("\r")) {
    filepath = filepath.replace(carriageReturnRegEx, "%0D");
  }
  if (filepath.includes("\t")) {
    filepath = filepath.replace(tabRegEx, "%09");
  }
  return filepath;
}

/**
 * Get fully resolved platform-specific File URL from the given file path
 * @param filepath The file path string to convert to a file URL
 */
export function pathToFileURL(filepath: string): URL {
  const outURL = new URL("file://");
  if (isWindows && filepath.startsWith("\\\\")) {
    // UNC path format: \\server\share\resource
    const paths = filepath.split("\\");
    if (paths.length <= 3) {
      throw new ERR_INVALID_ARG_VALUE(
        "filepath",
        filepath,
        "Missing UNC resource path",
      );
    }
    const hostname = paths[2];
    if (hostname.length === 0) {
      throw new ERR_INVALID_ARG_VALUE(
        "filepath",
        filepath,
        "Empty UNC servername",
      );
    }

    // TODO(wafuwafu13): To be `outURL.hostname = domainToASCII(hostname)` once `domainToASCII` are implemented
    outURL.hostname = hostname;
    outURL.pathname = encodePathChars(
      paths.slice(3).join("/"),
    );
  } else {
    let resolved = path.resolve(filepath);
    // path.resolve strips trailing slashes so we must add them back
    const filePathLast = filepath.charCodeAt(filepath.length - 1);
    if (
      (filePathLast === CHAR_FORWARD_SLASH ||
        (isWindows && filePathLast === CHAR_BACKWARD_SLASH)) &&
      resolved[resolved.length - 1] !== path.sep
    ) {
      resolved += "/";
    }

    outURL.pathname = encodePathChars(resolved);
  }
  return outURL;
}

// Taken from https://github.com/GoogleChromeLabs/native-url. Apache License 2.0
import t from "./querystring.ts";

var e = /https?|ftp|gopher|file/;
function o(o) {
  "string" == typeof o && (o = parse(o));
  var r = function (t, e, o) {
    var r = t.auth,
      a = t.hostname,
      s = t.protocol || "",
      p = t.pathname || "",
      n = t.hash || "",
      h = t.query || "",
      c = !1;
    r = r ? encodeURIComponent(r).replace(/%3A/i, ":") + "@" : "",
      t.host ? c = r + t.host : a &&
        (c = r + (~a.indexOf(":") ? "[" + a + "]" : a),
          t.port && (c += ":" + t.port)),
      h && "object" == typeof h && (h = e.encode(h));
    var l = t.search || h && "?" + h || "";
    return s && ":" !== s.substr(-1) && (s += ":"),
      t.slashes || (!s || o.test(s)) && !1 !== c
        ? (c = "//" + (c || ""), p && "/" !== p[0] && (p = "/" + p))
        : c || (c = ""),
      n && "#" !== n[0] && (n = "#" + n),
      l && "?" !== l[0] && (l = "?" + l),
      {
        protocol: s,
        host: c,
        pathname: p = p.replace(/[?#]/g, encodeURIComponent),
        search: l = l.replace("#", "%23"),
        hash: n,
      };
  }(o, t, e);
  return "" + r.protocol + r.host + r.pathname + r.search + r.hash;
}
var r = "http://",
  a = "w.w",
  s = r + a,
  p = /^([a-z0-9.+-]*:\/\/\/)([a-z0-9.+-]:\/*)?/i,
  n = /https?|ftp|gopher|file/;
function resolve(t, e) {
  var a = "string" == typeof t ? parse(t) : t;
  t = "object" == typeof t ? o(t) : t;
  var h = parse(e), c = "";
  a.protocol && !a.slashes &&
  (c = a.protocol,
    t = t.replace(a.protocol, ""),
    c += "/" === e[0] || "/" === t[0] ? "/" : ""),
    c && h.protocol &&
    (c = "", h.slashes || (c = h.protocol, e = e.replace(h.protocol, "")));
  var l = t.match(p);
  l && !h.protocol &&
    (t = t.substr((c = l[1] + (l[2] || "")).length),
      /^\/\/[^/]/.test(e) && (c = c.slice(0, -1)));
  var i = new URL(t, s + "/"),
    u = new URL(e, i).toString().replace(s, ""),
    f = h.protocol || a.protocol;
  return f += a.slashes || h.slashes ? "//" : "",
    !c && f ? u = u.replace(r, f) : c && (u = u.replace(r, "")),
    n.test(u) || ~e.indexOf(".") || "/" === t.slice(-1) ||
    "/" === e.slice(-1) || "/" !== u.slice(-1) || (u = u.slice(0, -1)),
    c && (u = c + ("/" === u[0] ? u.substr(1) : u)),
    u;
}
function resolveObject(t, e) {
  return parse(resolve(t, e));
}
function Url() {}
Url.prototype.parse = parse,
  Url.prototype.format = o,
  Url.prototype.resolve = resolve,
  Url.prototype.resolveObject = resolve;
var i = /^https?|ftp|gopher|file/,
  u = /^(.*?)([#?].*)/,
  f = /^([a-z0-9.+-]*:)(\/{0,3})(.*)/i,
  m = /^([a-z0-9.+-]*:)?\/\/\/*/i,
  v = /^([a-z0-9.+-]*:)(\/{0,2})\[(.*)\]$/i;
function parse(e, r, p) {
  if (
    void 0 === r && (r = !1),
      void 0 === p && (p = !1),
      e && "object" == typeof e && e instanceof Url
  ) {
    return e;
  }
  var n = (e = e.trim()).match(u);
  e = n ? n[1].replace(/\\/g, "/") + n[2] : e.replace(/\\/g, "/"),
    v.test(e) && "/" !== e.slice(-1) && (e += "/");
  var h = !/(^javascript)/.test(e) && e.match(f), c = m.test(e), g = "";
  h &&
    (i.test(h[1]) || (g = h[1].toLowerCase(), e = "" + h[2] + h[3]),
      h[2] ||
      (c = !1, i.test(h[1]) ? (g = h[1], e = "" + h[3]) : e = "//" + h[3]),
      3 !== h[2].length && 1 !== h[2].length || (g = h[1], e = "/" + h[3]));
  var d,
    y = (n ? n[1] : e).match(/^https?:\/\/[^/]+(:[0-9]+)(?=\/|$)/),
    b = y && y[1],
    C = new Url(),
    U = "",
    w = "";
  try {
    d = new URL(e);
  } catch (t) {
    U = t,
      g || p || !/^\/\//.test(e) || /^\/\/.+[@.]/.test(e) ||
      (w = "/", e = e.substr(1));
    try {
      d = new URL(e, s);
    } catch (t) {
      return C.protocol = g, C.href = g, C;
    }
  }
  C.slashes = c && !w,
    C.host = d.host === a ? "" : d.host,
    C.hostname = d.hostname === a ? "" : d.hostname.replace(/(\[|\])/g, ""),
    C.protocol = U ? g || null : d.protocol,
    C.search = d.search.replace(/\\/g, "%5C"),
    C.hash = d.hash.replace(/\\/g, "%5C");
  var j = e.split("#");
  !C.search && ~j[0].indexOf("?") && (C.search = "?"),
    C.hash || "" !== j[1] || (C.hash = "#"),
    C.query = r ? t.decode(d.search.substr(1)) : C.search.substr(1),
    C.pathname = w + (h
      ? function (t) {
        return t.replace(/['^|`]/g, function (t) {
          return "%" + t.charCodeAt().toString(16).toUpperCase();
        }).replace(/((?:%[0-9A-F]{2})+)/g, function (t, e) {
          try {
            return decodeURIComponent(e).split("").map(function (t) {
              var e = t.charCodeAt();
              return e > 256 || /^[a-z0-9]$/i.test(t)
                ? t
                : "%" + e.toString(16).toUpperCase();
            }).join("");
          } catch (t) {
            return e;
          }
        });
      }(d.pathname)
      : d.pathname),
    "about:" === C.protocol && "blank" === C.pathname &&
    (C.protocol = "", C.pathname = ""),
    U && "/" !== e[0] && (C.pathname = C.pathname.substr(1)),
    g && !i.test(g) && "/" !== e.slice(-1) && "/" === C.pathname &&
    (C.pathname = ""),
    C.path = C.pathname + C.search,
    C.auth = [d.username, d.password].map(decodeURIComponent).filter(Boolean)
      .join(":"),
    C.port = d.port,
    b && !C.host.endsWith(b) && (C.host += b, C.port = b.slice(1)),
    C.href = w ? "" + C.pathname + C.search + C.hash : o(C);
  var R = /^(file)/.test(C.href) ? ["host", "hostname"] : [];
  return Object.keys(C).forEach(function (t) {
    ~R.indexOf(t) || (C[t] = C[t] || null);
  }),
    C;
}

const _URLSearchParams = globalThis.URLSearchParams;

export { parse, resolve, resolveObject, Url, _URLSearchParams as URLSearchParams };

interface HttpOptions {
  protocol: string;
  hostname: string;
  hash: string;
  search: string;
  pathname: string;
  path: string;
  href: string;
  port?: number;
  auth?: string;
}

/**
 * This utility function converts a URL object into an ordinary options object as expected by the `http.request()` and `https.request()` APIs.
 * @param url The `WHATWG URL` object to convert to an options object.
 * @returns HttpOptions
 * @returns HttpOptions.protocol Protocol to use.
 * @returns HttpOptions.hostname A domain name or IP address of the server to issue the request to.
 * @returns HttpOptions.hash The fragment portion of the URL.
 * @returns HttpOptions.search The serialized query portion of the URL.
 * @returns HttpOptions.pathname The path portion of the URL.
 * @returns HttpOptions.path Request path. Should include query string if any. E.G. `'/index.html?page=12'`. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future.
 * @returns HttpOptions.href The serialized URL.
 * @returns HttpOptions.port Port of remote server.
 * @returns HttpOptions.auth Basic authentication i.e. `'user:password'` to compute an Authorization header.
 */
function urlToHttpOptions(url: URL): HttpOptions {
  const options: HttpOptions = {
    protocol: url.protocol,
    hostname: typeof url.hostname === "string" &&
        url.hostname.startsWith("[")
      ? url.hostname.slice(1, -1)
      : url.hostname,
    hash: url.hash,
    search: url.search,
    pathname: url.pathname,
    path: `${url.pathname || ""}${url.search || ""}`,
    href: url.href,
  };
  if (url.port !== "") {
    options.port = Number(url.port);
  }
  if (url.username || url.password) {
    options.auth = `${decodeURIComponent(url.username)}:${
      decodeURIComponent(url.password)
    }`;
  }
  return options;
}

export default {
  parse,
  resolve,
  resolveObject,
  Url,
  format,
  fileURLToPath,
  pathToFileURL,
  urlToHttpOptions,
  URL,
  URLSearchParams,
};
