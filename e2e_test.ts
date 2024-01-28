// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.

import { createHandler } from "$fresh/server.ts";
import manifest from "@/fresh.gen.ts";
import {
  collectValues,
  createItem,
  createUser,
  createVote,
  getUser,
  type Item,
  listItemsByUser,
  randomItem,
  randomUser,
  User,
} from "@/utils/db.ts";
import { stripe } from "@/utils/stripe.ts";
import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertInstanceOf,
  assertNotEquals,
  assertObjectMatch,
  assertStringIncludes,
} from "std/assert/mod.ts";
import { isRedirectStatus, STATUS_CODE } from "std/http/status.ts";
import { resolvesNext, returnsNext, stub } from "std/testing/mock.ts";
import Stripe from "stripe";
import options from "./fresh.config.ts";
import { _internals } from "./plugins/kv_oauth.ts";

/**
 * These tests are end-to-end tests, which follow this rule-set:
 * 1. `Response.status` is checked first by using the `Status` enum. It's the
 * primary indicator of whether the request was successful or not.
 * 2. `Response.header`'s `content-type` is checked next to ensure the
 * response is of the expected type. This is where custom assertions are used.
 * 3. `Response.body` is checked last, if needed. This is where the actual
 * content of the response is checked. Here, we're checking if the body is
 * instance of a specific type, equals a specific string, contains a specific
 * string or is empty.
 */

/**
 * @see {@link https://fresh.deno.dev/docs/examples/writing-tests|Writing tests} example on how to write tests for Fresh projects.
 */
const handler = await createHandler(manifest, options);

function assertHtml(resp: Response) {
  assertInstanceOf(resp.body, ReadableStream);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
}

function assertJson(resp: Response) {
  assertInstanceOf(resp.body, ReadableStream);
  assertEquals(resp.headers.get("content-type"), "application/json");
}

function assertXml(resp: Response) {
  assertInstanceOf(resp.body, ReadableStream);
  assertEquals(
    resp.headers.get("content-type"),
    "application/atom+xml; charset=utf-8",
  );
}

function assertText(resp: Response) {
  assertInstanceOf(resp.body, ReadableStream);
  assertEquals(resp.headers.get("content-type"), "text/plain;charset=UTF-8");
}

function assertRedirect(response: Response, location: string) {
  assert(isRedirectStatus(response.status));
  assert(response.headers.get("location")?.includes(location));
}

function setupEnv(overrides: Record<string, string | null> = {}) {
  const defaults: Record<string, string> = {
    "STRIPE_SECRET_KEY": crypto.randomUUID(),
    "STRIPE_WEBHOOK_SECRET": crypto.randomUUID(),
    "STRIPE_PREMIUM_PLAN_PRICE_ID": crypto.randomUUID(),
    "GITHUB_CLIENT_ID": crypto.randomUUID(),
    "GITHUB_CLIENT_SECRET": crypto.randomUUID(),
    // Add more default values here
  };

  // Merge defaults and overrides
  const combinedEnvVars = { ...defaults, ...overrides };

  // Set or delete environment variables
  for (const [key, value] of Object.entries(combinedEnvVars)) {
    if (value === null) {
      Deno.env.delete(key);
    } else {
      Deno.env.set(key, value);
    }
  }
}

Deno.test("[e2e] security headers", async () => {
  setupEnv();
  const resp = await handler(new Request("http://localhost"));

  assertEquals(
    resp.headers.get("strict-transport-security"),
    "max-age=63072000;",
  );
  assertEquals(
    resp.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assertEquals(resp.headers.get("x-content-type-options"), "nosniff");
  assertEquals(resp.headers.get("x-frame-options"), "SAMEORIGIN");
  assertEquals(resp.headers.get("x-xss-protection"), "1; mode=block");
});

Deno.test("[e2e] GET /", async () => {
  setupEnv();
  const resp = await handler(new Request("http://localhost"));

  assertEquals(resp.status, STATUS_CODE.OK);
  assertHtml(resp);
});

Deno.test("[e2e] GET /callback", async (test) => {
  setupEnv();
  const login = crypto.randomUUID();
  const sessionId = crypto.randomUUID();

  await test.step("creates a new user if it doesn't already exist", async () => {
    const handleCallbackResp = {
      response: new Response(),
      tokens: {
        accessToken: crypto.randomUUID(),
        tokenType: crypto.randomUUID(),
      },
      sessionId,
    };
    const id = crypto.randomUUID();
    const handleCallbackStub = stub(
      _internals,
      "handleCallback",
      returnsNext([Promise.resolve(handleCallbackResp)]),
    );
    const githubRespBody = {
      login,
      email: crypto.randomUUID(),
    };
    const stripeRespBody: Partial<Stripe.Response<Stripe.Customer>> = { id };
    const fetchStub = stub(
      window,
      "fetch",
      returnsNext([
        Promise.resolve(Response.json(githubRespBody)),
        Promise.resolve(Response.json(stripeRespBody)),
      ]),
    );
    const req = new Request("http://localhost/callback");
    await handler(req);
    handleCallbackStub.restore();
    fetchStub.restore();

    const user = await getUser(githubRespBody.login);
    assert(user !== null);
    assertEquals(user.sessionId, handleCallbackResp.sessionId);
  });

  await test.step("updates the user session ID if they already exist", async () => {
    const handleCallbackResp = {
      response: new Response(),
      tokens: {
        accessToken: crypto.randomUUID(),
        tokenType: crypto.randomUUID(),
      },
      sessionId: crypto.randomUUID(),
    };
    const id = crypto.randomUUID();
    const handleCallbackStub = stub(
      _internals,
      "handleCallback",
      returnsNext([Promise.resolve(handleCallbackResp)]),
    );
    const githubRespBody = {
      login,
      email: crypto.randomUUID(),
    };
    const stripeRespBody: Partial<Stripe.Response<Stripe.Customer>> = { id };
    const fetchStub = stub(
      window,
      "fetch",
      returnsNext([
        Promise.resolve(Response.json(githubRespBody)),
        Promise.resolve(Response.json(stripeRespBody)),
      ]),
    );
    const req = new Request("http://localhost/callback");
    await handler(req);
    handleCallbackStub.restore();
    fetchStub.restore();

    const user = await getUser(githubRespBody.login);
    assert(user !== null);
    assertNotEquals(user.sessionId, sessionId);
  });
});

Deno.test("[e2e] GET /blog", async () => {
  setupEnv();
  const resp = await handler(
    new Request("http://localhost/blog"),
  );

  assertEquals(resp.status, STATUS_CODE.OK);
  assertHtml(resp);
});

Deno.test("[e2e] GET /pricing", async () => {
  setupEnv({
    "STRIPE_SECRET_KEY": null,
    "STRIPE_PREMIUM_PLAN_PRICE_ID": null,
  });
  const handler = await createHandler(manifest, options);
  const resp = await handler(
    new Request("http://localhost/pricing"),
  );

  assertEquals(resp.status, STATUS_CODE.NotFound);
  assertHtml(resp);
});

Deno.test("[e2e] GET /signin", async () => {
  setupEnv();
  const resp = await handler(
    new Request("http://localhost/signin"),
  );

  assertRedirect(
    resp,
    "https://github.com/login/oauth/authorize",
  );
});

Deno.test("[e2e] GET /signout", async () => {
  setupEnv();
  const resp = await handler(
    new Request("http://localhost/signout"),
  );

  assertRedirect(resp, "/");
});

Deno.test("[e2e] GET /dashboard", async (test) => {
  setupEnv();
  const url = "http://localhost/dashboard";
  const user = randomUser();
  await createUser(user);

  await test.step("redirects to sign-in page if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("redirects to `/dashboard/stats` when the session user is signed in", async () => {
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertRedirect(resp, "/dashboard/stats");
  });
});

Deno.test("[e2e] GET /dashboard/stats", async (test) => {
  setupEnv();
  const url = "http://localhost/dashboard/stats";
  const user = randomUser();
  await createUser(user);

  await test.step("redirects to sign-in page if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("renders dashboard stats chart for a user who is signed in", async () => {
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.OK);
    assertHtml(resp);
    assertStringIncludes(await resp.text(), "<!--frsh-chart_default");
  });
});

Deno.test("[e2e] GET /dashboard/users", async (test) => {
  setupEnv();
  const url = "http://localhost/dashboard/users";
  const user = randomUser();
  await createUser(user);

  await test.step("redirects to sign-in if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("renders dashboard stats table for a user who is signed in", async () => {
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.OK);
    assertHtml(resp);
    assertStringIncludes(await resp.text(), "<!--frsh-userstable_default");
  });
});

Deno.test("[e2e] GET /submit", async () => {
  setupEnv();
  const resp = await handler(
    new Request("http://localhost/submit"),
  );

  assertEquals(resp.status, STATUS_CODE.OK);
  assertHtml(resp);
});

Deno.test("[e2e] GET /feed", async () => {
  setupEnv();
  const resp = await handler(
    new Request("http://localhost/feed"),
  );

  assertEquals(resp.status, STATUS_CODE.OK);
  assertXml(resp);
});

Deno.test("[e2e] GET /api/items", async () => {
  setupEnv();
  const item1 = randomItem();
  const item2 = randomItem();
  await createItem(item1);
  await createItem(item2);
  const req = new Request("http://localhost/api/items");
  const resp = await handler(req);
  const { values } = await resp.json();

  assertEquals(resp.status, STATUS_CODE.OK);
  assertJson(resp);
  assertArrayIncludes(values, [item1, item2]);
});

Deno.test("[e2e] POST /submit", async (test) => {
  setupEnv();
  const url = "http://localhost/submit";
  const user = randomUser();
  await createUser(user);

  await test.step("redirects to `/submit?error` if item is missing title", async () => {
    const body = new FormData();
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
        body,
      }),
    );

    assertRedirect(resp, "/submit?error");
  });

  await test.step("redirects to `/submit?error` if item is missing URL", async () => {
    const body = new FormData();
    body.set("title", "Title text");
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
        body,
      }),
    );

    assertRedirect(resp, "/submit?error");
  });

  await test.step("redirects to `/submit?error` if item has an invalid URL", async () => {
    const body = new FormData();
    body.set("title", "Title text");
    body.set("url", "invalid-url");
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
        body,
      }),
    );

    assertRedirect(resp, "/submit?error");
  });

  await test.step("creates an item and redirects to the home page", async () => {
    const item = { title: "Title text", url: "http://bobross.com" };
    const body = new FormData();
    body.set("title", item.title);
    body.set("url", item.url);
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
        body,
      }),
    );
    const items = await collectValues(listItemsByUser(user.login));

    assertRedirect(resp, "/");
    // Deep partial match since the item ID is a ULID generated at runtime
    assertObjectMatch(items[0], item);
  });
});

Deno.test("[e2e] GET /api/items/[id]", async (test) => {
  setupEnv();
  const item = randomItem();
  const req = new Request("http://localhost/api/items/" + item.id);

  await test.step("serves not found response if item not found", async () => {
    const resp = await handler(req);

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertEquals(await resp.text(), "Item not found");
  });

  await test.step("serves item as JSON", async () => {
    await createItem(item);
    const resp = await handler(req);

    assertEquals(resp.status, STATUS_CODE.OK);
    assertJson(resp);
    assertEquals(await resp.json(), item);
  });
});

Deno.test("[e2e] GET /api/users", async () => {
  setupEnv();
  const user1 = randomUser();
  const user2 = randomUser();
  await createUser(user1);
  await createUser(user2);

  const req = new Request("http://localhost/api/users");
  const resp = await handler(req);

  const { values } = await resp.json();

  assertEquals(resp.status, STATUS_CODE.OK);
  assertJson(resp);
  assertArrayIncludes(values, [user1, user2]);
});

Deno.test("[e2e] GET /api/users/[login]", async (test) => {
  setupEnv();
  const user = randomUser();
  const req = new Request("http://localhost/api/users/" + user.login);

  await test.step("serves not found response if user not found", async () => {
    const resp = await handler(req);

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "User not found");
  });

  await test.step("serves user as JSON", async () => {
    await createUser(user);
    const resp = await handler(req);

    assertEquals(resp.status, STATUS_CODE.OK);
    assertJson(resp);
    assertEquals(await resp.json(), user);
  });
});

Deno.test("[e2e] GET /api/users/[login]/items", async (test) => {
  setupEnv();
  const user = randomUser();
  const item: Item = {
    ...randomItem(),
    userLogin: user.login,
  };
  const req = new Request(`http://localhost/api/users/${user.login}/items`);

  await test.step("serves not found response if user not found", async () => {
    const resp = await handler(req);

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "User not found");
  });

  await test.step("serves items as JSON", async () => {
    await createUser(user);
    await createItem(item);
    const resp = await handler(req);
    const { values } = await resp.json();

    assertEquals(resp.status, STATUS_CODE.OK);
    assertJson(resp);
    assertArrayIncludes(values, [item]);
  });
});

Deno.test("[e2e] POST /api/vote", async (test) => {
  setupEnv();
  const item = randomItem();
  const user = randomUser();
  await createItem(item);
  await createUser(user);
  const url = `http://localhost/api/vote?item_id=${item.id}`;

  await test.step("serves unauthorized response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url, { method: "POST" }));

    assertEquals(resp.status, STATUS_CODE.Unauthorized);
    assertText(resp);
    assertEquals(await resp.text(), "User must be signed in");
  });

  await test.step("serves not found response if the item is not found", async () => {
    const resp = await handler(
      new Request("http://localhost/api/vote?item_id=bob-ross", {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "Item not found");
  });

  await test.step("creates a vote", async () => {
    const item = { ...randomItem(), userLogin: user.login };
    await createItem(item);
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.Created);
  });

  await test.step("serves an error response if the `item_id` URL parameter is missing", async () => {
    const resp = await handler(
      new Request("http://localhost/api/vote", {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.BadRequest);
    assertEquals(await resp.text(), "`item_id` URL parameter missing");
  });
});

function createStripeEvent(
  type: Stripe.Event.Type,
  customer: string,
): Promise<Stripe.Event> {
  return Promise.resolve({
    id: "123",
    object: "event",
    api_version: null,
    created: 0,
    livemode: false,
    pending_webhooks: 0,
    type,
    request: null,
    data: {
      object: {
        customer,
      },
    },
  });
}

Deno.test("[e2e] POST /api/stripe-webhooks", async (test) => {
  const url = "http://localhost/api/stripe-webhooks";

  await test.step("serves not found response if Stripe is disabled", async () => {
    setupEnv(
      { "STRIPE_SECRET_KEY": null },
    );
    const resp = await handler(new Request(url, { method: "POST" }));

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "Not Found");
  });

  await test.step("serves bad request response if `Stripe-Signature` header is missing", async () => {
    setupEnv();
    const resp = await handler(new Request(url, { method: "POST" }));

    assertEquals(resp.status, STATUS_CODE.BadRequest);
    assertText(resp);
    assertEquals(await resp.text(), "`Stripe-Signature` header is missing");
  });

  await test.step("serves internal server error response if `STRIPE_WEBHOOK_SECRET` environment variable is not set", async () => {
    setupEnv(
      { "STRIPE_WEBHOOK_SECRET": null },
    );
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { "Stripe-Signature": crypto.randomUUID() },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.InternalServerError);
    assertText(resp);
    assertEquals(
      await resp.text(),
      "`STRIPE_WEBHOOK_SECRET` environment variable is not set",
    );
  });

  await test.step("serves bad request response if the event payload is invalid", async () => {
    setupEnv();
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { "Stripe-Signature": crypto.randomUUID() },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.BadRequest);
    assertText(resp);
    assertEquals(
      await resp.text(),
      "No webhook payload was provided.",
    );
  });

  await test.step("serves not found response if the user is not found for subscription creation", async () => {
    const constructEventAsyncStub = stub(
      stripe.webhooks,
      "constructEventAsync",
      returnsNext([
        createStripeEvent("customer.subscription.created", "x"),
      ]),
    );

    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { "Stripe-Signature": crypto.randomUUID() },
      }),
    );

    constructEventAsyncStub.restore();

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "User not found");
  });

  await test.step("creates a subscription", async () => {
    const user = randomUser();
    await createUser(user);

    const constructEventAsyncStub = stub(
      stripe.webhooks,
      "constructEventAsync",
      returnsNext([
        createStripeEvent(
          "customer.subscription.created",
          user.stripeCustomerId!,
        ),
      ]),
    );

    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { "Stripe-Signature": crypto.randomUUID() },
      }),
    );

    constructEventAsyncStub.restore();

    assertEquals(resp.status, STATUS_CODE.Created);
    assertEquals(await getUser(user.login), { ...user, isSubscribed: true });
  });

  await test.step("serves not found response if the user is not found for subscription deletion", async () => {
    const constructEventAsyncStub = stub(
      stripe.webhooks,
      "constructEventAsync",
      returnsNext([
        createStripeEvent("customer.subscription.deleted", "x"),
      ]),
    );

    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { "Stripe-Signature": crypto.randomUUID() },
      }),
    );

    constructEventAsyncStub.restore();

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "User not found");
  });

  await test.step("deletes a subscription", async () => {
    const user: User = { ...randomUser(), isSubscribed: true };
    await createUser(user);

    const constructEventAsyncStub = stub(
      stripe.webhooks,
      "constructEventAsync",
      returnsNext([
        createStripeEvent(
          "customer.subscription.deleted",
          user.stripeCustomerId!,
        ),
      ]),
    );

    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { "Stripe-Signature": crypto.randomUUID() },
      }),
    );

    constructEventAsyncStub.restore();

    assertEquals(await getUser(user.login), { ...user, isSubscribed: false });
    assertEquals(resp.status, STATUS_CODE.Accepted);
  });

  await test.step("serves bad request response if the event type is not supported", async () => {
    const constructEventAsyncStub = stub(
      stripe.webhooks,
      "constructEventAsync",
      returnsNext([
        createStripeEvent("account.application.authorized", "x"),
      ]),
    );

    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { "Stripe-Signature": crypto.randomUUID() },
      }),
    );

    constructEventAsyncStub.restore();

    assertEquals(resp.status, STATUS_CODE.BadRequest);
    assertText(resp);
    assertEquals(await resp.text(), "Event type not supported");
  });
});

Deno.test("[e2e] GET /account", async (test) => {
  setupEnv();
  const url = "http://localhost/account";

  await test.step("redirects to sign-in page if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("serves a web page for signed-in free user", async () => {
    const user = randomUser();
    await createUser(user);

    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.OK);
    assertHtml(resp);
    assertStringIncludes(await resp.text(), 'href="/account/upgrade"');
  });

  await test.step("serves a web page for signed-in premium user", async () => {
    const user = randomUser();
    await createUser({ ...user, isSubscribed: true });

    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.OK);
    assertHtml(resp);
    assertStringIncludes(await resp.text(), 'href="/account/manage"');
  });
});

Deno.test("[e2e] GET /account/manage", async (test) => {
  setupEnv();
  const url = "http://localhost/account/manage";

  await test.step("redirects to sign-in page if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("serves not found response if the session user does not have a Stripe customer ID", async () => {
    const user = randomUser();
    await createUser({ ...user, stripeCustomerId: undefined });
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertHtml(resp);
  });

  await test.step("redirects to the URL returned by Stripe after creating a billing portal session", async () => {
    const user = randomUser();
    await createUser(user);

    const session = { url: "https://stubbing-returned-url" } as Stripe.Response<
      Stripe.BillingPortal.Session
    >;
    const sessionsCreateStub = stub(
      stripe.billingPortal.sessions,
      "create",
      resolvesNext([session]),
    );

    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    sessionsCreateStub.restore();

    assertRedirect(resp, session.url);
  });
});

Deno.test("[e2e] GET /account/upgrade", async (test) => {
  setupEnv();
  const url = "http://localhost/account/upgrade";

  await test.step("redirects to sign-in page if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  const user = randomUser();
  await createUser(user);

  await test.step("serves internal server error response if the `STRIPE_PREMIUM_PLAN_PRICE_ID` environment variable is not set", async () => {
    setupEnv(
      { "STRIPE_PREMIUM_PLAN_PRICE_ID": null },
    );

    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.InternalServerError);
    assertHtml(resp);
  });

  await test.step("serves not found response if Stripe is disabled", async () => {
    setupEnv(
      { "STRIPE_SECRET_KEY": null },
    );

    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertHtml(resp);
  });

  await test.step("serves not found response if Stripe returns a `null` URL", async () => {
    setupEnv();

    const session = { url: null } as Stripe.Response<
      Stripe.Checkout.Session
    >;
    const sessionsCreateStub = stub(
      stripe.checkout.sessions,
      "create",
      resolvesNext([session]),
    );

    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    sessionsCreateStub.restore();

    assertEquals(resp.status, STATUS_CODE.NotFound);
    assertHtml(resp);
  });

  await test.step("redirects to the URL returned by Stripe after creating a checkout session", async () => {
    const priceId = crypto.randomUUID();
    setupEnv(
      { "STRIPE_PREMIUM_PLAN_PRICE_ID": priceId },
    );

    const session = { url: "https://stubbing-returned-url" } as Stripe.Response<
      Stripe.Checkout.Session
    >;
    const sessionsCreateStub = stub(
      stripe.checkout.sessions,
      "create",
      resolvesNext([session]),
    );

    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    sessionsCreateStub.restore();

    assertRedirect(resp, session.url!);
  });
});

Deno.test("[e2e] GET /api/me/votes", async () => {
  setupEnv();
  const user = randomUser();
  await createUser(user);
  const item1 = randomItem();
  const item2 = randomItem();
  await createItem(item1);
  await createItem(item2);
  await createVote({
    userLogin: user.login,
    itemId: item1.id,
  });
  await createVote({
    userLogin: user.login,
    itemId: item2.id,
  });
  const resp = await handler(
    new Request("http://localhost/api/me/votes", {
      headers: { cookie: "site-session=" + user.sessionId },
    }),
  );
  const body = await resp.json();

  assertEquals(resp.status, STATUS_CODE.OK);
  assertJson(resp);
  assertArrayIncludes(body, [{ ...item1, score: 1 }, { ...item2, score: 1 }]);
});

Deno.test("[e2e] GET /welcome", async () => {
  setupEnv(
    { "GITHUB_CLIENT_ID": null },
  );
  const req = new Request("http://localhost/");
  const resp = await handler(req);

  assertRedirect(resp, "/welcome");
});
