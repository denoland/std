import { chain, Handler, HttpRequest, Middleware } from "./mod.ts";
import { assertEquals } from "../testing/asserts.ts";

function buildRequest(body?: string) {
  return new HttpRequest(
    new Request("http://test", { method: "POST", body }),
    {
      localAddr: {
        transport: "tcp",
        hostname: "test",
        port: 1234,
      },
      remoteAddr: {
        transport: "tcp",
        hostname: "test",
        port: 1234,
      },
    },
    {},
  );
}

Deno.test({
  name: `chain() does not change a handler's behaviour`,
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
  name: `chain() should pass next in the given order`,
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
  name: `nested chains should call depth first`,
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
