// Copyright 2023 the Deno authors. All rights reserved. MIT license.

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
async function getValue<T>(
  key: Deno.KvKey,
  options?: { consistency?: Deno.KvConsistencyLevel },
) {
  const res = await kv.get<T>(key, options);
  return res.value;
}

async function getValues<T>(
  selector: Deno.KvListSelector,
  options?: Deno.KvListOptions,
) {
  const values = [];
  const iter = kv.list<T>(selector, options);
  for await (const { value } of iter) values.push(value);
  return values;
}

// Item
export interface Item {
  userId: string;
  title: string;
  url: string;
  // The below properties can be automatically generated upon item creation
  id: string;
  createdAt: Date;
  score: number;
}

export function newItemProps(): Pick<Item, "id" | "score" | "createdAt"> {
  return {
    id: crypto.randomUUID(),
    score: 0,
    createdAt: new Date(),
  };
}

/**
 * Creates a new item in KV. Throws if the item already exists in one of the indexes.
 *
 * @example New item creation
 * ```ts
 * import { newItemProps, createItem, incrementAnalyticsMetricPerDay } from "@/utils/db.ts";
 *
 * const item: Item = {
 *   userId: "example-user-id",
 *   title: "example-title",
 *   url: "https://example.com"
 *   ..newItemProps(),
 * };
 *
 * await createItem(item);
 * await incrementAnalyticsMetricPerDay("items_count", item.createdAt);
 * ```
 */
export async function createItem(item: Item) {
  const itemsKey = ["items", item.id];
  const itemsByTimeKey = ["items_by_time", item.createdAt.getTime(), item.id];
  const itemsByUserKey = ["items_by_user", item.userId, item.id];

  const res = await kv.atomic()
    .check({ key: itemsKey, versionstamp: null })
    .check({ key: itemsByTimeKey, versionstamp: null })
    .check({ key: itemsByUserKey, versionstamp: null })
    .set(itemsKey, item)
    .set(itemsByTimeKey, item)
    .set(itemsByUserKey, item)
    .commit();

  if (!res.ok) throw new Error(`Failed to create item: ${item}`);
}

export async function getItem(id: string) {
  return await getValue<Item>(["items", id]);
}

export async function getItemsByUser(userId: string) {
  return await getValues<Item>({ prefix: ["items_by_user", userId] });
}

export async function getAllItems() {
  return await getValues<Item>({ prefix: ["items"] });
}

/**
 * Gets all items since a given number of milliseconds ago from KV.
 *
 * @example Since a week ago
 * ```ts
 * import { WEEK } from "std/datetime/constants.ts";
 * import { getItemsSince } from "@/utils/db.ts";
 *
 * const itemsSinceAllTime = await getItemsSince(WEEK);
 * ```
 *
 * @example Since a month ago
 * ```ts
 * import { DAY } from "std/datetime/constants.ts";
 * import { getItemsSince } from "@/utils/db.ts";
 *
 * const itemsSinceAllTime = await getItemsSince(DAY * 30);
 * ```
 */
export async function getItemsSince(msAgo: number) {
  return await getValues<Item>({
    prefix: ["items_by_time"],
    start: ["items_by_time", Date.now() - msAgo],
  });
}

// Comment
export interface Comment {
  userId: string;
  itemId: string;
  text: string;
  // The below properties can be automatically generated upon comment creation
  id: string;
  createdAt: Date;
}

export function newCommentProps(): Pick<Comment, "id" | "createdAt"> {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
}

export async function createComment(comment: Comment) {
  const commentsByItemKey = ["comments_by_item", comment.itemId, comment.id];

  const res = await kv.atomic()
    .check({ key: commentsByItemKey, versionstamp: null })
    .set(commentsByItemKey, comment)
    .commit();

  if (!res.ok) throw new Error(`Failed to create comment: ${comment}`);
}

export async function getCommentsByItem(itemId: string) {
  return await getValues<Comment>({ prefix: ["comments_by_item", itemId] });
}

// Vote
interface Vote {
  item: Item;
  user: User;
}

export async function createVote(vote: Vote) {
  vote.item.score++;

  const itemKey = ["items", vote.item.id];
  const itemsByTimeKey = [
    "items_by_time",
    vote.item.createdAt.getTime(),
    vote.item.id,
  ];
  const itemsByUserKey = ["items_by_user", vote.item.userId, vote.item.id];
  const votedItemsByUserKey = [
    "voted_items_by_user",
    vote.user.id,
    vote.item.id,
  ];
  const votedUsersByItemKey = [
    "voted_users_by_item",
    vote.item.id,
    vote.user.id,
  ];

  const [itemRes, itemsByTimeRes, itemsByUserRes] = await kv.getMany([
    itemKey,
    itemsByTimeKey,
    itemsByUserKey,
  ]);
  const res = await kv.atomic()
    .check(itemRes)
    .check(itemsByTimeRes)
    .check(itemsByUserRes)
    .check({ key: votedItemsByUserKey, versionstamp: null })
    .check({ key: votedUsersByItemKey, versionstamp: null })
    .set(itemKey, vote.item)
    .set(itemsByTimeKey, vote.item)
    .set(itemsByUserKey, vote.item)
    .set(votedItemsByUserKey, vote.item)
    .set(votedUsersByItemKey, vote.user)
    .commit();

  if (!res.ok) throw new Error(`Failed to set vote: ${vote}`);

  await incrementAnalyticsMetricPerDay("votes_count", new Date());

  return vote;
}

export async function deleteVote(vote: Vote) {
  vote.item.score--;

  const itemKey = ["items", vote.item.id];
  const itemsByTimeKey = [
    "items_by_time",
    vote.item.createdAt.getTime(),
    vote.item.id,
  ];
  const itemsByUserKey = ["items_by_user", vote.item.userId, vote.item.id];
  const votedItemsByUserKey = [
    "voted_items_by_user",
    vote.user.id,
    vote.item.id,
  ];
  const votedUsersByItemKey = [
    "voted_users_by_item",
    vote.item.id,
    vote.user.id,
  ];

  const [itemRes, itemsByTimeRes, itemsByUserRes] = await kv.getMany([
    itemKey,
    itemsByTimeKey,
    itemsByUserKey,
  ]);
  const res = await kv.atomic()
    .check(itemRes)
    .check(itemsByTimeRes)
    .check(itemsByUserRes)
    .set(itemKey, vote.item)
    .set(itemsByTimeKey, vote.item)
    .set(itemsByUserKey, vote.item)
    .delete(votedItemsByUserKey)
    .delete(votedUsersByItemKey)
    .commit();

  if (!res.ok) throw new Error(`Failed to delete vote: ${vote}`);
}

export async function getVotedItemsByUser(userId: string) {
  return await getValues<Item>({ prefix: ["voted_items_by_user", userId] });
}

// User
export interface User {
  id: string;
  login: string;
  avatarUrl: string;
  sessionId: string;
  stripeCustomerId?: string;
  // The below properties can be automatically generated upon comment creation
  isSubscribed: boolean;
}

export function newUserProps(): Pick<User, "isSubscribed"> {
  return {
    isSubscribed: false,
  };
}

/**
 * Creates a new user in KV. Throws if the user already exists.
 *
 * @example
 * ```ts
 * import { createUser, newUser } from "@/utils/db.ts";
 *
 * const user = {
 *   id: "id",
 *   login: "login",
 *   avatarUrl: "https://example.com/avatar-url",
 *   sessionId: "sessionId",
 *   ...newUserProps(),
 * };
 * await createUser(user);
 * await incrementAnalyticsMetricPerDay("users_count", new Date());
 * ```
 */
export async function createUser(user: User) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];

  const atomicOp = kv.atomic();

  if (user.stripeCustomerId !== undefined) {
    const usersByStripeCustomerKey = [
      "users_by_stripe_customer",
      user.stripeCustomerId,
    ];
    atomicOp
      .check({ key: usersByStripeCustomerKey, versionstamp: null })
      .set(usersByStripeCustomerKey, user);
  }

  const res = await atomicOp
    .check({ key: usersKey, versionstamp: null })
    .check({ key: usersByLoginKey, versionstamp: null })
    .check({ key: usersBySessionKey, versionstamp: null })
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .commit();

  if (!res.ok) throw new Error(`Failed to create user: ${user}`);
}

export async function updateUser(user: User) {
  const usersKey = ["users", user.id];
  const usersByLoginKey = ["users_by_login", user.login];
  const usersBySessionKey = ["users_by_session", user.sessionId];

  const atomicOp = kv.atomic();

  if (user.stripeCustomerId !== undefined) {
    const usersByStripeCustomerKey = [
      "users_by_stripe_customer",
      user.stripeCustomerId,
    ];
    atomicOp
      .set(usersByStripeCustomerKey, user);
  }

  const res = await atomicOp
    .set(usersKey, user)
    .set(usersByLoginKey, user)
    .set(usersBySessionKey, user)
    .commit();

  if (!res.ok) throw new Error(`Failed to update user: ${user}`);
}

export async function deleteUserBySession(sessionId: string) {
  await kv.delete(["users_by_session", sessionId]);
}

export async function getUser(id: string) {
  return await getValue<User>(["users", id]);
}

export async function getUserByLogin(login: string) {
  return await getValue<User>(["users_by_login", login]);
}

export async function getUserBySession(sessionId: string) {
  const usersBySessionKey = ["users_by_session", sessionId];
  return await getValue<User>(usersBySessionKey, {
    consistency: "eventual",
  }) ?? await getValue<User>(usersBySessionKey);
}

export async function getUserByStripeCustomer(stripeCustomerId: string) {
  return await getValue<User>([
    "users_by_stripe_customer",
    stripeCustomerId,
  ]);
}

export async function getManyUsers(ids: string[]) {
  const keys = ids.map((id) => ["users", id]);
  const res = await kv.getMany<User[]>(keys);
  return res.map((entry) => entry.value!);
}

export async function getAreVotedBySessionId(
  items: Item[],
  sessionId?: string,
) {
  if (!sessionId) return [];
  const sessionUser = await getUserBySession(sessionId);
  if (!sessionUser) return [];
  const votedItems = await getVotedItemsByUser(sessionUser.id);
  const votedItemIds = votedItems.map((item) => item.id);
  return items.map((item) => votedItemIds.includes(item.id));
}

export function compareScore(a: Item, b: Item) {
  return Number(b.score) - Number(a.score);
}

// Analytics
export async function incrementAnalyticsMetricPerDay(
  metric: string,
  date: Date,
) {
  // convert to ISO format that is zero UTC offset
  const metricKey = [
    metric,
    `${date.toISOString().split("T")[0]}`,
  ];
  await kv.atomic()
    .sum(metricKey, 1n)
    .commit();
}

export async function incrementVisitsPerDay(date: Date) {
  // convert to ISO format that is zero UTC offset
  const visitsKey = [
    "visits",
    `${date.toISOString().split("T")[0]}`,
  ];
  await kv.atomic()
    .sum(visitsKey, 1n)
    .commit();
}

export async function getVisitsPerDay(date: Date) {
  return await getValue<bigint>([
    "visits",
    `${date.toISOString().split("T")[0]}`,
  ]);
}

export async function getAnalyticsMetricsPerDay(
  metric: string,
  options?: Deno.KvListOptions,
) {
  const iter = await kv.list<bigint>({ prefix: [metric] }, options);
  const metricsValue = [];
  const dates = [];
  for await (const res of iter) {
    metricsValue.push(Number(res.value));
    dates.push(String(res.key[1]));
  }
  return { metricsValue, dates };
}

export async function getManyAnalyticsMetricsPerDay(
  metrics: string[],
  options?: Deno.KvListOptions,
) {
  const analyticsByDay = await Promise.all(
    metrics.map((metric) => getAnalyticsMetricsPerDay(metric, options)),
  );

  return analyticsByDay;
}

export async function getAllVisitsPerDay(options?: Deno.KvListOptions) {
  const iter = await kv.list<bigint>({ prefix: ["visits"] }, options);
  const visits = [];
  const dates = [];
  for await (const res of iter) {
    visits.push(Number(res.value));
    dates.push(String(res.key[1]));
  }
  return { visits, dates };
}
