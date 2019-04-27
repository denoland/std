// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { ServerRequest, Response } from "./server.ts";
import { getCookie, delCookie, setCookie, cookieDateFormat } from "./cookie.ts";
import { assert, assertEquals } from "../testing/asserts.ts";
import { test } from "../testing/mod.ts";

test({
  name: "[HTTP] Cookie Date Format",
  fn(): void {
    const actual = cookieDateFormat(new Date(Date.UTC(1994, 3, 5, 15, 32)));
    const expected = "Tue, 05 May 1994 15:32:00 GMT";
    assertEquals(actual, expected);
  }
});

test({
  name: "[HTTP] Cookie parser",
  fn(): void {
    let req = new ServerRequest();
    req.headers = new Headers();
    assertEquals(getCookie(req), {});
    req.headers = new Headers();
    req.headers.set("Cookie", "foo=bar");
    assertEquals(getCookie(req), { foo: "bar" });

    req.headers = new Headers();
    req.headers.set("Cookie", "full=of  ; tasty=chocolate");
    assertEquals(getCookie(req), { full: "of  ", tasty: "chocolate" });

    req.headers = new Headers();
    req.headers.set("Cookie", "igot=99; problems=but...");
    assertEquals(getCookie(req), { igot: "99", problems: "but..." });
  }
});

test({
  name: "[HTTP] Cookie Delete",
  fn(): void {
    let res: Response = {};
    delCookie(res, "deno");
    assertEquals(
      res.headers.get("Set-Cookie"),
      "deno=; Expires=Thus, 01 Jan 1970 00:00:00 GMT"
    );
  }
});

test({
  name: "[HTTP] Cookie Set",
  fn(): void {
    let res: Response = {};

    res.headers = new Headers();
    setCookie(res, { name: "Space", value: "Cat" });
    assertEquals(res.headers.get("Set-Cookie"), "Space=Cat");

    res.headers = new Headers();
    setCookie(res, { name: "Space", value: "Cat" }, { Secure: true });
    assertEquals(res.headers.get("Set-Cookie"), "Space=Cat; Secure");

    res.headers = new Headers();
    setCookie(res, { name: "Space", value: "Cat" }, { HttpOnly: true });
    assertEquals(res.headers.get("Set-Cookie"), "Space=Cat; HttpOnly");

    res.headers = new Headers();
    setCookie(
      res,
      { name: "Space", value: "Cat" },
      { HttpOnly: true, Secure: true }
    );
    assertEquals(res.headers.get("Set-Cookie"), "Space=Cat; Secure; HttpOnly");

    res.headers = new Headers();
    setCookie(
      res,
      { name: "Space", value: "Cat" },
      { HttpOnly: true, Secure: true, MaxAge: 2 }
    );
    assertEquals(
      res.headers.get("Set-Cookie"),
      "Space=Cat; Secure; HttpOnly; Max-Age=2"
    );

    let error = false;
    res.headers = new Headers();
    try {
      setCookie(
        res,
        { name: "Space", value: "Cat" },
        { HttpOnly: true, Secure: true, MaxAge: 0 }
      );
    } catch (e) {
      error = true;
    }
    assert(error);

    res.headers = new Headers();
    setCookie(
      res,
      { name: "Space", value: "Cat" },
      { HttpOnly: true, Secure: true, MaxAge: 2, Domain: "deno.land" }
    );
    assertEquals(
      res.headers.get("Set-Cookie"),
      "Space=Cat; Secure; HttpOnly; Max-Age=2; Domain=deno.land"
    );

    res.headers = new Headers();
    setCookie(
      res,
      { name: "Space", value: "Cat" },
      {
        HttpOnly: true,
        Secure: true,
        MaxAge: 2,
        Domain: "deno.land",
        SameSite: "Strict"
      }
    );
    assertEquals(
      res.headers.get("Set-Cookie"),
      "Space=Cat; Secure; HttpOnly; Max-Age=2; Domain=deno.land; SameSite=Strict"
    );

    res.headers = new Headers();
    setCookie(
      res,
      { name: "Space", value: "Cat" },
      {
        HttpOnly: true,
        Secure: true,
        MaxAge: 2,
        Domain: "deno.land",
        SameSite: "Lax"
      }
    );
    assertEquals(
      res.headers.get("Set-Cookie"),
      "Space=Cat; Secure; HttpOnly; Max-Age=2; Domain=deno.land; SameSite=Lax"
    );

    res.headers = new Headers();
    setCookie(
      res,
      { name: "Space", value: "Cat" },
      {
        HttpOnly: true,
        Secure: true,
        MaxAge: 2,
        Domain: "deno.land",
        Path: "/"
      }
    );
    assertEquals(
      res.headers.get("Set-Cookie"),
      "Space=Cat; Secure; HttpOnly; Max-Age=2; Domain=deno.land; Path=/"
    );

    res.headers = new Headers();
    setCookie(
      res,
      { name: "Space", value: "Cat" },
      {
        HttpOnly: true,
        Secure: true,
        MaxAge: 2,
        Domain: "deno.land",
        Path: "/",
        Expires: new Date(Date.UTC(1983, 0, 7, 15, 32))
      }
    );
    assertEquals(
      res.headers.get("Set-Cookie"),
      "Space=Cat; Secure; HttpOnly; Max-Age=2; Domain=deno.land; Path=/; Expires=Fri, 07 Jan 1983 15:32:00 GMT"
    );

    res.headers = new Headers();
    setCookie(res, { name: "__Secure-Kitty", value: "Meow" });
    assertEquals(res.headers.get("Set-Cookie"), "__Secure-Kitty=Meow; Secure");

    res.headers = new Headers();
    setCookie(
      res,
      { name: "__Host-Kitty", value: "Meow" },
      { Domain: "deno.land" }
    );
    assertEquals(
      res.headers.get("Set-Cookie"),
      "__Host-Kitty=Meow; Secure; Path=/"
    );
  }
});
