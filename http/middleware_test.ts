import { chain, Handler, HttpRequest, Middleware, serve } from "./mod.ts";
import {
  handleGreetings,
  log,
  validate,
  yaml,
} from "./middleware/example_middleware.ts";
import { assertEquals } from "../testing/asserts.ts";

function buildRequest(body?: string) {
  return new HttpRequest(
    new Request("http://test", { method: "POST", body }),
    {
      localAddr: {
        transport: "tcp",
        hostname: "test.host",
        port: 1234,
      },
      remoteAddr: {
        transport: "tcp",
        hostname: "test.client",
        port: 1234,
      },
    },
    {},
  );
}

Deno.test({
  name: `[http/middleware] chain() does not change a handler's behaviour`,
  fn: () => {
    const handled = new Array<string>();

    const handler: Handler = async (req) => {
      const content = await req.text();

      handled.push(content);

      return new Response(content);
    };

    const chained = chain(handler);

    const testBody = "foo";

    handler(buildRequest(testBody));
    chained(buildRequest(testBody));

    assertEquals(handled[0], handled[1]);
  },
});

Deno.test({
  name: `[http/middleware] chain() should pass next in the given order`,
  fn: () => {
    const called = new Array<number>();

    const first: Middleware = (req, next) => {
      called.push(1);
      return next(req);
    };

    const second: Middleware = (req, next) => {
      called.push(2);
      return next(req);
    };

    const handler: Handler = () => new Response();
    const chained = chain(first).add(second).add(handler);

    chained(buildRequest());

    assertEquals(called, [1, 2]);
  },
});

Deno.test({
  name: `[http/middleware] nested chains should call depth first`,
  fn: () => {
    const called = new Array<number>();

    const first: Middleware = (req, next) => {
      called.push(1);
      return next(req);
    };

    const second: Middleware = (req, next) => {
      called.push(2);
      return next(req);
    };

    const third: Middleware = (req, next) => {
      called.push(3);
      return next(req);
    };

    const fourth: Middleware = (req, next) => {
      called.push(4);
      return next(req);
    };

    const handler: Handler = () => new Response();

    const firstChain = chain(first).add(second);
    const secondChain = chain(third).add(fourth);
    const chained = chain(firstChain).add(secondChain).add(handler);

    chained(buildRequest());

    assertEquals(called, [1, 2, 3, 4]);
  },
});

Deno.test({
  name: `[http/middleware] unterminated chains should not be passable to serve`,
  fn: () => {
    const chained = chain(yaml).add(validate);

    const _ = () => {
      // @ts-expect-error Should not be assignable
      serve(chained);
    };
  },
});

Deno.test({
  name:
    `[http/middleware] terminated chains that still depend on some context should not be passable to serve`,
  fn: () => {
    const chained = chain(validate).add(handleGreetings);

    const _ = () => {
      // @ts-expect-error Should not be assignable
      serve(chained);
    };
  },
});

Deno.test({
  name: `[http/middleware] terminated chains should not allow to call add`,
  fn: () => {
    const chained = chain(yaml).add(validate).add(handleGreetings);

    // @ts-expect-error Should not be assignable
    chained.add(log);
  },
});
