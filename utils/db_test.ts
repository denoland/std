// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "std/assert/mod.ts";
import { ulid } from "std/ulid/mod.ts";
import {
  collectValues,
  createItem,
  createUser,
  createVote,
  deleteItem,
  deleteUserSession,
  deleteVote,
  getAreVotedByUser,
  getItem,
  getUser,
  getUserBySession,
  getUserByStripeCustomer,
  type Item,
  kv,
  listItems,
  listItemsByUser,
  listItemsVotedByUser,
  randomItem,
  randomUser,
  updateUser,
  type User,
} from "./db.ts";

Deno.test("[db] items", async () => {
  const user = randomUser();
  const item1: Item = {
    ...randomItem(),
    id: ulid(),
    userLogin: user.login,
  };
  const item2: Item = {
    ...randomItem(),
    id: ulid(Date.now() + 1_000),
    userLogin: user.login,
  };

  assertEquals(await getItem(item1.id), null);
  assertEquals(await getItem(item2.id), null);
  assertEquals(await collectValues(listItems()), []);
  assertEquals(await collectValues(listItemsByUser(user.login)), []);
  await assertRejects(async () => await deleteItem(item1), "Item not found");

  await createItem(item1);
  await createItem(item2);
  await assertRejects(async () => await createItem(item1));

  assertEquals(await getItem(item1.id), item1);
  assertEquals(await getItem(item2.id), item2);
  assertEquals(await collectValues(listItems()), [item1, item2]);
  assertEquals(await collectValues(listItemsByUser(user.login)), [
    item1,
    item2,
  ]);

  await deleteItem(item1);
  await deleteItem(item2);

  assertEquals(await getItem(item1.id), null);
  assertEquals(await getItem(item1.id), null);
  assertEquals(await collectValues(listItems()), []);
  assertEquals(await collectValues(listItemsByUser(user.login)), []);
});

Deno.test("[db] user", async () => {
  const user = randomUser();

  assertEquals(await getUser(user.login), null);
  assertEquals(await getUserBySession(user.sessionId), null);
  assertEquals(await getUserByStripeCustomer(user.stripeCustomerId!), null);

  await createUser(user);
  await assertRejects(async () => await createUser(user));
  assertEquals(await getUser(user.login), user);
  assertEquals(await getUserBySession(user.sessionId), user);
  assertEquals(await getUserByStripeCustomer(user.stripeCustomerId!), user);

  const user1 = randomUser();
  await createUser(user1);

  await deleteUserSession(user.sessionId);
  assertEquals(await getUserBySession(user.sessionId), null);

  const newUser: User = { ...user, sessionId: crypto.randomUUID() };
  await updateUser(newUser);
  assertEquals(await getUser(newUser.login), newUser);
  assertEquals(await getUserBySession(newUser.sessionId), newUser);
  assertEquals(
    await getUserByStripeCustomer(newUser.stripeCustomerId!),
    newUser,
  );
});

Deno.test("[db] votes", async () => {
  const item = randomItem();
  const user = randomUser();
  const vote = {
    itemId: item.id,
    userLogin: user.login,
    createdAt: new Date(),
  };

  assertEquals(await collectValues(listItemsVotedByUser(user.login)), []);

  await assertRejects(
    async () => await createVote(vote),
    Deno.errors.NotFound,
    "Item not found",
  );
  await createItem(item);
  await assertRejects(
    async () => await createVote(vote),
    Deno.errors.NotFound,
    "User not found",
  );
  await createUser(user);
  await createVote(vote);
  item.score++;

  assertEquals(await collectValues(listItemsVotedByUser(user.login)), [item]);
  await assertRejects(async () => await createVote(vote));

  await deleteItem(item);
  await assertRejects(
    async () => await deleteVote(vote),
    Deno.errors.NotFound,
    "Item not found",
  );
  await createItem(item);

  /** @todo(iuioiua) Replace with `deleteUser()` once implemented */
  await kv.delete(["users", user.login]);
  await assertRejects(
    async () => await deleteVote(vote),
    Deno.errors.NotFound,
    "User not found",
  );
  /** @todo(iuioiua) Replace with `createUser()` once `deleteUser()` is implemented */
  await kv.set(["users", user.login], user);

  await kv.delete(["items_voted_by_user", user.login, item.id]);
  await assertRejects(
    async () => await deleteVote(vote),
    Deno.errors.NotFound,
    "Item voted by user not found",
  );
  await kv.set(["items_voted_by_user", user.login, item.id], item);

  await kv.delete(["users_voted_for_item", item.id, user.login]);
  await assertRejects(
    async () => await deleteVote(vote),
    Deno.errors.NotFound,
    "User voted for item not found",
  );
  await kv.set(["users_voted_for_item", item.id, user.login], user);

  await deleteVote(vote);
  assertEquals(await collectValues(listItemsVotedByUser(user.login)), []);
});

Deno.test("[db] getAreVotedByUser()", async () => {
  const item = randomItem();
  const user = randomUser();
  const vote = {
    itemId: item.id,
    userLogin: user.login,
    createdAt: new Date(),
  };

  assertEquals(await getItem(item.id), null);
  assertEquals(await getUser(user.login), null);
  assertEquals(await getAreVotedByUser([item], user.login), [false]);

  await createItem(item);
  await createUser(user);
  await createVote(vote);
  item.score++;

  assertEquals(await getItem(item.id), item);
  assertEquals(await getUser(user.login), user);
  assertEquals(await getAreVotedByUser([item], user.login), [true]);
});
