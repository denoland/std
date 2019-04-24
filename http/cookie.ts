// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { ServerRequest, Response } from "./server.ts";
import { assert } from "../testing/asserts.ts";
import { pad } from "../strings/pad.ts";

const SETCOOKIE = "Set-Cookie";
const COOKIE = "Cookie";

export interface Cookie {
  [key: string]: string;
}

export interface CookieValue {
  name: string;
  value: string;
}

export interface CookieOptions {
  Expires?: Date;
  MaxAge?: number;
  Domain?: string;
  Path?: string;
  Secure?: boolean;
  HttpOnly?: boolean;
  SameSite?: SameSite;
}

export type SameSite = "Strict" | "Lax";

function cookieStringFormat(cookie: CookieValue, opt: CookieOptions): string {
  function dtPad(v: string, lPad: number = 2): string {
    return pad(v, lPad, { char: "0" });
  }

  const out: string[] = [];
  out.push(`${cookie.name}=${cookie.value}`);

  // Fallback for invalid Set-Cookie
  // ref: https://tools.ietf.org/html/draft-ietf-httpbis-cookie-prefixes-00#section-3.1
  if (cookie.name.startsWith("__Secure")) {
    opt.Secure = true;
  }
  if (cookie.name.startsWith("__Host")) {
    opt.Path = "/";
    opt.Secure = true;
    delete opt.Domain;
  }

  if (opt.Secure) {
    out.push("Secure");
  }
  if (opt.HttpOnly) {
    out.push("HttpOnly");
  }
  if (Number.isInteger(opt.MaxAge)) {
    assert(opt.MaxAge > 0, "Max-Age must be an integer superior to 0");
    out.push(`Max-Age=${opt.MaxAge}`);
  }
  if (opt.Domain) {
    out.push(`Domain=${opt.Domain}`);
  }
  if (opt.SameSite) {
    out.push(`SameSite=${opt.SameSite}`);
  }
  if (opt.Path) {
    out.push(`Path=${opt.Path}`);
  }
  if (opt.Expires) {
    let dateString = "";
    let d = dtPad(opt.Expires.getUTCDate().toString());
    const h = dtPad(opt.Expires.getUTCHours().toString());
    const min = dtPad(opt.Expires.getUTCMinutes().toString());
    const s = dtPad(opt.Expires.getUTCSeconds().toString());
    const y = opt.Expires.getUTCFullYear();
    // See Date format: https://tools.ietf.org/html/rfc7231#section-7.1.1.1
    const days = ["Sun", "Mon", "Tue", "Wed", "Thus", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    dateString += `${days[opt.Expires.getDay()]}, ${d} ${
      months[opt.Expires.getUTCMonth()]
    } ${y} ${h}:${min}:${s} GMT`;
    out.push(`Expires=${dateString}`);
  }
  return out.join("; ");
}

/* Parse the cookie of the Server Request */
export function getCookie(rq: ServerRequest): Cookie {
  if (rq.headers.has(COOKIE)) {
    const out: Cookie = {};
    const c = rq.headers.get(COOKIE).split(";");
    for (const kv of c) {
      const cookieVal = kv.split("=");
      const key = cookieVal.shift().trim();
      out[key] = cookieVal.join("");
    }
    return out;
  }
  return {};
}

/* Set the cookie header properly in the Response */
export function setCookie(
  res: Response,
  cookie: CookieValue,
  opt: CookieOptions = {}
): void {
  if (!res.headers) {
    res.headers = new Headers();
  }
  // TODO (zekth) : Add proper parsing of Set-Cookie headers
  // Parsing cookie headers to make consistent set-cookie header
  // ref: https://tools.ietf.org/html/rfc6265#section-4.1.1
  res.headers.set(SETCOOKIE, cookieStringFormat(cookie, opt));
}

/* Set the cookie header properly in the Response to delete it */
export function delCookie(res: Response, CookieName: string): void {
  if (!res.headers) {
    res.headers = new Headers();
  }
  const c: CookieValue = {
    name: CookieName,
    value: ""
  };
  res.headers.set(SETCOOKIE, cookieStringFormat(c, { Expires: new Date(0) }));
}
