// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { decodeTime } from "std/ulid/mod.ts";
import { chunk } from "std/collections/chunk.ts";

const KV_PATH_KEY = "KV_PATH";
let path = undefined;
if (
  (await Deno.permissions.query({ name: "env", variable: KV_PATH_KEY }))
    .state === "granted"
) {
  path = Deno.env.get(KV_PATH_KEY);
}
export const kv = await Deno.openKv(path);

// Helpers
/**
 * Gets many values from KV. Uses batched requests to get values in chunks of 10.
 */
async function getManyValues<T>(
  keys: Deno.KvKey[],
): Promise<(T | null)[]> {
  const promises = [];
  for (const batch of chunk(keys, 10)) {
    promises.push(kv.getMany<T[]>(batch));
  }
  return (await Promise.all(promises))
    .flat()
    .map((entry) => entry?.value);
}

/** Gets all dates since a given number of milliseconds ago */
export function getDatesSince(msAgo: number) {
  const dates = [];
  const now = Date.now();
  const start = new Date(now - msAgo);

  while (+start < now) {
    start.setDate(start.getDate() + 1);
    dates.push(formatDate(new Date(start)));
  }

  return dates;
}

export async function collectValues<T>(iter: Deno.KvListIterator<T>) {
  const values = [];
  for await (const { value } of iter) values.push(value);
  return values;
}

/** Converts `Date` to ISO format that is zero UTC offset */
export function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

// Item
export interface Item {
  // Uses ULID
  id: string;
  userLogin: string;
  title: string;
  url: string;
  score: number;
}

/**
 * Creates a new item in KV. Throws if the item already exists in one of the indexes.
 *
 * @example
 * ```ts
 * import { createItem } from "@/utils/db.ts";
 * import { ulid } from "std/ulid/mod.ts";
 *
 * await createItem({
 *   id: ulid(),
 *   userLogin: "john_doe",
 *   title: "example-title",
 *   url: "https://example.com",
 *   score: 0,
 * });
 * ```
 */
export async function createItem(item: Item) {
  const itemsKey = ["items", item.id];
  const itemsByUserKey = ["items_by_user", item.userLogin, item.id];
  const itemsCountKey = [
    "items_count",
    formatDate(new Date(decodeTime(item.id))),
  ];

  const res = await kv.atomic()
    .check({ key: itemsKey, versionstamp: null })
    .check({ key: itemsByUserKey, versionstamp: null })
    .set(itemsKey, item)
    .set(itemsByUserKey, item)
    .sum(itemsCountKey, 1n)
    .commit();

  if (!res.ok) throw new Error("Failed to create item");
}

export async function deleteItem(item: Item) {
  const itemsKey = ["items", item.id];
  const itemsByUserKey = ["items_by_user", item.userLogin, item.id];
  const [itemsRes, itemsByUserRes] = await kv.getMany<Item[]>([
    itemsKey,
    itemsByUserKey,
  ]);
  if (itemsRes.value === null) throw new Deno.errors.NotFound("Item not found");
  if (itemsByUserRes.value === null) {
    throw new Deno.errors.NotFound("Item by user not found");
  }

  const res = await kv.atomic()
    .check(itemsRes)
    .check(itemsByUserRes)
    .delete(itemsKey)
    .delete(itemsByUserKey)
    .commit();

  if (!res.ok) throw new Error("Failed to delete item");
}

export async function getItem(id: string) {
  const res = await kv.get<Item>(["items", id]);
  return res.value;
}

export function listItems(options?: Deno.KvListOptions) {
  return kv.list<Item>({ prefix: ["items"] }, options);
}

export function listItemsByUser(
  userLogin: string,
  options?: Deno.KvListOptions,
) {
  return kv.list<Item>({ prefix: ["items_by_user", userLogin] }, options);
}

// Comment
export interface Comment {
  // Uses ULID
  id: string;
  userLogin: string;
  itemId: string;
  text: string;
}

export async function createComment(comment: Comment) {
  const itemKey = ["items", comment.itemId];
  const itemRes = await kv.get<Item>(itemKey);
  const item = itemRes.value;
  if (item === null) throw new Deno.errors.NotFound("Item not found");

  const commentKey = [
    "comments_by_item",
    comment.itemId,
    comment.id,
  ];

  const atomicOp = kv.atomic()
    .check({ key: commentKey, versionstamp: null })
    .set(commentKey, comment);

  const res = await atomicOp.commit();
  if (!res.ok) throw new Error("Failed to create comment");
}

export async function deleteComment(comment: Comment) {
  const key = [
    "comments_by_item",
    comment.itemId,
    comment.id,
  ];
  const commentRes = await kv.get<Comment>(key);
  if (commentRes.value === null) {
    throw new Deno.errors.NotFound("Comment not found");
  }

  const res = await kv.atomic()
    .check(commentRes)
    .delete(key)
    .commit();

  if (!res.ok) throw new Error("Failed to delete comment");
}

export function listCommentsByItem(
  itemId: string,
  options?: Deno.KvListOptions,
) {
  return kv.list<Comment>({ prefix: ["comments_by_item", itemId] }, options);
}

// Vote
export interface Vote {
  itemId: string;
  userLogin: string;
  // Only used for updating values in the `votes_count` index.
  createdAt: Date;
}

/**
 * Creates a vote in the database for a given item and user. An error is thrown
 * if the given item or user doesn't exist or the vote already exists. The
 * item's score increments by 1 upon commit.
 *
 * @example
 * ```ts
 * import { createVote } from "@/utils/db.ts";
 *
 * await createVote({
 *   itemId: "13f34b7e-5563-4001-98ed-9ee04d7af717",
 *   userLogin: "pedro",
 *   createdAt: new Date()
 * });
 * ```
 */
export async function createVote(vote: Vote) {
  const itemKey = ["items", vote.itemId];
  const userKey = ["users", vote.userLogin];
  const [itemRes, userRes] = await kv.getMany<[Item, User]>([itemKey, userKey]);
  const item = itemRes.value;
  const user = userRes.value;
  if (item === null) throw new Deno.errors.NotFound("Item not found");
  if (user === null) throw new Deno.errors.NotFound("User not found");

  const itemVotedByUserKey = [
    "items_voted_by_user",
    vote.userLogin,
    vote.itemId,
  ];
  const userVotedForItemKey = [
    "users_voted_for_item",
    vote.itemId,
    vote.userLogin,
  ];
  const itemByUserKey = ["items_by_user", item.userLogin, item.id];
  const votesCountKey = ["votes_count", formatDate(vote.createdAt)];

  item.score++;

  const res = await kv.atomic()
    .check(itemRes)
    .check(userRes)
    .check({ key: itemVotedByUserKey, versionstamp: null })
    .check({ key: userVotedForItemKey, versionstamp: null })
    .set(itemKey, item)
    .set(itemByUserKey, item)
    .set(itemVotedByUserKey, item)
    .set(userVotedForItemKey, user)
    .sum(votesCountKey, 1n)
    .commit();

  if (!res.ok) throw new Error("Failed to create vote");
}

/**
 * Deletes a vote in the database for a given item and user. An error is throw
 * if the item, user or vote doesn't exist. The item's score decrements by 1
 * upon commit.
 *
 * @example
 * ```ts
 * import { deleteVote } from "@/utils/db.ts";
 *
 * await deleteVote({
 *   itemId: "13f34b7e-5563-4001-98ed-9ee04d7af717",
 *   userLogin: "pedro"
 * });
 * ```
 */
export async function deleteVote(vote: Omit<Vote, "createdAt">) {
  const itemKey = ["items", vote.itemId];
  const userKey = ["users", vote.userLogin];
  const itemVotedByUserKey = [
    "items_voted_by_user",
    vote.userLogin,
    vote.itemId,
  ];
  const userVotedForItemKey = [
    "users_voted_for_item",
    vote.itemId,
    vote.userLogin,
  ];
  const [itemRes, userRes, itemVotedByUserRes, userVotedForItemRes] = await kv
    .getMany<
      [Item, User, Item, User]
    >([itemKey, userKey, itemVotedByUserKey, userVotedForItemKey]);
  const item = itemRes.value;
  const user = userRes.value;
  if (item === null) throw new Deno.errors.NotFound("Item not found");
  if (user === null) throw new Deno.errors.NotFound("User not found");
  if (itemVotedByUserRes.value === null) {
    throw new Deno.errors.NotFound("Item voted by user not found");
  }
  if (userVotedForItemRes.value === null) {
    throw new Deno.errors.NotFound("User voted for item not found");
  }

  const itemByUserKey = ["items_by_user", item.userLogin, item.id];

  item.score--;

  const res = await kv.atomic()
    .check(itemRes)
    .check(userRes)
    .check(itemVotedByUserRes)
    .check(userVotedForItemRes)
    .set(itemKey, item)
    .set(itemByUserKey, item)
    .delete(itemVotedByUserKey)
    .delete(userVotedForItemKey)
    .commit();

  if (!res.ok) throw new Error("Failed to delete vote");
}

/**
 * Returns a {@linkcode Deno.KvListIterator} which can be used to iterate over
 * the items voted by a given user in the database.
 *
 * @example
 * ```
 * import { listItemsVotedByUser } from "@/utils/db.ts";
 *
 * for await (const entry of listItemsVotedByUser("john")) {
 *   entry.value.itemId; // Returns "13f34b7e-5563-4001-98ed-9ee04d7af717"
 *   entry.value.userLogin; // Returns "pedro"
 *   entry.key; // Returns ["items_voted_by_user", "13f34b7e-5563-4001-98ed-9ee04d7af717", "pedro"]
 *   entry.versionstamp; // Returns "00000000000000010000"
 * }
 * ```
 */
export function listItemsVotedByUser(userLogin: string) {
  return kv.list<Item>({ prefix: ["items_voted_by_user", userLogin] });
}

// User
export interface User {
  // AKA username
  login: string;
  sessionId: string;
  /**
   * Whether the user is subscribed to the "Premium Plan".
   * @default {false}
   */
  isSubscribed: boolean;
  stripeCustomerId?: string;
}

/**
 * Creates a new user. Throws if the user already exists.
 *
 * @example
 * ```ts
 * import { createUser } from "@/utils/db.ts";
 *
 * await createUser({
 *   login: "john",
 *   sessionId: crypto.randomUUID(),
 *   isSubscribed: false,
 * });
 * ```
 */
export async function createUser(user: User) {
  const usersKey = ["users", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];
  const usersCountKey = ["users_count", formatDate(new Date())];

  const atomicOp = kv.atomic()
    .check({ key: usersKey, versionstamp: null })
    .check({ key: usersBySessionKey, versionstamp: null })
    .set(usersKey, user)
    .set(usersBySessionKey, user)
    .sum(usersCountKey, 1n);

  if (user.stripeCustomerId !== undefined) {
    const usersByStripeCustomerKey = [
      "users_by_stripe_customer",
      user.stripeCustomerId,
    ];
    atomicOp
      .check({ key: usersByStripeCustomerKey, versionstamp: null })
      .set(usersByStripeCustomerKey, user);
  }

  const res = await atomicOp.commit();
  if (!res.ok) throw new Error("Failed to create user");
}

/**
 * Creates a user, overwriting any previous data.
 *
 * @example
 * ```ts
 * import { updateUser } from "@/utils/db.ts";
 *
 * await updateUser({
 *   login: "john",
 *   sessionId: crypto.randomUUID(),
 *   isSubscribed: false,
 * });
 * ```
 */
export async function updateUser(user: User) {
  const usersKey = ["users", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];

  const atomicOp = kv.atomic()
    .set(usersKey, user)
    .set(usersBySessionKey, user);

  if (user.stripeCustomerId !== undefined) {
    const usersByStripeCustomerKey = [
      "users_by_stripe_customer",
      user.stripeCustomerId,
    ];
    atomicOp
      .set(usersByStripeCustomerKey, user);
  }

  const res = await atomicOp.commit();
  if (!res.ok) throw new Error("Failed to update user");
}

/**
 * Delete the user with the given session ID.
 *
 * @example
 * ```ts
 * import { deleteUserBySession } from "@/utils/db.ts";
 *
 * await deleteUserBySession("jack");
 * ```
 */
export async function deleteUserBySession(sessionId: string) {
  await kv.delete(["users_by_session", sessionId]);
}

/**
 * Gets the user with the given login.
 *
 * @example
 * ```ts
 * import { getUser } from "@/utils/db.ts";
 *
 * await getUser("jack"); // Returns { login: "jack", sessionId: "xxx", isSubscribed: false }
 * await getUser("jill"); // Returns null
 * ```
 */
export async function getUser(login: string) {
  const res = await kv.get<User>(["users", login]);
  return res.value;
}

/**
 * Gets the user with the given session ID. The first attempt is done with
 * eventual consistency. If that returns `null`, the second attempt is done
 * with strong consistency. This is done for performance reasons, as this
 * function is called in every route request for checking whether the session
 * user is signed in.
 *
 * @example
 * ```ts
 * import { getUserBySession } from "@/utils/db.ts";
 *
 * await getUserBySession("xxx"); // Returns { login: "jack", sessionId: "xxx", isSubscribed: false }
 * ```
 */
export async function getUserBySession(sessionId: string) {
  const key = ["users_by_session", sessionId];
  const eventualRes = await kv.get<User>(key, {
    consistency: "eventual",
  });
  if (eventualRes.value !== null) return eventualRes.value;
  const res = await kv.get<User>(key);
  return res.value;
}

/**
 * Gets a user by their given Stripe customer ID.
 *
 * @example
 * ```ts
 * import { getUserByStripeCustomer } from "@/utils/db.ts";
 *
 * await getUserByStripeCustomer("123"); // Returns { login: "jack", sessionId: "xxx", isSubscribed: false, stripeCustomerId: "123" }
 */
export async function getUserByStripeCustomer(stripeCustomerId: string) {
  const res = await kv.get<User>([
    "users_by_stripe_customer",
    stripeCustomerId,
  ]);
  return res.value;
}

/**
 * Returns a {@linkcode Deno.KvListIterator} which can be used to iterate over
 * the users in the database.
 *
 * @example
 * ```
 * import { listUsers } from "@/utils/db.ts";
 *
 * for await (const entry of listUsers()) {
 *   entry.value.login; // Returns "jack"
 *   entry.value.sessionId; // Returns "xxx"
 *   entry.value.isSubscribed; // Returns false
 * }
 * ```
 */
export function listUsers(options?: Deno.KvListOptions) {
  return kv.list<User>({ prefix: ["users"] }, options);
}

/**
 * Returns a boolean array indicating whether the given items have been voted
 * for by the given user.
 *
 * @example
 * ```ts
 * import { getAreVotedByUser } from "@/utils/db.ts";
 *
 * const items = [
 *   {
 *     id: "123",
 *     userLogin: "jack",
 *     title: "Jack voted for this",
 *     url: "http://example.com",
 *     score: 1,
 *   },
 *   {
 *     id: "124",
 *     userLogin: "jill",
 *     title: "Jack didn't vote for this",
 *     url: "http://youtube.com",
 *     score: 0,
 *   }
 * ];
 * await getAreVotedByUser(items, "jack"); // Returns [true, false]
 * ```
 */
export async function getAreVotedByUser(items: Item[], userLogin: string) {
  const votedItems = await collectValues(listItemsVotedByUser(userLogin));
  const votedItemsIds = votedItems.map((item) => item.id);
  return items.map((item) => votedItemsIds.includes(item.id));
}

// Analytics
export async function incrVisitsCountByDay(date: Date) {
  const visitsKey = ["visits_count", formatDate(date)];
  await kv.atomic()
    .sum(visitsKey, 1n)
    .commit();
}

export async function getManyMetrics(
  metric: "visits_count" | "items_count" | "votes_count" | "users_count",
  dates: Date[],
) {
  const keys = dates.map((date) => [metric, formatDate(date)]);
  const res = await getManyValues<bigint>(keys);
  return res.map((value) => value?.valueOf() ?? 0n);
}
