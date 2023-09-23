// Copyright 2023 the Deno authors. All rights reserved. MIT license.

import { createHandler, Status } from "$fresh/server.ts";
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
  randomVote,
  User,
  Vote,
} from "@/utils/db.ts";
import { stripe } from "@/utils/stripe.ts";
import {
  assert,
  assertArrayIncludes,
  assertEquals,
  assertInstanceOf,
  assertObjectMatch,
  assertStringIncludes,
} from "std/assert/mod.ts";
import { isRedirectStatus } from "std/http/http_status.ts";
import { resolvesNext, returnsNext, stub } from "std/testing/mock.ts";
import Stripe from "stripe";
import options from "./fresh.config.ts";

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

Deno.test("[e2e] GET /", async () => {
  const resp = await handler(new Request("http://localhost"));

  assertEquals(resp.status, Status.OK);
  assertHtml(resp);
});

Deno.test("[e2e] GET /callback", async () => {
  const resp = await handler(
    new Request("http://localhost/callback"),
  );

  assertEquals(resp.status, Status.InternalServerError);
  assertHtml(resp);
});

Deno.test("[e2e] GET /blog", async () => {
  const resp = await handler(
    new Request("http://localhost/blog"),
  );

  assertEquals(resp.status, Status.OK);
  assertHtml(resp);
});

Deno.test("[e2e] GET /pricing", async () => {
  Deno.env.delete("STRIPE_SECRET_KEY");
  const req = new Request("http://localhost/pricing");
  const resp = await handler(req);

  assertEquals(resp.status, Status.NotFound);
  assertHtml(resp);
});

Deno.test("[e2e] GET /signin", async () => {
  const resp = await handler(
    new Request("http://localhost/signin"),
  );

  assertRedirect(
    resp,
    "https://github.com/login/oauth/authorize",
  );
});

Deno.test("[e2e] GET /signout", async () => {
  const resp = await handler(
    new Request("http://localhost/signout"),
  );

  assertRedirect(resp, "/");
});

Deno.test("[e2e] GET /dashboard", async (test) => {
  const url = "http://localhost/dashboard";
  const user = randomUser();
  await createUser(user);

  await test.step("returns redirect response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("returns redirect response to /dashboard/stats from root route when the session user is signed in", async () => {
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertRedirect(resp, "/dashboard/stats");
  });
});

Deno.test("[e2e] GET /dashboard/stats", async (test) => {
  const url = "http://localhost/dashboard/stats";
  const user = randomUser();
  await createUser(user);

  await test.step("returns redirect response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("renders dashboard stats chart for a user who is signed in", async () => {
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.OK);
    assertHtml(resp);
    assertStringIncludes(await resp.text(), "<!--frsh-chart_default");
  });
});

Deno.test("[e2e] GET /dashboard/users", async (test) => {
  const url = "http://localhost/dashboard/users";
  const user = randomUser();
  await createUser(user);

  await test.step("returns redirect response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("renders dashboard stats table for a user who is signed in", async () => {
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.OK);
    assertHtml(resp);
    assertStringIncludes(await resp.text(), "<!--frsh-userstable_default");
  });
});

Deno.test("[e2e] GET /submit", async () => {
  const resp = await handler(
    new Request("http://localhost/submit"),
  );

  assertRedirect(resp, "/signin");
});

Deno.test("[e2e] GET /feed", async () => {
  const resp = await handler(
    new Request("http://localhost/feed"),
  );

  assertEquals(resp.status, Status.OK);
  assertXml(resp);
});

Deno.test("[e2e] GET /api/items", async () => {
  const item1 = randomItem();
  const item2 = randomItem();
  await createItem(item1);
  await createItem(item2);

  const req = new Request("http://localhost/api/items");
  const resp = await handler(req);

  const { values } = await resp.json();

  assertEquals(resp.status, Status.OK);
  assertJson(resp);
  assertArrayIncludes(values, [
    JSON.parse(JSON.stringify(item1)),
    JSON.parse(JSON.stringify(item2)),
  ]);
});

Deno.test("[e2e] POST /api/items", async (test) => {
  const url = "http://localhost/api/items";
  const user = randomUser();
  await createUser(user);

  await test.step("returns HTTP 401 Unauthorized response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url, { method: "POST" }));

    assertEquals(resp.status, Status.Unauthorized);
    assertText(resp);
    assertEquals(await resp.text(), "User must be signed in");
  });

  await test.step("returns HTTP 400 Bad Request response if item is missing title", async () => {
    const body = new FormData();
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
        body,
      }),
    );

    assertEquals(resp.status, Status.BadRequest);
    assertText(resp);
    assertEquals(await resp.text(), "Title is missing");
  });

  await test.step("returns HTTP 400 Bad Request response if item has an invalid or missing url", async () => {
    const body = new FormData();
    body.set("title", "Title text");
    const resp1 = await handler(
      new Request(url, {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
        body,
      }),
    );

    assertEquals(resp1.status, Status.BadRequest);
    assertText(resp1);
    assertEquals(await resp1.text(), "URL is invalid or missing");

    body.set("url", "invalid-url");
    const resp2 = await handler(
      new Request(url, {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
        body,
      }),
    );

    assertEquals(resp2.status, Status.BadRequest);
    assertText(resp2);
    assertEquals(await resp2.text(), "URL is invalid or missing");
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

Deno.test("[e2e] GET /api/items/[id]", async () => {
  const item = randomItem();
  const req = new Request("http://localhost/api/items/" + item.id);

  const resp1 = await handler(req);

  assertEquals(resp1.status, Status.NotFound);
  assertEquals(await resp1.text(), "Item not found");

  await createItem(item);
  const resp2 = await handler(req);

  assertEquals(resp2.status, Status.OK);
  assertJson(resp2);
  assertEquals(await resp2.json(), JSON.parse(JSON.stringify(item)));
});

Deno.test("[e2e] GET /api/users", async () => {
  const user1 = randomUser();
  const user2 = randomUser();
  await createUser(user1);
  await createUser(user2);

  const req = new Request("http://localhost/api/users");
  const resp = await handler(req);

  const { values } = await resp.json();

  assertEquals(resp.status, Status.OK);
  assertJson(resp);
  assertArrayIncludes(values, [user1, user2]);
});

Deno.test("[e2e] GET /api/users/[login]", async () => {
  const user = randomUser();
  const req = new Request("http://localhost/api/users/" + user.login);

  const resp1 = await handler(req);

  assertEquals(resp1.status, Status.NotFound);
  assertText(resp1);
  assertEquals(await resp1.text(), "User not found");

  await createUser(user);
  const resp2 = await handler(req);

  assertEquals(resp2.status, Status.OK);
  assertJson(resp2);
  assertEquals(await resp2.json(), user);
});

Deno.test("[e2e] GET /api/users/[login]/items", async () => {
  const user = randomUser();
  const item: Item = {
    ...randomItem(),
    userLogin: user.login,
  };
  const req = new Request(`http://localhost/api/users/${user.login}/items`);

  const resp1 = await handler(req);

  assertEquals(resp1.status, Status.NotFound);
  assertText(resp1);
  assertEquals(await resp1.text(), "User not found");

  await createUser(user);
  await createItem(item);

  const resp2 = await handler(req);
  const { values } = await resp2.json();

  assertEquals(resp2.status, Status.OK);
  assertJson(resp2);
  assertArrayIncludes(values, [JSON.parse(JSON.stringify(item))]);
});

Deno.test("[e2e] DELETE /api/items/[id]/vote", async (test) => {
  const item = randomItem();
  const user = randomUser();
  await createItem(item);
  await createUser(user);
  const vote: Vote = {
    ...randomVote(),
    itemId: item.id,
    userLogin: user.login,
  };
  await createVote(vote);
  const url = `http://localhost/api/items/${item.id}/vote`;

  await test.step("returns HTTP 401 Unauthorized response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url, { method: "DELETE" }));

    assertEquals(resp.status, Status.Unauthorized);
    assertText(resp);
    assertEquals(await resp.text(), "User must be signed in");
  });

  await test.step("returns HTTP 404 Not Found response if the item is not found", async () => {
    const resp = await handler(
      new Request("http://localhost/api/items/bob-ross/vote", {
        method: "DELETE",
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "Item not found");
  });

  await test.step("returns HTTP 204 No Content when it deletes a vote", async () => {
    const resp = await handler(
      new Request(url, {
        method: "DELETE",
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.NoContent);
  });
});

Deno.test("[e2e] POST /api/items/[id]/vote", async (test) => {
  const item = randomItem();
  const user = randomUser();
  await createItem(item);
  await createUser(user);
  const url = `http://localhost/api/items/${item.id}/vote`;

  await test.step("returns HTTP 401 Unauthorized response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url, { method: "POST" }));

    assertEquals(resp.status, Status.Unauthorized);
    assertText(resp);
    assertEquals(await resp.text(), "User must be signed in");
  });

  await test.step("returns HTTP 404 Not Found response if the item is not found", async () => {
    const resp = await handler(
      new Request("http://localhost/api/items/bob-ross/vote", {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "Item not found");
  });

  await test.step("creates a vote", async () => {
    const item = { ...randomItem(), userLogin: user.login };
    await createItem(item);
    const url = `http://localhost/api/items/${item.id}/vote`;
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.Created);
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

  await test.step("returns HTTP 404 Not Found response if Stripe is disabled", async () => {
    Deno.env.delete("STRIPE_SECRET_KEY");
    const resp = await handler(new Request(url, { method: "POST" }));

    assertEquals(resp.status, Status.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "Not Found");
  });

  await test.step("returns HTTP 400 Bad Request response if `Stripe-Signature` header is missing", async () => {
    Deno.env.set("STRIPE_SECRET_KEY", crypto.randomUUID());
    const resp = await handler(new Request(url, { method: "POST" }));

    assertEquals(resp.status, Status.BadRequest);
    assertText(resp);
    assertEquals(await resp.text(), "`Stripe-Signature` header is missing");
  });

  await test.step("returns HTTP 500 Internal Server Error response if `STRIPE_WEBHOOK_SECRET` environment variable is not set", async () => {
    Deno.env.delete("STRIPE_WEBHOOK_SECRET");
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { "Stripe-Signature": crypto.randomUUID() },
      }),
    );

    assertEquals(resp.status, Status.InternalServerError);
    assertText(resp);
    assertEquals(
      await resp.text(),
      "`STRIPE_WEBHOOK_SECRET` environment variable is not set",
    );
  });

  await test.step("returns HTTP 400 Bad Request response if the event payload is invalid", async () => {
    Deno.env.set("STRIPE_WEBHOOK_SECRET", crypto.randomUUID());
    const resp = await handler(
      new Request(url, {
        method: "POST",
        headers: { "Stripe-Signature": crypto.randomUUID() },
      }),
    );

    assertEquals(resp.status, Status.BadRequest);
    assertText(resp);
    assertEquals(
      await resp.text(),
      "No webhook payload was provided.",
    );
  });

  await test.step("returns HTTP 404 Not Found response if the user is not found for subscription creation", async () => {
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

    assertEquals(resp.status, Status.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "User not found");
  });

  await test.step("returns HTTP 201 Created response if the subscription is created", async () => {
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

    assertEquals(resp.status, Status.Created);
    assertEquals(await getUser(user.login), { ...user, isSubscribed: true });
  });

  await test.step("returns HTTP 404 Not Found response if the user is not found for subscription deletion", async () => {
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

    assertEquals(resp.status, Status.NotFound);
    assertText(resp);
    assertEquals(await resp.text(), "User not found");
  });

  await test.step("returns HTTP 202 Accepted response if the subscription is deleted", async () => {
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
    assertEquals(resp.status, Status.Accepted);
  });

  await test.step("returns HTTP 400 Bad Request response if the event type is not supported", async () => {
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

    assertEquals(resp.status, Status.BadRequest);
    assertText(resp);
    assertEquals(await resp.text(), "Event type not supported");
  });
});

Deno.test("[e2e] GET /account", async (test) => {
  const url = "http://localhost/account";

  await test.step("returns redirect response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("renders the account page as a free user", async () => {
    const user = randomUser();
    await createUser(user);

    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.OK);
    assertHtml(resp);
    assertStringIncludes(await resp.text(), 'href="/account/upgrade"');
  });

  await test.step("renders the account page as a premium user", async () => {
    const user = randomUser();
    await createUser({ ...user, isSubscribed: true });

    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.OK);
    assertHtml(resp);
    assertStringIncludes(await resp.text(), 'href="/account/manage"');
  });
});

Deno.test("[e2e] GET /account/manage", async (test) => {
  const url = "http://localhost/account/manage";
  Deno.env.set("STRIPE_SECRET_KEY", crypto.randomUUID());

  await test.step("returns redirect response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  await test.step("returns HTTP 404 Not Found response if the session user does not have a Stripe customer ID", async () => {
    const user = randomUser();
    await createUser({ ...user, stripeCustomerId: undefined });
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.NotFound);
    assertHtml(resp);
  });

  await test.step("returns redirect response to the URL returned by Stripe after creating a billing portal session", async () => {
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
  const url = "http://localhost/account/upgrade";

  await test.step("returns redirect response if the session user is not signed in", async () => {
    const resp = await handler(new Request(url));

    assertRedirect(resp, "/signin");
  });

  const user = randomUser();
  await createUser(user);

  await test.step("returns HTTP 500 Internal Server Error response if the `STRIPE_PREMIUM_PLAN_PRICE_ID` environment variable is not set", async () => {
    Deno.env.set("STRIPE_SECRET_KEY", crypto.randomUUID());
    Deno.env.delete("STRIPE_PREMIUM_PLAN_PRICE_ID");
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.InternalServerError);
    assertHtml(resp);
  });

  await test.step("returns HTTP 404 Not Found response if Stripe is disabled", async () => {
    Deno.env.set("STRIPE_PREMIUM_PLAN_PRICE_ID", crypto.randomUUID());
    Deno.env.delete("STRIPE_SECRET_KEY");
    const resp = await handler(
      new Request(url, {
        headers: { cookie: "site-session=" + user.sessionId },
      }),
    );

    assertEquals(resp.status, Status.NotFound);
    assertHtml(resp);
  });

  await test.step("returns HTTP 404 Not Found response if Stripe returns a `null` URL", async () => {
    Deno.env.set("STRIPE_PREMIUM_PLAN_PRICE_ID", crypto.randomUUID());
    Deno.env.set("STRIPE_SECRET_KEY", crypto.randomUUID());

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

    assertEquals(resp.status, Status.NotFound);
    assertHtml(resp);
  });

  await test.step("returns redirect response to the URL returned by Stripe after creating a checkout session", async () => {
    const priceId = crypto.randomUUID();
    Deno.env.set("STRIPE_PREMIUM_PLAN_PRICE_ID", priceId);
    Deno.env.set("STRIPE_SECRET_KEY", crypto.randomUUID());

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

  assertEquals(resp.status, Status.OK);
  assertJson(resp);
  assertArrayIncludes(body, [{ ...item1, score: 1 }, { ...item2, score: 1 }]);
});
