// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  createUser,
  getUserById,
  getUserByLogin,
  getUserBySessionId,
  getUserByStripeCustomerId,
  getVisitsPerDay,
  incrementVisitsPerDay,
  kv,
  setUserSessionId,
  updateUserIsSubscribed,
  type User,
} from "./db.ts";
import { assertEquals } from "std/testing/asserts.ts";

async function deleteUser(user: User) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];
  const usersByStripeCustomerKey = [
    "users_by_stripe_customer",
    user.stripeCustomerId,
  ];

  const [
    userRes,
    userByLoginRes,
    userBySessionRes,
    userByStripeCustomerRes,
  ] = await kv.getMany<User[]>([
    usersKey,
    usersByLoginKey,
    usersBySessionKey,
    usersByStripeCustomerKey,
  ]);

  const res = await kv.atomic()
    .check(userRes)
    .check(userByLoginRes)
    .check(userBySessionRes)
    .check(userByStripeCustomerRes)
    .delete(usersKey)
    .delete(usersByLoginKey)
    .delete(usersBySessionKey)
    .delete(usersByStripeCustomerKey)
    .commit();

  if (!res.ok) {
    throw res;
  }
}

Deno.test("[db] user", async () => {
  const initUser = {
    id: crypto.randomUUID(),
    login: crypto.randomUUID(),
    avatarUrl: "https://example.com",
    stripeCustomerId: crypto.randomUUID(),
    sessionId: crypto.randomUUID(),
  };

  await createUser(initUser);
  let user = { ...initUser, isSubscribed: false } as User;
  assertEquals(await getUserById(user.id), user);
  assertEquals(await getUserByLogin(user.login), user);
  assertEquals(await getUserBySessionId(user.sessionId), user);
  assertEquals(await getUserByStripeCustomerId(user.stripeCustomerId), user);

  await updateUserIsSubscribed(user, true);
  user = { ...user, isSubscribed: true };
  assertEquals(await getUserById(user.id), user);
  assertEquals(await getUserByLogin(user.login), user);
  assertEquals(await getUserBySessionId(user.sessionId), user);
  assertEquals(await getUserByStripeCustomerId(user.stripeCustomerId), user);

  const sessionId = crypto.randomUUID();
  await setUserSessionId(user, sessionId);
  user = { ...user, sessionId };
  assertEquals(await getUserById(user.id), user);
  assertEquals(await getUserByLogin(user.login), user);
  assertEquals(await getUserBySessionId(user.sessionId), user);
  assertEquals(await getUserByStripeCustomerId(user.stripeCustomerId), user);

  await deleteUser(user);
  assertEquals(await getUserById(user.id), null);
  assertEquals(await getUserByLogin(user.login), null);
  assertEquals(await getUserBySessionId(user.sessionId), null);
  assertEquals(await getUserByStripeCustomerId(user.stripeCustomerId), null);
});

Deno.test("[db] visit", async () => {
  const date = new Date("2023-01-01");
  const visitsKey = [
    "visits",
    `${date.toISOString().split("T")[0]}`,
  ];
  await incrementVisitsPerDay(date);
  assertEquals((await kv.get(visitsKey)).key[1], "2023-01-01");
  assertEquals((await getVisitsPerDay(date))!.valueOf(), 1n);
  await kv.delete(visitsKey);
  assertEquals(await getVisitsPerDay(date), null);
});
